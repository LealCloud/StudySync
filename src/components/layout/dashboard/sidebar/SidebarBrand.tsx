// components/sidebar/SidebarBrand.tsx ('use client')
'use client';

import { useSidebar } from './SidebarContext';

interface SidebarBrandProps {
  fullLogo: React.ReactNode;
  compactLogo: React.ReactNode;
}

export default function SidebarBrand({
  fullLogo,
  compactLogo,
}: SidebarBrandProps) {
  const { collapsed } = useSidebar();

  return (
    <div className="flex items-center overflow-hidden p-4 transition-all duration-200">
      {collapsed ? compactLogo : fullLogo}
    </div>
  );
}
