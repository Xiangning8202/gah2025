"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/test', label: 'Test' },
  { href: '/attack', label: 'Attack' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header
      style={{
        width: '100%',
        borderBottom: '1px solid #e5e7eb',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(8px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <span style={{ fontWeight: 600, letterSpacing: '0.05em' }}>GAH 2025</span>
        <nav style={{ display: 'flex', gap: '0.5rem' }}>
          {navItems.map((item) => {
            const isRoot = item.href === '/';
            const isActive = isRoot ? pathname === '/' : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: '0.35rem 0.9rem',
                  borderRadius: '999px',
                  border: '1px solid transparent',
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  color: isActive ? '#111827' : '#4b5563',
                  backgroundColor: isActive ? '#e5e7eb' : 'transparent',
                  borderColor: isActive ? '#d1d5db' : 'transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

