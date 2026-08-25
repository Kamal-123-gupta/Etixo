import React, { useContext, useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { searchEvents, fetchEventById, fetchRecommendations } from '../lib/api';
import { Search, Sparkles, SlidersHorizontal, MapPin, Calendar, ArrowRight } from 'lucide-react';

export default function AttendeePortal() {
  const { events, eventsLoading, eventsError, userProfile, updateProfilePreferences } = useContext(AppContext);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Categories derived from the real event catalog instead of a hardcoded
  // guess -- the old ['Tech', 'Music', 'Comedy', 'Arts'] list doesn't exist
  // anywhere in the real data (real categories are football/basketball/
  // baseball/hockey/stadium_tours), so the preference-toggle buttons were
  // silently offering categories with zero matching events.
  const availableCategories = useMemo(() => {
    return [...new Set(events.map((evt) => evt.category))].filter(Boolean).sort();
  }, [events]);

  // Handle preference tag toggle. Routes through the context's real
  // updateProfilePreferences() (PUT /users/me/preferences for logged-in
  // users) instead of setting local state directly -- it USED to just
  // mutate userProfile in place, which never reached the backend. That
  // was silently harmless while "Recommended for You" was only a local
  // category filter, but now that it calls the real Personalization
  // Agent (which ranks off the DB-stored preferences, not local React
  // state), a toggle that never persists would look like it does nothing.
  const handleTogglePref = (category) => {
    const prefs = userProfile.preferences.includes(category)
      ? userProfile.preferences.filter((p) => p !== category)
      : [...userProfile.preferences, category];
    updateProfilePreferences({
      categories: prefs,
      budget_max: userProfile.budget,
      ticket_tier: userProfile.ticketTier
    }).catch((err) => console.error('Failed to save preference', err));
  };

  // Real Event Discovery Agent search (debounced -- avoids firing a
  // request on every keystroke). Empty query short-circuits to showing
  // every event, no API call needed.
  const [parsedIntent, setParsedIntent] = useState(null);
  const [searchResultIds, setSearchResultIds] = useState(null); // null = no search active
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Cache for events referenced by search OR recommendation results but not
  // present in the (paginated) `events` list from context -- GET /events
  // defaults to a 20-item page, but the Discovery/Personalization Agents
  // search/rank the FULL DB with no limit, so a legitimate result can
  // reference an event outside whatever page happened to be loaded.
  // Without this, those results were silently dropped (confirmed in
  // testing: a 3-result search rendered only 1 card, no error, no
  // indication 2 results vanished).
  const [fetchedSearchEvents, setFetchedSearchEvents] = useState({});

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setParsedIntent(null);
      setSearchResultIds(null);
      setSearchError(null);
      return;
    }

    let cancelled = false;
    setSearchLoading(true);
    const timer = setTimeout(() => {
      searchEvents(query, { userId: userProfile.id ?? undefined })
        .then(async ({ parsedIntent, rankedEventIds }) => {
          if (cancelled) return;
          setParsedIntent(parsedIntent);
          setSearchResultIds(rankedEventIds);
          setSearchError(null);

          // fetch any result IDs not already available locally, in parallel
          const knownIds = new Set(events.map((e) => e.id));
          const missingIds = rankedEventIds.filter(
            (id) => !knownIds.has(id) && !(id in fetchedSearchEvents)
          );
          if (missingIds.length > 0) {
            const fetched = await Promise.all(
              missingIds.map((id) => fetchEventById(id).catch(() => null))
            );
            if (cancelled) return;
            setFetchedSearchEvents((prev) => {
              const next = { ...prev };
              missingIds.forEach((id, i) => {
                if (fetched[i]) next[id] = fetched[i];
              });
              return next;
            });
          }
        })
        .catch((err) => {
          if (cancelled) return;
          setSearchError(err.message || 'Search failed.');
          setSearchResultIds([]);
        })
        .finally(() => {
          if (!cancelled) setSearchLoading(false);
        });
    }, 350); // debounce

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchedSearchEvents intentionally excluded to avoid re-searching on cache updates
  }, [searchQuery, userProfile.id, events]);

  // Map the agent's ranked event IDs back onto full event objects --
  // checking the locally-loaded list first, then the fetched-on-demand
  // cache for anything outside the loaded page. Order is preserved (the
  // agent's ranking), not re-sorted.
  const filteredEvents = useMemo(() => {
    if (searchResultIds === null) return events; // no active search
    const eventsById = new Map(events.map((evt) => [evt.id, evt]));
    return searchResultIds
      .map((id) => eventsById.get(id) || fetchedSearchEvents[id])
      .filter(Boolean);
  }, [events, searchResultIds, fetchedSearchEvents]);

  // Real User Preference & Personalization Agent recommendations
  // (GET /agents/recommendations). Requires a real logged-in user id --
  // there's no anonymous recommendation path server-side, so guests get
  // null here and see a sign-in prompt instead of a fake list.
  const [recommendedEventIds, setRecommendedEventIds] = useState(null);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState(null);

  useEffect(() => {
    if (userProfile.isGuest || !userProfile.id) {
      setRecommendedEventIds(null);
      setRecError(null);
      return;
    }

    let cancelled = false;
    setRecLoading(true);
    fetchRecommendations(userProfile.id)
      .then(async (rankedEventIds) => {
        if (cancelled) return;
        setRecommendedEventIds(rankedEventIds);
        setRecError(null);

        // fetch any result IDs not already available locally, in parallel
        // (same pagination gap as Discovery Agent search -- see comment above)
        const knownIds = new Set(events.map((e) => e.id));
        const missingIds = rankedEventIds.filter(
          (id) => !knownIds.has(id) && !(id in fetchedSearchEvents)
        );
        if (missingIds.length > 0) {
          const fetched = await Promise.all(
            missingIds.map((id) => fetchEventById(id).catch(() => null))
          );
          if (cancelled) return;
          setFetchedSearchEvents((prev) => {
            const next = { ...prev };
            missingIds.forEach((id, i) => {
              if (fetched[i]) next[id] = fetched[i];
            });
            return next;
          });
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setRecError(err.message || 'Could not load recommendations.');
        setRecommendedEventIds([]);
      })
      .finally(() => {
        if (!cancelled) setRecLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchedSearchEvents intentionally excluded to avoid re-fetching on cache updates
  }, [userProfile.id, userProfile.isGuest, userProfile.preferences, events]);

  // Map the agent's ranked event IDs back onto full event objects, same
  // pattern as filteredEvents above -- order preserved, not re-sorted.
  const recommendedEvents = useMemo(() => {
    if (!recommendedEventIds) return [];
    const eventsById = new Map(events.map((evt) => [evt.id, evt]));
    return recommendedEventIds
      .map((id) => eventsById.get(id) || fetchedSearchEvents[id])
      .filter(Boolean);
  }, [events, recommendedEventIds, fetchedSearchEvents]);

  return (
    <div className="flex-1 bg-[#16171d] text-gray-100 p-6 md:p-10 space-y-10 max-w-7xl mx-auto w-full">
      {/* Hero Welcome & Personalization Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900/30 via-indigo-900/30 to-slate-900/30 border border-purple-500/10 p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5" /> Personalization Agent Active
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white m-0">
            Welcome back, {userProfile.name}
          </h1>
          <p className="text-gray-400 text-sm md:text-base max-w-xl">
            We've customized your discovery deck based on your interests and location in <span className="text-indigo-400 font-semibold">{userProfile.location}</span>.
          </p>
        </div>

        {/* Preference Selector */}
        <div className="bg-[#1f2028]/80 backdrop-blur border border-white/5 p-4 rounded-2xl w-full md:w-auto">
          <div className="flex items-center gap-2 mb-2">
            <SlidersHorizontal className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-semibold text-gray-300">Preferences Profile</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {availableCategories.map((cat) => {
              const selected = userProfile.preferences.includes(cat);
              return (
                <button
                  key={cat}
                  onClick={() => handleTogglePref(cat)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                    selected
                      ? 'bg-purple-600 border-purple-500 text-white shadow-sm shadow-purple-500/20'
                      : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Discovery Hub: Search Box */}
      <section className="space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder='Ask discovery agent, e.g. "Find me coding hackathons under $50 in Bengaluru"'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1f2028] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-sm md:text-base"
          />
        </div>

        {/* Simulated Discovery Intent Badge */}
        {searchQuery && (
          <div className="flex items-center gap-2 p-2 px-3 bg-[#1f2028] rounded-xl border border-white/5 text-xs font-mono max-w-max">
            <span className="text-purple-400">Event Discovery Intent:</span>
            {parsedIntent ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                {parsedIntent.category && (
                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-md border border-indigo-500/20">
                    Category: {parsedIntent.category}
                  </span>
                )}
                {parsedIntent.location && (
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md border border-emerald-500/20">
                    Location: {parsedIntent.location}
                  </span>
                )}
                {parsedIntent.maxPrice && (
                  <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-md border border-amber-500/20">
                    Budget Max: ${parsedIntent.maxPrice}
                  </span>
                )}
                {!parsedIntent.category && !parsedIntent.location && !parsedIntent.maxPrice && (
                  <span className="text-gray-400">Scanning keyword context...</span>
                )}
              </div>
            ) : (
              <span className="text-gray-500">Parsing...</span>
            )}
          </div>
        )}
      </section>

      {/* Recommended for You Grid (Horizontal Scroll / Block) */}
      {!searchQuery && userProfile.isGuest && (
        <section className="rounded-2xl border border-white/5 bg-[#1f2028]/60 p-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
            Sign in to see events picked for you by the Personalization Agent.
          </div>
          <button
            onClick={() => navigate('/login')}
            className="text-xs bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-xl transition-all shrink-0"
          >
            Sign In
          </button>
        </section>
      )}

      {!searchQuery && !userProfile.isGuest && recLoading && !recommendedEventIds && (
        <section className="text-center p-6 bg-[#1f2028] border border-white/5 rounded-2xl">
          <p className="text-gray-400 text-sm">Personalization Agent is picking events for you...</p>
        </section>
      )}

      {!searchQuery && !userProfile.isGuest && recError && (
        <section className="text-center p-6 bg-[#1f2028] border border-rose-500/20 rounded-2xl">
          <p className="text-rose-400 text-sm font-semibold mb-1">Couldn't load recommendations</p>
          <p className="text-gray-500 text-xs font-mono">{recError}</p>
        </section>
      )}

      {recommendedEvents.length > 0 && !searchQuery && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-bold tracking-tight text-white m-0">Recommended for You</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendedEvents.map((evt) => (
              <div
                key={`rec-${evt.id}`}
                onClick={() => navigate(`/event/${evt.id}`)}
                className="group relative overflow-hidden rounded-2xl bg-[#1f2028] border border-purple-500/10 hover:border-purple-500/30 transition-all duration-300 p-5 flex flex-col sm:flex-row gap-5 cursor-pointer shadow-lg hover:shadow-purple-500/5 hover:-translate-y-0.5"
              >
                <div className="w-full sm:w-36 h-28 rounded-xl overflow-hidden shrink-0">
                  <img
                    src={evt.image}
                    alt={evt.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-purple-400">
                        {evt.category} Recommendation
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                        evt.demand === 'Surge' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        evt.demand === 'High' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {evt.demand === 'Surge' ? '🔥 Surge Price' : evt.demand === 'High' ? '⚡ High Demand' : '🏷️ Dynamic Disc.'}
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-gray-100 group-hover:text-purple-400 transition-colors m-0 leading-snug">
                      {evt.title}
                    </h3>
                    <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed">
                      {evt.description}
                    </p>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-white/5">
                    <span className="text-lg font-bold text-white font-mono">${evt.price}</span>
                    <span className="text-xs text-purple-400 flex items-center gap-1 font-medium">
                      Configure Booking <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main Events List */}
      <section className="space-y-6">
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <h2 className="text-xl font-bold text-white m-0">All Scheduled Events</h2>
          <span className="text-xs text-gray-400 font-mono">{filteredEvents.length} Events matches</span>
        </div>

        {eventsLoading ? (
          <div className="text-center p-12 bg-[#1f2028] border border-white/5 rounded-2xl">
            <p className="text-gray-400 text-sm">Loading events from the backend...</p>
          </div>
        ) : eventsError ? (
          <div className="text-center p-12 bg-[#1f2028] border border-rose-500/20 rounded-2xl">
            <p className="text-rose-400 text-sm font-semibold mb-1">Couldn't reach the backend</p>
            <p className="text-gray-500 text-xs font-mono">{eventsError}</p>
            <p className="text-gray-500 text-xs mt-2">
              Check that the API server is running and reachable at the configured base URL.
            </p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center p-12 bg-[#1f2028] border border-white/5 rounded-2xl">
            <p className="text-gray-400 text-sm">The database has no events yet.</p>
            <p className="text-gray-500 text-xs mt-2">Run the seed script on the backend to load sample data.</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center p-12 bg-[#1f2028] border border-white/5 rounded-2xl">
            <p className="text-gray-400 text-sm">No scheduled events match your search query.</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-3 text-xs bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-xl transition-all"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((evt) => {
              const percentSold = Math.min(100, Math.round((evt.ticketsSold / evt.totalTickets) * 100));
              return (
                <div
                  key={evt.id}
                  onClick={() => navigate(`/event/${evt.id}`)}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl bg-[#1f2028] border border-white/5 hover:border-purple-500/20 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-purple-500/5 hover:-translate-y-0.5"
                >
                  {/* Event Thumbnail */}
                  <div className="relative h-44 overflow-hidden bg-slate-800">
                    <img
                      src={evt.image}
                      alt={evt.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3 flex flex-col gap-1">
                      <span className="bg-[#16171d]/80 backdrop-blur-md text-[10px] px-2.5 py-1 rounded-full font-mono text-purple-400 font-semibold border border-purple-500/10">
                        {evt.category}
                      </span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full text-center font-mono font-semibold ${
                        evt.demand === 'Surge' ? 'bg-rose-500/90 text-white shadow-lg shadow-rose-500/15' :
                        evt.demand === 'High' ? 'bg-amber-500/90 text-slate-900 font-bold' :
                        'bg-emerald-500/90 text-slate-900 font-bold'
                      }`}>
                        {evt.demand} Demand
                      </span>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-bold text-base text-gray-100 group-hover:text-purple-400 transition-colors m-0 leading-snug">
                        {evt.title}
                      </h3>
                      <div className="space-y-1 text-xs text-gray-400 font-medium">
                        <p className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span>{evt.location}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span>{evt.date} • {evt.time}</span>
                        </p>
                      </div>
                    </div>

                    {/* Ticket Progress bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-mono text-gray-400">
                        <span>Allocation Sold</span>
                        <span>{percentSold}% ({evt.ticketsSold}/{evt.totalTickets})</span>
                      </div>
                      <div className="w-full bg-[#16171d] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentSold}%` }}
                        />
                      </div>
                    </div>

                    {/* Pricing info */}
                    <div className="flex justify-between items-center pt-3 border-t border-white/5">
                      <div className="text-left">
                        <span className="text-[10px] text-gray-500 uppercase font-mono block">Dynamic price</span>
                        <span className="text-xl font-bold text-white font-mono leading-none">${evt.price}</span>
                      </div>
                      <span className="text-xs bg-purple-600/10 group-hover:bg-purple-600 text-purple-400 group-hover:text-white px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 font-semibold border border-purple-500/10 group-hover:border-purple-600">
                        View Details <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}