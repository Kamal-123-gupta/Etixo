import React, { useContext, useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { searchEvents, fetchEventById, fetchRecommendations } from '../lib/api';
import { getCategoryFallbackImage, handleImageError } from '../lib/eventImages';
import InteractiveEventGlobe from '../components/InteractiveEventGlobe';
import {
  Search,
  Sparkles,
  SlidersHorizontal,
  MapPin,
  Calendar,
  ArrowRight,
  TrendingUp,
  Award,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Compass,
  Globe2
} from 'lucide-react';

export default function AttendeePortal() {
  const { events, eventsLoading, eventsError, userProfile, updateProfilePreferences, formatPrice, theme } = useContext(AppContext);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const isLight = theme === 'light';

  const normalizeCategory = (cat) =>
    String(cat || '').toLowerCase().trim().replace(/[\s_-]+/g, '');

  // Static predefined categories (matches Profile.jsx) merged with any extra from the event DB
  const PREDEFINED_CATEGORIES = [
    'football', 'basketball', 'baseball', 'hockey', 'stadium_tours',
    'Music', 'Arts', 'Comedy', 'Film',
    'Tech', 'Hackathon', 'Conference',
    'Food', 'Fitness', 'Wellness', 'Dance',
    'Gaming', 'Charity', 'Networking', 'Kids',
  ];

  const availableCategories = useMemo(() => {
    const map = new Map();
    PREDEFINED_CATEGORIES.forEach((cat) => {
      map.set(normalizeCategory(cat), cat);
    });
    events.forEach((evt) => {
      if (evt.category) {
        const norm = normalizeCategory(evt.category);
        if (!map.has(norm)) {
          map.set(norm, evt.category);
        }
      }
    });
    return Array.from(map.values());
  }, [events]);

  const handleTogglePref = (category) => {
    const currentPrefs = userProfile.preferences || [];
    const isSelected = currentPrefs.some(
      (p) => normalizeCategory(p) === normalizeCategory(category)
    );
    const prefs = isSelected
      ? currentPrefs.filter((p) => normalizeCategory(p) !== normalizeCategory(category))
      : [...currentPrefs, category];
    updateProfilePreferences({
      categories: prefs,
      budget_max: userProfile.budget,
      ticket_tier: userProfile.ticketTier
    }).catch((err) => console.error('Failed to save preference', err));
  };

  const handleClearPrefs = () => {
    updateProfilePreferences({
      categories: [],
      budget_max: userProfile.budget,
      ticket_tier: userProfile.ticketTier
    }).catch((err) => console.error('Failed to clear preferences', err));
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
    let list = events;
    if (searchResultIds !== null) {
      const eventsById = new Map(events.map((evt) => [evt.id, evt]));
      list = searchResultIds
        .map((id) => eventsById.get(id) || fetchedSearchEvents[id])
        .filter(Boolean);
    }

    if (userProfile.preferences && userProfile.preferences.length > 0) {
      const selectedNormSet = new Set(
        userProfile.preferences.map(normalizeCategory)
      );
      list = list.filter((evt) =>
        selectedNormSet.has(normalizeCategory(evt.category))
      );
    }

    return list;
  }, [events, searchResultIds, fetchedSearchEvents, userProfile.preferences]);

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

  // Specific featured pillar events matching the 3 signature reference card colors
  const featuredTechEvent = events.find(e => normalizeCategory(e.category) === 'tech') || events[0];
  const featuredMusicEvent = events.find(e => normalizeCategory(e.category) === 'music') || events[1];
  const featuredHackathonEvent = events.find(e => normalizeCategory(e.category) === 'hackathon') || events[2];

  return (
    <div className={`flex-1 p-4 sm:p-8 md:p-12 space-y-14 max-w-7xl mx-auto w-full transition-colors duration-200 ${
      isLight ? 'text-slate-900' : 'text-gray-100'
    }`}>

      {/* ==================== HERO SECTION ==================== */}
      <section className="pt-2 sm:pt-6 pb-4 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Hero Content */}
        <div className="lg:col-span-7 space-y-6 text-left">
          {/* Badge */}
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium border ${
            isLight
              ? 'bg-white/80 border-[#e7e4dc] text-slate-700 shadow-xs'
              : 'bg-white/5 border-white/10 text-gray-300'
          }`}>
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>AI-Powered Event Discovery & Smart Ticketing</span>
          </div>

          {/* Headline (Inter Tight style from reference) */}
          <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] m-0 ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            How is your <br />
            event experience <br />
            performing globally?
          </h1>

          {/* Subtitle */}
          <p className={`text-base sm:text-lg max-w-xl leading-relaxed ${
            isLight ? 'text-slate-600' : 'text-gray-400'
          }`}>
            Consolidating real-time AI agents, dynamic pricing velocity, instant QR check-ins, and verified global events into a single interactive dashboard for fans, organizers, and creators.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => {
                const el = document.getElementById('events-grid');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-all flex items-center gap-2 shadow-xs cursor-pointer hover:translate-x-0.5"
            >
              <span>Explore All Events</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('categories-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`px-5 py-3.5 rounded-xl border text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
                isLight
                  ? 'border-[#dcd8ce] bg-white/70 hover:bg-white text-slate-800 shadow-xs'
                  : 'border-white/10 bg-white/5 hover:bg-white/10 text-gray-200'
              }`}
            >
              <Compass className="w-4 h-4 text-slate-500" />
              <span>Browse by Category</span>
            </button>
          </div>
        </div>

        {/* Right Hero Graphic: Interactive 3D Event Globe & Dynamic Floating Badges */}
        <div className="lg:col-span-5 flex justify-center">
          <InteractiveEventGlobe onSelectCategory={handleTogglePref} isLight={isLight} />
        </div>
      </section>

      {/* ==================== STATS RIBBON ==================== */}
      <section className={`grid grid-cols-2 sm:grid-cols-4 gap-6 py-8 border-y text-left ${
        isLight ? 'border-[#e7e4dc]' : 'border-white/5'
      }`}>
        <div className="space-y-1">
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono text-slate-900 dark:text-white">
            20+
          </p>
          <p className="text-xs font-medium text-slate-500 dark:text-gray-400">
            Core Global Dimensions
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono text-slate-900 dark:text-white">
            {events.length > 0 ? `${events.length}+` : '1,000+'}
          </p>
          <p className="text-xs font-medium text-slate-500 dark:text-gray-400">
            Live Scheduled Events
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono text-slate-900 dark:text-white">
            100%
          </p>
          <p className="text-xs font-medium text-slate-500 dark:text-gray-400">
            Smart Anti-Fraud QR
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono text-slate-900 dark:text-white">
            24/7
          </p>
          <p className="text-xs font-medium text-slate-500 dark:text-gray-400">
            Autonomous AI Agents
          </p>
        </div>
      </section>

      {/* ==================== 3 SIGNATURE PILLAR CARDS (From Reference Site) ==================== */}
      <section className="space-y-6 text-left">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-widest font-mono font-bold text-slate-500 dark:text-gray-400">
              KEY GLOBAL PILLARS
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight m-0 text-slate-900 dark:text-white">
              Featured Event Highlights & Intelligence
            </h2>
          </div>

          <button
            onClick={() => {
              const el = document.getElementById('events-grid');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`self-start sm:self-auto text-xs font-medium px-4 py-2 rounded-xl border transition-all cursor-pointer ${
              isLight
                ? 'bg-white border-[#e7e4dc] text-slate-800 hover:bg-slate-50 shadow-xs'
                : 'bg-white/5 border-white/10 text-gray-200 hover:bg-white/10'
            }`}
          >
            View All Metrics & Events
          </button>
        </div>

        {/* 3 Bold Pillar Cards matching the reference layout & color system */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Pillar Card 1: Deep Forest Teal (#133834) */}
          <div
            onClick={() => featuredTechEvent && navigate(`/event/${featuredTechEvent.id}`)}
            className="group relative rounded-3xl p-6 sm:p-7 text-white flex flex-col justify-between min-h-[220px] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer bg-[#133834]"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-emerald-300" />
                </div>
                <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-white/10 text-emerald-200">
                  #1 Ranked / Tech
                </span>
              </div>

              <div>
                <p className="text-xs font-medium text-emerald-200/80">Keynote & AI Summit</p>
                <h3 className="text-lg font-bold tracking-tight text-white m-0 mt-0.5 line-clamp-1">
                  {featuredTechEvent?.title || 'Global AI Summit 2026'}
                </h3>
              </div>
            </div>

            <div className="pt-6 space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-white">
                  {featuredTechEvent ? formatPrice(featuredTechEvent.price) : '$199'}
                </span>
                <span className="text-xs text-emerald-200/70 font-mono">Dynamic Price</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-white/10 text-emerald-200 font-medium">
                  ▲ High Demand
                </span>
                <span className="text-emerald-200/90 font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Explore Event <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>

          {/* Pillar Card 2: Vibrant Raspberry Coral (#ec3b77) */}
          <div
            onClick={() => featuredMusicEvent && navigate(`/event/${featuredMusicEvent.id}`)}
            className="group relative rounded-3xl p-6 sm:p-7 text-white flex flex-col justify-between min-h-[220px] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer bg-[#ec3b77]"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-white/15 text-white">
                  #1 Ranked / Music
                </span>
              </div>

              <div>
                <p className="text-xs font-medium text-pink-100">Electronic Festival & Live Gala</p>
                <h3 className="text-lg font-bold tracking-tight text-white m-0 mt-0.5 line-clamp-1">
                  {featuredMusicEvent?.title || 'Neon Pulse: Electronic Music Fest'}
                </h3>
              </div>
            </div>

            <div className="pt-6 space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-white">
                  {featuredMusicEvent ? formatPrice(featuredMusicEvent.price) : '$89'}
                </span>
                <span className="text-xs text-pink-100 font-mono">Surge Velocity</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/15 text-xs">
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-white/15 text-white font-medium">
                  🔥 Top Velocity
                </span>
                <span className="text-white font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Explore Event <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>

          {/* Pillar Card 3: Soft Periwinkle Lavender (#9e98e4) */}
          <div
            onClick={() => featuredHackathonEvent && navigate(`/event/${featuredHackathonEvent.id}`)}
            className="group relative rounded-3xl p-6 sm:p-7 text-slate-900 flex flex-col justify-between min-h-[220px] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer bg-[#9e98e4]"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-black/10 flex items-center justify-center">
                  <Award className="w-4 h-4 text-slate-900" />
                </div>
                <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-black/10 text-slate-900">
                  #2 / Hackathons
                </span>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-700">Sprint & Agentic Buildathon</p>
                <h3 className="text-lg font-bold tracking-tight text-slate-950 m-0 mt-0.5 line-clamp-1">
                  {featuredHackathonEvent?.title || 'Global AI & Agentic Systems Hackathon'}
                </h3>
              </div>
            </div>

            <div className="pt-6 space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-slate-950">
                  {featuredHackathonEvent ? formatPrice(featuredHackathonEvent.price) : 'Free'}
                </span>
                <span className="text-xs text-slate-700 font-mono">Entry Pass</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-black/10 text-xs">
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-black/10 text-slate-900 font-semibold">
                  ✦ Open Reg.
                </span>
                <span className="text-slate-950 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Explore Event <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ==================== CATEGORIES NAVIGATION RIBBON ==================== */}
      <section id="categories-section" className="space-y-6 text-left">
        <div className="space-y-2">
          <span className="text-[11px] uppercase tracking-widest font-mono font-bold text-slate-500 dark:text-gray-400">
            MULTI-DIMENSIONAL INTELLIGENCE
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight m-0 text-slate-900 dark:text-white">
            Explore across 20 global categories
          </h2>
          <p className={`text-sm max-w-2xl ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
            From high-stakes hackathons and tech summits to philharmonic symphonies and stadium tours, filter through verified real-time event datasets.
          </p>
        </div>

        {/* Categories Pills Container matching reference design */}
        <div className={`p-4 sm:p-5 rounded-2xl border transition-colors ${
          isLight
            ? 'bg-white/80 border-[#e7e4dc] shadow-xs'
            : 'bg-[#18191e] border-white/5'
        }`}>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-slate-600 dark:text-gray-400" />
              <span className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-gray-200'}`}>
                Category Filter
              </span>
            </div>

            {(userProfile.preferences || []).length > 0 && (
              <button
                type="button"
                onClick={handleClearPrefs}
                className="text-xs font-medium text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:underline cursor-pointer"
              >
                Clear filter ({(userProfile.preferences || []).length})
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleClearPrefs}
              className={`text-xs px-3.5 py-1.5 rounded-full border transition-all cursor-pointer font-medium ${
                (!userProfile.preferences || userProfile.preferences.length === 0)
                  ? 'bg-slate-900 border-slate-900 text-white shadow-xs font-semibold'
                  : isLight
                  ? 'bg-white border-[#e7e4dc] text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              All Events ({events.length})
            </button>

            {availableCategories.map((cat) => {
              const selected = (userProfile.preferences || []).some(
                (p) => normalizeCategory(p) === normalizeCategory(cat)
              );
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleTogglePref(cat)}
                  className={`text-xs px-3.5 py-1.5 rounded-full border transition-all cursor-pointer font-medium ${
                    selected
                      ? 'bg-slate-900 border-slate-900 text-white shadow-xs font-semibold'
                      : isLight
                      ? 'bg-white border-[#e7e4dc] text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== DISCOVERY SEARCH BAR ==================== */}
      <section className="space-y-4 text-left">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder='Ask discovery agent, e.g. "Find me coding hackathons in Bengaluru" or "Electronic music in Miami"'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full rounded-2xl pl-11 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-slate-400 border transition-all text-sm ${
              isLight
                ? 'bg-white border-[#e7e4dc] text-slate-900 placeholder-slate-400 shadow-xs'
                : 'bg-[#18191e] border-white/10 text-gray-200 placeholder-gray-500'
            }`}
          />
        </div>

        {/* Discovery Intent Badge */}
        {searchQuery && (
          <div className={`flex items-center gap-2 p-2 px-3 rounded-xl border text-xs font-mono max-w-max ${
            isLight
              ? 'bg-white border-[#e7e4dc] text-slate-700 shadow-xs'
              : 'bg-[#18191e] border-white/5 text-gray-200'
          }`}>
            <span className="font-semibold text-slate-800 dark:text-gray-200">Event Discovery Intent:</span>
            {parsedIntent ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                {parsedIntent.category && (
                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded-md border border-indigo-500/20 font-bold">
                    Category: {parsedIntent.category}
                  </span>
                )}
                {parsedIntent.location && (
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-md border border-emerald-500/20 font-bold">
                    Location: {parsedIntent.location}
                  </span>
                )}
                {parsedIntent.maxPrice && (
                  <span className="px-2 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-md border border-amber-500/20 font-bold">
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

      {/* ==================== PERSONALIZED RECOMMENDATIONS (IF LOGGED IN) ==================== */}
      {recommendedEvents.length > 0 && !searchQuery && (
        <section className="space-y-4 text-left">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h2 className="text-xl font-bold tracking-tight m-0 text-slate-900 dark:text-white">
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
                    ? 'bg-white border-[#e7e4dc] hover:border-slate-400 hover:shadow-md'
                    : 'bg-[#18191e] border-white/5 hover:border-white/20 hover:shadow-lg'
                }`}
              >
                <div className="w-full sm:w-36 h-28 rounded-xl overflow-hidden shrink-0 bg-slate-900">
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
                      <span className="text-[10px] uppercase font-mono tracking-widest text-slate-600 dark:text-slate-400 font-bold">
                        {evt.category} Recommendation
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                        evt.demand === 'Surge' ? 'bg-red-500/10 text-red-600 border border-red-500/20' :
                        evt.demand === 'High' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20' :
                        'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {evt.demand === 'Surge' ? '🔥 Surge' : evt.demand === 'High' ? '⚡ High Demand' : '🏷️ Dynamic Disc.'}
                      </span>
                    </div>
                    <h3 className={`font-bold text-base group-hover:text-slate-900 dark:group-hover:text-white transition-colors m-0 leading-snug ${
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
                    <span className="text-xs text-slate-800 dark:text-gray-200 flex items-center gap-1 font-semibold">
                      Configure Booking <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ==================== ALL SCHEDULED EVENTS GRID ==================== */}
      <section id="events-grid" className="space-y-6 text-left">
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 ${
          isLight ? 'border-[#e7e4dc]' : 'border-white/5'
        }`}>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className={`text-xl sm:text-2xl font-extrabold tracking-tight m-0 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              All Scheduled Events
            </h2>
            {(userProfile.preferences || []).length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-slate-500">Filtered by:</span>
                {(userProfile.preferences || []).map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-900 text-white"
                  >
                    {p}
                    <button
                      type="button"
                      onClick={() => handleTogglePref(p)}
                      className="hover:text-pink-300 font-bold cursor-pointer ml-0.5"
                      title={`Remove ${p} filter`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={handleClearPrefs}
                  className="text-xs text-slate-700 dark:text-gray-300 hover:underline font-semibold cursor-pointer ml-1"
                >
                  Reset
                </button>
              </div>
            )}
          </div>
          <span className="text-xs text-slate-500 font-mono font-medium">{filteredEvents.length} Events matches</span>
        </div>

        {eventsLoading ? (
          <div className={`text-center p-12 border rounded-2xl ${
            isLight ? 'bg-white border-[#e7e4dc] text-slate-500' : 'bg-[#18191e] border-white/5 text-gray-400'
          }`}>
            <p className="text-sm">Loading events catalog...</p>
          </div>
        ) : eventsError ? (
          <div className={`text-center p-12 border rounded-2xl ${
            isLight ? 'bg-rose-50 border-rose-200' : 'bg-[#18191e] border-rose-500/20'
          }`}>
            <p className="text-rose-600 text-sm font-semibold mb-1">Couldn't reach the backend</p>
            <p className="text-slate-400 text-xs font-mono">{eventsError}</p>
          </div>
        ) : events.length === 0 ? (
          <div className={`text-center p-12 border rounded-2xl ${
            isLight ? 'bg-white border-[#e7e4dc] text-slate-500' : 'bg-[#18191e] border-white/5 text-gray-400'
          }`}>
            <p className="text-sm">No events found in the database.</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className={`text-center p-12 border rounded-2xl ${
            isLight ? 'bg-white border-[#e7e4dc] text-slate-500' : 'bg-[#18191e] border-white/5 text-gray-400'
          }`}>
            <p className="text-sm">
              {searchQuery
                ? 'No scheduled events match your search query.'
                : 'No scheduled events match the selected category filter.'}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                handleClearPrefs();
              }}
              className="mt-3 text-xs bg-slate-900 hover:bg-slate-800 text-white font-medium px-4 py-2 rounded-xl transition-all cursor-pointer"
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
                  className={`group flex flex-col justify-between overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer hover:-translate-y-1 ${
                    isLight
                      ? 'bg-white border-[#e7e4dc] hover:border-slate-400 hover:shadow-lg'
                      : 'bg-[#18191e] border-white/5 hover:border-white/20 hover:shadow-xl'
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
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePref(evt.category);
                        }}
                        className="bg-black/75 backdrop-blur-md text-[10px] px-2.5 py-1 rounded-full font-mono text-white font-semibold border border-white/10 cursor-pointer hover:bg-slate-900 transition-all shadow-sm"
                        title={`Filter by ${evt.category}`}
                      >
                        {evt.category}
                      </span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full text-center font-mono font-semibold ${
                        evt.demand === 'Surge' ? 'bg-[#ec3b77] text-white shadow-sm' :
                        evt.demand === 'High' ? 'bg-[#f59e0b] text-slate-950 font-bold' :
                        'bg-[#10b981] text-slate-950 font-bold'
                      }`}>
                        {evt.demand} Demand
                      </span>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className={`font-bold text-base group-hover:text-slate-900 dark:group-hover:text-white transition-colors m-0 leading-snug ${
                        isLight ? 'text-slate-900' : 'text-gray-100'
                      }`}>
                        {evt.title}
                      </h3>
                      <div className={`space-y-1 text-xs font-medium ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                        <p className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{[evt.venueName, evt.location].filter(Boolean).join(' — ') || 'Location TBA'}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
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
                        isLight ? 'bg-slate-100' : 'bg-black/30'
                      }`}>
                        <div
                          className="bg-slate-900 dark:bg-white h-full rounded-full transition-all duration-500"
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
                      <span className="text-xs bg-slate-900 text-white group-hover:bg-slate-800 px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1 font-semibold shadow-xs">
                        Book Ticket <ArrowRight className="w-3.5 h-3.5" />
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