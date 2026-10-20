import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { BackgroundEffects } from './BackgroundEffects';
import { GlobalCursor } from './GlobalCursor';
import { FooterGlossary } from './FooterGlossary';
import { QuoteFooter } from './QuoteFooter';

interface AppLayoutProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export function AppLayout({ currentPath, onNavigate, children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isDashboard = currentPath === '/dashboard' || currentPath === '/';

  return (
    <div className="min-h-screen bg-obsidian flex flex-col lg:flex-row">
      {/* Infinite Trace cursor animation strictly scoped to Left Navigation Column and Dashboard view */}
      <GlobalCursor currentPath={currentPath} />
      <Sidebar
        currentPath={currentPath}
        onNavigate={onNavigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} onNavigate={onNavigate} />

        <main className="flex-1 min-w-0 overflow-x-hidden flex flex-col justify-between">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-10 py-4 sm:py-6 lg:py-10 w-full flex-1">
            <BackgroundEffects showDashboardEffects={isDashboard}>
              {children}
            </BackgroundEffects>
            {isDashboard ? <FooterGlossary /> : <QuoteFooter currentPath={currentPath} />}
          </div>
        </main>
      </div>
    </div>
  );
}
