import { NavLink, useLocation } from 'react-router-dom';
import LiquidGlass from 'liquid-glass-react';
import { motion } from 'framer-motion';
import type { JSX } from 'react';

interface Tab {
  to: string;
  label: string;
  end: boolean;
  Icon: () => JSX.Element;
}

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

  // Find active tab index for layout calculation
  const activeIndex = tabs.findIndex((tab) =>
    tab.end
      ? location.pathname === tab.to
      : location.pathname.startsWith(tab.to) ||
        (tab.to === '/settings' &&
          (location.pathname.startsWith('/profile') ||
            location.pathname.startsWith('/subscriptions')))
  );

  const activeTab = activeIndex !== -1 ? activeIndex : 0;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      <nav
        aria-label="Primary"
        className="relative flex items-center justify-between gap-1 px-2 py-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-2xl shadow-2xl ring-1 ring-white/10"
      >
        {/* Single Sliding Liquid Glass Bubble */}
        <motion.div
          className="absolute top-1.5 bottom-1.5 rounded-full pointer-events-none z-0"
          style={{ width: `calc((100% - 16px) / ${tabs.length})` }}
          animate={{ x: `${activeTab * 100}%` }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        >
          <LiquidGlass
            style={{
              width: '100%',
              height: '100%',
              top: -80,
              left: 40,
              borderRadius: '9999px',
              backdropFilter: 'blur(8px) saturate(180%)',
              boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.6), 0 4px 12px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
            displacementScale={64}
            saturation={130}
            aberrationIntensity={5}
            elasticity={9.35}
            blurAmount={0.1}
          >
            {null}
          </LiquidGlass>
        </motion.div>

        {/* Navigation Items */}
        {tabs.map(({ to, label, end, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="relative flex-1 z-10"
          >
            {({ isActive }) => (
              <div className="flex flex-col items-center justify-center py-2 px-6 min-w-[80px]">
                <div
                  className={`flex flex-col items-center justify-center transition-all duration-300 ${
                    isActive
                      ? 'text-blue-400 font-semibold scale-105'
                      : 'text-gray-300 hover:text-white font-normal'
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