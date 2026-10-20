import type { ReactNode } from 'react';
import { Bell } from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { UserProfileDropdown } from './UserProfileDropdown';
import { demoNotifications } from '@/data/demoData';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const unreadCount = demoNotifications.filter((n) => !n.read).length;

  return (
    <header className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div className="min-w-0 flex-1">
        <h1 className="text-xl sm:text-2xl font-display font-medium text-ivory tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs sm:text-sm text-muted mt-1 leading-relaxed">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-wrap sm:flex-nowrap justify-start md:justify-end">
        {actions && <div className="flex items-center">{actions}</div>}
        <ThemeToggle />
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative h-9 w-9 flex items-center justify-center rounded-lg bg-graphite border border-line text-muted hover:text-ivory hover:border-line-light transition-all shrink-0"
            title="Notifications"
            aria-label="View notifications"
          >
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold-400 rounded-full text-[10px] font-bold text-obsidian flex items-center justify-center shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 bg-elevated border border-line rounded-xl z-50 animate-fade-in overflow-hidden shadow-2xl">
                <div className="px-4 py-3 border-b border-line bg-graphite/50 flex items-center justify-between">
                  <p className="text-xs font-mono font-bold uppercase tracking-wider text-ivory">Notifications</p>
                  <span className="text-[10px] font-mono text-gold-400">{unreadCount} Unread</span>
                </div>
                <div className="max-h-80 overflow-y-auto scrollbar-thin">
                  {demoNotifications.map((n) => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 border-b border-line hover:bg-elevated-light transition-colors ${
                        !n.read ? 'bg-gold-400/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-gold-400 mt-1.5 shrink-0" />}
                        <div className={n.read ? 'pl-4' : ''}>
                          <p className="text-xs text-ivory font-medium">{n.title}</p>
                          <p className="text-[11px] text-muted mt-0.5">{n.detail}</p>
                          <p className="text-[10px] font-mono text-muted/70 mt-1">{n.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="pl-1 sm:pl-2 border-l border-line flex items-center">
          <UserProfileDropdown />
        </div>
      </div>
    </header>
  );
}
