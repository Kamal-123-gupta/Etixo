import React, { useContext, useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { searchEvents, fetchEventById, fetchRecommendations } from '../lib/api';
import { getCategoryFallbackImage, handleImageError } from '../lib/eventImages';
import { Search, Sparkles, SlidersHorizontal, MapPin, Calendar, ArrowRight } from 'lucide-react';

export default function AttendeePortal() {
  const { events, eventsLoading, eventsError, userProfile, updateProfilePreferences, formatPrice, theme } = useContext(AppContext);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const isLight = theme === 'light';

  // Categories derived from the real event catalog
  const availableCategories = useMemo(() => {
    return [...new Set(events.map((evt) => evt.category))].filter(Boolean).sort();
  }, [events]);

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

  const [parsedIntent, setParsedIntent] = useState(null);
  const [searchResultIds, setSearchResultIds] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
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
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, userProfile.id, events]);

  const filteredEvents = useMemo(() => {
    if (searchResultIds === null) return events;
    const eventsById = new Map(events.map((evt) => [evt.id, evt]));
    return searchResultIds
      .map((id) => eventsById.get(id) || fetchedSearchEvents[id])
      .filter(Boolean);
  }, [events, searchResultIds, fetchedSearchEvents]);

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
  }, [userProfile.id, userProfile.isGuest, userProfile.preferences, events]);

  const recommendedEvents = useMemo(() => {
    if (!recommendedEventIds) return [];
    const eventsById = new Map(events.map((evt) => [evt.id, evt]));
    return recommendedEventIds
      .map((id) => eventsById.get(id) || fetchedSearchEvents[id])
      .filter(Boolean);
  }, [events, recommendedEventIds, fetchedSearchEvents]);

  return (
    <div className={`flex-1 p-6 md:p-10 space-y-10 max-w-7xl mx-auto w-full transition-colors ${
      isLight ? 'text-slate-800' : 'text-gray-100'
    }`}>
      {/* Hero Welcome & Personalization Section */}
      <section className={`relative overflow-hidden rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-all ${
        isLight
          ? 'bg-gradient-to-r from-purple-100/70 via-indigo-50/70 to-slate-100/80 border border-purple-200/80 shadow-xs'
          : 'bg-gradient-to-r from-purple-900/30 via-indigo-900/30 to-slate-900/30 border border-purple-500/10'
      }`}>
        <div className="space-y-2">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold ${
            isLight
              ? 'bg-purple-600/10 text-purple-700 border border-purple-300'
              : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
          }`}>
            <Sparkles className="w-3.5 h-3.5" /> Personalization Agent Active
          </div>
          <h1 className={`text-3xl md:text-4xl font-extrabold tracking-tight m-0 ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            Welcome back, {userProfile.name}
          </h1>
          <p className={`text-sm md:text-base max-w-xl ${
            isLight ? 'text-slate-600' : 'text-gray-400'
          }`}>
            We've customized your discovery deck based on your interests and location in{' '}
            <span className={isLight ? 'text-indigo-600 font-bold' : 'text-indigo-400 font-semibold'}>
              {userProfile.location}
            </span>.
          </p>
        </div>

        {/* Preference Selector */}
        <div className={`backdrop-blur p-4 rounded-2xl w-full md:w-auto border transition-colors ${
          isLight
            ? 'bg-white/90 border-slate-200/90 shadow-xs'
            : 'bg-[#1f2028]/80 border-white/5'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <SlidersHorizontal className="w-4 h-4 text-purple-500" />
            <span className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
              Preferences Profile
            </span>
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
                      ? 'bg-purple-600 border-purple-600 text-white shadow-xs font-semibold'
                      : isLight
                      ? 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
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
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder='Ask discovery agent, e.g. "Find me coding hackathons in Bengaluru"'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500/40 border transition-all text-sm md:text-base ${
              isLight
                ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 shadow-xs focus:border-purple-500'
                : 'bg-[#1f2028] border-white/10 text-gray-200 placeholder-gray-500 focus:border-purple-500'
            }`}
          />
        </div>

        {/* Discovery Intent Badge */}
        {searchQuery && (
          <div className={`flex items-center gap-2 p-2 px-3 rounded-xl border text-xs font-mono max-w-max ${
            isLight
              ? 'bg-white border-slate-200 text-slate-700 shadow-xs'
              : 'bg-[#1f2028] border-white/5 text-gray-200'
          }`}>
            <span className="text-purple-600 dark:text-purple-400 font-semibold">Event Discovery Intent:</span>
            {parsedIntent ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                {parsedIntent.category && (
                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-md border border-indigo-500/20 font-bold">
                    Category: {parsedIntent.category}
                  </span>
                )}
                {parsedIntent.location && (
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md border border-emerald-500/20 font-bold">
                    Location: {parsedIntent.location}
                  </span>
                )}
                {parsedIntent.maxPrice && (
                  <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md border border-amber-500/20 font-bold">
                    Budget Max: {formatPrice(parsedIntent.maxPrice)}
                  </span>
                )}
                {!parsedIntent.category && !parsedIntent.location && !parsedIntent.maxPrice && (
                  <span className="text-slate-400">Scanning keyword context...</span>
                )}
              </div>
            ) : (
              <span className="text-slate-400">Parsing...</span>
            )}
          </div>
        )}
      </section>

      {/* Recommended for You Grid */}
      {!searchQuery && userProfile.isGuest && (
        <section className={`rounded-2xl border p-5 flex items-center justify-between gap-4 flex-wrap ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#1f2028]/60 border-white/5'
        }`}>
          <div className={`flex items-center gap-2 text-sm ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
            Sign in to see events picked for you by the Personalization Agent.
          </div>
          <button
            onClick={() => navigate('/login')}
            className="text-xs bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-xl transition-all shrink-0 shadow-xs"
          >
            Sign In
          </button>
        </section>
      )}

      {!searchQuery && !userProfile.isGuest && recLoading && !recommendedEventIds && (
        <section className={`text-center p-6 border rounded-2xl ${
          isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-[#1f2028] border-white/5 text-gray-400'
        }`}>
          <p className="text-sm">Personalization Agent is picking events for you...</p>
        </section>
      )}

      {!searchQuery && !userProfile.isGuest && recError && (
        <section className={`text-center p-6 border rounded-2xl ${
          isLight ? 'bg-rose-50 border-rose-200' : 'bg-[#1f2028] border-rose-500/20'
        }`}>
          <p className="text-rose-600 text-sm font-semibold mb-1">Couldn't load recommendations</p>
          <p className="text-slate-400 text-xs font-mono">{recError}</p>
        </section>
      )}

      {recommendedEvents.length > 0 && !searchQuery && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h2 className={`text-xl font-bold tracking-tight m-0 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Recommended for You
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendedEvents.map((evt) => (
              <div
                key={`rec-${evt.id}`}
                onClick={() => navigate(`/event/${evt.id}`)}
                className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 p-5 flex flex-col sm:flex-row gap-5 cursor-pointer hover:-translate-y-0.5 ${
                  isLight
                    ? 'bg-white border-slate-200 hover:border-purple-300 hover:shadow-lg shadow-xs'
                    : 'bg-[#1f2028] border-purple-500/10 hover:border-purple-500/30 hover:shadow-xl hover:shadow-purple-500/5'
                }`}
              >
                <div className="w-full sm:w-36 h-28 rounded-xl overflow-hidden shrink-0 bg-slate-800">
                  <img
                    src={evt.image || getCategoryFallbackImage(evt.category)}
                    alt={evt.title}
                    onError={(e) => handleImageError(e, evt.category)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-purple-600 dark:text-purple-400 font-bold">
                        {evt.category} Recommendation
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                        evt.demand === 'Surge' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                        evt.demand === 'High' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                        'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {evt.demand === 'Surge' ? '🔥 Surge Price' : evt.demand === 'High' ? '⚡ High Demand' : '🏷️ Dynamic Disc.'}
                      </span>
                    </div>
                    <h3 className={`font-bold text-base group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors m-0 leading-snug ${
                      isLight ? 'text-slate-900' : 'text-gray-100'
                    }`}>
                      {evt.title}
                    </h3>
                    <p className={`text-xs line-clamp-2 leading-relaxed ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                      {evt.description}
                    </p>
                  </div>
                  <div className={`flex justify-between items-center pt-2 border-t ${
                    isLight ? 'border-slate-100' : 'border-white/5'
                  }`}>
                    <span className={`text-lg font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {formatPrice(evt.price)}
                    </span>
                    <span className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1 font-semibold">
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
        <div className={`flex justify-between items-center border-b pb-3 ${
          isLight ? 'border-slate-200' : 'border-white/5'
        }`}>
          <h2 className={`text-xl font-bold m-0 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            All Scheduled Events
          </h2>
          <span className="text-xs text-slate-400 font-mono font-medium">{filteredEvents.length} Events matches</span>
        </div>

        {eventsLoading ? (
          <div className={`text-center p-12 border rounded-2xl ${
            isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-[#1f2028] border-white/5 text-gray-400'
          }`}>
            <p className="text-sm">Loading events from the backend...</p>
          </div>
        ) : eventsError ? (
          <div className={`text-center p-12 border rounded-2xl ${
            isLight ? 'bg-rose-50 border-rose-200' : 'bg-[#1f2028] border-rose-500/20'
          }`}>
            <p className="text-rose-600 text-sm font-semibold mb-1">Couldn't reach the backend</p>
            <p className="text-slate-400 text-xs font-mono">{eventsError}</p>
          </div>
        ) : events.length === 0 ? (
          <div className={`text-center p-12 border rounded-2xl ${
            isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-[#1f2028] border-white/5 text-gray-400'
          }`}>
            <p className="text-sm">The database has no events yet.</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className={`text-center p-12 border rounded-2xl ${
            isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-[#1f2028] border-white/5 text-gray-400'
          }`}>
            <p className="text-sm">No scheduled events match your search query.</p>
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
                  className={`group flex flex-col justify-between overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer hover:-translate-y-0.5 ${
                    isLight
                      ? 'bg-white border-slate-200 hover:border-purple-300 hover:shadow-xl shadow-xs'
                      : 'bg-[#1f2028] border-white/5 hover:border-purple-500/20 hover:shadow-xl hover:shadow-purple-500/5'
                  }`}
                >
                  {/* Event Thumbnail */}
                  <div className="relative h-44 overflow-hidden bg-slate-900">
                    <img
                      src={evt.image || getCategoryFallbackImage(evt.category)}
                      alt={evt.title}
                      onError={(e) => handleImageError(e, evt.category)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3 flex flex-col gap-1">
                      <span className="bg-[#16171d]/85 backdrop-blur-md text-[10px] px-2.5 py-1 rounded-full font-mono text-purple-300 font-semibold border border-purple-500/20">
                        {evt.category}
                      </span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full text-center font-mono font-semibold ${
                        evt.demand === 'Surge' ? 'bg-rose-500 text-white shadow-sm' :
                        evt.demand === 'High' ? 'bg-amber-500 text-slate-900 font-bold' :
                        'bg-emerald-500 text-slate-900 font-bold'
                      }`}>
                        {evt.demand} Demand
                      </span>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className={`font-bold text-base group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors m-0 leading-snug ${
                        isLight ? 'text-slate-900' : 'text-gray-100'
                      }`}>
                        {evt.title}
                      </h3>
                      <div className={`space-y-1 text-xs font-medium ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                        <p className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          <span>{[evt.venueName, evt.location].filter(Boolean).join(' — ') || 'Location TBA'}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          <span>{evt.date} • {evt.time}</span>
                        </p>
                      </div>
                    </div>

                    {/* Ticket Progress bar */}
                    <div className="space-y-1.5">
                      <div className={`flex justify-between items-center text-[10px] font-mono ${
                        isLight ? 'text-slate-500' : 'text-gray-400'
                      }`}>
                        <span>Allocation Sold</span>
                        <span>{percentSold}% ({evt.ticketsSold}/{evt.totalTickets})</span>
                      </div>
                      <div className={`w-full h-1.5 rounded-full overflow-hidden ${
                        isLight ? 'bg-slate-100' : 'bg-[#16171d]'
                      }`}>
                        <div
                          className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentSold}%` }}
                        />
                      </div>
                    </div>

                    {/* Pricing info */}
                    <div className={`flex justify-between items-center pt-3 border-t ${
                      isLight ? 'border-slate-100' : 'border-white/5'
                    }`}>
                      <div className="text-left">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Dynamic price</span>
                        <span className={`text-xl font-bold font-mono leading-none ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}>
                          {formatPrice(evt.price)}
                        </span>
                      </div>
                      <span className="text-xs bg-purple-600/10 group-hover:bg-purple-600 text-purple-600 dark:text-purple-400 group-hover:text-white px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 font-semibold border border-purple-500/20 group-hover:border-purple-600">
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