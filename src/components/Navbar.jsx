import React, { useContext, useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import {
  Bell,
  ShieldAlert,
  BadgeAlert,
  Sparkles,
  MessageSquare,
  Terminal,
  Sun,
  Moon,
  ChevronDown,
  Search,
  Compass,
  Layers
} from 'lucide-react';
import BrandLogo from './BrandLogo';

export default function Navbar() {
  const {
    notifications,
    clearUnreadNotifications,
    userProfile,
    theme,
    toggleTheme,
    currency,
    setCurrency,
    CURRENCIES
  } = useContext(AppContext);

  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const currencyRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleNotifClick = () => {
    setShowNotifDropdown(!showNotifDropdown);
    if (!showNotifDropdown) {
      clearUnreadNotifications();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (currencyRef.current && !currencyRef.current.contains(event.target)) {
        setShowCurrencyDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotifIcon = (type) => {
    switch (type) {
      case 'fraud':
        return <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'pricing':
        return <BadgeAlert className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'ops':
        return <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />;
      default:
        return <Terminal className="w-4 h-4 text-indigo-500 shrink-0" />;
    }
  };

  const isLight = theme === 'light';
  const currentCurrencyInfo = CURRENCIES[currency] || CURRENCIES.USD;

  return (
    <nav className={`sticky top-0 z-50 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between transition-colors duration-200 border-b ${
      isLight 
        ? 'bg-[#f6f4ee]/90 border-[#e7e4dc]' 
        : 'bg-[#101114]/90 border-white/5'
    }`}>
      {/* Brand Logo & Name */}
      <NavLink to="/" className="flex items-center gap-3 group text-decoration-none shrink-0">
        <BrandLogo size={36} className="shrink-0 shadow-xs group-hover:scale-105 transition-transform" />
        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span className={`font-extrabold text-base tracking-tight block ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              Etixo Ticketing
            </span>
          </div>
          <span className={`text-[10px] font-mono tracking-wider block ${
            isLight ? 'text-slate-500' : 'text-gray-400'
          }`}>
            Smart Event Platform
          </span>
        </div>
      </NavLink>

      {/* Navigation Links */}
      <div className="hidden lg:flex items-center gap-1.5 text-xs font-medium">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
              isActive
                ? isLight
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'bg-white text-slate-900 font-semibold shadow-xs'
                : isLight
                ? 'text-slate-600 hover:text-slate-900 hover:bg-black/5'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`
          }
        >
          <Compass className="w-3.5 h-3.5" />
          Dashboard
        </NavLink>

        {(userProfile?.role === 'organizer' || userProfile?.role === 'admin') && (
          <NavLink
            to="/organizer"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
                isActive
                  ? isLight
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'bg-white text-slate-900 font-semibold shadow-xs'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-black/5'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Layers className="w-3.5 h-3.5" />
            Organizer
          </NavLink>
        )}

        {userProfile?.role === 'admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
                isActive
                  ? isLight
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'bg-white text-slate-900 font-semibold shadow-xs'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-black/5'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Admin
          </NavLink>
        )}

        <NavLink
          to="/support"
          className={({ isActive }) =>
            `flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
              isActive
                ? isLight
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'bg-white text-slate-900 font-semibold shadow-xs'
                : isLight
                ? 'text-slate-600 hover:text-slate-900 hover:bg-black/5'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`
          }
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Etix AI Support
        </NavLink>
      </div>

      {/* Controls: Search Trigger, Currency Selector, Theme Toggle, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Quick Search Shortcut Pill */}
        <button
          onClick={() => {
            const searchInput = document.querySelector('input[type="text"]');
            if (searchInput) {
              searchInput.focus();
              searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }}
          className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-all ${
            isLight
              ? 'bg-white/80 border-[#e7e4dc] text-slate-500 hover:bg-white hover:text-slate-800 shadow-xs'
              : 'bg-[#18191e] border-white/5 text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>Search...</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
            isLight ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-black/30 border-white/10 text-gray-400'
          }`}>
            ⌘K
          </span>
        </button>

        {/* Currency Selector Dropdown */}
        <div className="relative" ref={currencyRef}>
          <button
            onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-mono font-medium transition-all cursor-pointer ${
              isLight
                ? 'bg-white/80 border-[#e7e4dc] text-slate-800 hover:bg-white shadow-xs'
                : 'bg-[#18191e] border-white/5 text-gray-200 hover:bg-white/5'
            }`}
            title="Change Currency Denomination"
          >
            <span>{currentCurrencyInfo.flag}</span>
            <span>{currentCurrencyInfo.code}</span>
            <span className="font-semibold">{currentCurrencyInfo.symbol.trim()}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {showCurrencyDropdown && (
            <div className={`absolute right-0 mt-2 w-48 rounded-2xl border shadow-xl p-2 z-50 backdrop-blur-xl animate-fadeIn ${
              isLight
                ? 'bg-white/95 border-[#e7e4dc] text-slate-800'
                : 'bg-[#18191e]/95 border-white/10 text-gray-200'
            }`}>
              <div className={`px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider font-bold border-b ${
                isLight ? 'text-slate-400 border-slate-100' : 'text-gray-500 border-white/5'
              }`}>
                Select Currency
              </div>
              <div className="space-y-0.5 mt-1 max-h-60 overflow-y-auto pr-0.5">
                {Object.values(CURRENCIES).map((c) => {
                  const isSelected = currency === c.code;
                  return (
                    <button
                      key={c.code}
                      onClick={() => {
                        setCurrency(c.code);
                        setShowCurrencyDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white font-bold'
                          : isLight
                          ? 'hover:bg-slate-100 text-slate-700'
                          : 'hover:bg-white/5 text-gray-300'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{c.flag}</span>
                        <span>{c.name}</span>
                      </span>
                      <span className={isSelected ? 'text-white' : 'text-slate-400 font-bold'}>
                        {c.symbol.trim()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={handleNotifClick}
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all relative cursor-pointer ${
              isLight
                ? 'bg-white/80 border-[#e7e4dc] text-slate-700 hover:bg-white shadow-xs'
                : 'bg-[#18191e] border-white/5 text-gray-300 hover:bg-white/5'
            }`}
            title="Agent Simulation Alerts"
          >
            <Bell className="w-3.5 h-3.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[#ec3b77] text-white font-semibold text-[8px] min-w-3.5 h-3.5 px-0.5 rounded-full flex items-center justify-center border border-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className={`absolute right-0 mt-2 w-80 rounded-2xl border shadow-xl p-4 z-50 backdrop-blur-xl animate-fadeIn ${
              isLight
                ? 'bg-white/95 border-[#e7e4dc] text-slate-800'
                : 'bg-[#18191e]/95 border-white/10 text-gray-200'
            }`}>
              <div className={`flex justify-between items-center pb-2.5 border-b mb-2.5 ${
                isLight ? 'border-slate-100' : 'border-white/5'
              }`}>
                <span className={`text-xs font-semibold font-mono uppercase tracking-wider ${
                  isLight ? 'text-slate-600' : 'text-gray-300'
                }`}>
                  Agent System Logs
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full font-mono font-bold">
                  Active
                </span>
              </div>
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {notifications.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-6">No notifications logged yet.</p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`flex gap-2.5 p-2 rounded-xl transition-colors ${
                        isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'
                      }`}
                    >
                      {getNotifIcon(notif.type)}
                      <div className="flex-1 text-left">
                        <p className={`text-xs leading-normal ${
                          isLight ? 'text-slate-700 font-medium' : 'text-gray-300'
                        }`}>
                          {notif.message}
                        </p>
                        <span className="text-[9px] text-gray-400 font-mono mt-1 block">
                          {notif.timestamp}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Light / Dark Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
            isLight
              ? 'bg-white/80 border-[#e7e4dc] text-slate-700 hover:bg-white shadow-xs'
              : 'bg-[#18191e] border-white/5 text-amber-300 hover:bg-white/5'
          }`}
          title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
          aria-label="Toggle Theme"
        >
          {isLight ? (
            <Moon className="w-3.5 h-3.5 text-slate-700" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-300" />
          )}
        </button>

        {/* User Profile / Auth Button */}
        <div className="flex items-center gap-1.5">
          {userProfile.isGuest ? (
            <NavLink
              to="/login"
              className="px-3.5 py-1.5 rounded-full bg-slate-900 text-white hover:bg-slate-800 text-xs font-medium transition-all shadow-xs"
            >
              Sign In
            </NavLink>
          ) : (
            <NavLink
              to="/profile"
              className={`flex items-center gap-2 px-2.5 py-1 rounded-full border transition-all text-xs ${
                isLight
                  ? 'bg-white/80 border-[#e7e4dc] text-slate-800 hover:bg-white shadow-xs'
                  : 'bg-[#18191e] border-white/5 text-gray-200 hover:bg-white/5'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                {userProfile.name ? userProfile.name.charAt(0) : 'U'}
              </div>
              <span className="hidden sm:inline font-medium text-xs">
                {userProfile.name || 'Account'}
              </span>
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
}
