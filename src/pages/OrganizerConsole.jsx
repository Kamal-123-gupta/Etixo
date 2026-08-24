import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, Sparkles, Megaphone, CheckSquare, PlusCircle,
  DollarSign, Users, Award, ShieldCheck, PlayCircle
} from 'lucide-react';

export default function OrganizerConsole() {
  const { events, marketingCampaigns, addCustomEvent, triggerMarketingCampaign } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('insights');

  // Event Creator Form States
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Tech');
  const [newBasePrice, setNewBasePrice] = useState('45');
  const [newTotalTickets, setNewTotalTickets] = useState('300');
  const [newLocation, setNewLocation] = useState('Bengaluru, Outer Ring Road');
  const [newImage, setNewImage] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiDraftPreview, setAiDraftPreview] = useState(null);

  // Marketing Form States
  const [selectedMarketingEventId, setSelectedMarketingEventId] = useState(events[0]?.id || '');

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
  const totalRevenue = useMemo(() => {
    return events.reduce((sum, e) => sum + (e.ticketsSold * e.price), 0);
  }, [events]);

  const totalTicketsSold = useMemo(() => {
    return events.reduce((sum, e) => sum + e.ticketsSold, 0);
  }, [events]);

  // Charts Data Prep
  const salesVelocityData = useMemo(() => {
    // Generate simulated timeline sales velocity based on current state
    return [
      { name: '10:00 AM', velocity: Math.round(totalTicketsSold * 0.1) },
      { name: '12:00 PM', velocity: Math.round(totalTicketsSold * 0.25) },
      { name: '02:00 PM', velocity: Math.round(totalTicketsSold * 0.55) },
      { name: '04:00 PM', velocity: Math.round(totalTicketsSold * 0.8) },
      { name: '06:00 PM', velocity: totalTicketsSold },
    ];
  }, [totalTicketsSold]);

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

  // AI draft generator triggers
  const handleAIDraft = () => {
    if (!newTitle) return;
    setIsGeneratingAI(true);
    setAiDraftPreview(null);

    // Simulate Generative LLM delay
    setTimeout(() => {
      setIsGeneratingAI(false);
      setAiDraftPreview({
        description: `This is a pre-drafted event description generated automatically for "${newTitle}". This is a ${newCategory} category event scheduled at ${newLocation}. It will host high-quality talks, network mixers, and interactive workshop breakout sessions.`,
        faqs: [
          { question: 'What is included in the ticket?', answer: 'Full access passes, lunch catering, and verified smart certificate tags.' },
          { question: 'Is parking available?', answer: 'Yes, secure valet parking is integrated with registration validation.' }
        ],
        terms: [
          'No transfers allowed within 24 hours of start.',
          'Please present the QR code at checking terminals.'
        ]
      });
    }, 1500);
  };

  const handlePublish = (e) => {
    e.preventDefault();
    if (!newTitle) return;

    addCustomEvent({
      title: newTitle,
      category: newCategory,
      basePrice: newBasePrice,
      totalTickets: newTotalTickets,
      location: newLocation,
      image: newImage
    });

    // Reset Form
    setNewTitle('');
    setNewImage('');
    setAiDraftPreview(null);
  };

  const handleLaunchCampaign = () => {
    const targetEvent = events.find(e => e.id === selectedMarketingEventId);
    if (targetEvent) {
      triggerMarketingCampaign(targetEvent);
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
                <span className="text-xl font-bold text-white font-mono">{marketingCampaigns.length} Launches</span>
              </div>
            </div>

            <div className="bg-[#1f2028] border border-white/5 p-5 rounded-2xl flex items-center gap-4">
              <div className="w-11 h-11 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 font-mono block uppercase">Pricing Surcharges</span>
                <span className="text-xl font-bold text-white font-mono">1.15x Surge</span>
              </div>
            </div>
          </div>

          {/* Recharts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Sales velocity area chart */}
            <div className="bg-[#1f2028] border border-white/5 p-5 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-gray-300 font-mono uppercase tracking-wider">Ticket Sales Velocity (Today)</h3>
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
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-[#16171d] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value="Tech">Tech</option>
                    <option value="Music">Music</option>
                    <option value="Comedy">Comedy</option>
                    <option value="Arts">Arts</option>
                  </select>
                </div>
              </div>

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

              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-mono">Location Venue</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pune Art Gallery"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full bg-[#16171d] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-purple-500 transition-colors"
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
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-500 uppercase font-mono block">Auto-Generated description</span>
                    <p className="leading-relaxed bg-[#16171d] p-3 rounded-xl border border-white/5">{aiDraftPreview.description}</p>
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

              <div className="bg-[#16171d] p-3 rounded-xl border border-white/5 text-xs text-gray-400 leading-relaxed font-medium">
                <span className="font-bold text-[9px] text-purple-400 font-mono uppercase block mb-1">Agent Action Flow</span>
                Our marketing agent parses target details, drafts tailored newsletters/social pushes, tracks email bounces, and adjusts channel splits dynamically to boost ticket sales velocity.
              </div>

              <button
                onClick={handleLaunchCampaign}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
              >
                <PlayCircle className="w-4 h-4" /> Launch AI Campaign
              </button>
            </div>
          </div>

          {/* Active Campaigns Log */}
          <div className="lg:col-span-2 bg-[#1f2028] border border-white/5 p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
              <h3 className="text-base font-bold text-gray-300 m-0 uppercase tracking-wider font-mono">
                Active Campaigns ({marketingCampaigns.length})
              </h3>
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Outreach Monitoring
              </span>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {marketingCampaigns.map((camp) => (
                <div key={camp.id} className="bg-[#16171d] p-4.5 rounded-xl border border-white/5 space-y-3 text-xs">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div className="space-y-0.5 text-left">
                      <span className="text-[10px] text-purple-400 font-mono font-bold uppercase">{camp.channel}</span>
                      <h4 className="font-bold text-gray-200 text-sm leading-tight m-0">{camp.title}</h4>
                      <p className="text-gray-500 text-[10px]">Target: {camp.targetEvent}</p>
                    </div>
                    <div className="flex gap-2">
                      <div className="text-right">
                        <span className="text-[9px] text-gray-500 font-mono block uppercase">Sent</span>
                        <span className="font-mono font-bold text-gray-300">{camp.sentCount}</span>
                      </div>
                      <div className="text-right border-l border-white/10 pl-2">
                        <span className="text-[9px] text-gray-500 font-mono block uppercase">Engagement</span>
                        <span className="font-mono font-bold text-emerald-400">{camp.engagementRate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#1f2028] p-3 rounded-lg border border-white/5 font-mono text-[10px] text-gray-400 leading-normal">
                    {camp.content}
                  </div>
                </div>
              ))}
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
