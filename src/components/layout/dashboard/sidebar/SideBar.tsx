import { auth } from '@/auth';
import Logo from '@/components/ui/logo';
import { getTranslations } from 'next-intl/server';
import MobileNav from './Mobilenav';
import PlanCard from './PlanCard';
import SidebarBrand from './SidebarBrand';
import SidebarNav from './SidebarNav';
import SidebarShell from './SidebarShell';
import SidebarUserMenu from './SidebarUserMenu';

export default async function SideBar() {
  const [session, t, navT] = await Promise.all([
    auth(),
    getTranslations('dashboard.sidebar'),
    getTranslations('dashboard.navigation'),
  ]);

  if (!session) return null;

  const sidebarLabels = {
    showMenu: t('showMenu'),
    hideMenu: t('hideMenu'),
    signOut: t('signOut'),
    navigationLabel: t('navigationLabel'),
    more: t('more'),
    moreOptions: t('moreOptions'),
    theme: t('theme'),
  };

  return (
    <>
      <SidebarShell labels={sidebarLabels}>
        <div>
          <SidebarBrand
            fullLogo={<Logo variant="full" href="/dashboard" />}
            compactLogo={<Logo variant="compact" href="/dashboard" />}
          />
          <SidebarNav />
        </div>
        <PlanCard />
        <SidebarUserMenu signOutLabel={sidebarLabels.signOut} />
      </SidebarShell>
      <MobileNav
        homePath="/dashboard"
        homeLabel={navT('home')}
        labels={sidebarLabels}
      />
    </>
  );
}
