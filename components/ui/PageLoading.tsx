'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Global page loading overlay
 * Shows when navigation is in progress
 */
export function PageLoading() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const startLoading = () => {
      // Show loading after a small delay to avoid flash for instant navigations
      timeoutId = setTimeout(() => setIsLoading(true), 150);
    };

    const stopLoading = () => {
      clearTimeout(timeoutId);
      setIsLoading(false);
    };

    // Listen for route change events
    // Note: Next.js App Router doesn't expose direct route events, so we use a different approach
    // We'll use the pathname and searchParams changes to detect navigation

    // Store current path
    const currentPath = pathname + searchParams.toString();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [pathname, searchParams]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm dark:bg-black/70">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary dark:text-white" />
        <p className="text-sm text-foreground/80 dark:text-gray-300">Yükleniyor...</p>
      </div>
    </div>
  );
}

/**
 * Hook to track navigation loading state
 * Usage: const { startNavigation, isNavigating } = useNavigationLoading();
 */
export function useNavigationLoading() {
  const [isNavigating, setIsNavigating] = useState(false);

  const startNavigation = () => {
    setIsNavigating(true);
  };

  const endNavigation = () => {
    setIsNavigating(false);
  };

  return { isNavigating, startNavigation, endNavigation };
}
