import React, { useState, useEffect, useRef, useLayoutEffect, type JSX } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, useMotionValue, useSpring } from 'framer-motion';

interface Tab {
  to: string;
  label: string;
  end: boolean;
  Icon: () => JSX.Element;
}

const NAV_GLASS_CONFIG = {
  physics: {
    stiffness: 380,
    damping: 28,
    mass: 0.85,
    animationDuration: 400,
    velocityThreshold: 2,
    velocityReference: 500,
  },
  glass: {
    scale: 1.08,
    transmission: 0.95,
    blur: 6,
    saturation: 160,
    contrast: 480,
    borderOpacity: 0.8,
    shadowOpacity: 1.8,
  },
  stretch: {
    factorX: 0.85,
    factorY: 0.18,
    minY: 0.75,
    maxVelocity: 2.2,
    anisotropy: 1.0,
  },
  chromatic: {
    base: 1,
    velocityAmount: 3.5,
    overlayOpacity: 0.2,
    red: 'rgba(255, 0, 90, 0.3)',
    blue: 'rgba(0, 240, 255, 0.3)',
  },
  animation: {
    liquidFadeDuration: 0.12,
    liquidEase: [0.16, 1, 0.3, 1],
  },
} as const;

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V21h4.5v-5.5h4V21h4.5V9.5" />
    </svg>  
  );
}

function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.25V12l3.25 1.9" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  );
}

const tabs: Tab[] = [
  { to: '/', label: 'Dashboard', end: true, Icon: HomeIcon },
  { to: '/history', label: 'History', end: false, Icon: ClockIcon },
  { to: '/settings', label: 'Settings', end: false, Icon: GearIcon }
];

export default function BottomNav() {
  const location = useLocation();
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const activeIndex = tabs.findIndex((tab) =>
    tab.end
      ? location.pathname === tab.to
      : location.pathname.startsWith(tab.to) ||
        (tab.to === '/settings' &&
          (location.pathname.startsWith('/profile') ||
            location.pathname.startsWith('/subscriptions')))
  );

  const activeTab = activeIndex !== -1 ? activeIndex : 0;

  const [pillBounds, setPillBounds] = useState<{ left: number; width: number } | null>(null);

  const x = useMotionValue(0);
  const widthVal = useMotionValue(0);

  const springX = useSpring(x, {
    stiffness: NAV_GLASS_CONFIG.physics.stiffness,
    damping: NAV_GLASS_CONFIG.physics.damping,
    mass: NAV_GLASS_CONFIG.physics.mass,
  });

  const springWidth = useSpring(widthVal, {
    stiffness: NAV_GLASS_CONFIG.physics.stiffness,
    damping: NAV_GLASS_CONFIG.physics.damping,
    mass: NAV_GLASS_CONFIG.physics.mass,
  });

  const [velocity, setVelocity] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const updateLayout = () => {
    const activeEl = tabRefs.current[activeTab];
    if (activeEl) {
      const left = activeEl.offsetLeft;
      const width = activeEl.offsetWidth;

      x.set(left);
      widthVal.set(width);
      setPillBounds({ left, width });
    }
  };

  useLayoutEffect(() => {
    updateLayout();

    setIsAnimating(true);
    const timer = window.setTimeout(() => {
      setIsAnimating(false);
    }, NAV_GLASS_CONFIG.physics.animationDuration);

    return () => window.clearTimeout(timer);
  }, [activeTab]);

  useEffect(() => {
    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  useEffect(() => {
    return springX.on('change', () => {
      setVelocity(springX.getVelocity());
    });
  }, [springX]);

  const isLiquidActive = isAnimating || Math.abs(velocity) > NAV_GLASS_CONFIG.physics.velocityThreshold;

  const normalizedVelocity = Math.min(
    Math.abs(velocity) / NAV_GLASS_CONFIG.physics.velocityReference,
    NAV_GLASS_CONFIG.stretch.maxVelocity
  );

  const stretchX = isLiquidActive
    ? 1 + normalizedVelocity * NAV_GLASS_CONFIG.stretch.factorX * NAV_GLASS_CONFIG.stretch.anisotropy
    : 1;

  const stretchY = isLiquidActive
    ? Math.max(
        NAV_GLASS_CONFIG.stretch.minY,
        1 - normalizedVelocity * NAV_GLASS_CONFIG.stretch.factorY * NAV_GLASS_CONFIG.stretch.anisotropy
      )
    : 1;

  return (
    <div className="fixed bottom-20 w-[90vw] max-w-md left-1/2 -translate-x-1/2 z-40">
      <nav
        aria-label="Primary"
        className="relative flex items-center justify-between gap-1 p-1.5 rounded-full border border-white/20 bg-[#1c1c1e]/80 backdrop-blur-2xl shadow-2xl overflow-visible"
      >
        {/* ==========================================
            LIQUID GLASS MOVING BACKDROP
            ========================================== */}
        {pillBounds && (
          <motion.div
            className="absolute top-1.5 bottom-1.5 pointer-events-none z-10"
            style={{
              x: springX,
              width: 100,
            }}
          >
            {/* SOLID RESTING TAB BACKGROUND */}
            <motion.div
              className="w-full h-full rounded-full bg-white/15 shadow-sm border border-white/10"
              animate={{
                opacity: isLiquidActive ? 0 : 1,
                scale: isLiquidActive ? 0.92 : 1,
              }}
              transition={{
                duration: 0.15,
                ease: 'easeOut',
              }}
            />

            {/* LIQUID GLASS ACTIVE STATE */}
            <motion.div
              className="absolute inset-0 pointer-events-none z-20 rounded-full"
              animate={{
                opacity: isLiquidActive ? NAV_GLASS_CONFIG.glass.transmission : 0,
                scale: isLiquidActive ? NAV_GLASS_CONFIG.glass.scale : 0.85,
                scaleX: stretchX,
                scaleY: stretchY,
              }}
              transition={{
                duration: NAV_GLASS_CONFIG.animation.liquidFadeDuration,
                ease: NAV_GLASS_CONFIG.animation.liquidEase,
              }}
              style={{
                backdropFilter: `
                  blur(${NAV_GLASS_CONFIG.glass.blur}px)
                  saturate(${NAV_GLASS_CONFIG.glass.saturation}%)
                  contrast(${NAV_GLASS_CONFIG.glass.contrast}%)
                `,
                WebkitBackdropFilter: `
                  blur(${NAV_GLASS_CONFIG.glass.blur}px)
                  saturate(${NAV_GLASS_CONFIG.glass.saturation}%)
                  contrast(${NAV_GLASS_CONFIG.glass.contrast}%)
                `,
                background: 'rgba(255, 255, 255, 0.22)',
                border: `1px solid rgba(255, 255, 255, ${NAV_GLASS_CONFIG.glass.borderOpacity})`,
                boxShadow: `
                  inset 0 2px 4px rgba(255,255,255,0.95),
                  inset 0 -2px 4px rgba(0,0,0,${NAV_GLASS_CONFIG.glass.shadowOpacity}),
                  0 6px 16px rgba(0,0,0,0.25)
                `,
              }}
            >
              {/* RGB dispersion overlay */}
              <motion.div
                className="absolute inset-0 overflow-hidden rounded-full pointer-events-none"
                animate={{
                  opacity: isLiquidActive ? NAV_GLASS_CONFIG.chromatic.overlayOpacity : 0,
                }}
              >
                <div
                  className="w-full h-full"
                  style={{
                    background: `
                      linear-gradient(
                        90deg,
                        ${NAV_GLASS_CONFIG.chromatic.red} 0%,
                        transparent 40%,
                        transparent 60%,
                        ${NAV_GLASS_CONFIG.chromatic.blue} 100%
                      )
                    `,
                  }}
                />
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* Navigation Items */}
        {tabs.map(({ to, label, end, Icon }, idx) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            ref={(el) => {
              tabRefs.current[idx] = el;
            }}
            className="relative flex-1 z-20"
          >
            {({ isActive }) => (
              <div className="flex flex-col items-center justify-center py-2 px-3 min-w-[70px]">
                <div
                  className={`flex flex-col items-center justify-center transition-all duration-300 ${
                    isActive
                      ? 'text-white font-semibold scale-105'
                      : 'text-white/60 hover:text-white font-normal'
                  }`}
                >
                  <Icon />
                  <span className="text-[10px] leading-tight mt-1 tracking-tight">
                    {label}
                  </span>
                </div>
              </div>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}