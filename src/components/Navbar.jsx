import React, { useContext, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Bell, ShieldAlert, BadgeAlert, Sparkles, MessageSquare, Terminal } from 'lucide-react';

export default function Navbar() {
  const { notifications, clearUnreadNotifications, userProfile } = useContext(AppContext);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleNotifClick = () => {
    setShowNotifDropdown(!showNotifDropdown);
    if (!showNotifDropdown) {
      clearUnreadNotifications();
    }
  };

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

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#16171d]/85 border-b border-purple-500/10 px-6 py-4 flex items-center justify-between">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <span className="font-bold text-white text-xl">A</span>
        </div>
        <div>
          <span className="font-semibold text-gray-100 tracking-wide block">Antigravity Tickets</span>
          <span className="text-[10px] text-purple-400/80 font-mono tracking-widest uppercase">9-Agent Sandbox</span>
        </div>
      </div>

      {/* Simulator Switcher Navigation */}
      <div className="flex bg-[#1f2028] p-1 rounded-xl border border-white/5 gap-1">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
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
              `px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
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
              `px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
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
            `px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              isActive
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`
          }
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Support AI
        </NavLink>
      </div>

      {/* Profile & Notifications Panel */}
      <div className="flex items-center gap-4">
        {/* Real-time Agent Notifications */}
        <div className="relative">
          <button
            onClick={handleNotifClick}
            className="w-10 h-10 rounded-xl bg-[#1f2028] border border-white/5 flex items-center justify-center text-gray-400 hover:text-gray-100 hover:border-purple-500/30 transition-all relative"
            title="Agent Alerts"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-semibold text-[10px] min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center border-2 border-[#16171d] animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifDropdown && (
            <div className="absolute right-0 mt-3 w-80 rounded-2xl bg-[#1f2028] border border-purple-500/10 shadow-2xl p-4 z-50 backdrop-blur-xl">
              <div className="flex justify-between items-center pb-3 border-b border-white/5 mb-3">
                <span className="text-xs font-semibold text-gray-300 font-mono uppercase tracking-wider">Agent Simulation Logs</span>
                <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-full font-mono">Live</span>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {notifications.length === 0 ? (
                  <p className="text-center text-xs text-gray-500 py-6">No notifications logged yet.</p>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className="flex gap-2.5 p-2 rounded-lg hover:bg-white/5 transition-colors">
                      {getNotifIcon(notif.type)}
                      <div className="flex-1">
                        <p className="text-xs text-gray-300 leading-normal">{notif.message}</p>
                        <span className="text-[9px] text-gray-500 font-mono mt-1 block">{notif.timestamp}</span>
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
              className="px-3.5 py-1.5 rounded-xl border border-purple-500/10 text-xs font-semibold text-purple-400 bg-purple-500/5 hover:bg-purple-500/10 transition-all font-mono"
            >
              Sign In
            </NavLink>
          )}
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-1.5 bg-[#1f2028] rounded-xl border transition-all text-xs ${
                isActive
                  ? 'border-purple-500/40 bg-purple-500/5 shadow-md shadow-purple-500/5'
                  : 'border-white/5 hover:border-purple-500/20 text-gray-300 hover:text-white'
              }`
            }
          >
            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              {userProfile.name ? userProfile.name.charAt(0) : 'G'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="font-semibold text-gray-200 leading-none">{userProfile.name || 'Guest'}</p>
              <span className="text-[9px] text-purple-400 font-mono">{userProfile.ticketTier || 'General'} Tier</span>
            </div>
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
