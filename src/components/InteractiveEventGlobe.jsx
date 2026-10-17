import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Zap, Award, TrendingUp, Radio, Globe, Compass, ArrowUpRight } from 'lucide-react';

export default function InteractiveEventGlobe({ onSelectCategory, isLight }) {
  const [activeHoverCategory, setActiveHoverCategory] = useState(null);
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [rotationAngle, setRotationAngle] = useState(0);

  // Smooth continuous ambient globe rotation
  useEffect(() => {
    let animId;
    let angle = 0;
    const rotate = () => {
      angle = (angle + 0.35) % 360;
      setRotationAngle(angle);
      animId = requestAnimationFrame(rotate);
    };
    animId = requestAnimationFrame(rotate);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = ((y - centerY) / centerY) * -9;
    const tiltY = ((x - centerX) / centerX) * 9;
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setActiveHoverCategory(null);
  };

  const badges = [
    {
      id: 'music',
      label: 'Concerts & Festivals #1',
      category: 'Music',
      subtitle: 'Miami • Red Rocks • Hollywood Bowl',
      stat: '94% Velocity',
      liveCount: '38 Live Venues',
      color: '#ec3b77',
      bgClass: 'bg-[#ec3b77]',
      textClass: 'text-white',
      shadowClass: 'shadow-[0_8px_25px_rgba(236,59,119,0.45)]',
      borderClass: 'border-white/30',
      position: 'top-4 left-2 sm:left-4',
      animClass: 'animate-float-slow',
      icon: TrendingUp,
      nodePos: { cx: 135, cy: 125, name: 'Red Rocks & Hollywood' }
    },
    {
      id: 'tech',
      label: 'AI Tech Summits #1',
      category: 'Tech',
      subtitle: 'San Francisco & Moscone Center',
      stat: '$199 Dynamic',
      liveCount: '18 Summits Live',
      color: '#f59e0b',
      bgClass: 'bg-[#f59e0b]',
      textClass: 'text-slate-950',
      shadowClass: 'shadow-[0_8px_25px_rgba(245,158,11,0.45)]',
      borderClass: 'border-black/15',
      position: 'top-6 right-2 sm:right-4',
      animClass: 'animate-float-delayed',
      icon: Zap,
      nodePos: { cx: 275, cy: 135, name: 'Moscone & Silicon Valley' }
    },
    {
      id: 'hackathon',
      label: 'Global Hackathons #2',
      category: 'Hackathon',
      subtitle: 'Agentic AI & Web3 Buildathons',
      stat: '$100K Pool',
      liveCount: '12 Active Dev Bounties',
      color: '#9e98e4',
      bgClass: 'bg-[#9e98e4]',
      textClass: 'text-slate-950',
      shadowClass: 'shadow-[0_8px_25px_rgba(158,152,228,0.45)]',
      borderClass: 'border-black/15',
      position: 'bottom-12 left-2 sm:left-4',
      animClass: 'animate-float-reverse',
      icon: Sparkles,
      nodePos: { cx: 145, cy: 265, name: 'London & Berlin Hubs' }
    },
    {
      id: 'sports',
      label: 'Championships #1',
      category: 'football',
      subtitle: 'Santiago Bernabéu & Wembley',
      stat: '100% QR Verified',
      liveCount: '24 Stadium Matches',
      color: '#10b981',
      bgClass: 'bg-[#10b981]',
      textClass: 'text-slate-950',
      shadowClass: 'shadow-[0_8px_25px_rgba(16,185,129,0.45)]',
      borderClass: 'border-black/15',
      position: 'bottom-10 right-2 sm:right-4',
      animClass: 'animate-float-slow',
      icon: Award,
      nodePos: { cx: 265, cy: 275, name: 'Bernabéu & Wembley' }
    }
  ];

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full max-w-lg aspect-square rounded-3xl p-4 sm:p-6 flex items-center justify-center overflow-hidden border transition-transform duration-200 select-none ${
        isLight
          ? 'bg-gradient-to-br from-[#f5f1e8] via-[#eee7d9] to-[#e4ded0] border-[#ded7c8] shadow-[0_12px_40px_rgba(0,0,0,0.06)]'
          : 'bg-gradient-to-br from-[#16171d] via-[#1a1c24] to-[#121318] border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.35)]'
      }`}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
      }}
    >
      {/* Dynamic Ambient Background Aura */}
      <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#ec3b77]/20 rounded-full blur-3xl pointer-events-none transition-all duration-700" />
      <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-[#10b981]/20 rounded-full blur-3xl pointer-events-none transition-all duration-700" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main 3D Interactive Sphere & Celestial Rings Canvas */}
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">

        {/* Outer Orbiting Particle Ring 1 (Tilted 3D plane) */}
        <div
          className="absolute inset-0 rounded-full animate-orbit-spin pointer-events-none"
          style={{ transform: 'rotateX(65deg) rotateY(-15deg)' }}
        >
          <div className="w-full h-full rounded-full border border-teal-400/25 border-dashed relative">
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399] animate-pulse" />
            <div className="absolute -bottom-1.5 left-1/3 w-2.5 h-2.5 rounded-full bg-pink-400 shadow-[0_0_10px_#f472b6]" />
          </div>
        </div>

        {/* Outer Orbiting Particle Ring 2 (Opposite Tilted 3D plane) */}
        <div
          className="absolute -inset-3 rounded-full animate-orbit-reverse pointer-events-none"
          style={{ transform: 'rotateX(-60deg) rotateY(25deg)' }}
        >
          <div className="w-full h-full rounded-full border border-amber-400/20 relative">
            <div className="absolute top-1/4 -right-1.5 w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_12px_#fbbf24] animate-pulse" />
            <div className="absolute bottom-1/4 -left-1.5 w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_#818cf8]" />
          </div>
        </div>

        {/* Deep 3D Shaded Sphere Body */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-gradient-to-br from-[#1b3d37] via-[#102724] to-[#071311] shadow-[0_0_40px_rgba(20,184,166,0.35),inset_0_4px_30px_rgba(45,212,191,0.25),inset_0_-10px_40px_rgba(0,0,0,0.85)] flex items-center justify-center border-2 border-teal-400/40 overflow-hidden">

          {/* SVG 3D Dynamic Wireframe */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 400 400"
            fill="none"
          >
            <defs>
              <radialGradient id="sphereSpec" cx="35%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#5eead4" stopOpacity="0.35" />
                <stop offset="45%" stopColor="#0f766e" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#021a17" stopOpacity="0.8" />
              </radialGradient>
              <linearGradient id="radarScanBeam" x1="50%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
              </linearGradient>
              <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Inner spherical lighting volume */}
            <circle cx="200" cy="200" r="196" fill="url(#sphereSpec)" />

            {/* Parallels (Latitude 3D Ellipses) */}
            <ellipse cx="200" cy="200" rx="196" ry="65" stroke="#2dd4bf" strokeWidth="1.5" strokeOpacity="0.5" strokeDasharray="5 4" />
            <ellipse cx="200" cy="135" rx="172" ry="50" stroke="#2dd4bf" strokeWidth="1.2" strokeOpacity="0.35" strokeDasharray="4 3" />
            <ellipse cx="200" cy="265" rx="172" ry="50" stroke="#2dd4bf" strokeWidth="1.2" strokeOpacity="0.35" strokeDasharray="4 3" />
            <ellipse cx="200" cy="80" rx="120" ry="32" stroke="#2dd4bf" strokeWidth="1" strokeOpacity="0.25" />
            <ellipse cx="200" cy="320" rx="120" ry="32" stroke="#2dd4bf" strokeWidth="1" strokeOpacity="0.25" />

            {/* Dynamic Rotating Longitude Meridians (Continuously Gliding in 3D) */}
            {[-75, -45, -15, 15, 45, 75].map((offset, i) => {
              // Calculate dynamic rx based on continuous rotation
              const rad = ((rotationAngle + offset * 3) * Math.PI) / 180;
              const currentRx = Math.abs(Math.sin(rad)) * 194;
              const isFront = Math.cos(rad) > 0;
              return (
                <ellipse
                  key={`meridian-${i}`}
                  cx="200"
                  cy="200"
                  rx={Math.max(4, currentRx)}
                  ry="196"
                  stroke="#2dd4bf"
                  strokeWidth={isFront ? "1.4" : "0.75"}
                  strokeOpacity={isFront ? "0.45" : "0.15"}
                  strokeDasharray={isFront ? "none" : "3 3"}
                />
              );
            })}

            {/* Central Axis Crosshairs */}
            <line x1="200" y1="4" x2="200" y2="396" stroke="#2dd4bf" strokeWidth="1.5" strokeOpacity="0.6" strokeDasharray="3 3" />
            <line x1="4" y1="200" x2="396" y2="200" stroke="#2dd4bf" strokeWidth="1.5" strokeOpacity="0.6" strokeDasharray="3 3" />

            {/* Sweeping Dynamic Radar Beam */}
            <g className="animate-scan-radar" style={{ transformOrigin: '200px 200px' }}>
              <line x1="200" y1="200" x2="396" y2="200" stroke="#5eead4" strokeWidth="2.5" strokeOpacity="0.9" />
              <polygon points="200,200 396,200 375,265" fill="url(#radarScanBeam)" />
            </g>

            {/* Interactive Connected Nodes & Glowing City Pings */}
            {badges.map((b) => {
              const isActive = activeHoverCategory === b.id;
              return (
                <g key={`node-${b.id}`}>
                  {/* Subtle curved arc to center when hovered */}
                  {isActive && (
                    <path
                      d={`M 200 200 Q ${(200 + b.nodePos.cx) / 2} ${(200 + b.nodePos.cy) / 2 - 20} ${b.nodePos.cx} ${b.nodePos.cy}`}
                      stroke={b.color}
                      strokeWidth="2"
                      strokeDasharray="4 2"
                      fill="none"
                      className="animate-pulse"
                    />
                  )}
                  {/* Outer Pulsing Ping Ring */}
                  <circle
                    cx={b.nodePos.cx}
                    cy={b.nodePos.cy}
                    r={isActive ? 16 : 9}
                    fill="none"
                    stroke={b.color}
                    strokeWidth={isActive ? '2.5' : '1.5'}
                    className="animate-ping"
                    style={{ animationDuration: isActive ? '1.2s' : '2.4s' }}
                  />
                  {/* Solid Glowing Core Node */}
                  <circle
                    cx={b.nodePos.cx}
                    cy={b.nodePos.cy}
                    r={isActive ? 7 : 4.5}
                    fill={b.color}
                    filter="url(#glowFilter)"
                  />
                  <circle
                    cx={b.nodePos.cx}
                    cy={b.nodePos.cy}
                    r={isActive ? 3 : 2}
                    fill="#ffffff"
                  />
                </g>
              );
            })}
          </svg>

          {/* Glowing Sonar Rings radiating from Core */}
          <div className="absolute w-20 h-20 rounded-full border-2 border-emerald-400/50 animate-pulse-ring pointer-events-none" />
          <div
            className="absolute w-32 h-32 rounded-full border border-teal-300/35 animate-pulse-ring pointer-events-none"
            style={{ animationDelay: '1.2s' }}
          />
          <div
            className="absolute w-44 h-44 rounded-full border border-emerald-200/20 animate-pulse-ring pointer-events-none"
            style={{ animationDelay: '2.1s' }}
          />

          {/* Central Holographic "ET" Disc (CD-like metallic iridescent sheen) */}
          <div className="relative z-10 w-16 h-16 rounded-full flex items-center justify-center p-[2px] shadow-2xl transition-transform duration-300 hover:scale-110 cursor-pointer">
            {/* Spinning Holographic Rim */}
            <div
              className="absolute inset-0 rounded-full animate-holo-shimmer opacity-85"
              style={{
                background:
                  'conic-gradient(from 0deg, #ec3b77, #f59e0b, #10b981, #2dd4bf, #818cf8, #ec3b77)',
              }}
            />

            {/* Inner White Badge Core */}
            <div className="relative w-full h-full rounded-full bg-white flex flex-col items-center justify-center shadow-inner">
              <span className="font-black text-slate-950 text-base font-mono tracking-tight leading-none">
                ET
              </span>
              <div className="flex items-center gap-0.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[7.5px] font-mono font-extrabold text-teal-800 tracking-wider">
                  LIVE
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Sleek High-Contrast Floating Category Badges */}
      {badges.map((b) => {
        const Icon = b.icon;
        const isHovered = activeHoverCategory === b.id;

        return (
          <div
            key={b.id}
            onMouseEnter={() => setActiveHoverCategory(b.id)}
            onMouseLeave={() => setActiveHoverCategory(null)}
            onClick={() => {
              if (onSelectCategory) {
                onSelectCategory(b.category);
              }
              const el = document.getElementById('events-grid');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`absolute z-30 ${b.position} ${b.animClass} transition-all duration-300 cursor-pointer group`}
          >
            {/* Clean, bold rounded-full pill matching reference style */}
            <div
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full border font-bold text-xs sm:text-[13px] tracking-tight transition-all duration-300 backdrop-blur-md ${b.bgClass} ${b.textClass} ${b.shadowClass} ${b.borderClass} ${
                isHovered ? 'scale-110 -translate-y-1 ring-2 ring-white/50' : 'hover:scale-105'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">{b.label}</span>
              <ArrowUpRight className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
            </div>

            {/* Micro HUD Popover appearing on hover */}
            {isHovered && (
              <div
                className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 z-40 px-3 py-1.5 rounded-xl shadow-2xl border text-[10px] font-mono whitespace-nowrap animate-fadeIn pointer-events-none ${
                  isLight
                    ? 'bg-slate-900/95 text-white border-slate-700/80 shadow-slate-950/20'
                    : 'bg-black/95 text-teal-300 border-teal-500/40 shadow-black/80'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: b.color }} />
                  <span>{b.liveCount}</span>
                  <span className="opacity-60">•</span>
                  <span className="text-amber-400">{b.stat}</span>
                </div>
                <div className="text-[9px] opacity-75 font-sans mt-0.5">
                  {b.subtitle}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Dynamic Soundwave / Telemetry Bar at Bottom */}
      <div
        className={`absolute bottom-2 inset-x-4 flex items-center justify-between text-[10px] font-mono font-semibold tracking-wider px-2 py-1 rounded-xl backdrop-blur-xs ${
          isLight
            ? 'text-slate-600 bg-black/[0.03]'
            : 'text-teal-400/80 bg-white/[0.03]'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="hidden sm:inline font-mono">RADAR ACTIVE</span>
          <span className="sm:hidden font-mono">LIVE</span>
        </div>

        {/* Live Audio / Frequency Waveform Equalizer */}
        <div className="flex items-center gap-1 h-3">
          {[12, 18, 8, 22, 14, 20, 10, 16, 24, 12].map((height, i) => (
            <span
              key={`bar-${i}`}
              className="w-0.5 rounded-full bg-emerald-500/70"
              style={{
                height: `${height * 0.5}px`,
                animation: `wave-bar 1.${(i % 5) + 2}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>

        <div className="text-right font-mono text-[9px] opacity-80">
          <span>1,420 ACTIVE EVENTS</span>
        </div>
      </div>
    </div>
  );
}
