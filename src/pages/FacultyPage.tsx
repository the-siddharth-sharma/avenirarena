import { useState, useEffect, useMemo } from 'react';
import {
  Users,
  HelpCircle,
  UserX,
  Zap,
  TrendingUp,
  FileQuestion,
  Settings,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Loader2,
  BarChart2,
} from 'lucide-react';
import { Card } from '@/components/Card';
import { StatCard } from '@/components/StatCard';
import { fetchRealtimeCadets, type RealtimeCadet } from '@/firebaseConfig';
import { subscribeToPresence, formatLastSeen, type CadetPresence } from '@/data/presence';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * ONE_DAY_MS;

export function FacultyPage() {
  const [cadets, setCadets] = useState<RealtimeCadet[]>([]);
  const [presenceMap, setPresenceMap] = useState<Record<string, CadetPresence>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load real enrolled cadets and subscribe to live presence
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const fetched = await fetchRealtimeCadets();
        if (isMounted) {
          // Exclude raw admin service accounts to reflect true academic student body
          const studentCadets = fetched.filter((c) => c.role !== 'admin');
          setCadets(studentCadets);
        }
      } catch (err) {
        console.error('Failed to load cadets for faculty panel:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    const unsubPresence = subscribeToPresence((map) => {
      if (isMounted) setPresenceMap(map);
    });

    return () => {
      isMounted = false;
      unsubPresence();
    };
  }, []);

  // Compute authentic metrics
  const now = Date.now();

  const totalStudents = cadets.length;

  const activeToday = useMemo(() => {
    return cadets.filter((c) => {
      const p = presenceMap[c.uid];
      if (!p?.lastSeen) return false;
      return now - p.lastSeen < ONE_DAY_MS;
    }).length;
  }, [cadets, presenceMap, now]);

  const totalXPAwarded = useMemo(() => {
    return cadets.reduce((acc, c) => acc + (c.academicXP ?? c.xp ?? 0), 0);
  }, [cadets]);

  const avgStudentXP = totalStudents > 0 ? Math.round(totalXPAwarded / totalStudents) : 0;
  const avgStudentLevel = Math.max(1, Math.floor(avgStudentXP / 500) + 1);

  // Inactive students: enrolled students who have not had a heartbeat in 7+ days or never active
  const inactiveCadets = useMemo(() => {
    return cadets.filter((c) => {
      const p = presenceMap[c.uid];
      if (!p?.lastSeen) return true;
      return now - p.lastSeen > SEVEN_DAYS_MS;
    });
  }, [cadets, presenceMap, now]);

  // Quiz completion rate: percentage of students with recorded academic activity
  const studentsWithActivity = useMemo(() => {
    return cadets.filter((c) => (c.academicXP ?? c.xp ?? 0) > 0).length;
  }, [cadets]);

  const participationRate = totalStudents > 0 ? Math.round((studentsWithActivity / totalStudents) * 100) : 0;

  // Real weekly engagement distribution by day of week
  const weeklyEngagement = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts: Record<string, number> = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };

    cadets.forEach((c) => {
      const p = presenceMap[c.uid];
      if (p?.lastSeen && now - p.lastSeen < SEVEN_DAYS_MS) {
        const dayIndex = new Date(p.lastSeen).getDay();
        const dayName = days[dayIndex];
        counts[dayName] = (counts[dayName] || 0) + 1;
      }
    });

    // Reorder starting from 6 days ago up to today
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * ONE_DAY_MS);
      const dayName = days[d.getDay()];
      result.push({
        day: dayName,
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        value: counts[dayName] || 0,
      });
    }
    return result;
  }, [cadets, presenceMap, now]);

  const maxWeeklyEngagement = Math.max(1, ...weeklyEngagement.map((d) => d.value));

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-line">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono border border-gold-400/30 bg-gold-400/10 text-gold-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-gold-400" />
              VERIFIED FACULTY PORTAL
            </span>
            <span className="text-xs font-mono text-muted">• Real-Time Telemetry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-ivory">
            Faculty Operations Center
          </h1>
          <p className="text-xs text-muted mt-1">
            Real student cohort analytics, real-time presence indicators, and academic curriculum metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-obsidian border border-line text-xs font-mono text-muted flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-gold-400" />
            <span>Updated: Just now</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-16 text-center space-y-4">
          <Loader2 className="w-8 h-8 text-gold-400 animate-spin mx-auto" />
          <p className="text-xs font-mono text-gold-400 uppercase tracking-widest">
            Compiling Academic Cohort Telemetry...
          </p>
        </div>
      ) : (
        <>
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Users className="w-5 h-5 text-emerald-400" />}
              label="Active Cadets Today"
              value={totalStudents > 0 ? `${activeToday}/${totalStudents}` : '0/0'}
              sublabel={totalStudents === 0 ? 'No cadets registered yet' : `${activeToday} active in past 24h`}
              accentColor="text-emerald-400"
            />
            <StatCard
              icon={<HelpCircle className="w-5 h-5 text-cyan-400" />}
              label="Curriculum Engagement"
              value={`${participationRate}%`}
              sublabel={totalStudents === 0 ? 'Awaiting initial cohort' : `${studentsWithActivity} of ${totalStudents} active`}
              accentColor="text-cyan-400"
            />
            <StatCard
              icon={<UserX className="w-5 h-5 text-red-400" />}
              label="Inactive Cadets"
              value={inactiveCadets.length}
              sublabel={totalStudents === 0 ? 'None recorded' : 'No activity in 7+ days'}
              accentColor="text-red-400"
            />
            <StatCard
              icon={<Zap className="w-5 h-5 text-gold-400" />}
              label="Total Academic XP"
              value={totalXPAwarded > 1_000_000 ? `${(totalXPAwarded / 1_000_000).toFixed(2)}M` : totalXPAwarded.toLocaleString()}
              sublabel={`Cohort average: Level ${avgStudentLevel} (${avgStudentXP} XP)`}
              accentColor="text-gold-400"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Student Engagement Chart */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-gold-400" />
                  <h3 className="font-display font-semibold text-ivory">7-Day Cohort Activity</h3>
                </div>
                <span className="text-[11px] font-mono text-muted">Real-Time Cadets Active</span>
              </div>

              {cadets.length === 0 ? (
                <div className="h-44 flex flex-col items-center justify-center text-center p-6 bg-obsidian/40 rounded-xl border border-line">
                  <BarChart2 className="w-8 h-8 text-muted/40 mb-2" />
                  <p className="text-xs font-mono text-muted">No student activity recorded this week</p>
                  <p className="text-[11px] text-muted/70 mt-1">Activity telemetry populates automatically as cadets log in.</p>
                </div>
              ) : (
                <div className="flex items-end justify-between gap-3 h-40 pt-4">
                  {weeklyEngagement.map((d) => (
                    <div key={`${d.day}-${d.date}`} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-[10px] font-mono text-gold-400/90">{d.value}</span>
                      <div className="w-full bg-obsidian rounded-t-md flex items-end h-24 p-0.5">
                        <div
                          className="w-full rounded-t-sm bg-gradient-to-t from-gold-500/40 to-gold-400 transition-all duration-500"
                          style={{
                            height: d.value > 0 ? `${Math.max(12, (d.value / maxWeeklyEngagement) * 100)}%` : '4px',
                            opacity: d.value > 0 ? 1 : 0.2,
                          }}
                        />
                      </div>
                      <div className="text-center">
                        <span className="block text-[11px] font-mono text-ivory">{d.day}</span>
                        <span className="block text-[9px] font-mono text-muted">{d.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Inactive Students Panel */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <UserX className="w-5 h-5 text-red-400" />
                  <h3 className="font-display font-semibold text-ivory">Students Needing Follow-up</h3>
                </div>
                <span className="text-[11px] font-mono text-muted">
                  {inactiveCadets.length} {inactiveCadets.length === 1 ? 'Cadet' : 'Cadets'}
                </span>
              </div>

              {inactiveCadets.length === 0 ? (
                <div className="h-44 flex flex-col items-center justify-center text-center p-6 bg-obsidian/40 rounded-xl border border-line">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
                  <p className="text-xs font-mono text-emerald-400">Excellent Engagement!</p>
                  <p className="text-[11px] text-muted mt-1">
                    {totalStudents === 0 ? 'No students enrolled in this sector.' : 'All enrolled cadets have been active in the past 7 days.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-48 overflow-y-auto scrollbar-thin pr-1">
                  {inactiveCadets.slice(0, 5).map((cadet) => {
                    const presence = presenceMap[cadet.uid];
                    const initials = (cadet.displayName || 'Cadet').slice(0, 2).toUpperCase();
                    return (
                      <div
                        key={cadet.uid}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-obsidian border border-line hover:border-red-500/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 font-mono text-xs font-bold shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-ivory truncate">{cadet.displayName}</p>
                            <p className="text-[10px] font-mono text-muted truncate">
                              {cadet.campus || 'Sector MSOT'} • {cadet.email || 'institutional cadet'}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-red-400 shrink-0 ml-2">
                          {formatLastSeen(presence?.lastSeen)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Academic Management Hub */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <FileQuestion className="w-5 h-5 text-gold-400" />
                <h3 className="font-display font-semibold text-ivory">Question Bank & Curricula</h3>
              </div>
              <p className="text-xs text-muted leading-relaxed mb-4">
                Manage interactive daily challenges and algorithm quizzes across 8 computer science subjects.
              </p>
              <div className="p-4 rounded-xl bg-obsidian border border-line space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-muted">Active Subject Areas:</span>
                  <span className="text-ivory font-bold">8 Domains (C++, DSA, ML, Systems)</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-muted">Daily Refresh Schedule:</span>
                  <span className="text-emerald-400">00:00 UTC (Automated)</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="w-5 h-5 text-gold-400" />
                <h3 className="font-display font-semibold text-ivory">Academic XP Engine</h3>
              </div>
              <p className="text-xs text-muted leading-relaxed mb-4">
                XP rewards and leveling thresholds are dynamically reconciled with verified curriculum tasks.
              </p>
              <div className="p-4 rounded-xl bg-obsidian border border-line space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-muted">Standard Challenge Reward:</span>
                  <span className="text-gold-400 font-bold">+100 to +300 XP</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-muted">Anti-Cheat Rate Limiter:</span>
                  <span className="text-emerald-400">Enabled (Atomic Firestore Sync)</span>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
