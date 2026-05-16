import Link from 'next/link';

const categories = [
  { label: 'Food & Drinks', emoji: '🍜', href: '/places?category=Food+%26+Drinks' },
  { label: 'Entertainment', emoji: '🎭', href: '/places?category=Entertainment' },
  { label: 'Culture', emoji: '🎨', href: '/places?category=Culture' },
  { label: 'Landmarks & Heritage', emoji: '🏛️', href: '/places?category=Landmarks+%26+Heritage' },
  { label: 'Outdoors', emoji: '🌿', href: '/places?category=Outdoors' },
  { label: 'Cinema & Screenings', emoji: '🎬', href: '/places?category=Cinema+%26+Screenings' },
  { label: 'Shopping', emoji: '🛍️', href: '/places?category=Shopping' },
];

export default function CategoryGrid({ categoryCounts = {} }: { categoryCounts?: any }) {
  const radius = 300;
  
  return (
    <div className="relative py-20 overflow-visible flex items-center justify-center min-h-[800px]">
      
      {/* ─── DESKTOP ORBITAL COMPASS ─── */}
      <div className="hidden lg:flex relative w-[800px] h-[800px] items-center justify-center">
        
        {/* Connection Lines (SVG Layer) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 animate-orbit opacity-20">
          {categories.map((_, i) => {
            const angle = (i / categories.length) * (2 * Math.PI);
            const x2 = 400 + Math.cos(angle) * radius;
            const y2 = 400 + Math.sin(angle) * radius;
            return (
              <line 
                key={i} 
                x1="400" y1="400" 
                x2={x2} y2={y2} 
                stroke="var(--accent-brand)" 
                strokeWidth="1" 
                strokeDasharray="5,5"
              />
            );
          })}
          <circle cx="400" cy="400" r={radius} fill="none" stroke="var(--border)" strokeWidth="1" strokeDasharray="10,10" className="opacity-30" />
        </svg>

        {/* Central Hub */}
        <div className="z-20 relative group">
          <div className="absolute inset-0 bg-brand-500/20 blur-[80px] rounded-full animate-pulse" />
          <div className="relative w-56 h-56 bg-[var(--bg-card)] border border-brand-500/40 rounded-full flex flex-col items-center justify-center shadow-2xl backdrop-blur-3xl group-hover:scale-105 transition-transform duration-700">
             <div className="absolute inset-0 rounded-full border border-brand-500/20 animate-ping opacity-20" />
             <h3 className="text-2xl font-black text-[var(--text-primary)] text-center leading-tight tracking-tighter">
               PICK YOUR<br/>
               <span className="text-brand-500 uppercase">VIBE</span>
               <span className="text-gradient animate-blink">.</span>
             </h3>
          </div>
        </div>

        {/* Orbiting Elements */}
        <div className="absolute inset-0 z-10 animate-orbit hover:[animation-play-state:paused]">
          {categories.map((cat, i) => {
            const angle = (i / categories.length) * 360;
            const floatClass = i % 3 === 0 ? 'animate-float' : i % 3 === 1 ? 'animate-float-delayed' : 'animate-float-slow';
            
            return (
              <div
                key={cat.label}
                className="absolute top-1/2 left-1/2 -mt-16 -ml-16 w-32 h-32"
                style={{
                  transform: `rotate(${angle}deg) translate(${radius}px) rotate(-${angle}deg)`
                }}
              >
                <Link href={cat.href}>
                  <div className={`animate-reverse-orbit hover:[animation-play-state:paused]`}>
                    <div className={`${floatClass} group/node relative flex flex-col items-center justify-center p-4 w-32 h-32 rounded-full bg-[var(--bg-card)] border border-brand-500/30 backdrop-blur-xl transition-all duration-500 hover:bg-brand-500/10 hover:border-brand-500/60 hover:scale-110 hover:shadow-[0_0_40px_rgba(14,165,233,0.2)] shadow-xl`}>
                      
                      {/* Node Connection Point */}
                      <div className="absolute -z-10 w-2 h-2 bg-brand-500 rounded-full blur-[2px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/node:opacity-100 transition-opacity" />

                      <span className="text-3xl mb-1 group-hover/node:scale-110 transition-transform duration-300">{cat.emoji}</span>
                      <div className="text-center">
                        <p className="text-[9px] font-black leading-tight text-[var(--text-primary)] group-hover/node:text-brand-500 uppercase tracking-wider">
                          {cat.label}
                        </p>
                        <p className="text-[8px] text-[var(--text-muted)] mt-1 font-bold">
                          {(categoryCounts[cat.label] || 0)}+ SPOTS
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── MOBILE LIST ─── */}
      <div className="lg:hidden grid grid-cols-2 gap-4 w-full px-4">
        {categories.map((cat) => (
          <Link key={cat.label} href={cat.href}>
            <div className="flex flex-col items-center justify-center gap-3 p-6 rounded-3xl bg-[var(--bg-card)] border border-brand-500/20 backdrop-blur-lg text-center active:scale-95 transition-all shadow-lg">
              <span className="text-3xl">{cat.emoji}</span>
              <div>
                <p className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider">
                  {cat.label}
                </p>
                <p className="text-[10px] text-[var(--text-muted)] mt-1 font-bold">
                  {(categoryCounts[cat.label] || 0)}+ SPOTS
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

