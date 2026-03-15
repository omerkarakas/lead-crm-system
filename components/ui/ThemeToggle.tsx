'use client';

import { useThemeStore } from '@/lib/stores/theme';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9"
        aria-label="Toggle theme"
      >
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  const isDark = theme === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative h-9 w-9 overflow-hidden transition-colors hover:bg-accent/50"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Animated container */}
      <div className="relative h-5 w-5">
        {/* Sun icon */}
        <Sun
          className={`absolute inset-0 h-5 w-5 text-amber-500 transition-all duration-500 ease-in-out ${
            isDark
              ? 'opacity-0 rotate-90 scale-0'
              : 'opacity-100 rotate-0 scale-100'
          }`}
        />

        {/* Moon icon */}
        <Moon
          className={`absolute inset-0 h-5 w-5 text-indigo-400 transition-all duration-500 ease-in-out ${
            isDark
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 -rotate-90 scale-0'
          }`}
        />
      </div>

      {/* Subtle glow effect */}
      <span
        className={`absolute inset-0 rounded-full transition-opacity duration-500 ${
          isDark
            ? 'bg-indigo-500/10 opacity-100'
            : 'bg-amber-500/10 opacity-0'
        }`}
      />
    </Button>
  );
}
