// src/lib/api.js
//
// API client for the real FastAPI backend. This module is the ONLY place
// that should know about the backend's actual field names/shapes -- every
// component keeps consuming the same event object shape it already expects
// (the one defined by the old mock `initialEvents` array in AppContext.jsx),
// via the adapter functions below. That way wiring real data in doesn't
// require rewriting every component that reads `evt.demand`, `evt.location`,
// etc.

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://localhost:8000";

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers,
    ...options,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || JSON.stringify(body);
    } catch {
      // response wasn't JSON -- fall back to statusText
    }
    throw new ApiError(`${res.status} ${detail}`, res.status);
  }
  if (res.status === 204) return null;
  return res.json();
}

// --- Adapters: backend shape -> frontend's existing expected shape --------

/**
 * Combines city + state, omitting state when it's missing/null/undefined.
 * Without this, international/no-state venues render as "London, null" or
 * "London, undefined" -- the exact class of bug already caught once in the
 * Python marketing agent (it printed "London, nan" there for the same
 * underlying reason: naively formatting a missing value into a string).
 */
function formatLocation(city, state) {
  if (!city) return state || "";
  if (!state) return city;
  return `${city}, ${state}`;
}

/**
 * Backend's DemandTier enum is lowercase ("low"/"medium"/"high"/"surge").
 * The frontend's existing UI does CASE-SENSITIVE comparisons like
 * `evt.demand === 'Surge'` for badge styling (AttendeePortal.jsx). Passing
 * the raw lowercase value through would silently break every demand badge
 * -- they'd all just fail every comparison and fall through to the default
 * styling, with no error to signal it. This mapping keeps the frontend's
 * existing comparisons working unchanged.
 */
const DEMAND_TIER_DISPLAY = {
  low: "Low",
  medium: "Medium",
  high: "High",
  surge: "Surge",
};
function formatDemandTier(tier) {
  return DEMAND_TIER_DISPLAY[tier] ?? "Low";
}

function splitDateTime(isoString) {
  if (!isoString) return { date: "", time: "" };
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return { date: "", time: "" };
  const date = d.toISOString().slice(0, 10); // YYYY-MM-DD
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return { date, time };
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&auto=format&fit=crop&q=60";

/** Shared mapping for fields present on EventOut (both list and detail responses). */
export function adaptEventCore(apiEvent) {
  const { date, time } = splitDateTime(apiEvent.event_datetime);
  return {
    id: String(apiEvent.id),
    title: apiEvent.title,
    description: apiEvent.description || "",
    date,
    time,
    location: formatLocation(apiEvent.venue_city, apiEvent.venue_state),
    venueName: apiEvent.venue_name || null,
    category: apiEvent.category,
    basePrice: apiEvent.base_price,
    price: apiEvent.current_price,
    totalTickets: apiEvent.total_tickets,
    ticketsSold: apiEvent.tickets_sold,
    demand: formatDemandTier(apiEvent.demand_tier),
    // riskFactor has no backend equivalent yet (no fraud-risk field on
    // EventOut) -- defaulting rather than inventing a fake signal.
    riskFactor: "Low",
    image: apiEvent.image_url || FALLBACK_IMAGE,
    performer: apiEvent.primary_performer_name || null,
    organizerId: apiEvent.organizer_id ?? null,
    status: apiEvent.status, // "upcoming" | "past" | "tbd" -- computed server-side, see Event.status
  };
}

/** GET /events list response -> array of frontend-shaped events (no faqs/terms -- not included in the list endpoint). */
function adaptEventList(apiEvents) {
  return apiEvents.map((e) => ({ ...adaptEventCore(e), faqs: [], terms: [] }));
}

/** GET /events/{id} detail response -> frontend-shaped event, including faqs/terms. */
function adaptEventDetail(apiEvent) {
  return {
    ...adaptEventCore(apiEvent),
    faqs: (apiEvent.faqs || []).map((f) => ({ question: f.question, answer: f.answer })),
    terms: (apiEvent.terms || []).map((t) => t.term_text),
  };
}

// --- Public API -------------------------------------------------------------

export async function fetchEvents() {
  // Backend defaults to limit=20 per page (max allowed: 100 -- see
  // GET /events's `limit: int = Query(default=20, le=100)`). Requesting
  // the max here reduces how often search results fall outside the loaded
  // page (see fetchEventById fallback in AttendeePortal), but does NOT
  // fully solve it for catalogs over 100 events -- real pagination/
  // infinite-scroll in the UI is still a follow-up, not built here.
  const data = await apiFetch("/events?limit=100");
  return adaptEventList(data);
}

export async function fetchEventById(id) {
  const data = await apiFetch(`/events/${id}`);
  return adaptEventDetail(data);
}

/**
 * Discovery Agent search. `userId` is optional -- the backend personalizes
 * ranking when provided, and falls back to popularity ranking without it
 * (there's no login page yet, so this will usually be called without one).
 *
 * IMPORTANT: the search results from this endpoint carry only a PARTIAL
 * set of fields (event_id, name, category, venue_city/state,
 * price_estimated, popularity, score) -- not the full EventOut shape that
 * GET /events returns (no title/demand_tier/total_tickets/image_url/dates).
 * This is because the backend runs the discovery agent against a lighter
 * DataFrame bridge, not the full DB model. Rather than build a second,
 * incompatible adapter for a partial shape, this returns just the ranked
 * event IDs (+ parsed intent) -- callers should map those IDs back onto
 * the FULL event objects already loaded via fetchEvents(), preserving the
 * agent's ranking order, to get complete data for rendering.
 */
export async function searchEvents(query, { userId, topN = 10 } = {}) {
  const params = new URLSearchParams({ q: query, top_n: String(topN) });
  if (userId != null) params.set("user_id", String(userId));
  const data = await apiFetch(`/agents/discovery/search?${params.toString()}`);
  return {
    parsedIntent: data.parsed_intent
      ? {
          category: data.parsed_intent.category,
          location: data.parsed_intent.location,
          maxPrice: data.parsed_intent.max_price,
          keywords: data.parsed_intent.keywords,
        }
      : null,
    rankedEventIds: data.results.map((r) => String(r.event_id)),
  };
}

// Authentication & Profile Endpoints
export async function loginUser(email, password) {
  const data = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (data.access_token) {
    localStorage.setItem("token", data.access_token);
  }
  return data;
}

export async function registerUser({ name, email, password, role, home_city, home_state, home_country }) {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password, role, home_city, home_state, home_country }),
  });
}

export async function fetchCurrentUser() {
  return apiFetch("/auth/me");
}

export async function fetchUserPreferences() {
  return apiFetch("/users/me/preferences");
}

export async function updateUserPreferences({ categories, budget_max, ticket_tier }) {
  return apiFetch("/users/me/preferences", {
    method: "PUT",
    body: JSON.stringify({ categories, budget_max, ticket_tier }),
  });
}

export async function fetchMyBookings() {
  return apiFetch("/bookings/me");
}

export async function postCreateBooking({ event_id, quantity, cardholder_name, card_number }) {
  return apiFetch("/bookings", {
    method: "POST",
    body: JSON.stringify({ event_id: Number(event_id), quantity: Number(quantity), cardholder_name, card_number }),
  });
}

export function logoutUser() {
  localStorage.removeItem("token");
}

export { ApiError, formatLocation, formatDemandTier };

export async function generateEventContent(payload) {
  return apiFetch("/events/generate-content", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createEvent(payload) {
  return apiFetch("/events", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
export async function generateAndApplyEventContent(eventId) {
  return apiFetch(`/events/${eventId}/generate-content`, {
    method: "POST",
  });
}

export async function fetchOrganizerInsights() {
  return apiFetch("/organizer/insights");
}

/**
 * Dynamic Pricing Agent: locks the event's CURRENT price for this user for
 * a short window (10 min server-side -- see PRICE_LOCK_SECONDS in
 * pricing_agent.py). Requires a logged-in user; there's no anonymous
 * locking path on the backend. The lock is honored automatically by
 * POST /bookings for whichever authenticated user holds it -- nothing
 * needs to be threaded through the booking payload itself.
 */
export async function lockPriceApi(eventId) {
  return apiFetch(`/events/${eventId}/price-lock`, { method: "POST" });
}

/**
 * Personalization Agent recommendations. Requires a real logged-in user id
 * -- the backend has no guest/anonymous recommendation path (there's no
 * meaningful profile to rank against without one).
 *
 * Same partial-shape situation as searchEvents(): the response rows come
 * from ContentBasedRecommender.recommend() (event_id/name/category/
 * venue_city/price_estimated/event_popularity_score/score), NOT the full
 * EventOut shape GET /events returns. Returns just the ranked event IDs;
 * callers should map those onto full event objects already loaded, same
 * as searchEvents.
 */
export async function fetchRecommendations(userId, { topN = 10 } = {}) {
  const params = new URLSearchParams({ userId: String(userId), top_n: String(topN) });
  const data = await apiFetch(`/agents/recommendations?${params.toString()}`);
  return data.results.map((r) => String(r.event_id));
}

/**
 * Marketing Campaign Agent: launches a real campaign (POST
 * /organizer/events/{id}/campaigns) and persists it -- not the old
 * client-only mock that faked sent/engagement numbers and vanished on
 * reload. `channel` must be one of the backend's CampaignChannel enum
 * values: 'whatsapp' | 'email' | 'x'.
 */
export async function launchCampaignApi(eventId, channel) {
  return apiFetch(`/organizer/events/${eventId}/campaigns`, {
    method: "POST",
    body: JSON.stringify({ channel }),
  });
}

/** All campaigns launched so far for one organizer-owned event. */
export async function fetchEventCampaigns(eventId) {
  return apiFetch(`/organizer/events/${eventId}/campaigns`);
}