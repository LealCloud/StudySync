'use client';

import { Button } from '@/components/ui/Button';
import { cn } from '@/utilities/cn';
import { useEffect, useState } from 'react';
import { SidebarContext } from './SidebarContext';

export default function SidebarShell({
  children,
  labels,
}: {
  children: React.ReactNode;
  labels: { showMenu: string; hideMenu: string };
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored =
      localStorage.getItem('studysync-sidebar-collapsed') === 'true';
    // eslint-disable-next-line -- sincroniza estado con localStorage (sistema externo) en el montaje inicial, caso válido según react.dev
    setCollapsed(stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem('studysync-sidebar-collapsed', String(collapsed));
    document.documentElement.style.setProperty(
      '--ss-sidebar-current-width',
      collapsed ? '80px' : '256px',
    );
  }, [collapsed, hydrated]);

  const toggleCollapsed = () => setCollapsed((c) => !c);

  return (
    <SidebarContext.Provider value={{ collapsed, toggleCollapsed }}>
      <aside
        className={cn(
          'border-border bg-background text-foreground relative hidden h-screen justify-between border-r shadow-[18px_0_45px_color-mix(in_oklch,var(--foreground)_12%,transparent)] transition-[width] duration-200 lg:flex lg:flex-col',
          collapsed ? 'w-20' : 'w-64',
        )}
      >
        <Button
          variant="primary"
          size="sm"
          icon={collapsed ? 'chevronRight' : 'chevronLeft'}
          aria-label={collapsed ? labels.showMenu : labels.hideMenu}
          onClick={toggleCollapsed}
          className="absolute top-6 -right-3.5 z-20 h-7 w-7 rounded-full p-0 shadow-md"
        />

        {children}
      </aside>
    </SidebarContext.Provider>
  );
}
