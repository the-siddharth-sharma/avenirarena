import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { BackgroundEffects } from './BackgroundEffects';

interface AppLayoutProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export function AppLayout({ currentPath, onNavigate, children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isDashboard = currentPath === '/dashboard';

  return (
    <div className="min-h-screen bg-obsidian flex">
      <Sidebar
        currentPath={currentPath}
        onNavigate={onNavigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

      <main className="flex-1 min-w-0 lg:pl-0 pl-14 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
          <BackgroundEffects showDashboardEffects={isDashboard}>
            {children}
          </BackgroundEffects>
        </div>
      </main>
    </div>
  );
}
