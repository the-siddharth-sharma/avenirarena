import { useMemo, useState } from 'react';
import {
  Activity as ActivityIcon,
  Award,
  Calendar,
  CheckCircle2,
  Edit3,
  Hash,
  Lock,
  MapPin,
  Target,
  UserRound,
  Zap,
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { StudentAvatar } from '@/components/StudentAvatar';
import { XPProgressBar } from '@/components/XPProgressBar';
import { StatCard } from '@/components/StatCard';
import { demoActivities } from '@/data/demoData';
import { badgeDefinitions } from '@/data/progressData';
import { getEditableProfile } from '@/data/studentProfiles';
import { useStudentProfiles } from '@/students/StudentProfileContext';
import type { EditableStudentProfile } from '@/types';

type ProfileTab = 'overview' | 'activity' | 'badges';

const avatarColors = [
  'from-[var(--c-accent)] to-[var(--c-accent-2)]',
  'from-[var(--c-accent-2)] to-[var(--c-accent)]',
  'from-[var(--c-warning)] to-[var(--c-accent-2)]',
];

export function ProfilePage() {
  const { selectedStudent, updateSelectedStudent, earnedBadges: earnedBadgeRecords } = useStudentProfiles();
  const [tab, setTab] = useState<ProfileTab>('overview');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditableStudentProfile>(() => getEditableProfile(selectedStudent));
  const [errors, setErrors] = useState<Partial<Record<keyof EditableStudentProfile, string>>>({});

  const tabs: { key: ProfileTab; label: string; icon: typeof Zap }[] = [
    { key: 'overview', label: 'Overview', icon: Zap },
    { key: 'activity', label: 'Activity', icon: ActivityIcon },
    { key: 'badges', label: 'Badges', icon: Award },
  ];
  const earnedBadgeIds = new Set(earnedBadgeRecords.map((earned) => earned.badgeId));
  const earnedBadges = badgeDefinitions.filter((badge) => earnedBadgeIds.has(badge.id));
  const lockedBadges = badgeDefinitions.filter((badge) => !earnedBadgeIds.has(badge.id));

  const accountRows = useMemo(() => [
    { label: 'Display Name', value: selectedStudent.displayName },
    { label: 'Student ID', value: selectedStudent.studentId },
    { label: 'Course / Branch', value: selectedStudent.courseBranch },
    { label: 'Year', value: selectedStudent.year },
    { label: 'Batch', value: selectedStudent.batch },
    { label: 'Campus', value: selectedStudent.campus },
    { label: 'Joined', value: selectedStudent.joinedDate },
  ], [selectedStudent]);

  const openEditor = () => {
    setForm(getEditableProfile(selectedStudent));
    setErrors({});
    setEditing(true);
  };

  const cancelEditor = () => {
    setForm(getEditableProfile(selectedStudent));
    setErrors({});
    setEditing(false);
  };

  const updateField = (field: keyof EditableStudentProfile, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const saveProfile = () => {
    const requiredFields: (keyof EditableStudentProfile)[] = [
      'displayName',
      'courseBranch',
      'year',
      'batch',
      'campus',
    ];
    const nextErrors: Partial<Record<keyof EditableStudentProfile, string>> = {};
    requiredFields.forEach((field) => {
      if (!form[field].trim()) nextErrors[field] = 'This field is required.';
    });
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    updateSelectedStudent(form);
    setEditing(false);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="My Profile" subtitle="Your learning identity and progress at a glance." />

      <div className="demo-label">
        <UserRound className="h-3.5 w-3.5 text-gold-400" />
        <span>Sample profile data for demonstration only. Learning history and achievements are not verified records.</span>
      </div>

      <Card className="mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gold-400/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
        <div className="relative flex flex-col lg:flex-row lg:items-center gap-6">
          <StudentAvatar initials={selectedStudent.avatarInitials} color={selectedStudent.avatarColor} size="xl" ring />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-display font-bold text-ivory">{selectedStudent.displayName}</h2>
              <span className="badge bg-gold-400/10 text-gold-400">Level {selectedStudent.level}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted">
              <span className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" />{selectedStudent.studentId}</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{selectedStudent.campus}</span>
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Joined {selectedStudent.joinedDate}</span>
            </div>
            <p className="text-sm text-muted mt-2">{selectedStudent.courseBranch} · {selectedStudent.year} · {selectedStudent.batch}</p>
          </div>
          <div className="w-full lg:w-56">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-[0.12em] text-muted">Profile completion</span>
              <span className="font-mono text-sm text-gold-400">{selectedStudent.profileCompletion}%</span>
            </div>
            <XPProgressBar current={selectedStudent.profileCompletion} max={100} showLabels={false} height="sm" />
            <button onClick={openEditor} className="btn btn-secondary w-full mt-4"><Edit3 className="w-4 h-4" />Edit Profile</button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Zap className="w-5 h-5" />} label="Total XP" value={selectedStudent.totalXP.toLocaleString()} sublabel="Sample progress" accentColor="text-gold-400" />
        <StatCard icon={<Target className="w-5 h-5" />} label="Current Level" value={selectedStudent.level} sublabel="Sample progress" accentColor="text-gold-400" />
        <StatCard icon={<ActivityIcon className="w-5 h-5" />} label="Streak" value={`${selectedStudent.streak} days`} sublabel="Sample progress" accentColor="text-gold-400" />
        <StatCard icon={<Award className="w-5 h-5" />} label="Badges" value={`${earnedBadges.length}/${badgeDefinitions.length}`} sublabel="Sample achievements" accentColor="text-gold-400" />
      </div>

      <div className="flex gap-1.5 bg-graphite border border-line rounded-md p-1 mb-6 w-fit overflow-x-auto no-scrollbar">
        {tabs.map((tabItem) => {
          const Icon = tabItem.icon;
          return <button key={tabItem.key} onClick={() => setTab(tabItem.key)} className={`tab-button flex items-center gap-2 ${tab === tabItem.key ? 'tab-active' : 'tab-inactive'}`}><Icon className="w-4 h-4" />{tabItem.label}</button>;
        })}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="font-display font-semibold text-ivory mb-4">Student Information</h3>
            <div className="space-y-1">
              {accountRows.map((row) => <div key={row.label} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-3 border-b border-line last:border-0"><span className="text-sm text-muted">{row.label}</span><span className="text-sm text-ivory font-medium sm:text-right">{row.value}</span></div>)}
            </div>
          </Card>
          <Card>
            <h3 className="font-display font-semibold text-ivory mb-4">Recent Badges</h3>
            <div className="grid grid-cols-2 gap-3">
              {earnedBadges.slice(0, 4).map((badge) => {
                const Icon = (Icons[badge.icon as keyof typeof Icons] as Icons.LucideIcon) || Icons.Award;
                return <div key={badge.id} className="border-gold-400/20 bg-gold-400/5 text-gold-400 p-3 rounded-md border"><Icon className="w-6 h-6 mb-2" /><p className="text-sm font-medium text-ivory">{badge.title}</p><p className="text-xs text-muted mt-0.5">{badge.description}</p></div>;
              })}
            </div>
          </Card>
        </div>
      )}

      {tab === 'activity' && <Card><h3 className="font-display font-semibold text-ivory mb-1">Recent Activity</h3><p className="text-xs text-muted mb-4">Sample activity placeholder — not verified student history.</p><div className="space-y-1">{demoActivities.slice(0, 8).map((activity) => <div key={activity.id} className="flex items-center gap-3 py-3 px-2 rounded-md hover:bg-elevated transition-colors border-b border-line last:border-0"><div className="w-2 h-2 rounded-full bg-gold-400 shrink-0" /><div className="flex-1 min-w-0"><p className="text-sm text-ivory">{activity.title}</p><p className="text-xs text-muted">{activity.detail}</p></div><span className="text-xs text-muted shrink-0">{activity.date}</span>{activity.xpEarned > 0 && <span className="text-xs font-mono text-gold-400 shrink-0">+{activity.xpEarned}</span>}</div>)}</div></Card>}

      {tab === 'badges' && <div className="space-y-6"><Card><h3 className="font-display font-semibold text-ivory mb-4 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-gold-400" />Earned Badges ({earnedBadges.length})</h3><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{earnedBadges.map((badge) => { const Icon = (Icons[badge.icon as keyof typeof Icons] as Icons.LucideIcon) || Icons.Award; return <div key={badge.id} className="border-gold-400/20 bg-gold-400/5 text-gold-400 p-4 rounded-md border"><div className="flex items-start gap-3"><Icon className="w-7 h-7 shrink-0" /><div><p className="text-sm font-medium text-ivory">{badge.title}</p><p className="text-xs text-muted mt-0.5">{badge.description}</p><span className="badge bg-elevated text-muted text-[10px] mt-2">Unlocked {earnedBadgeRecords.find((earned) => earned.badgeId === badge.id)?.unlockedAt.slice(0, 10)}</span></div></div></div>; })}</div></Card><Card><h3 className="font-display font-semibold text-ivory mb-4 flex items-center gap-2"><Lock className="w-5 h-5 text-muted" />Locked Badges ({lockedBadges.length})</h3><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{lockedBadges.map((badge) => { const Icon = (Icons[badge.icon as keyof typeof Icons] as Icons.LucideIcon) || Icons.Award; return <div key={badge.id} className="p-4 rounded-md border border-line bg-graphite opacity-60"><div className="flex items-start gap-3"><Icon className="w-7 h-7 shrink-0 text-muted" /><div><p className="text-sm font-medium text-ivory">{badge.title}</p><p className="text-xs text-muted mt-0.5">{badge.description}</p><span className="badge bg-elevated text-muted text-[10px] mt-2">Locked</span></div></div></div>; })}</div></Card></div>}

      {editing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="edit-profile-title"><div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-md border border-line bg-graphite p-6 shadow-2xl"><div className="flex items-start justify-between gap-4 mb-6"><div><h2 id="edit-profile-title" className="font-display text-xl font-semibold text-ivory">Edit Profile</h2><p className="text-sm text-muted mt-1">Your student ID is assigned by AVENIR ARENA and cannot be changed.</p></div><span className="badge bg-gold-400/10 text-gold-400">Demo mode</span></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{([['displayName', 'Full name'], ['courseBranch', 'Course / branch'], ['year', 'Year'], ['batch', 'Batch'], ['campus', 'Campus']] as [keyof EditableStudentProfile, string][]).map(([field, label]) => <label key={field} className="block"><span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span><input value={form[field]} onChange={(event) => updateField(field, event.target.value)} className={`mt-1.5 w-full rounded-md border bg-elevated px-3 py-2.5 text-sm text-ivory placeholder:text-muted focus:border-gold-400 focus:outline-none ${errors[field] ? 'border-crimson-400' : 'border-line'}`} />{errors[field] && <span className="mt-1 block text-xs text-crimson-400">{errors[field]}</span>}</label>)}</div><fieldset className="mt-5"><legend className="text-xs font-medium uppercase tracking-wide text-muted">Avatar style</legend><div className="mt-2 flex gap-3">{avatarColors.map((color) => <button type="button" key={color} onClick={() => updateField('avatarColor', color)} className={`rounded-md p-1 ${form.avatarColor === color ? 'ring-2 ring-gold-400' : 'ring-1 ring-line'}`} aria-label="Choose avatar style"><StudentAvatar initials={form.displayName.trim().slice(0, 2).toUpperCase() || 'AA'} color={color} size="md" /></button>)}</div></fieldset><div className="flex justify-end gap-3 mt-7"><button onClick={cancelEditor} className="btn btn-secondary">Cancel</button><button onClick={saveProfile} className="btn btn-primary">Save Profile</button></div></div></div>}
    </div>
  );
}
