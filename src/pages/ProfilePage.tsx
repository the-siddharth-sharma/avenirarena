import { useMemo, useState } from 'react';
import {
  Activity as ActivityIcon,
  Award,
  Calendar,
  CheckCircle2,
  Edit3,
  ExternalLink,
  Globe,
  Hash,
  Linkedin,
  Lock,
  MapPin,
  Share2,
  Target,
  User,
  Zap,
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { StudentAvatar } from '@/components/StudentAvatar';
import { XPProgressBar } from '@/components/XPProgressBar';
import { StatCard } from '@/components/StatCard';
import { badgeDefinitions } from '@/data/progressData';
import { getEditableProfile } from '@/data/studentProfiles';
import { useStudentProfiles } from '@/students/StudentProfileContext';
import { useAuth } from '@/context/AuthContext';
import type { EditableStudentProfile } from '@/types';

type ProfileTab = 'overview' | 'activity' | 'badges';

const avatarColors = [
  'from-[var(--c-accent)] to-[var(--c-accent-2)]',
  'from-[var(--c-accent-2)] to-[var(--c-accent)]',
  'from-[var(--c-warning)] to-[var(--c-accent-2)]',
];

export function ProfilePage() {
  const {
    selectedStudent,
    updateSelectedStudent,
    earnedBadges: earnedBadgeRecords,
    xpTransactions,
  } = useStudentProfiles();
  const { userProfile, saveUserProfile, currentUser } = useAuth();

  const [tab, setTab] = useState<ProfileTab>('overview');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditableStudentProfile>(() => ({
    ...getEditableProfile(selectedStudent),
    linkedin: userProfile?.socialLinks?.linkedin || '',
    other: userProfile?.socialLinks?.other || '',
  }));
  const [errors, setErrors] = useState<Partial<Record<keyof EditableStudentProfile, string>>>({});

  const tabs: { key: ProfileTab; label: string; icon: typeof Zap }[] = [
    { key: 'overview', label: 'Overview', icon: Zap },
    { key: 'activity', label: 'Activity', icon: ActivityIcon },
    { key: 'badges', label: 'Badges', icon: Award },
  ];
  const earnedBadgeIds = new Set(earnedBadgeRecords.map((earned) => earned.badgeId));
  const earnedBadges = badgeDefinitions.filter((badge) => earnedBadgeIds.has(badge.id));
  const lockedBadges = badgeDefinitions.filter((badge) => !earnedBadgeIds.has(badge.id));

  const accountRows = useMemo(
    () => [
      { label: 'Display Name', value: selectedStudent.displayName },
      { label: 'Student ID', value: selectedStudent.studentId },
      { label: 'Course / Branch', value: selectedStudent.courseBranch },
      { label: 'Year', value: selectedStudent.year },
      { label: 'Batch', value: selectedStudent.batch },
      { label: 'Campus', value: selectedStudent.campus },
      { label: 'Joined', value: selectedStudent.joinedDate },
      {
        label: 'LinkedIn URL',
        value: userProfile?.socialLinks?.linkedin || form.linkedin || 'Not linked',
      },
      {
        label: 'Portfolio / Social',
        value: userProfile?.socialLinks?.other || form.other || 'Not linked',
      },
    ],
    [selectedStudent, userProfile, form]
  );

  const openEditor = () => {
    setForm({
      ...getEditableProfile(selectedStudent),
      linkedin: userProfile?.socialLinks?.linkedin || '',
      other: userProfile?.socialLinks?.other || '',
    });
    setErrors({});
    setEditing(true);
  };

  const cancelEditor = () => {
    setForm({
      ...getEditableProfile(selectedStudent),
      linkedin: userProfile?.socialLinks?.linkedin || '',
      other: userProfile?.socialLinks?.other || '',
    });
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
      if (!form[field]?.trim()) nextErrors[field] = 'This field is required.';
    });
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    updateSelectedStudent(form);

    // Also persist social links & updated attributes into AuthContext
    if (userProfile) {
      saveUserProfile({
        ...userProfile,
        campus: form.campus,
        year: form.year,
        batch: form.batch,
        socialLinks: {
          linkedin: form.linkedin?.trim() || '',
          other: form.other?.trim() || '',
        },
      });
    }

    setEditing(false);
  };

  const navigateToPublicProfile = () => {
    window.location.hash = '/player/me';
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Cadet Profile & Settings"
          subtitle="Manage your learning identity, public credentials, and social links."
        />
        <button
          onClick={navigateToPublicProfile}
          className="btn btn-primary text-xs px-4 py-2 flex items-center gap-2 shadow-[0_0_15px_rgba(208,180,119,0.25)] shrink-0"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>View Public Profile</span>
        </button>
      </div>

      <Card className="relative overflow-hidden border-line bg-graphite">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gold-400/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row lg:items-center gap-6">
          <StudentAvatar
            initials={selectedStudent.avatarInitials}
            color={selectedStudent.avatarColor}
            size="xl"
            ring
          />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-display font-bold text-ivory">
                {selectedStudent.displayName}
              </h2>
              <span className="badge bg-gold-400/10 text-gold-400">
                Level {selectedStudent.level}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted">
              <span className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5" />
                {selectedStudent.studentId}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {selectedStudent.campus}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Joined {selectedStudent.joinedDate}
              </span>
            </div>
            <p className="text-sm text-muted mt-2">
              {selectedStudent.courseBranch} · {selectedStudent.year} · {selectedStudent.batch}
            </p>

            {/* Social Links Row */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {(userProfile?.socialLinks?.linkedin || form.linkedin) && (
                <a
                  href={userProfile?.socialLinks?.linkedin || form.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg border border-line bg-elevated/70 text-xs font-mono text-ivory hover:text-gold-400 flex items-center gap-1.5 transition-colors"
                >
                  <Linkedin className="w-3 h-3 text-[#0A66C2]" />
                  <span>LinkedIn</span>
                  <ExternalLink className="w-2.5 h-2.5 text-muted" />
                </a>
              )}

              {(userProfile?.socialLinks?.other || form.other) && (
                <a
                  href={userProfile?.socialLinks?.other || form.other}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg border border-line bg-elevated/70 text-xs font-mono text-ivory hover:text-gold-400 flex items-center gap-1.5 transition-colors"
                >
                  <Globe className="w-3 h-3 text-cyan-400" />
                  <span>Portfolio</span>
                  <ExternalLink className="w-2.5 h-2.5 text-muted" />
                </a>
              )}
            </div>
          </div>

          <div className="w-full lg:w-56 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-[0.12em] text-muted">
                  Profile completion
                </span>
                <span className="font-mono text-sm text-gold-400">
                  {selectedStudent.profileCompletion}%
                </span>
              </div>
              <XPProgressBar
                current={selectedStudent.profileCompletion}
                max={100}
                showLabels={false}
                height="sm"
              />
            </div>
            <button onClick={openEditor} className="btn btn-secondary w-full">
              <Edit3 className="w-4 h-4" />
              Edit Profile & Socials
            </button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Zap className="w-5 h-5" />}
          label="Total XP"
          value={selectedStudent.totalXP.toLocaleString()}
          sublabel="Academic record"
          accentColor="text-gold-400"
        />
        <StatCard
          icon={<Target className="w-5 h-5" />}
          label="Current Level"
          value={selectedStudent.level}
          sublabel="Arena rank"
          accentColor="text-gold-400"
        />
        <StatCard
          icon={<ActivityIcon className="w-5 h-5" />}
          label="Streak"
          value={`${selectedStudent.streak} days`}
          sublabel="Daily momentum"
          accentColor="text-gold-400"
        />
        <StatCard
          icon={<Award className="w-5 h-5" />}
          label="Badges"
          value={`${earnedBadges.length}/${badgeDefinitions.length}`}
          sublabel="Verified accolades"
          accentColor="text-gold-400"
        />
      </div>

      <div className="flex gap-1.5 bg-graphite border border-line rounded-md p-1 w-fit overflow-x-auto no-scrollbar">
        {tabs.map((tabItem) => {
          const Icon = tabItem.icon;
          return (
            <button
              key={tabItem.key}
              onClick={() => setTab(tabItem.key)}
              className={`tab-button flex items-center gap-2 ${
                tab === tabItem.key ? 'tab-active' : 'tab-inactive'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tabItem.label}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="font-display font-semibold text-ivory mb-4">
              Student Credentials & Social Links
            </h3>
            <div className="space-y-1">
              {accountRows.map((row) => (
                <div
                  key={row.label}
                  className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-3 border-b border-line last:border-0"
                >
                  <span className="text-sm text-muted">{row.label}</span>
                  <span className="text-sm text-ivory font-medium sm:text-right truncate max-w-xs">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h3 className="font-display font-semibold text-ivory mb-4">Recent Badges</h3>
            <div className="grid grid-cols-2 gap-3">
              {earnedBadges.slice(0, 4).map((badge) => {
                const Icon =
                  (Icons[badge.icon as keyof typeof Icons] as Icons.LucideIcon) || Icons.Award;
                return (
                  <div
                    key={badge.id}
                    className="border-gold-400/20 bg-gold-400/5 text-gold-400 p-3 rounded-md border"
                  >
                    <Icon className="w-6 h-6 mb-2" />
                    <p className="text-sm font-medium text-ivory">{badge.title}</p>
                    <p className="text-xs text-muted mt-0.5">{badge.description}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {tab === 'activity' && (
        <Card>
          <h3 className="font-display font-semibold text-ivory mb-1">Recent Activity</h3>
          <p className="text-xs text-muted mb-4">Student activity timeline across campus.</p>
          <div className="space-y-1">
            {xpTransactions.length > 0 ? (
              xpTransactions.slice(0, 8).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 py-3 px-2 rounded-md hover:bg-elevated transition-colors border-b border-line last:border-0"
                >
                  <div className="w-2 h-2 rounded-full bg-gold-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ivory">{activity.reason}</p>
                    <p className="text-xs text-muted">
                      {activity.source.toUpperCase()} • {activity.academicDate}
                    </p>
                  </div>
                  <span className="text-xs text-muted shrink-0">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </span>
                  {activity.amount > 0 && (
                    <span className="text-xs font-mono text-gold-400 shrink-0">
                      +{activity.amount} XP
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs font-mono text-muted">
                No activity recorded yet. Complete quizzes or games to earn your first XP!
              </div>
            )}
          </div>
        </Card>
      )}

      {tab === 'badges' && (
        <div className="space-y-6">
          <Card>
            <h3 className="font-display font-semibold text-ivory mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-gold-400" />
              Earned Badges ({earnedBadges.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {earnedBadges.map((badge) => {
                const Icon =
                  (Icons[badge.icon as keyof typeof Icons] as Icons.LucideIcon) || Icons.Award;
                return (
                  <div
                    key={badge.id}
                    className="border-gold-400/20 bg-gold-400/5 text-gold-400 p-4 rounded-md border"
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="w-7 h-7 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-ivory">{badge.title}</p>
                        <p className="text-xs text-muted mt-0.5">{badge.description}</p>
                        <span className="badge bg-elevated text-muted text-[10px] mt-2">
                          Unlocked{' '}
                          {earnedBadgeRecords
                            .find((earned) => earned.badgeId === badge.id)
                            ?.unlockedAt.slice(0, 10)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card>
            <h3 className="font-display font-semibold text-ivory mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-muted" />
              Locked Badges ({lockedBadges.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {lockedBadges.map((badge) => {
                const Icon =
                  (Icons[badge.icon as keyof typeof Icons] as Icons.LucideIcon) || Icons.Award;
                return (
                  <div
                    key={badge.id}
                    className="p-4 rounded-md border border-line bg-graphite opacity-60"
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="w-7 h-7 shrink-0 text-muted" />
                      <div>
                        <p className="text-sm font-medium text-ivory">{badge.title}</p>
                        <p className="text-xs text-muted mt-0.5">{badge.description}</p>
                        <span className="badge bg-elevated text-muted text-[10px] mt-2">Locked</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Profile & Social Settings Editor Modal */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-profile-title"
        >
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-line bg-graphite p-6 sm:p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2
                  id="edit-profile-title"
                  className="font-display text-xl font-bold text-ivory"
                >
                  Edit Profile & Social Links
                </h2>
                <p className="text-xs text-muted mt-1">
                  Update your identity credentials and connect external profiles.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(
                [
                  ['displayName', 'Full name'],
                  ['courseBranch', 'Course / branch'],
                  ['year', 'Year'],
                  ['batch', 'Batch'],
                  ['campus', 'Campus'],
                ] as [keyof EditableStudentProfile, string][]
              ).map(([field, label]) => (
                <label key={field} className="block">
                  <span className="text-xs font-mono uppercase tracking-wide text-muted font-medium">
                    {label}
                  </span>
                  <input
                    value={form[field] || ''}
                    onChange={(event) => updateField(field, event.target.value)}
                    className={`mt-1.5 w-full rounded-xl border bg-elevated px-3 py-2.5 text-xs text-ivory placeholder:text-muted focus:border-gold-400 focus:outline-none ${
                      errors[field] ? 'border-crimson-400' : 'border-line'
                    }`}
                  />
                  {errors[field] && (
                    <span className="mt-1 block text-xs text-crimson-400">
                      {errors[field]}
                    </span>
                  )}
                </label>
              ))}
            </div>

            {/* Social Links Section */}
            <div className="mt-5 pt-4 border-t border-line space-y-3">
              <span className="text-xs font-mono uppercase tracking-wide text-gold-400 font-semibold block">
                Social Profile Links
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-mono text-muted flex items-center gap-1.5 mb-1.5">
                    <Linkedin className="w-3.5 h-3.5 text-[#0A66C2]" /> LinkedIn Profile URL
                  </span>
                  <input
                    type="url"
                    value={form.linkedin || ''}
                    onChange={(e) => updateField('linkedin', e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full rounded-xl border border-line bg-elevated px-3 py-2.5 text-xs text-ivory placeholder:text-muted/50 focus:border-gold-400 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <span className="text-xs font-mono text-muted flex items-center gap-1.5 mb-1.5">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" /> Other URL (Portfolio, GitHub)
                  </span>
                  <input
                    type="url"
                    value={form.other || ''}
                    onChange={(e) => updateField('other', e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full rounded-xl border border-line bg-elevated px-3 py-2.5 text-xs text-ivory placeholder:text-muted/50 focus:border-gold-400 focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            <fieldset className="mt-5">
              <legend className="text-xs font-mono uppercase tracking-wide text-muted font-medium">
                Avatar Frame Style
              </legend>
              <div className="mt-2 flex gap-3">
                {avatarColors.map((color) => (
                  <button
                    type="button"
                    key={color}
                    onClick={() => updateField('avatarColor', color)}
                    className={`rounded-xl p-1 transition-all ${
                      form.avatarColor === color
                        ? 'ring-2 ring-gold-400 shadow-[0_0_10px_rgba(208,180,119,0.3)]'
                        : 'ring-1 ring-line hover:ring-line-light'
                    }`}
                    aria-label="Choose avatar style"
                  >
                    <StudentAvatar
                      initials={form.displayName.trim().slice(0, 2).toUpperCase() || 'AA'}
                      color={color}
                      size="md"
                    />
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="flex justify-end gap-3 mt-7">
              <button onClick={cancelEditor} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={saveProfile} className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
