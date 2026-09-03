// src/lib/eventImages.js
//
// High-resolution SVG vector illustrations & curated fallback banners for all event categories.
// Uses standalone SVG Data URIs so cards and banners ALWAYS render with 100% reliability (offline/online)
// with zero external network dependency, vibrant themes, and rich aesthetics.

function createSvgDataUri(svgContent) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent.trim())}`;
}

const CATEGORY_SVGS = {
  // Football / Soccer: Stadium floodlights & pitch arcs
  football: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#064e3b" />
          <stop offset="50%" stop-color="#0f766e" />
          <stop offset="100%" stop-color="#1e1b4b" />
        </linearGradient>
        <radialGradient id="spot" cx="50%" cy="20%" r="60%">
          <stop offset="0%" stop-color="#34d399" stop-opacity="0.5" />
          <stop offset="100%" stop-color="#064e3b" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="beam" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.15" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
        </linearGradient>
      </defs>
      <rect width="800" height="400" fill="url(#bg)" />
      <rect width="800" height="400" fill="url(#spot)" />
      <!-- Stadium Beams -->
      <polygon points="100,0 250,400 50,400" fill="url(#beam)" />
      <polygon points="700,0 750,400 550,400" fill="url(#beam)" />
      <polygon points="400,0 550,400 250,400" fill="url(#beam)" />
      <!-- Field Arcs -->
      <circle cx="400" cy="420" r="220" fill="none" stroke="#6ee7b7" stroke-width="3" stroke-opacity="0.35" />
      <circle cx="400" cy="420" r="80" fill="none" stroke="#6ee7b7" stroke-width="3" stroke-opacity="0.4" />
      <line x1="0" y1="420" x2="800" y2="420" stroke="#6ee7b7" stroke-width="3" stroke-opacity="0.35" />
      <!-- Icon/Badge Art -->
      <g transform="translate(360, 110)">
        <circle cx="40" cy="40" r="48" fill="#047857" fill-opacity="0.6" stroke="#34d399" stroke-width="2" />
        <path d="M40 16 L56 28 L50 48 L30 48 L24 28 Z" fill="#ffffff" fill-opacity="0.9" />
        <circle cx="40" cy="40" r="32" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-opacity="0.8" />
        <line x1="40" y1="8" x2="40" y2="16" stroke="#ffffff" stroke-width="2" />
        <line x1="16" y1="48" x2="24" y2="48" stroke="#ffffff" stroke-width="2" />
        <line x1="64" y1="48" x2="56" y2="48" stroke="#ffffff" stroke-width="2" />
      </g>
      <text x="400" y="240" fill="#ecfdf5" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="800" letter-spacing="4" text-anchor="middle">FOOTBALL MATCH</text>
      <text x="400" y="270" fill="#6ee7b7" font-family="monospace" font-size="12" font-weight="600" letter-spacing="3" text-anchor="middle">LIVE STADIUM EXPERIENCE</text>
    </svg>
  `),

  // Stadium Tours: Arena silhouette & grand dome
  stadium_tours: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
      <defs>
        <linearGradient id="bg-stadium" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e1b4b" />
          <stop offset="50%" stop-color="#4338ca" />
          <stop offset="100%" stop-color="#581c87" />
        </linearGradient>
        <radialGradient id="glow-stadium" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stop-color="#a855f7" stop-opacity="0.6" />
          <stop offset="100%" stop-color="#1e1b4b" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="800" height="400" fill="url(#bg-stadium)" />
      <rect width="800" height="400" fill="url(#glow-stadium)" />
      <!-- Dome Silhouette -->
      <path d="M 150 350 Q 400 150 650 350 Z" fill="none" stroke="#c084fc" stroke-width="4" stroke-opacity="0.4" />
      <path d="M 200 350 Q 400 190 600 350 Z" fill="none" stroke="#e879f9" stroke-width="2" stroke-opacity="0.3" />
      <path d="M 250 350 Q 400 230 550 350 Z" fill="none" stroke="#a855f7" stroke-width="1.5" stroke-opacity="0.3" />
      <!-- Rib lines -->
      <line x1="400" y1="150" x2="400" y2="350" stroke="#c084fc" stroke-width="2" stroke-opacity="0.3" />
      <line x1="400" y1="150" x2="300" y2="350" stroke="#c084fc" stroke-width="1.5" stroke-opacity="0.25" />
      <line x1="400" y1="150" x2="500" y2="350" stroke="#c084fc" stroke-width="1.5" stroke-opacity="0.25" />
      <g transform="translate(360, 80)">
        <rect x="0" y="0" width="80" height="80" rx="20" fill="#6b21a8" fill-opacity="0.6" stroke="#c084fc" stroke-width="2" />
        <!-- Stadium Icon -->
        <ellipse cx="40" cy="40" rx="26" ry="16" fill="none" stroke="#ffffff" stroke-width="2.5" />
        <ellipse cx="40" cy="40" rx="14" ry="8" fill="none" stroke="#ffffff" stroke-width="1.5" />
      </g>
      <text x="400" y="210" fill="#faf5ff" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="800" letter-spacing="4" text-anchor="middle">STADIUM EXPERIENCE</text>
      <text x="400" y="240" fill="#d8b4fe" font-family="monospace" font-size="12" font-weight="600" letter-spacing="3" text-anchor="middle">VIP ARENA & ACCESS PASS</text>
    </svg>
  `),

  // Basketball
  basketball: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
      <defs>
        <linearGradient id="bg-bball" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#431407" />
          <stop offset="50%" stop-color="#9a3412" />
          <stop offset="100%" stop-color="#311042" />
        </linearGradient>
        <radialGradient id="glow-bball" cx="50%" cy="30%" r="50%">
          <stop offset="0%" stop-color="#fb923c" stop-opacity="0.6" />
          <stop offset="100%" stop-color="#431407" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="800" height="400" fill="url(#bg-bball)" />
      <rect width="800" height="400" fill="url(#glow-bball)" />
      <!-- Court Curves -->
      <path d="M 0 200 Q 400 50 800 200" fill="none" stroke="#fdba74" stroke-width="3" stroke-opacity="0.3" />
      <circle cx="400" cy="200" r="90" fill="none" stroke="#fdba74" stroke-width="2.5" stroke-opacity="0.3" />
      <g transform="translate(360, 70)">
        <circle cx="40" cy="40" r="44" fill="#c2410c" fill-opacity="0.7" stroke="#fb923c" stroke-width="2" />
        <circle cx="40" cy="40" r="30" fill="none" stroke="#ffffff" stroke-width="2" />
        <line x1="10" y1="40" x2="70" y2="40" stroke="#ffffff" stroke-width="2" />
        <line x1="40" y1="10" x2="40" y2="70" stroke="#ffffff" stroke-width="2" />
        <path d="M 22 22 Q 40 40 22 58" fill="none" stroke="#ffffff" stroke-width="2" />
        <path d="M 58 22 Q 40 40 58 58" fill="none" stroke="#ffffff" stroke-width="2" />
      </g>
      <text x="400" y="200" fill="#fff7ed" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="800" letter-spacing="4" text-anchor="middle">BASKETBALL ARENA</text>
      <text x="400" y="230" fill="#fdba74" font-family="monospace" font-size="12" font-weight="600" letter-spacing="3" text-anchor="middle">CHAMPIONSHIP SERIES</text>
    </svg>
  `),

  // Baseball
  baseball: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
      <defs>
        <linearGradient id="bg-base" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#172554" />
          <stop offset="50%" stop-color="#1e40af" />
          <stop offset="100%" stop-color="#881337" />
        </linearGradient>
      </defs>
      <rect width="800" height="400" fill="url(#bg-base)" />
      <!-- Diamond diamond -->
      <polygon points="400,80 600,240 400,380 200,240" fill="none" stroke="#93c5fd" stroke-width="3" stroke-opacity="0.3" />
      <g transform="translate(360, 90)">
        <circle cx="40" cy="40" r="40" fill="#1e3a8a" fill-opacity="0.8" stroke="#60a5fa" stroke-width="2" />
        <circle cx="40" cy="40" r="28" fill="#ffffff" />
        <path d="M 22 22 Q 32 40 22 58" fill="none" stroke="#dc2626" stroke-width="2" stroke-dasharray="3,3" />
        <path d="M 58 22 Q 48 40 58 58" fill="none" stroke="#dc2626" stroke-width="2" stroke-dasharray="3,3" />
      </g>
      <text x="400" y="210" fill="#eff6ff" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="800" letter-spacing="4" text-anchor="middle">BASEBALL LEAGUE</text>
      <text x="400" y="240" fill="#93c5fd" font-family="monospace" font-size="12" font-weight="600" letter-spacing="3" text-anchor="middle">MAJOR BALLPARK EVENT</text>
    </svg>
  `),

  // Hockey
  hockey: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
      <defs>
        <linearGradient id="bg-ice" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#082f49" />
          <stop offset="50%" stop-color="#0369a1" />
          <stop offset="100%" stop-color="#1e1b4b" />
        </linearGradient>
      </defs>
      <rect width="800" height="400" fill="url(#bg-ice)" />
      <circle cx="400" cy="200" r="140" fill="none" stroke="#7dd3fc" stroke-width="3" stroke-opacity="0.35" />
      <circle cx="400" cy="200" r="15" fill="#f43f5e" fill-opacity="0.6" />
      <line x1="400" y1="0" x2="400" y2="400" stroke="#f43f5e" stroke-width="3" stroke-opacity="0.4" />
      <g transform="translate(360, 90)">
        <rect x="0" y="0" width="80" height="80" rx="20" fill="#0c4a6e" stroke="#38bdf8" stroke-width="2" />
        <ellipse cx="40" cy="40" rx="24" ry="12" fill="#0f172a" stroke="#ffffff" stroke-width="2" />
      </g>
      <text x="400" y="210" fill="#f0f9ff" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="800" letter-spacing="4" text-anchor="middle">ICE HOCKEY NIGHT</text>
      <text x="400" y="240" fill="#7dd3fc" font-family="monospace" font-size="12" font-weight="600" letter-spacing="3" text-anchor="middle">RINK SHOWDOWN & TOURNAMENT</text>
    </svg>
  `),

  // Music / Concerts / Festivals
  music: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
      <defs>
        <linearGradient id="bg-music" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#3b0764" />
          <stop offset="50%" stop-color="#86198f" />
          <stop offset="100%" stop-color="#4c0519" />
        </linearGradient>
        <radialGradient id="glow-music" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stop-color="#f43f5e" stop-opacity="0.6" />
          <stop offset="100%" stop-color="#3b0764" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="800" height="400" fill="url(#bg-music)" />
      <rect width="800" height="400" fill="url(#glow-music)" />
      <!-- Sound Equalizer Bars -->
      <g fill="#f472b6" fill-opacity="0.35" transform="translate(160, 240)">
        <rect x="0" y="-30" width="16" height="60" rx="8" />
        <rect x="30" y="-60" width="16" height="90" rx="8" />
        <rect x="60" y="-90" width="16" height="120" rx="8" />
        <rect x="90" y="-40" width="16" height="70" rx="8" />
        <rect x="120" y="-75" width="16" height="105" rx="8" />
        <rect x="150" y="-110" width="16" height="140" rx="8" />
        <rect x="180" y="-85" width="16" height="115" rx="8" />
        <rect x="210" y="-50" width="16" height="80" rx="8" />
        <rect x="240" y="-100" width="16" height="130" rx="8" />
        <rect x="270" y="-130" width="16" height="160" rx="8" />
        <rect x="300" y="-70" width="16" height="100" rx="8" />
        <rect x="330" y="-95" width="16" height="125" rx="8" />
        <rect x="360" y="-50" width="16" height="80" rx="8" />
        <rect x="390" y="-80" width="16" height="110" rx="8" />
        <rect x="420" y="-40" width="16" height="70" rx="8" />
        <rect x="450" y="-20" width="16" height="50" rx="8" />
      </g>
      <g transform="translate(360, 70)">
        <circle cx="40" cy="40" r="44" fill="#701a75" stroke="#f472b6" stroke-width="2" />
        <!-- Musical Note -->
        <path d="M 32 50 A 6 6 0 1 1 26 44 L 26 24 L 54 18 L 54 44 A 6 6 0 1 1 48 38 L 48 24 L 32 28 Z" fill="#ffffff" />
      </g>
      <text x="400" y="200" fill="#fdf4ff" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="800" letter-spacing="4" text-anchor="middle">LIVE MUSIC FESTIVAL</text>
      <text x="400" y="230" fill="#f472b6" font-family="monospace" font-size="12" font-weight="600" letter-spacing="3" text-anchor="middle">CONCERT & STAGE SHOW</text>
    </svg>
  `),

  // Tech / Conferences / Hackathons
  tech: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
      <defs>
        <linearGradient id="bg-tech" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#030712" />
          <stop offset="50%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#1e1b4b" />
        </linearGradient>
        <radialGradient id="glow-tech" cx="50%" cy="30%" r="50%">
          <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.5" />
          <stop offset="100%" stop-color="#030712" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="800" height="400" fill="url(#bg-tech)" />
      <rect width="800" height="400" fill="url(#glow-tech)" />
      <!-- Digital Matrix Grid -->
      <g stroke="#38bdf8" stroke-width="1.5" stroke-opacity="0.3">
        <line x1="100" y1="100" x2="300" y2="100" />
        <line x1="300" y1="100" x2="400" y2="200" />
        <line x1="400" y1="200" x2="600" y2="200" />
        <line x1="500" y1="120" x2="700" y2="120" />
        <line x1="200" y1="300" x2="600" y2="300" />
        <circle cx="300" cy="100" r="5" fill="#38bdf8" />
        <circle cx="400" cy="200" r="6" fill="#06b6d4" />
        <circle cx="500" cy="120" r="5" fill="#38bdf8" />
        <circle cx="600" cy="200" r="5" fill="#818cf8" />
      </g>
      <g transform="translate(360, 70)">
        <rect x="0" y="0" width="80" height="80" rx="20" fill="#0e7490" fill-opacity="0.6" stroke="#22d3ee" stroke-width="2" />
        <path d="M 28 32 L 20 40 L 28 48 M 52 32 L 60 40 L 52 48 M 44 26 L 36 54" stroke="#ffffff" stroke-width="3" stroke-linecap="round" fill="none" />
      </g>
      <text x="400" y="200" fill="#f0fdf4" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="800" letter-spacing="4" text-anchor="middle">TECH SUMMIT & KEYNOTE</text>
      <text x="400" y="230" fill="#38bdf8" font-family="monospace" font-size="12" font-weight="600" letter-spacing="3" text-anchor="middle">INNOVATION & AI SESSIONS</text>
    </svg>
  `),

  // Comedy / Standup
  comedy: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
      <defs>
        <linearGradient id="bg-comedy" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#2e1065" />
          <stop offset="50%" stop-color="#581c87" />
          <stop offset="100%" stop-color="#78350f" />
        </linearGradient>
        <radialGradient id="glow-comedy" cx="50%" cy="20%" r="50%">
          <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.6" />
          <stop offset="100%" stop-color="#2e1065" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="800" height="400" fill="url(#bg-comedy)" />
      <rect width="800" height="400" fill="url(#glow-comedy)" />
      <!-- Spotlight -->
      <polygon points="400,0 200,400 600,400" fill="#fbbf24" fill-opacity="0.12" />
      <g transform="translate(360, 70)">
        <circle cx="40" cy="40" r="44" fill="#6b21a8" stroke="#fbbf24" stroke-width="2" />
        <!-- Microphone -->
        <rect x="34" y="22" width="12" height="24" rx="6" fill="#ffffff" />
        <path d="M 28 34 A 12 12 0 0 0 52 34" fill="none" stroke="#ffffff" stroke-width="2.5" />
        <line x1="40" y1="46" x2="40" y2="58" stroke="#ffffff" stroke-width="2.5" />
        <line x1="30" y1="58" x2="50" y2="58" stroke="#ffffff" stroke-width="2.5" />
      </g>
      <text x="400" y="200" fill="#fffbeb" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="800" letter-spacing="4" text-anchor="middle">STANDUP COMEDY CLUB</text>
      <text x="400" y="230" fill="#fbbf24" font-family="monospace" font-size="12" font-weight="600" letter-spacing="3" text-anchor="middle">LIVE LAUGHTER SPECIAL</text>
    </svg>
  `),

  // Arts / Theatre
  arts: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
      <defs>
        <linearGradient id="bg-arts" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#4c0519" />
          <stop offset="50%" stop-color="#881337" />
          <stop offset="100%" stop-color="#2e1065" />
        </linearGradient>
      </defs>
      <rect width="800" height="400" fill="url(#bg-arts)" />
      <!-- Stage curtains -->
      <path d="M 0 0 Q 200 250 200 400 L 0 400 Z" fill="#9f1239" fill-opacity="0.4" />
      <path d="M 800 0 Q 600 250 600 400 L 800 400 Z" fill="#9f1239" fill-opacity="0.4" />
      <g transform="translate(360, 70)">
        <circle cx="40" cy="40" r="44" fill="#9f1239" stroke="#fda4af" stroke-width="2" />
        <!-- Theatre Mask -->
        <path d="M 26 28 Q 40 18 54 28 Q 50 58 40 60 Q 30 58 26 28 Z" fill="#ffffff" />
        <ellipse cx="34" cy="36" rx="3" ry="4" fill="#881337" />
        <ellipse cx="46" cy="36" rx="3" ry="4" fill="#881337" />
        <path d="M 34 48 Q 40 54 46 48" stroke="#881337" stroke-width="2" fill="none" />
      </g>
      <text x="400" y="200" fill="#fff1f2" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="800" letter-spacing="4" text-anchor="middle">THEATRE & ARTS</text>
      <text x="400" y="230" fill="#fda4af" font-family="monospace" font-size="12" font-weight="600" letter-spacing="3" text-anchor="middle">DRAMA, EXHIBITS & PERFORMANCE</text>
    </svg>
  `),

  // Food & Drinks
  food: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
      <defs>
        <linearGradient id="bg-food" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#451a03" />
          <stop offset="50%" stop-color="#9a3412" />
          <stop offset="100%" stop-color="#831843" />
        </linearGradient>
      </defs>
      <rect width="800" height="400" fill="url(#bg-food)" />
      <circle cx="400" cy="200" r="120" fill="none" stroke="#fdba74" stroke-width="2.5" stroke-opacity="0.3" />
      <g transform="translate(360, 70)">
        <circle cx="40" cy="40" r="44" fill="#c2410c" stroke="#fdba74" stroke-width="2" />
        <!-- Fork & Spoon -->
        <path d="M 30 24 L 30 36 M 34 24 L 34 36 M 38 24 L 38 36 M 30 36 Q 34 42 34 56 M 38 36 Q 34 42 34 56" stroke="#ffffff" stroke-width="2" fill="none" />
        <ellipse cx="48" cy="30" rx="6" ry="8" fill="#ffffff" />
        <line x1="48" y1="38" x2="48" y2="56" stroke="#ffffff" stroke-width="2" />
      </g>
      <text x="400" y="200" fill="#fff7ed" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="800" letter-spacing="4" text-anchor="middle">FOOD & CULINARY FEST</text>
      <text x="400" y="230" fill="#fdba74" font-family="monospace" font-size="12" font-weight="600" letter-spacing="3" text-anchor="middle">TASTING & CHEF WORKSHOPS</text>
    </svg>
  `),

  // Default Fallback
  default: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
      <defs>
        <linearGradient id="bg-default" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e1b4b" />
          <stop offset="50%" stop-color="#4f46e5" />
          <stop offset="100%" stop-color="#7c3aed" />
        </linearGradient>
        <radialGradient id="glow-default" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stop-color="#a855f7" stop-opacity="0.6" />
          <stop offset="100%" stop-color="#1e1b4b" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="800" height="400" fill="url(#bg-default)" />
      <rect width="800" height="400" fill="url(#glow-default)" />
      <polygon points="100,80 300,40 500,120 700,60 750,300 450,350 200,320" fill="none" stroke="#c084fc" stroke-width="2" stroke-opacity="0.25" />
      <g transform="translate(360, 70)">
        <rect x="0" y="0" width="80" height="80" rx="22" fill="#6366f1" fill-opacity="0.7" stroke="#c084fc" stroke-width="2" />
        <!-- Ticket Icon -->
        <rect x="22" y="26" width="36" height="28" rx="4" fill="none" stroke="#ffffff" stroke-width="2.5" />
        <circle cx="22" cy="40" r="4" fill="#6366f1" />
        <circle cx="58" cy="40" r="4" fill="#6366f1" />
        <line x1="34" y1="30" x2="34" y2="50" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="2,2" />
      </g>
      <text x="400" y="200" fill="#faf5ff" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="800" letter-spacing="4" text-anchor="middle">PREMIUM EVENT</text>
      <text x="400" y="230" fill="#d8b4fe" font-family="monospace" font-size="12" font-weight="600" letter-spacing="3" text-anchor="middle">SMART TICKETING BY ETIXO</text>
    </svg>
  `),
};

// Aliases
CATEGORY_SVGS.soccer = CATEGORY_SVGS.football;
CATEGORY_SVGS.stadium = CATEGORY_SVGS.stadium_tours;
CATEGORY_SVGS.concert = CATEGORY_SVGS.music;
CATEGORY_SVGS.festival = CATEGORY_SVGS.music;
CATEGORY_SVGS.conference = CATEGORY_SVGS.tech;
CATEGORY_SVGS.hackathon = CATEGORY_SVGS.tech;
CATEGORY_SVGS.standup = CATEGORY_SVGS.comedy;
CATEGORY_SVGS.theatre = CATEGORY_SVGS.arts;
CATEGORY_SVGS.theater = CATEGORY_SVGS.arts;
CATEGORY_SVGS.drinks = CATEGORY_SVGS.food;

/**
 * Returns an instant, self-contained SVG Data URI visual for the given category.
 * Always renders with 0ms latency and 0 external dependencies.
 */
export function getCategoryFallbackImage(category = '') {
  if (!category) return CATEGORY_SVGS.default;
  const normalized = String(category).toLowerCase().trim().replace(/[\s-]+/g, '_');

  if (CATEGORY_SVGS[normalized]) {
    return CATEGORY_SVGS[normalized];
  }

  for (const [key, uri] of Object.entries(CATEGORY_SVGS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return uri;
    }
  }

  return CATEGORY_SVGS.default;
}

/**
 * Image onError handler to cleanly replace broken URLs with the category SVG vector banner.
 */
export function handleImageError(e, category) {
  const fallback = getCategoryFallbackImage(category);
  if (e.currentTarget.src !== fallback) {
    e.currentTarget.src = fallback;
  }
}
