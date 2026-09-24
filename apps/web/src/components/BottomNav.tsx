import { NavLink } from 'react-router-dom';
import LiquidGlass from 'liquid-glass-react';
import type { JSX } from 'react';

interface Tab {
  to: string;
  label: string;
  end: boolean;
  Icon: () => JSX.Element;
}

function HomeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V21h4.5v-5.5h4V21h4.5V9.5" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.25V12l3.25 1.9" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
  return (
    <LiquidGlass 
      style={{ 
        position: 'fixed', 
        bottom: '1.5rem', 
        left: '50%', 
        zIndex: 40 
      }}
    >
      <nav
        className="flex items-stretch justify-between gap-1 w-[70vw]"
        aria-label="Primary"
      >
        {tabs.map(({ to, label, end, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `relative flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-2 transition-colors duration-200 ${
                isActive ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}
                >
                  <Icon />
                </span>
                <span
                  className={`text-[10px] leading-none font-semibold tracking-tight transition-colors duration-200 ${
                    isActive ? 'text-blue-600' : 'text-slate-500'
                  }`}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </LiquidGlass>
  );
}