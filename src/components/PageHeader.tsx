import type { ReactNode } from 'react';
import { Bell } from 'lucide-react';
import { useState } from 'react';
import { StudentAvatar } from './StudentAvatar';
import { ThemeToggle } from './ThemeToggle';
import { DemoStudentSelector } from './DemoStudentSelector';
import { useStudentProfiles } from '@/students/StudentProfileContext';
import { demoNotifications } from '@/data/demoData';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const { selectedStudent } = useStudentProfiles();
  const unreadCount = demoNotifications.filter((n) => !n.read).length;

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-display font-medium text-ivory tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2.5">
        {actions}
        <DemoStudentSelector />
        <ThemeToggle />
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2.5 rounded-md bg-graphite border border-line text-muted hover:text-ivory hover:border-line-light transition-all"
          >
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold-400 rounded-full text-[10px] font-bold text-obsidian flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 bg-elevated border border-line rounded-md z-50 animate-fade-in overflow-hidden">
                <div className="px-4 py-3 border-b border-line">
                  <p className="text-sm font-semibold text-ivory">Notifications</p>
                </div>
                <div className="max-h-80 overflow-y-auto scrollbar-thin">
                  {demoNotifications.map((n) => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 border-b border-line hover:bg-elevated-light transition-colors ${
                        !n.read ? 'bg-gold-400/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-gold-400 mt-1.5 shrink-0" />}
                        <div className={n.read ? 'pl-3.5' : ''}>
                          <p className="text-sm text-ivory font-medium">{n.title}</p>
                          <p className="text-xs text-muted mt-0.5">{n.detail}</p>
                          <p className="text-[11px] text-muted mt-1">{n.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-2.5 pl-2.5 border-l border-line">
          <StudentAvatar
            initials={selectedStudent.avatarInitials}
            color={selectedStudent.avatarColor}
            size="md"
          />
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-ivory">{selectedStudent.displayName}</p>
            <p className="text-xs text-muted">Level {selectedStudent.level}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
