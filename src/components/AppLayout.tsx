import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { BackgroundEffects } from './BackgroundEffects';
import { GlobalCursor } from './GlobalCursor';
import { FooterGlossary } from './FooterGlossary';

interface AppLayoutProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export function AppLayout({ currentPath, onNavigate, children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isDashboard = currentPath === '/dashboard' || currentPath === '/';

  return (
    <div className="min-h-screen bg-obsidian flex">
      {/* Infinite Trace cursor animation strictly scoped to Left Navigation Column and Dashboard view */}
      <GlobalCursor currentPath={currentPath} />
      <Sidebar
        currentPath={currentPath}
        onNavigate={onNavigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

      <main className="flex-1 min-w-0 lg:pl-0 pl-14 overflow-x-hidden flex flex-col justify-between">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10 w-full flex-1">
          <BackgroundEffects showDashboardEffects={isDashboard}>
            {children}
          </BackgroundEffects>
          <FooterGlossary />
        </div>
      </main>
    </div>
  );
}
