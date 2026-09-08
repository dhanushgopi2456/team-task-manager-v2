import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { BackgroundFX } from './BackgroundFX';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="relative min-h-screen">
      <BackgroundFX />
      <Sidebar open={!collapsed} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="relative z-10">
        <div
          style={{ transition: 'padding-left .3s cubic-bezier(.22,1,.36,1)' }}
          data-collapsed={collapsed}
          className="min-h-screen lg:[&[data-collapsed='false']]:pl-[280px] lg:[&[data-collapsed='true']]:pl-[100px]"
        >
          <Topbar
            onToggleSidebar={() => setCollapsed((c) => !c)}
            onOpenMobile={() => setMobileOpen(true)}
            collapsed={collapsed}
          />
          <main className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6">
            <Outlet />
          </main>
          <footer className="pb-8 text-center text-xs text-muted">
            TEAM TASK MANAGER · Smart Teamwork. Clear Tasks. Better Results.
          </footer>
        </div>
      </div>
    </div>
  );
}
