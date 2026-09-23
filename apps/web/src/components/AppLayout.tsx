import { NavLink, Outlet } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/react';

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/phone-numbers', label: 'Phone numbers' },
  { to: '/history', label: 'History' },
  { to: '/settings', label: 'Settings' }
];

export default function AppLayout() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress ?? '';

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            R
          </span>
          <span className="brand-name">RemindMe</span>
        </div>
        <nav className="nav" aria-label="Main">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="userbox">
          <span className="user-email">{email || 'Account'}</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}