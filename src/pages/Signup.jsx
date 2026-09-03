import React, { useState, useContext } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { User, Mail, Lock, Globe, MapPin, UserPlus, AlertCircle } from 'lucide-react';

export default function Signup() {
  const { signup, login, theme } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();
  const isLight = theme === 'light';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('attendee');
  const [homeCity, setHomeCity] = useState('');
  const [homeState, setHomeState] = useState('');
  const [homeCountry, setHomeCountry] = useState('India');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address with a domain (e.g. name@gmail.com or user@example.com).');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      await signup({
        name: name.trim(),
        email: trimmedEmail,
        password,
        role,
        home_city: homeCity.trim() || null,
        home_state: homeState.trim() || null,
        home_country: homeCountry.trim() || null,
      });

      await login(trimmedEmail, password);
      navigate(location.state?.from || '/');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex-1 flex items-center justify-center px-6 py-12 relative overflow-hidden transition-colors ${
      isLight ? 'bg-[#f8fafc]' : 'bg-[#16171d]'
    }`}>
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl -z-10" />

      <div className={`w-full max-w-lg border p-8 rounded-3xl shadow-2xl space-y-6 transition-colors ${
        isLight ? 'bg-white/95 border-slate-200 shadow-xl' : 'bg-[#1f2028]/60 backdrop-blur-xl border-purple-500/10'
      }`}>
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/20 mx-auto text-white font-extrabold text-xl font-mono">
            E
          </div>
          <h2 className={`text-2xl font-extrabold tracking-tight ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>Join Etixo</h2>
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
            Join the smart event discovery and AI ticketing platform
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-2xl">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed m-0">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-mono block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full border rounded-2xl pl-11 pr-4 py-3.5 text-xs focus:outline-none focus:border-purple-500 transition-all ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400' : 'bg-[#16171d] border-white/5 text-gray-200 placeholder-gray-600'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-mono block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="jane.doe@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full border rounded-2xl pl-11 pr-4 py-3.5 text-xs focus:outline-none focus:border-purple-500 transition-all font-mono ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400' : 'bg-[#16171d] border-white/5 text-gray-200 placeholder-gray-600'
                  }`}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-mono block">Password (min 8 chars)</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full border rounded-2xl pl-11 pr-4 py-3.5 text-xs focus:outline-none focus:border-purple-500 transition-all font-mono ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400' : 'bg-[#16171d] border-white/5 text-gray-200 placeholder-gray-600'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-mono block">I want to register as</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={`w-full border rounded-2xl px-4 py-3.5 text-xs focus:outline-none focus:border-purple-500 transition-all h-[46px] ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-[#16171d] border-white/5 text-gray-200'
                }`}
              >
                <option value="attendee">Attendee (Buy Tickets & Discover)</option>
                <option value="organizer">Organizer (Manage & Publish Events)</option>
                <option value="admin">Platform Admin</option>
              </select>
            </div>
          </div>

          {/* Location details */}
          <div className={`space-y-2 border-t pt-4 ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
            <h4 className={`text-xs font-bold font-mono uppercase tracking-wider ${
              isLight ? 'text-slate-800' : 'text-gray-300'
            }`}>Home Location (For Discovery Filtering)</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-mono block">City</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Bengaluru"
                    value={homeCity}
                    onChange={(e) => setHomeCity(e.target.value)}
                    className={`w-full border rounded-xl pl-9 pr-3 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition-all ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-[#16171d] border-white/5 text-gray-200'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-mono block">State</label>
                <input
                  type="text"
                  placeholder="KA"
                  value={homeState}
                  onChange={(e) => setHomeState(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition-all ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-[#16171d] border-white/5 text-gray-200'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-mono block">Country</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="India"
                    value={homeCountry}
                    onChange={(e) => setHomeCountry(e.target.value)}
                    className={`w-full border rounded-xl pl-9 pr-3 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition-all ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-[#16171d] border-white/5 text-gray-200'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3.5 px-4 rounded-2xl text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 active:translate-y-0.5 pt-4"
          >
            {loading ? 'Registering...' : 'Sign Up for Etixo'}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center pt-2">
          <p className="text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" state={location.state} className="text-purple-600 dark:text-purple-400 hover:underline font-semibold transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}