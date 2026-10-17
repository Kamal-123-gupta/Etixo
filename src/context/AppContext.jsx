import React, { createContext, useState, useEffect } from 'react';
import {
  fetchEvents,
  ApiError,
  loginUser,
  registerUser,
  fetchCurrentUser,
  fetchUserPreferences,
  updateUserPreferences,
  fetchMyBookings,
  postCreateBooking,
  createEvent,
  logoutUser,
  adaptEventCore,
  fetchEventById,
  sendSupportMessageApi,
  fetchMySupportMessages,
} from '../lib/api';
import { CURRENCIES, formatCurrencyPrice, detectCurrencyFromCountry } from '../lib/currency';

export const AppContext = createContext();

const initialFraudLogs = [
  {
    id: 'fraud-1',
    timestamp: '2026-08-05 14:22:10',
    type: 'Bulk Bot Booking',
    severity: 'High',
    ip: '198.51.100.42',
    user: 'bot-handler-77',
    eventTitle: 'Neon Pulse: Electronic Music Festival',
    details: 'Blocked booking request for 25 tickets in 0.4 seconds from a single IP.'
  },
  {
    id: 'fraud-2',
    timestamp: '2026-08-05 16:05:44',
    type: 'Card Fingerprint Anomaly',
    severity: 'Medium',
    ip: '203.0.113.88',
    user: 'anonymous_user_99',
    eventTitle: 'Global AI Summit 2026',
    details: 'Transaction flagged: 3 card authentication failures using card brand from differing origin country.'
  }
];

const initialNotifications = [
  {
    id: 'notif-1',
    message: 'Dynamic Pricing Agent: Price for Neon Pulse increased due to high demand velocity.',
    type: 'pricing',
    timestamp: '10 mins ago',
    unread: true
  },
  {
    id: 'notif-2',
    message: 'Fraud Detection Agent: Blocked suspicious bulk ticket booking from IP 198.51.100.42.',
    type: 'fraud',
    timestamp: '2 hours ago',
    unread: false
  },
  {
    id: 'notif-3',
    message: 'Event Operations Agent: QR Code check-in system successfully deployed for SustainTech Hackathon.',
    type: 'ops',
    timestamp: '4 hours ago',
    unread: false
  }
];

export const AppContextProvider = ({ children }) => {
  // Theme state: 'light' by default, or read from localStorage
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('etixo_theme') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('etixo_theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.body.classList.remove('dark');
      document.body.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      document.body.classList.remove('light');
      document.body.classList.add('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Currency State
  const [currency, setCurrencyState] = useState(() => {
    return localStorage.getItem('etixo_currency') || 'USD';
  });

  const setCurrency = (curr) => {
    localStorage.setItem('etixo_currency', curr);
    setCurrencyState(curr);
  };

  const formatPrice = (usdAmount) => {
    return formatCurrencyPrice(usdAmount, currency);
  };

  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState(null);
  const [bookings, setBookings] = useState([]);
  // Default Guest Profile
  const [userProfile, setUserProfile] = useState({
    name: 'Guest User',
    email: 'guest@example.com',
    location: 'Arlington',
    preferences: [],
    budget: 200,
    ticketTier: 'General',
    isGuest: true,
    role: 'attendee'
  });
  const [authLoading, setAuthLoading] = useState(true);

  const [fraudLogs, setFraudLogs] = useState(initialFraudLogs);
  const [notifications, setNotifications] = useState(initialNotifications);
  
  // Chat History with initial Welcome Message from Etix Support Agent.
  const SUPPORT_WELCOME_MESSAGE = {
    sender: 'bot',
    message: 'Hello! I am Etix, your AI Support Assistant. 🤖 I can assist you with ticket purchases, refunds, cancellations, and venue details. How can I help you today?',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
  const [supportChat, setSupportChat] = useState([SUPPORT_WELCOME_MESSAGE]);
  const [supportChatLoading, setSupportChatLoading] = useState(false);
  const [isSupportSending, setIsSupportSending] = useState(false);

  // Load User Profile from backend
  const loadProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setAuthLoading(false);
      return;
    }
    try {
      const user = await fetchCurrentUser();
      let prefs = { categories: [], budget_max: 200, ticket_tier: 'Gold' };
      try {
        prefs = await fetchUserPreferences();
      } catch (e) {
        console.error("Could not fetch user preferences", e);
      }
      
      const locationStr = user.home_city || 'Arlington';
      setUserProfile({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: locationStr,
        preferences: prefs.categories || [],
        budget: prefs.budget_max || 200,
        ticketTier: prefs.ticket_tier || 'Gold',
        isGuest: false
      });

      // Auto-detect currency based on user country / location if not manually set
      if (!localStorage.getItem('etixo_currency')) {
        const detected = detectCurrencyFromCountry(user.home_country || user.home_city || locationStr);
        setCurrencyState(detected);
      }
    } catch (err) {
      console.error("Failed to load user profile on startup", err);
      logoutUser();
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Real backend wiring: load the actual event catalog from the DB instead
  // of the hardcoded mock array. Deliberately does NOT fall back to mock
  // data on failure -- the whole point of wiring is that what's shown is
  // real DB state; silently falling back to fake data on an error would
  // make backend outages invisible instead of surfacing them.
  useEffect(() => {
    let cancelled = false;
    setEventsLoading(true);
    fetchEvents()
      .then((data) => {
        if (!cancelled) {
          setEvents(data);
          setEventsError(null);
          
          // Fetch user's bookings from backend if logged in
          const token = localStorage.getItem('token');
          if (token && userProfile && !userProfile.isGuest) {
            fetchMyBookings().then(async (myBks) => {
              if (cancelled) return;

              // GET /events now defaults to upcoming-only (past events
              // aren't deleted, just excluded from the general listing --
              // see Event.status on the backend), so a booking for an
              // event that has already happened will very often NOT be in
              // `data`. Without this fallback, every past booking's title
              // silently degraded to "Event #123" instead of showing what
              // the person actually bought a ticket to -- exactly the
              // booking-history case that not deleting past events was
              // supposed to preserve. Fetch any missing ones directly by
              // id, same fallback pattern used for search/recommendations.
              const knownIds = new Set(data.map((e) => e.id));
              const missingIds = [
                ...new Set(
                  myBks
                    .map((b) => String(b.event_id))
                    .filter((id) => !knownIds.has(id))
                ),
              ];
              const fetchedEvents = {};
              if (missingIds.length > 0) {
                const fetched = await Promise.all(
                  missingIds.map((id) => fetchEventById(id).catch(() => null))
                );
                missingIds.forEach((id, i) => {
                  if (fetched[i]) fetchedEvents[id] = fetched[i];
                });
              }
              if (cancelled) return;

              const adaptedBks = myBks.map(b => {
                const eventId = String(b.event_id);
                const evt = data.find(e => e.id === eventId) || fetchedEvents[eventId];
                return {
                  id: String(b.id),
                  eventId,
                  eventTitle: evt ? evt.title : `Event #${b.event_id}`,
                  quantity: b.quantity,
                  pricePaid: b.price_paid,
                  date: new Date(b.created_at).toLocaleDateString(),
                  qrCode: b.qr_code,
                  attendeeName: userProfile.name,
                  status: b.status === 'confirmed' ? 'Confirmed' : 'Cancelled'
                };
              });
              setBookings(adaptedBks);
            }).catch(e => console.error("Could not fetch bookings", e));
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setEventsError(err instanceof ApiError ? err.message : 'Could not reach the backend.');
        }
      })
      .finally(() => {
        if (!cancelled) setEventsLoading(false);
      });
    return () => { cancelled = true; };
  }, [userProfile?.id]);

  // Load real support chat history (GET /support/messages/me) for logged-in
  // users. Backend messages don't carry an `intent` field on reload (only
  // the live POST /support/messages response does -- intent isn't a
  // persisted column, see SupportMessage model), so history entries won't
  // show the LLM/rule-based badge that freshly-sent replies do -- only
  // whether each message resolved via escalation.
  useEffect(() => {
    if (userProfile.isGuest || !userProfile.id) {
      setSupportChat([SUPPORT_WELCOME_MESSAGE]);
      return;
    }
    let cancelled = false;
    setSupportChatLoading(true);
    fetchMySupportMessages()
      .then((rows) => {
        if (cancelled) return;
        if (rows.length === 0) {
          setSupportChat([SUPPORT_WELCOME_MESSAGE]);
          return;
        }
        setSupportChat(
          rows.map((r) => ({
            sender: r.sender === 'user' ? 'user' : 'bot',
            message: r.message,
            escalated: r.escalated,
            timestamp: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }))
        );
      })
      .catch((err) => {
        console.error('Failed to load support history', err);
        if (!cancelled) setSupportChat([SUPPORT_WELCOME_MESSAGE]);
      })
      .finally(() => {
        if (!cancelled) setSupportChatLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userProfile?.id, userProfile?.isGuest]);

  // DISABLED: this used to randomly perturb prices client-side every 45s to
  // make the old mock-only prototype feel "alive". Now that events come
  // from the real backend/DB, this would silently overwrite real prices
  // with fake random ones on every tick -- fighting the actual Dynamic
  // Pricing Agent instead of reflecting it. Real price changes should come
  // from the backend (re-fetching events, or a future live-update channel),
  // not a client-side random walk. Left commented rather than deleted so
  // the original simulation logic isn't lost if it's useful reference.
  //
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setEvents((prevEvents) =>
  //       prevEvents.map((evt) => {
  //         if (evt.demand === 'Surge') {
  //           const multiplier = 1 + (Math.random() * 0.05);
  //           const newPrice = Math.round(evt.price * multiplier * 100) / 100;
  //           if (newPrice !== evt.price) {
  //             triggerSystemNotification(`Dynamic Pricing: "${evt.title}" price increased to $${newPrice} due to high demand.`, 'pricing');
  //             return { ...evt, price: newPrice };
  //           }
  //         } else if (evt.demand === 'Low') {
  //           const multiplier = 1 - (Math.random() * 0.03);
  //           const newPrice = Math.max(evt.basePrice * 0.8, Math.round(evt.price * multiplier * 100) / 100);
  //           if (newPrice !== evt.price) {
  //             return { ...evt, price: newPrice };
  //           }
  //         }
  //         return evt;
  //       })
  //     );
  //   }, 45000);
  //   return () => clearInterval(interval);
  // }, []);

  const triggerSystemNotification = (message, type = 'info') => {
    const newNotif = {
      id: `notif-${Date.now()}`,
      message,
      type,
      timestamp: 'Just now',
      unread: true
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Agent: Event Creation Assistant Agent
  const generateAICopy = (title, category, location) => {
    const cleanTitle = title || 'Awesome Event';
    return {
      description: `Step into the future with "${cleanTitle}". Held in the vibrant event hubs of ${location || 'Bengaluru'}, this premier ${category || 'Tech'} experience brings together top-tier experts, interactive panels, and hands-on sessions designed to accelerate learning and networking. Join us to explore state-of-the-art developments and discover how AI and creativity collaborate!`,
      faqs: [
        { question: 'What is the refund policy?', answer: 'Full refunds are processed automatically up to 48 hours prior to the event start.' },
        { question: 'Will there be certificates provided?', answer: 'Yes, all verified attendees will receive a digital smart certificate verified via blockchain.' },
        { question: 'Who should I contact for partnerships?', answer: 'Reach out to sponsor@ai-ticketbooking.com for booth bookings and sponsorship tiers.' }
      ],
      terms: [
        'Strictly digital tickets; no printouts required.',
        'Recording sessions is prohibited unless a media badge is issued.',
        'Doors close 15 minutes prior to the opening keynote.'
      ]
    };
  };

  // Marketing Campaign Agent is wired directly in OrganizerConsole.jsx via
  // the real POST /organizer/events/{id}/campaigns endpoint -- removed the
  // client-side mock that used to live here (random channel pick, fake
  // sent/engagement numbers, never persisted anywhere).

  // Agent: Fraud Detection Agent Check & Ticket Booking
  const createBooking = async (eventId, quantity, paymentDetails) => {
    const targetEvent = events.find(e => e.id === eventId);
    if (!targetEvent) return { success: false, reason: 'Event not found' };

    if (userProfile && !userProfile.isGuest) {
      try {
        const bookingOut = await postCreateBooking({
          event_id: Number(eventId),
          quantity: Number(quantity),
          cardholder_name: paymentDetails.cardName,
          card_number: paymentDetails.cardNumber
        });

        // Re-fetch events to get updated demand tiers/prices
        const updatedEvents = await fetchEvents();
        setEvents(updatedEvents);

        const newBooking = {
          id: String(bookingOut.id),
          eventId: String(bookingOut.event_id),
          eventTitle: targetEvent.title,
          quantity: bookingOut.quantity,
          pricePaid: bookingOut.price_paid,
          date: new Date(bookingOut.created_at).toLocaleDateString(),
          qrCode: bookingOut.qr_code,
          attendeeName: paymentDetails.cardName || userProfile.name,
          status: 'Confirmed'
        };

        setBookings(prev => [newBooking, ...prev]);
        triggerSystemNotification(`Booking Confirmed: ${quantity} tickets purchased for "${targetEvent.title}".`, 'booking');
        
        setTimeout(() => {
          triggerSystemNotification(`Operations Agent: Smart ticket validation and QR code [${newBooking.qrCode}] activated.`, 'ops');
        }, 1500);

        return { success: true, booking: newBooking };
      } catch (err) {
        console.error("Booking failed via API", err);
        return { success: false, reason: err.message || 'Booking Denied: Flagged by Fraud Agent.' };
      }
    }

    // Guest fallback (original mock-only simulator logic)
    let fraudDetected = false;
    let fraudReason = '';
    let severity = 'Medium';

    if (quantity > 10) {
      fraudDetected = true;
      fraudReason = 'Bulk Bot Booking';
      severity = 'High';
    }
    else if (paymentDetails.cardName.toLowerCase().includes('bot') || paymentDetails.cardName.toLowerCase().includes('fraud')) {
      fraudDetected = true;
      fraudReason = 'Flagged Account Holder';
      severity = 'High';
    } 
    else if (paymentDetails.cardNumber.replace(/\s/g, '') === '4111111111111111') {
      fraudDetected = true;
      fraudReason = 'Card Fingerprint Anomaly';
      severity = 'High';
    }

    if (fraudDetected) {
      const newLog = {
        id: `fraud-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        type: fraudReason,
        severity,
        ip: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
        user: paymentDetails.cardName || 'Guest User',
        eventTitle: targetEvent.title,
        details: `Transaction blocked. Customer attempted buying ${quantity} tickets. Trigger: ${fraudReason}.`
      };

      setFraudLogs(prev => [newLog, ...prev]);
      triggerSystemNotification(`Fraud Warning: Transaction intercepted on "${targetEvent.title}". Reason: ${fraudReason}`, 'fraud');
      return { success: false, reason: `Booking Denied: Flagged by Fraud Agent as ${fraudReason}. Transaction aborted.` };
    }

    // Success booking: Decrement stock, increment sales
    setEvents(prevEvents =>
      prevEvents.map(evt => {
        if (evt.id === eventId) {
          const updatedSold = evt.ticketsSold + quantity;
          let updatedDemand = evt.demand;
          const ratio = updatedSold / evt.totalTickets;
          if (ratio > 0.85) updatedDemand = 'Surge';
          else if (ratio > 0.6) updatedDemand = 'High';
          else if (ratio > 0.3) updatedDemand = 'Medium';

          const newPrice = updatedDemand === 'Surge' ? Math.round(evt.price * 1.15) : evt.price;

          return {
            ...evt,
            ticketsSold: updatedSold,
            demand: updatedDemand,
            price: newPrice
          };
        }
        return evt;
      })
    );

    const bookingId = `tkt-${Date.now()}`;
    const newBooking = {
      id: bookingId,
      eventId,
      eventTitle: targetEvent.title,
      quantity,
      pricePaid: targetEvent.price * quantity,
      date: new Date().toLocaleDateString(),
      qrCode: `QR-TICKET-${bookingId}-${eventId}`,
      attendeeName: paymentDetails.cardName,
      status: 'Confirmed'
    };

    setBookings(prev => [newBooking, ...prev]);
    triggerSystemNotification(`Booking Confirmed: ${quantity} tickets purchased for "${targetEvent.title}".`, 'booking');

    setTimeout(() => {
      triggerSystemNotification(`Operations Agent: Smart ticket validation and QR code [${newBooking.qrCode}] activated.`, 'ops');
    }, 1500);

    return { success: true, booking: newBooking };
  };

  // Auth Operations
  const login = async (email, password) => {
    const res = await loginUser(email, password);
    await loadProfile();
    return res;
  };

  const signup = async (userData) => {
    return registerUser(userData);
  };

  const logout = () => {
    logoutUser();
    setUserProfile({
      name: 'Guest User',
      email: 'guest@example.com',
      location: 'Arlington',
      preferences: [],
      budget: 200,
      ticketTier: 'General',
      isGuest: true,
      role: 'attendee'
    });
    setBookings([]);
  };

  const updateProfilePreferences = async ({ categories, budget_max, ticket_tier }) => {
    if (userProfile.isGuest) {
      setUserProfile(prev => ({
        ...prev,
        preferences: categories,
        budget: budget_max,
        ticketTier: ticket_tier
      }));
      return;
    }
    const updated = await updateUserPreferences({ categories, budget_max, ticket_tier });
    setUserProfile(prev => ({
      ...prev,
      preferences: updated.categories || [],
      budget: updated.budget_max || 200,
      ticketTier: updated.ticket_tier || 'Gold'
    }));
  };

  // Agent: Customer Support Agent -- real backend (POST /support/messages),
  // which runs rule-based intent matching first (refunds/QR/pricing/fraud/
  // escalation keywords) and only falls through to a real LLM call for
  // anything unmatched, with a template fallback if no LLM_PROVIDER is
  // configured in the backend's .env. `intent` in the response is
  // "llm_general" exactly when the reply actually came from the LLM --
  // everything else (refund/qr/pricing_explanation/fraud_explanation/
  // escalation/fallback) never touched it.
  const sendSupportMessage = async (userMsg) => {
    if (!userMsg.trim() || userProfile.isGuest) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setSupportChat(prev => [...prev, { sender: 'user', message: userMsg, timestamp }]);
    setIsSupportSending(true);

    try {
      const result = await sendSupportMessageApi(userMsg);
      setSupportChat(prev => [
        ...prev,
        {
          sender: 'bot',
          message: result.reply,
          escalated: result.escalated,
          intent: result.intent,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      console.error('Support message failed', err);
      setSupportChat(prev => [
        ...prev,
        {
          sender: 'bot',
          message: "Sorry, I couldn't reach support right now. Please try again in a moment.",
          isError: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsSupportSending(false);
    }
  };

  const addCustomEvent = async (eventData) => {
  try {
    const rawCreatedEvent = await createEvent({
      title: eventData.title,
      description: eventData.description || null,
      category: eventData.category,
      subcategory: eventData.subcategory || null,
      event_datetime: eventData.date
        ? `${eventData.date}T${eventData.time || "19:00"}:00`
        : null,
      venue_name: eventData.location || null,
      venue_city: eventData.venue_city || null,
      venue_state: eventData.venue_state || null,
      venue_country: eventData.venue_country || null,
      base_price: Number(eventData.basePrice) || 0,
      total_tickets: Number(eventData.totalTickets) || 0,
      image_url: eventData.image || null,
    });

    // POST /events returns the raw backend shape (snake_case), not the
    // adapted frontend shape (.location/.price/.demand/etc.) every other
    // item in `events` uses -- adapt it before it goes anywhere near
    // component state, or it'll render as blank/undefined wherever it's
    // displayed.
    const createdEvent = adaptEventCore(rawCreatedEvent);

    // GET /events defaults to a max page of 100 (see fetchEvents' comment
    // in api.js), but this catalog has 1000+ events ordered by
    // event_datetime -- so a freshly created event is almost always
    // outside that page and fetchEvents() alone won't include it. That
    // was the actual cause of "created fine, but doesn't show up or open
    // from the attendee listing": the event existed in the DB the whole
    // time, it just never made it into the frontend's loaded event list.
    // Explicitly merge the real created event in (deduped, up front)
    // instead of trusting the refetch to happen to contain it.
    const updatedEvents = await fetchEvents();
    const withoutDup = updatedEvents.filter((e) => e.id !== createdEvent.id);
    setEvents([createdEvent, ...withoutDup]);

    triggerSystemNotification(
      `Event Creator: Created event "${createdEvent.title}".`,
      'creation'
    );

    setTimeout(() => {
      triggerSystemNotification(
        `Operations Agent: Registered "${createdEvent.title}". Automated event readiness checklist initialized.`,
        'ops'
      );
    }, 1000);

    return createdEvent;
  } catch (error) {
    console.error("Failed to create event via API:", error);
    throw error;
  }
};

  const clearUnreadNotifications = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        currency,
        setCurrency,
        formatPrice,
        CURRENCIES,
        events,
        eventsLoading,
        eventsError,
        bookings,
        userProfile,
        fraudLogs,
        notifications,
        supportChat,
        supportChatLoading,
        isSupportSending,
        createBooking,
        sendSupportMessage,
        addCustomEvent,
        clearUnreadNotifications,
        setUserProfile,
        authLoading,
        login,
        signup,
        logout,
        updateProfilePreferences
      }}
    >
      {children}
    </AppContext.Provider>
  );
};