import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { User, Mail, MapPin, Sliders, DollarSign, Award, LogOut, Ticket, QrCode, Sparkles, Check, AlertTriangle, ShieldCheck } from 'lucide-react';

const AVAILABLE_PREFS = ['football', 'basketball', 'baseball', 'hockey', 'stadium_tours', 'Music', 'Arts', 'Comedy', 'Tech', 'Food'];

export default function Profile() {
  const {
    userProfile,
    bookings,
    logout,
    updateProfilePreferences,
    formatPrice,
    theme
  } = useContext(AppContext);
  
  const navigate = useNavigate();
  const isLight = theme === 'light';

  // Local state for updating preferences
  const [selectedCats, setSelectedCats] = useState([]);
  const [budget, setBudget] = useState(200);
  const [ticketTier, setTicketTier] = useState('Gold');
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedBookingQr, setSelectedBookingQr] = useState(null);

  useEffect(() => {
    if (userProfile) {
      setSelectedCats(userProfile.preferences || []);
      setBudget(userProfile.budget || 200);
      setTicketTier(userProfile.ticketTier || 'Gold');
    }
  }, [userProfile]);

  const handleToggleCat = (cat) => {
    setSelectedCats(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setSuccessMsg('');

    try {
      await updateProfilePreferences({
        categories: selectedCats,
        budget_max: Number(budget),
        ticket_tier: ticketTier
      });
      setSuccessMsg('Discovery preferences successfully synchronized with personal Agent profile.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleLogoutClick = () => {
    logout();
    navigate('/login');
  };

  if (!userProfile) return null;

  return (
    <div className={`flex-1 py-10 px-6 max-w-7xl mx-auto w-full space-y-8 animate-fadeIn transition-colors ${
      isLight ? 'text-slate-800' : 'text-gray-200'
    }`}>
      
      {/* Page Header */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 ${
        isLight ? 'border-slate-200' : 'border-white/5'
      }`}>
        <div className="space-y-1 text-left">
          <h1 className={`text-3xl font-extrabold tracking-tight m-0 flex items-center gap-2 ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            <User className="w-8 h-8 text-purple-600" /> Account Deck
          </h1>
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
            Manage preferences, retrieve activated QR tickets, and check AI profile parameters
          </p>
        </div>
        {userProfile.isGuest ? (
          <div className="flex items-center gap-2">
            <Link to="/login" className={`px-4 py-2 border text-xs font-semibold rounded-xl transition-all ${
              isLight ? 'bg-white border-slate-200 text-purple-600 hover:bg-slate-50' : 'bg-[#1f2028] hover:bg-white/5 border-purple-500/20 text-purple-400'
            }`}>
              Sign In
            </Link>
            <Link to="/signup" className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-xs font-semibold text-white rounded-xl transition-all shadow-md shadow-purple-500/20">
              Register Account
            </Link>
          </div>
        ) : (
          <button
            onClick={handleLogoutClick}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-semibold text-rose-600 dark:text-rose-400 rounded-xl transition-all self-start md:self-auto"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        )}
      </div>

      {/* Guest Mode Alert Banner */}
      {userProfile.isGuest && (
        <div className={`border p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-4 text-left shadow-lg ${
          isLight ? 'bg-amber-50/70 border-amber-200 text-amber-900' : 'bg-[#1f2028] border-amber-500/20'
        }`}>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 space-y-1">
            <h4 className="text-sm font-bold">Sandbox Guest Mode Enabled</h4>
            <p className="text-xs leading-normal opacity-90">
              You are browsing as a guest. Your preferences will change dynamically for local recommendations, but they won't persist. Sign in to view and save custom recommendation profiles, manage real transactions, and view verified ticketing history.
            </p>
          </div>
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Card & Preferences Details */}
        <div className="space-y-6 lg:col-span-1">
          {/* Identity Card */}
          <div className={`border p-6 rounded-3xl space-y-5 text-left shadow-xl relative overflow-hidden transition-colors ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#1f2028]/60 backdrop-blur-xl border-white/5'
          }`}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-purple-500/20">
                {userProfile.name ? userProfile.name.charAt(0) : 'G'}
              </div>
              <div>
                <h3 className={`font-extrabold text-lg leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {userProfile.name}
                </h3>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono tracking-wider uppercase font-semibold">
                  {userProfile.ticketTier} Tier Holder
                </span>
              </div>
            </div>

            <div className={`space-y-3 pt-3 border-t text-xs ${
              isLight ? 'border-slate-100 text-slate-600' : 'border-white/5 text-gray-400'
            }`}>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className={`font-mono ${isLight ? 'text-slate-800' : 'text-gray-300'}`}>{userProfile.email || 'guest@example.com'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className={isLight ? 'text-slate-800' : 'text-gray-300'}>{userProfile.location}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <span className={`capitalize font-semibold ${isLight ? 'text-slate-800' : 'text-gray-300'}`}>{userProfile.role} Account</span>
              </div>
            </div>
          </div>

          {/* Preferences Settings Form */}
          <div className={`border p-6 rounded-3xl space-y-5 text-left shadow-xl transition-colors ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#1f2028]/60 backdrop-blur-xl border-white/5'
          }`}>
            <h3 className={`font-bold text-sm border-b pb-2.5 m-0 uppercase tracking-wider font-mono flex items-center gap-1.5 ${
              isLight ? 'text-slate-800 border-slate-100' : 'text-gray-300 border-white/5'
            }`}>
              <Sliders className="w-4 h-4 text-purple-600" /> Agent Parameters
            </h3>

            {successMsg && (
              <div className="flex items-start gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl font-medium">
                <Check className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="leading-tight">{successMsg}</p>
              </div>
            )}

            <form onSubmit={handleSavePreferences} className="space-y-4">
              
              {/* Category Preferences */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400 font-mono block">Personalization Interests</label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_PREFS.map(cat => {
                    const selected = selectedCats.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleToggleCat(cat)}
                        className={`text-[10px] px-2.5 py-1.5 rounded-xl font-semibold transition-all border ${
                          selected
                            ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                            : isLight
                            ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            : 'bg-[#16171d] border-white/5 text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        {cat.replace('_', ' ')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Budget Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-mono">
                  <label className="text-slate-400">Budget Maximum Limit</label>
                  <span className="text-purple-600 dark:text-purple-400 font-bold font-mono">{formatPrice(budget)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="range"
                    min="10"
                    max="1000"
                    step="10"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="flex-1 accent-purple-600 bg-slate-200 dark:bg-white/5 h-1 rounded-full cursor-pointer focus:outline-none"
                  />
                </div>
              </div>

              {/* Ticket Tier Preference */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-mono block">Preferred Ticket Tier</label>
                <div className={`flex p-1 rounded-xl border gap-1 ${
                  isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#16171d] border-white/5'
                }`}>
                  {['General', 'Gold', 'VIP'].map(tier => {
                    const active = ticketTier === tier;
                    return (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => setTicketTier(tier)}
                        className={`flex-1 py-1.5 text-[10px] font-semibold rounded-lg transition-all ${
                          active
                            ? 'bg-purple-600 text-white shadow-xs'
                            : isLight
                            ? 'text-slate-600 hover:text-slate-900'
                            : 'text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        {tier}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={updating}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/20 active:translate-y-0.5"
              >
                <Sparkles className="w-3.5 h-3.5" /> {updating ? 'Syncing...' : 'Sync with AI Agent'}
              </button>
            </form>
          </div>
        </div>

        {/* Ticket Purchases / Bookings List */}
        <div className="lg:col-span-2 space-y-6 text-left">
          <div className={`border p-6 rounded-3xl shadow-xl space-y-4 transition-colors ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#1f2028]/60 backdrop-blur-xl border-white/5'
          }`}>
            <h3 className={`font-bold text-sm border-b pb-2.5 m-0 uppercase tracking-wider font-mono flex items-center gap-1.5 ${
              isLight ? 'text-slate-800 border-slate-100' : 'text-gray-300 border-white/5'
            }`}>
              <Ticket className="w-4.5 h-4.5 text-purple-600" /> Active Tickets ({bookings.length})
            </h3>

            {bookings.length === 0 ? (
              <div className={`text-center py-12 border border-dashed rounded-2xl space-y-2 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#16171d]/30 border-white/5'
              }`}>
                <Ticket className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-400">No ticket purchases booked yet.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {bookings.map(booking => (
                  <div key={booking.id} className={`border rounded-2xl p-4 flex flex-col md:flex-row justify-between gap-4 transition-all shadow-xs relative overflow-hidden ${
                    isLight ? 'bg-slate-50 border-slate-200 hover:border-purple-300' : 'bg-[#1f2028] border-white/5 hover:border-purple-500/20'
                  }`}>
                    <div className="space-y-2.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-semibold font-mono px-2 py-0.5 rounded-full uppercase ${
                          booking.status === 'Confirmed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        }`}>
                          {booking.status}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">ID: {booking.id}</span>
                      </div>
                      
                      <div>
                        <h4 className={`font-extrabold text-base leading-snug ${isLight ? 'text-slate-900' : 'text-white'}`}>{booking.eventTitle}</h4>
                        <div className={`flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono mt-1 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                          <span>Qty: <strong className={isLight ? 'text-slate-800' : 'text-gray-200'}>{booking.quantity}</strong></span>
                          <span>Paid: <strong className={isLight ? 'text-slate-800' : 'text-gray-200'}>{formatPrice(booking.pricePaid)}</strong></span>
                          <span>Date: <strong className={isLight ? 'text-slate-800' : 'text-gray-200'}>{booking.date}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-start md:justify-end gap-3 shrink-0">
                      {booking.qrCode && (
                        <button
                          onClick={() => setSelectedBookingQr(booking)}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 text-xs font-semibold text-purple-600 dark:text-purple-400 rounded-xl transition-all active:translate-y-0.5"
                        >
                          <QrCode className="w-4 h-4" /> View QR Code
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Ticket Validation Modal */}
      {selectedBookingQr && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-fadeIn">
          <div className={`border w-full max-w-sm rounded-3xl p-6 relative text-center shadow-2xl space-y-6 ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#1f2028] border-purple-500/20 text-gray-200'
          }`}>
            <button
              onClick={() => setSelectedBookingQr(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5 rotate-180" />
            </button>

            <div className="space-y-1.5">
              <h3 className={`text-lg font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>QR Entry Ticket</h3>
              <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">{selectedBookingQr.eventTitle}</p>
            </div>

            {/* Generated QR Code Container */}
            <div className="w-52 h-52 bg-white rounded-3xl mx-auto flex items-center justify-center p-4 shadow-lg shadow-purple-500/10 border border-slate-100">
              <div className="w-full h-full flex flex-col items-center justify-center border-4 border-dashed border-purple-600/20 rounded-2xl relative overflow-hidden">
                <QrCode className="w-24 h-24 text-gray-800" />
                <span className="text-[8px] text-gray-500 font-mono mt-1 font-semibold break-all text-center px-2">
                  {selectedBookingQr.qrCode}
                </span>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border space-y-1 text-xs leading-normal text-left ${
              isLight ? 'bg-purple-50/60 border-purple-100 text-purple-900' : 'bg-[#16171d] border-white/5 text-gray-400'
            }`}>
              <div className="flex items-center gap-1.5 font-bold font-mono text-[9px] uppercase text-emerald-600 mb-1">
                <Award className="w-3.5 h-3.5" /> Operations Agent Verified
              </div>
              <p className="m-0">State: <strong className="text-emerald-600 font-semibold uppercase">Activated</strong></p>
              <p className="m-0">Ticket validated on checkout database. Show this code at check-in gate for automatic scan verification.</p>
            </div>

            <button
              onClick={() => setSelectedBookingQr(null)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3.5 rounded-2xl text-xs uppercase tracking-wider font-bold transition-all shadow-xs"
            >
              Close Ticket
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
