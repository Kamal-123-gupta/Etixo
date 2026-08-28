import React, { useContext, useState, useMemo, useEffect  } from 'react';
import { AppContext } from '../context/AppContext';
import { generateEventContent, generateAndApplyEventContent, fetchOrganizerInsights, launchCampaignApi, fetchEventCampaigns } from '../lib/api';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, Sparkles, Megaphone, CheckSquare, PlusCircle,
  DollarSign, Users, Award, ShieldCheck, PlayCircle
} from 'lucide-react';

export default function OrganizerConsole() {
  const { events, addCustomEvent } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('insights');
  const [organizerInsights, setOrganizerInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [insightsError, setInsightsError] = useState(null);
  useEffect(() => {
  let cancelled = false;

  const loadInsights = async () => {
      try {
        const data = await fetchOrganizerInsights();

        if (!cancelled) {
          setOrganizerInsights(data);
          setInsightsError(null);
        }
      } catch (error) {
        console.error("Failed to load organizer insights:", error);

        if (!cancelled) {
          setInsightsError(error);
        }
      } finally {
        if (!cancelled) {
          setInsightsLoading(false);
        }
      }
    };

    loadInsights();

    const interval = setInterval(loadInsights, 10000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Event Creator Form States
  const [newTitle, setNewTitle] = useState('');

  // Category: a generic top-level group (Sports/Music/Arts/Comedy/Other)
  // instead of either the old fake Tech/Music/Comedy/Arts list or the raw
  // granular sport-only taxonomy -- picking "Sports" reveals a second
  // dropdown of the REAL existing sport categories (football/basketball/
  // baseball/hockey/stadium_tours) so those events still match exactly
  // what Discovery/Personalization already index on; the other groups are
  // forward-looking category values with no existing catalog rows yet, so
  // they're saved as typed with no sub-list to match against.
  //
  // Deriving the Sports sub-list from every distinct category in `events`
  // (as this originally did) meant any stray non-sport category already
  // in the DB -- e.g. a "Tech" event created via testing before this
  // dropdown existed -- silently showed up as a "sport type" option.
  // Instead: only known real sport categories populate the Sports
  // sub-list; anything else already present in the catalog (like "Tech")
  // is promoted to its own top-level group automatically, rather than
  // being hidden inside Sports or requiring a hardcoded fix per stray value.
  const KNOWN_SPORT_CATEGORIES = ['football', 'basketball', 'baseball', 'hockey', 'stadium_tours'];
  const FIXED_CATEGORY_GROUPS = ['Sports', 'Music', 'Arts', 'Comedy', 'Other'];
  const realSportTypes = useMemo(() => {
    return [...new Set(events.map((evt) => evt.category))]
      .filter((cat) => cat && KNOWN_SPORT_CATEGORIES.includes(cat))
      .sort();
  }, [events]);
  const extraCategoryGroups = useMemo(() => {
    return [...new Set(events.map((evt) => evt.category))]
      .filter((cat) => cat && !KNOWN_SPORT_CATEGORIES.includes(cat) && !FIXED_CATEGORY_GROUPS.includes(cat))
      .sort();
  }, [events]);
  const CATEGORY_GROUPS = useMemo(() => {
    return ['Sports', 'Music', 'Arts', 'Comedy', ...extraCategoryGroups, 'Other'];
  }, [extraCategoryGroups]);
  const [newCategoryGroup, setNewCategoryGroup] = useState('Sports');
  const [newSportType, setNewSportType] = useState('');
  useEffect(() => {
    if (!newSportType && realSportTypes.length > 0) {
      setNewSportType(realSportTypes[0]);
    }
  }, [realSportTypes, newSportType]);
  // The value actually sent to the backend as `category`.
  const resolvedCategory = newCategoryGroup === 'Sports' ? newSportType : newCategoryGroup;

  const [newBasePrice, setNewBasePrice] = useState('45');
  const [newTotalTickets, setNewTotalTickets] = useState('300');

  // Date & time -- previously not collected by this form at all, so every
  // organizer-created event silently got event_datetime=null even though
  // the backend (EventCreate.event_datetime) fully supports it.
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('19:00');

  // Venue -- split into name/city/state instead of one free-text field.
  // The old single field only ever got sent as venue_name; venue_city was
  // never populated, so formatLocation(city, state) always returned an
  // empty string and the listing showed a blank location after the venue
  // name. City is what actually drives the visible location on cards/
  // detail pages, so it's the one marked required here.
  const [newVenueName, setNewVenueName] = useState('');
  const [newVenueCity, setNewVenueCity] = useState('');
  const [newVenueState, setNewVenueState] = useState('');

  // Manual description -- previously there was no way to opt out of the
  // AI draft: handlePublish always called generateAndApplyEventContent()
  // after creating the event, silently overwriting anything the organizer
  // might have wanted to write themselves (there wasn't even a field to
  // write it in). Now: if the organizer fills this in (either by typing,
  // or by using "Draft with AI" and keeping/editing the result), that
  // text is sent directly at creation time and the auto-generate-and-
  // apply step is skipped. Leaving it blank keeps the old auto-AI flow.
  const [newDescription, setNewDescription] = useState('');

  const [newImage, setNewImage] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiDraftPreview, setAiDraftPreview] = useState(null);

  // Marketing Form States
  const [selectedMarketingEventId, setSelectedMarketingEventId] = useState(events[0]?.id || '');
  const [selectedChannel, setSelectedChannel] = useState('whatsapp');

  // Real Marketing Campaign Agent state (POST/GET
  // /organizer/events/{id}/campaigns) -- replaces the old client-only mock
  // that faked sent-count/engagement numbers and reset on every reload.
  const [orgCampaigns, setOrgCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [campaignsError, setCampaignsError] = useState(null);
  const [isLaunchingCampaign, setIsLaunchingCampaign] = useState(false);
  const [launchError, setLaunchError] = useState(null);

  // Load campaign history for every event this organizer owns, once their
  // events are known via /organizer/insights. Small N of events expected
  // for a demo-scale organizer account, so one call per event is fine.
  useEffect(() => {
    const eventIds = organizerInsights?.events?.map((e) => e.event_id);
    if (!eventIds || eventIds.length === 0) {
      setCampaignsLoading(false);
      return;
    }
    let cancelled = false;
    setCampaignsLoading(true);
    Promise.all(eventIds.map((id) => fetchEventCampaigns(id).catch(() => [])))
      .then((results) => {
        if (cancelled) return;
        const titleByEventId = new Map(
          organizerInsights.events.map((e) => [e.event_id, e.title])
        );
        const merged = results
          .flat()
          .map((camp) => ({ ...camp, eventTitle: titleByEventId.get(camp.event_id) || 'Unknown Event' }))
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setOrgCampaigns(merged);
        setCampaignsError(null);
      })
      .catch((err) => {
        if (!cancelled) setCampaignsError(err.message || 'Could not load campaigns.');
      })
      .finally(() => {
        if (!cancelled) setCampaignsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [organizerInsights]);

  // Operations checklist states
  const [opsTasks, setOpsTasks] = useState([
    { id: 'op-1', text: 'Generate & encrypt secure ticket QR checkpoints', completed: true },
    { id: 'op-2', text: 'Confirm venue floor plans and digital screens deployment', completed: true },
    { id: 'op-3', text: 'Pre-schedule SMS notifications for registered user lists', completed: false },
    { id: 'op-4', text: 'Deploy Razorpay checkout API hooks validation servers', completed: true },
    { id: 'op-5', text: 'Setup offline backup scanning logs on check-in tablets', completed: false },
  ]);

  const toggleOpsTask = (id) => {
    setOpsTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const opsReadiness = useMemo(() => {
    const done = opsTasks.filter(t => t.completed).length;
    return Math.round((done / opsTasks.length) * 100);
  }, [opsTasks]);

  // Aggregate stats
  // const totalRevenue = useMemo(() => {
  //   return events.reduce((sum, e) => sum + (e.ticketsSold * e.price), 0);
  // }, [events]);

  const totalRevenue = organizerInsights?.total_revenue ?? 0;

  // const totalTicketsSold = useMemo(() => {
  //   return events.reduce((sum, e) => sum + e.ticketsSold, 0);
  // }, [events]);

  const totalTicketsSold = organizerInsights?.total_tickets_sold ?? 0;

  // Real per-event demand_tier tally from the Dynamic Pricing Agent (via
  // /organizer/insights), replacing the old hardcoded "1.15x Surge" label
  // that was never derived from any actual pricing data.
  const elevatedPricingCount = useMemo(() => {
    if (!organizerInsights?.events) return 0;
    return organizerInsights.events.filter(
      (e) => e.demand_tier === 'high' || e.demand_tier === 'surge'
    ).length;
  }, [organizerInsights]);

  // Charts Data Prep
  const salesVelocityData = useMemo(() => {
    if (!organizerInsights?.events) return [];

    return organizerInsights.events.map(event => ({
      name: event.title.length > 18
        ? `${event.title.substring(0, 18)}...`
        : event.title,
      velocity: event.velocity_last_7_days,
    }));
  }, [organizerInsights]);

  const categoryDistributionData = useMemo(() => {
    const map = {};
    events.forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.ticketsSold;
    });
    return Object.keys(map).map(cat => ({ name: cat, value: map[cat] }));
  }, [events]);

  const attendanceProjectionsData = useMemo(() => {
    // Compare actual sold tickets vs remaining capacities
    return events.map(e => ({
      name: e.title.substring(0, 15) + '...',
      Sold: e.ticketsSold,
      Capacity: e.totalTickets
    }));
  }, [events]);

  // Colors for Recharts Pie
  const COLORS = ['#a855f7', '#6366f1', '#10b981', '#f59e0b', '#ec4899'];

  const handleAIDraft = async () => {
    if (!newTitle.trim()) return;

    setIsGeneratingAI(true);
    setAiDraftPreview(null);  

    try {
      const generated = await generateEventContent({
        title: newTitle.trim(),
        category: resolvedCategory,
        venue_city: newVenueCity || null,
        venue_state: newVenueState || null,
        base_price: Number(newBasePrice) || 0,
      });

      setAiDraftPreview({
        description: generated.description || '',
        faqs: generated.faqs || [],
        terms: generated.terms || [],
        source: generated.source,
        warnings: generated.warnings || [],
      });
      // Populate the editable description field so the organizer can
      // review/tweak it before publishing, instead of it only living in
      // the read-only preview pane (see handlePublish for why this
      // matters -- a non-empty description here skips the redundant
      // auto-generate-and-apply call at publish time).
      setNewDescription(generated.description || '');
    } catch (error) {
      console.error("AI event generation failed:", error);

      setAiDraftPreview({
        description: "Unable to generate event content right now.",
        faqs: [],
        terms: [],
        source: null,
        warnings: [],
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const [publishError, setPublishError] = useState(null);

  const handlePublish = async (e) => {
    e.preventDefault();

    if (!newTitle.trim() || !resolvedCategory || !newVenueCity.trim() || !newDate) return;

    setPublishError(null);
    try {
      // Step 1: Create the actual event in the database. Sending the
      // organizer's own description (if they wrote/kept one) directly
      // here, rather than always leaving it blank for step 2 to fill in.
      const createdEvent = await addCustomEvent({
        title: newTitle.trim(),
        category: resolvedCategory,
        description: newDescription.trim() || null,
        basePrice: newBasePrice,
        totalTickets: newTotalTickets,
        date: newDate,
        time: newTime,
        location: newVenueName.trim() || null, // -> venue_name
        venue_city: newVenueCity.trim(),
        venue_state: newVenueState.trim() || null,
        image: newImage
      });

      // Step 2: only auto-generate-and-apply AI content (description +
      // FAQs + terms) when the organizer left the description blank --
      // otherwise this would silently overwrite the text they just chose
      // to keep. A manually-described event just won't have FAQs/terms
      // (EventDetailOut already defaults those to empty lists).
      if (!newDescription.trim()) {
        await generateAndApplyEventContent(createdEvent.id);
      }

      // Reset form only after everything succeeds
      setNewTitle('');
      setNewDescription('');
      setNewVenueName('');
      setNewVenueCity('');
      setNewVenueState('');
      setNewDate('');
      setNewTime('19:00');
      setNewImage('');
      setAiDraftPreview(null);

      console.log(
        `Event "${createdEvent.title}" published successfully.`
      );
    } catch (error) {
      console.error("Failed to publish event:", error);
      setPublishError(error.message || 'Failed to publish event. Please try again.');
    }
  };

  const handleLaunchCampaign = async () => {
    if (!selectedMarketingEventId) return;
    setIsLaunchingCampaign(true);
    setLaunchError(null);
    try {
      const campaign = await launchCampaignApi(selectedMarketingEventId, selectedChannel);
      const targetEvent = events.find((e) => e.id === selectedMarketingEventId);
      setOrgCampaigns((prev) => [
        { ...campaign, eventTitle: targetEvent?.title || 'Unknown Event' },
        ...prev,
      ]);
    } catch (err) {
      console.error('Failed to launch campaign:', err);
      setLaunchError(err.message || 'Campaign launch failed. Please try again.');
    } finally {
      setIsLaunchingCampaign(false);
    }
  };

  return (
    <div className="flex-1 bg-[#16171d] text-gray-200 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8 text-left">
      {/* Console Header */}
      <section className="border-b border-white/5 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-white m-0">Organizer Console</h1>
        <p className="text-gray-400 text-sm mt-1">Manage event readiness, generate copy with AI, track marketing pushes, and monitor ticket velocity trends.</p>
      </section>

      {/* Sub Tabs Toggle */}
      <div className="flex border-b border-white/5 gap-4">
        <button
          onClick={() => setActiveTab('insights')}
          className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'insights'
              ? 'border-purple-500 text-purple-400 font-bold'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Real-time Insights
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'create'
              ? 'border-purple-500 text-purple-400 font-bold'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <PlusCircle className="w-4 h-4" /> AI Event Creator
        </button>
        <button
          onClick={() => setActiveTab('marketing')}
          className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'marketing'
              ? 'border-purple-500 text-purple-400 font-bold'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Megaphone className="w-4 h-4" /> Marketing Hub
        </button>
        <button
          onClick={() => setActiveTab('operations')}
          className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'operations'
              ? 'border-purple-500 text-purple-400 font-bold'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <CheckSquare className="w-4 h-4" /> Operations ({opsReadiness}%)
        </button>
      </div>

      {/* TAB CONTENT: INSIGHTS */}
      {activeTab === 'insights' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-[#1f2028] border border-white/5 p-5 rounded-2xl flex items-center gap-4">
              <div className="w-11 h-11 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 font-mono block uppercase">Total Gross Sales</span>
                <span className="text-xl font-bold text-white font-mono">${totalRevenue.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-[#1f2028] border border-white/5 p-5 rounded-2xl flex items-center gap-4">
              <div className="w-11 h-11 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 font-mono block uppercase">Tickets Redeemed</span>
                <span className="text-xl font-bold text-white font-mono">{totalTicketsSold} Passes</span>
              </div>
            </div>

            <div className="bg-[#1f2028] border border-white/5 p-5 rounded-2xl flex items-center gap-4">
              <div className="w-11 h-11 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 font-mono block uppercase">Active Campaigns</span>
                <span className="text-xl font-bold text-white font-mono">{orgCampaigns.length} Launches</span>
              </div>
            </div>

            <div className="bg-[#1f2028] border border-white/5 p-5 rounded-2xl flex items-center gap-4">
              <div className="w-11 h-11 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 font-mono block uppercase">Elevated Pricing</span>
                <span className="text-xl font-bold text-white font-mono">
                  {elevatedPricingCount} / {organizerInsights?.events?.length ?? 0} Events
                </span>
              </div>
            </div>
          </div>

          {/* Recharts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Sales velocity area chart */}
            <div className="bg-[#1f2028] border border-white/5 p-5 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-gray-300 font-mono uppercase tracking-wider">Ticket Sales Velocity (Last 7 Days)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesVelocityData}>
                    <defs>
                      <linearGradient id="colorVelocity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2e303a" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={10} />
                    <YAxis stroke="#6b7280" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2028', borderColor: '#2e303a', color: '#fff' }} />
                    <Area type="monotone" dataKey="velocity" stroke="#a855f7" fillOpacity={1} fill="url(#colorVelocity)" name="Tickets Sold" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Turnout vs capacity bar chart */}
            <div className="bg-[#1f2028] border border-white/5 p-5 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-gray-300 font-mono uppercase tracking-wider">Event Bookings vs Capacity</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceProjectionsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2e303a" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={10} />
                    <YAxis stroke="#6b7280" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2028', borderColor: '#2e303a', color: '#fff' }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="Sold" fill="#6366f1" name="Tickets Booked" />
                    <Bar dataKey="Capacity" fill="#2e303a" name="Total Capacity" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category breakdown pie chart */}
            <div className="bg-[#1f2028] border border-white/5 p-5 rounded-2xl space-y-4 lg:col-span-2">
              <h3 className="text-sm font-bold text-gray-300 font-mono uppercase tracking-wider">Attendee Demographics (Interests Split)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6">
                <div className="h-56">
                  {categoryDistributionData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-gray-500">No ticket sales yet.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryDistributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categoryDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1f2028', borderColor: '#2e303a', color: '#fff' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="space-y-3">
                  <span className="text-[10px] text-gray-500 font-mono uppercase block mb-1">Interest Distribution</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {categoryDistributionData.map((d, index) => (
                      <div key={d.name} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-gray-300 font-medium">{d.name}: {d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB CONTENT: AI CREATOR */}
      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
          {/* Creator Form */}
          <div className="lg:col-span-2 bg-[#1f2028] border border-white/5 p-6 rounded-2xl space-y-5">
            <h3 className="text-base font-bold text-gray-300 border-b border-white/5 pb-2.5 m-0 uppercase tracking-wider font-mono">
              Event Configuration Wizard
            </h3>

            <form onSubmit={handlePublish} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-mono">Event Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Synthwave Night Delhi"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-[#16171d] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-mono">Category</label>
                  <select
                    value={newCategoryGroup}
                    onChange={(e) => setNewCategoryGroup(e.target.value)}
                    className="w-full bg-[#16171d] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    {CATEGORY_GROUPS.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {newCategoryGroup === 'Sports' && (
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-mono">Sport Type</label>
                  <select
                    value={newSportType}
                    onChange={(e) => setNewSportType(e.target.value)}
                    className="w-full bg-[#16171d] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    {realSportTypes.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-mono">Base Price ($)</label>
                  <input
                    type="number"
                    required
                    value={newBasePrice}
                    onChange={(e) => setNewBasePrice(e.target.value)}
                    className="w-full bg-[#16171d] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-purple-500 transition-colors font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-mono">Total Tickets Allocation</label>
                  <input
                    type="number"
                    required
                    value={newTotalTickets}
                    onChange={(e) => setNewTotalTickets(e.target.value)}
                    className="w-full bg-[#16171d] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-purple-500 transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-mono">Event Date</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-[#16171d] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-purple-500 transition-colors font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-mono">Event Time</label>
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-[#16171d] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-purple-500 transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-mono">Venue Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Pune Art Gallery"
                  value={newVenueName}
                  onChange={(e) => setNewVenueName(e.target.value)}
                  className="w-full bg-[#16171d] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-mono">City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bengaluru"
                    value={newVenueCity}
                    onChange={(e) => setNewVenueCity(e.target.value)}
                    className="w-full bg-[#16171d] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-mono">State (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Karnataka"
                    value={newVenueState}
                    onChange={(e) => setNewVenueState(e.target.value)}
                    className="w-full bg-[#16171d] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-400 font-mono">Description</label>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {newDescription.trim() ? 'Will publish as written' : 'Blank \u2192 AI will auto-draft on publish'}
                  </span>
                </div>
                <textarea
                  rows={3}
                  placeholder="Write your own description, or leave blank and use 'Draft Event with AI' below to generate one (you can still edit it after)."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-[#16171d] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-mono">Image URL (Optional)</label>
                <input
                  type="text"
                  placeholder="Paste image link, or leave empty for random"
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  className="w-full bg-[#16171d] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              {publishError && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-xs text-rose-400">
                  {publishError}
                </div>
              )}

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  disabled={!newTitle || isGeneratingAI}
                  onClick={handleAIDraft}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-purple-400 font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1 border border-purple-500/10 transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  {isGeneratingAI ? 'AI Generating...' : 'Draft Event with AI'}
                </button>
                <button
                  type="submit"
                  disabled={isGeneratingAI}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  Publish Event
                </button>
              </div>
            </form>
          </div>

          {/* AI Output Preview Column */}
          <div className="space-y-6">
            <div className="bg-[#1f2028] border border-purple-500/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-1.5 pb-2.5 border-b border-white/5">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span className="text-xs font-semibold text-gray-300 font-mono uppercase tracking-wider">AI Coprocessor Output</span>
              </div>

              {aiDraftPreview ? (
                <div className="space-y-4 text-xs text-gray-400 font-medium">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                      aiDraftPreview.source === 'llm'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {aiDraftPreview.source === 'llm' ? '\u2728 Generated via LLM' : aiDraftPreview.source === 'template' ? 'Template Fallback (no LLM configured)' : 'Generation Failed'}
                    </span>
                  </div>

                  {aiDraftPreview.warnings && aiDraftPreview.warnings.length > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 text-[10px] text-amber-400">
                      {aiDraftPreview.warnings.join(' \u00b7 ')}
                    </div>
                  )}

                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-500 uppercase font-mono block">Auto-Generated description</span>
                    <p className="leading-relaxed bg-[#16171d] p-3 rounded-xl border border-white/5">{aiDraftPreview.description}</p>
                    <span className="text-[9px] text-gray-500 block">Copied into the Description field above -- edit it there before publishing if needed.</span>
                  </div>
                  
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-gray-500 uppercase font-mono block">FAQ List Block</span>
                    {aiDraftPreview.faqs.map((f, i) => (
                      <div key={i} className="bg-[#16171d] p-2 rounded-lg border border-white/5">
                        <p className="font-bold text-gray-300 font-mono text-[9px] mb-0.5">{f.question}</p>
                        <p className="leading-snug text-gray-400">{f.answer}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-500 uppercase font-mono block">AI T&C Rules</span>
                    <ul className="list-disc pl-4 space-y-0.5 font-mono text-[10px]">
                      {aiDraftPreview.terms.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>

                  <p className="text-[9px] text-gray-500 leading-relaxed">
                    Note: FAQs/T&Cs shown here only get saved if you publish with the Description field blank (which re-runs full AI generation and applies it, including these). If you keep a written description, only that description text is saved -- no FAQs/terms.
                  </p>
                </div>
              ) : (
                <div className="text-center py-12 text-xs text-gray-500">
                  {isGeneratingAI ? (
                    <div className="space-y-2 flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                      <p>Drafting layout copy via Generative LLM agent...</p>
                    </div>
                  ) : (
                    <p>Enter an event title and click "Draft Event with AI" to inspect generated parameters.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: MARKETING HUB */}
      {activeTab === 'marketing' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
          {/* Launch campaign panel */}
          <div className="bg-[#1f2028] border border-white/5 p-6 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-gray-300 border-b border-white/5 pb-2.5 m-0 uppercase tracking-wider font-mono">
              Marketing Campaign Agent
            </h3>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-mono block">Select Target Event</label>
                <select
                  value={selectedMarketingEventId}
                  onChange={(e) => setSelectedMarketingEventId(e.target.value)}
                  className="w-full bg-[#16171d] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-purple-500 transition-colors"
                >
                  {events.map(e => (
                    <option key={e.id} value={e.id}>{e.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-mono block">Channel</label>
                <select
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                  className="w-full bg-[#16171d] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-purple-500 transition-colors"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                  <option value="x">X (Twitter)</option>
                </select>
              </div>

              <div className="bg-[#16171d] p-3 rounded-xl border border-white/5 text-xs text-gray-400 leading-relaxed font-medium">
                <span className="font-bold text-[9px] text-purple-400 font-mono uppercase block mb-1">Agent Action Flow</span>
                Our marketing agent parses target details, drafts tailored newsletters/social pushes, tracks email bounces, and adjusts channel splits dynamically to boost ticket sales velocity.
              </div>

              {launchError && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-xs text-rose-400">
                  {launchError}
                </div>
              )}

              <button
                onClick={handleLaunchCampaign}
                disabled={isLaunchingCampaign || !selectedMarketingEventId}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
              >
                <PlayCircle className="w-4 h-4" /> {isLaunchingCampaign ? 'Launching...' : 'Launch AI Campaign'}
              </button>
            </div>
          </div>

          {/* Active Campaigns Log */}
          <div className="lg:col-span-2 bg-[#1f2028] border border-white/5 p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
              <h3 className="text-base font-bold text-gray-300 m-0 uppercase tracking-wider font-mono">
                Active Campaigns ({orgCampaigns.length})
              </h3>
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Outreach Monitoring
              </span>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {campaignsLoading && orgCampaigns.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-8">Loading campaign history...</p>
              ) : campaignsError ? (
                <p className="text-xs text-rose-400 text-center py-8">{campaignsError}</p>
              ) : orgCampaigns.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-8">No campaigns launched yet. Pick an event and channel, then launch one.</p>
              ) : (
                orgCampaigns.map((camp) => (
                  <div key={camp.id} className="bg-[#16171d] p-4.5 rounded-xl border border-white/5 space-y-3 text-xs">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div className="space-y-0.5 text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-purple-400 font-mono font-bold uppercase">{camp.channel}</span>
                          {camp.source && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-semibold ${
                              camp.source === 'llm'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {camp.source === 'llm' ? 'LLM' : 'Template'}
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-gray-200 text-sm leading-tight m-0">{camp.eventTitle} Promo Push</h4>
                        <p className="text-gray-500 text-[10px]">Target: {camp.eventTitle}</p>
                      </div>
                      <div className="flex gap-2">
                        <div className="text-right">
                          <span className="text-[9px] text-gray-500 font-mono block uppercase">Sent</span>
                          <span className="font-mono font-bold text-gray-300">{camp.sent_count}</span>
                        </div>
                        <div className="text-right border-l border-white/10 pl-2">
                          <span className="text-[9px] text-gray-500 font-mono block uppercase">Engagement</span>
                          <span className="font-mono font-bold text-emerald-400">
                            {camp.engagement_rate != null ? `${(camp.engagement_rate * 100).toFixed(1)}%` : '—'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#1f2028] p-3 rounded-lg border border-white/5 font-mono text-[10px] text-gray-400 leading-normal">
                      {camp.content}
                    </div>

                    {camp.warnings && camp.warnings.length > 0 && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 text-[10px] text-amber-400">
                        {camp.warnings.join(' · ')}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: OPERATIONS */}
      {activeTab === 'operations' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
          {/* Operations Readiness checklist */}
          <div className="lg:col-span-2 bg-[#1f2028] border border-white/5 p-6 rounded-2xl space-y-5">
            <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
              <h3 className="text-base font-bold text-gray-300 m-0 uppercase tracking-wider font-mono">
                Event Readiness Checklist
              </h3>
              <span className="text-xs text-purple-400 font-mono font-semibold">
                Operations Agent System
              </span>
            </div>

            <div className="space-y-3">
              {opsTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleOpsTask(task.id)}
                  className="flex items-center gap-3 p-3.5 bg-[#16171d] rounded-xl border border-white/5 hover:border-purple-500/10 cursor-pointer select-none transition-all"
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => {}} // Swapped via div click
                    className="w-4.5 h-4.5 rounded border-white/10 bg-slate-900 text-purple-600 focus:ring-purple-500/30 shrink-0"
                  />
                  <span className={`text-xs ${task.completed ? 'line-through text-gray-500' : 'text-gray-300'}`}>
                    {task.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Readiness Dashboard Meter */}
          <div className="space-y-6">
            <div className="bg-[#1f2028] border border-white/5 rounded-2xl p-5 space-y-4 text-center">
              <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider block">Operational Readiness Index</span>
              
              <div className="relative inline-flex items-center justify-center p-2">
                {/* Visual circle progress */}
                <div className="w-32 h-32 rounded-full border-4 border-white/5 flex flex-col items-center justify-center gap-0.5">
                  <span className="text-3xl font-extrabold text-white font-mono leading-none">{opsReadiness}%</span>
                  <span className="text-[9px] text-purple-400 font-mono uppercase">Readiness</span>
                </div>
              </div>

              <div className="w-full bg-[#16171d] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${opsReadiness}%` }}
                />
              </div>

              <p className="text-[11px] text-gray-500 leading-normal text-left pt-2 border-t border-white/5">
                🤖 <span className="font-semibold text-gray-400">Event Operations Agent Log:</span> Checking system linkages. Verified entry QR servers integration is active. Push notification timers await SMS scheduling.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}