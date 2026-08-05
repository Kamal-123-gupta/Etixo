import React, { useContext, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Search, Sparkles, SlidersHorizontal, MapPin, Calendar, ArrowRight } from 'lucide-react';

export default function AttendeePortal() {
  const { events, userProfile, setUserProfile } = useContext(AppContext);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Categories available
  const availableCategories = ['Tech', 'Music', 'Comedy', 'Arts'];

  // Handle preference tag toggle
  const handleTogglePref = (category) => {
    setUserProfile((prev) => {
      const prefs = prev.preferences.includes(category)
        ? prev.preferences.filter((p) => p !== category)
        : [...prev.preferences, category];
      return { ...prev, preferences: prefs };
    });
  };

  // Mock Natural Language Query Parser (Event Discovery Agent)
  const parsedIntent = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const intent = {
      category: null,
      maxPrice: null,
      location: null,
    };

    if (!q) return null;

    // Check categories
    if (q.includes('tech') || q.includes('hackathon') || q.includes('summit')) intent.category = 'Tech';
    else if (q.includes('music') || q.includes('concert') || q.includes('electronic') || q.includes('neon')) intent.category = 'Music';
    else if (q.includes('comedy') || q.includes('show') || q.includes('laugh') || q.includes('improv')) intent.category = 'Comedy';
    else if (q.includes('art') || q.includes('chiaroscuro') || q.includes('exhibition')) intent.category = 'Arts';

    // Check location
    if (q.includes('bengaluru') || q.includes('bangalore')) intent.location = 'Bengaluru';
    else if (q.includes('mumbai') || q.includes('bombay')) intent.location = 'Mumbai';
    else if (q.includes('delhi')) intent.location = 'Delhi';
    else if (q.includes('pune')) intent.location = 'Pune';

    // Parse price limits (e.g. "under $50" or "under 100")
    const priceRegex = /(?:under|below|\$)\s*(\d+)/i;
    const match = q.match(priceRegex);
    if (match && match[1]) {
      intent.maxPrice = Number(match[1]);
    }

    return intent;
  }, [searchQuery]);

  // Filter events based on search query & natural language intent
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      // Natural language search filtering
      if (searchQuery.trim() === '') return true;

      const titleMatch = evt.title.toLowerCase().includes(searchQuery.toLowerCase());
      const descMatch = evt.description.toLowerCase().includes(searchQuery.toLowerCase());

      // If we parsed structured intent, use it to assist/supplement filters
      if (parsedIntent) {
        let isMatch = true;
        if (parsedIntent.category && evt.category !== parsedIntent.category) isMatch = false;
        if (parsedIntent.location && !evt.location.toLowerCase().includes(parsedIntent.location.toLowerCase())) isMatch = false;
        if (parsedIntent.maxPrice && evt.price > parsedIntent.maxPrice) isMatch = false;
        
        if (isMatch) return true;
      }

      return titleMatch || descMatch;
    });
  }, [events, searchQuery, parsedIntent]);

  // Recommended events based on User Preference & Personalization Agent
  const recommendedEvents = useMemo(() => {
    return events.filter((evt) =>
      userProfile.preferences.some((pref) => pref.toLowerCase() === evt.category.toLowerCase())
    );
  }, [events, userProfile.preferences]);

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

        {filteredEvents.length === 0 ? (
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
