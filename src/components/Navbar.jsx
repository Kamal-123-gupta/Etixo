import React, { useContext, useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
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
  Globe
} from 'lucide-react';

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

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleNotifClick = () => {
    setShowNotifDropdown(!showNotifDropdown);
    if (!showNotifDropdown) {
      clearUnreadNotifications();
    }
  };

  // Close dropdowns when clicking outside
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
        return <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />;
      case 'pricing':
        return <BadgeAlert className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'ops':
        return <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />;
      default:
        return <Terminal className="w-5 h-5 text-blue-400 shrink-0" />;
    }
  };

  const isLight = theme === 'light';
  const currentCurrencyInfo = CURRENCIES[currency] || CURRENCIES.USD;

  return (
    <nav className={`sticky top-0 z-50 backdrop-blur-md px-4 sm:px-6 py-3.5 flex items-center justify-between transition-colors duration-200 ${
      isLight 
        ? 'bg-white/90 border-b border-slate-200/80 shadow-xs' 
        : 'bg-[#16171d]/85 border-b border-purple-500/10'
    }`}>
      {/* Brand Logo & Name */}
      <NavLink to="/" className="flex items-center gap-3 group text-decoration-none">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-700 flex items-center justify-center shadow-md shadow-purple-500/25 group-hover:scale-105 transition-transform">
          <span className="font-extrabold text-white text-xl tracking-wider font-mono">E</span>
        </div>
        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span className={`font-extrabold text-lg tracking-tight block ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              Etixo
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-600 font-mono font-bold uppercase tracking-wider">
              AI Ticketing
            </span>
          </div>
          <span className={`text-[10px] font-mono tracking-wider block ${
            isLight ? 'text-slate-500' : 'text-purple-400/80'
          }`}>
            Smart Event Platform
          </span>
        </div>
      </NavLink>

      {/* Navigation Links */}
      <div className={`hidden md:flex p-1 rounded-xl border gap-1 transition-colors ${
        isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#1f2028] border-white/5'
      }`}>
        <NavLink
          to="/"
          className={({ isActive }) =>
            `px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isActive
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/20'
                : isLight
                ? 'text-slate-600 hover:text-slate-900 hover:bg-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`
          }
        >
          Attendee
        </NavLink>
        {(userProfile?.role === 'organizer' || userProfile?.role === 'admin') && (
          <NavLink
            to="/organizer"
            className={({ isActive }) =>
              `px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/20'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`
            }
          >
            Organizer
          </NavLink>
        )}
        {userProfile?.role === 'admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/20'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`
            }
          >
            Admin
          </NavLink>
        )}
        <NavLink
          to="/support"
          className={({ isActive }) =>
            `px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              isActive
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/20'
                : isLight
                ? 'text-slate-600 hover:text-slate-900 hover:bg-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`
          }
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Etix AI
        </NavLink>
      </div>

      {/* Controls: Currency Selector, Theme Toggle, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Currency Selector Dropdown */}
        <div className="relative" ref={currencyRef}>
          <button
            onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
            className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-mono font-semibold transition-all ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-800'
                : 'bg-[#1f2028] hover:bg-[#252630] border-white/5 text-gray-200 hover:border-purple-500/30'
            }`}
            title="Change Currency Denomination"
          >
            <span className="text-sm">{currentCurrencyInfo.flag}</span>
            <span>{currentCurrencyInfo.code}</span>
            <span className="text-purple-500 font-bold">{currentCurrencyInfo.symbol.trim()}</span>
            <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
          </button>

          {showCurrencyDropdown && (
            <div className={`absolute right-0 mt-2 w-48 rounded-2xl border shadow-2xl p-2 z-50 backdrop-blur-xl animate-fadeIn ${
              isLight
                ? 'bg-white/95 border-slate-200 text-slate-800'
                : 'bg-[#1f2028]/95 border-purple-500/20 text-gray-200'
            }`}>
              <div className={`px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider font-bold border-b ${
                isLight ? 'text-slate-400 border-slate-100' : 'text-gray-500 border-white/5'
              }`}>
                Select Currency
              </div>
              <div className="space-y-1 mt-1 max-h-60 overflow-y-auto pr-0.5">
                {Object.values(CURRENCIES).map((c) => {
                  const isSelected = currency === c.code;
                  return (
                    <button
                      key={c.code}
                      onClick={() => {
                        setCurrency(c.code);
                        setShowCurrencyDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                        isSelected
                          ? 'bg-purple-600 text-white font-bold'
                          : isLight
                          ? 'hover:bg-slate-100 text-slate-700'
                          : 'hover:bg-white/5 text-gray-300'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{c.flag}</span>
                        <span>{c.name}</span>
                      </span>
                      <span className={isSelected ? 'text-white' : 'text-purple-400 font-bold'}>
                        {c.symbol.trim()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Light / Dark Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center transition-all ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-amber-600'
              : 'bg-[#1f2028] hover:bg-[#252630] border-white/5 text-purple-400 hover:border-purple-500/30'
          }`}
          title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
          aria-label="Toggle Theme"
        >
          {isLight ? (
            <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 transition-transform rotate-0 hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-300 transition-transform -rotate-12 hover:rotate-0" />
          )}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={handleNotifClick}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center transition-all relative ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'
                : 'bg-[#1f2028] hover:bg-[#252630] border-white/5 text-gray-400 hover:text-gray-100 hover:border-purple-500/30'
            }`}
            title="Agent Simulation Alerts"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-semibold text-[9px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className={`absolute right-0 mt-2 w-80 rounded-2xl border shadow-2xl p-4 z-50 backdrop-blur-xl animate-fadeIn ${
              isLight
                ? 'bg-white/95 border-slate-200 text-slate-800'
                : 'bg-[#1f2028]/95 border-purple-500/20 text-gray-200'
            }`}>
              <div className={`flex justify-between items-center pb-3 border-b mb-3 ${
                isLight ? 'border-slate-100' : 'border-white/5'
              }`}>
                <span className={`text-xs font-semibold font-mono uppercase tracking-wider ${
                  isLight ? 'text-slate-600' : 'text-gray-300'
                }`}>
                  Etixo Simulation Logs
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-500 rounded-full font-mono font-bold">
                  Live
                </span>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {notifications.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-6">No notifications logged yet.</p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`flex gap-2.5 p-2 rounded-xl transition-colors ${
                        isLight ? 'hover:bg-slate-100' : 'hover:bg-white/5'
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

        {/* User Badge / Auth Buttons */}
        <div className="flex items-center gap-2">
          {userProfile.isGuest && (
            <NavLink
              to="/login"
              className="px-3 py-1.5 rounded-xl border border-purple-500/20 text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 transition-all font-mono"
            >
              Sign In
            </NavLink>
          )}
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border transition-all text-xs ${
                isActive
                  ? 'border-purple-500/50 bg-purple-500/10 shadow-xs'
                  : isLight
                  ? 'bg-slate-100 border-slate-200 hover:border-purple-500/30 text-slate-700'
                  : 'bg-[#1f2028] border-white/5 hover:border-purple-500/20 text-gray-300 hover:text-white'
              }`
            }
          >
            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-500 flex items-center justify-center font-bold">
              {userProfile.name ? userProfile.name.charAt(0) : 'G'}
            </div>
            <div className="hidden sm:block text-left">
              <p className={`font-semibold text-xs leading-none ${
                isLight ? 'text-slate-800' : 'text-gray-200'
              }`}>
                {userProfile.name || 'Guest'}
              </p>
              <span className="text-[9px] text-purple-500 font-mono font-medium">
                {userProfile.ticketTier || 'General'} Tier
              </span>
            </div>
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
