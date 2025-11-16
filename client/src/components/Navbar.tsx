"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './theme-toggle';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/test', label: 'Test Editor' },
  { href: '/attack', label: 'Attack Mode' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
            className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg"
          >
            <Sparkles className="w-5 h-5 text-white" />
          </motion.div>
          <span className="text-xl font-bold gradient-text">FlowLens</span>
        </Link>

        <nav className="flex items-center gap-2">
          {navItems.map((item, index) => {
            const isRoot = item.href === '/';
            const isActive = isRoot ? pathname === '/' : pathname.startsWith(item.href);

            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={item.href}
                  className={`
                    relative px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${isActive 
                      ? 'text-zinc-900 dark:text-zinc-50 bg-zinc-100 dark:bg-zinc-800' 
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                    }
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800 rounded-lg"
                      style={{ zIndex: -1 }}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  {item.label}
                </Link>
              </motion.div>
            );
          })}
          
          <div className="ml-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </motion.header>
  );
}
