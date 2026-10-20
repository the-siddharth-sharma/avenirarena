import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  ExternalLink,
  Flame,
  Gamepad2,
  Globe,
  GraduationCap,
  Linkedin,
  MapPin,
  Share2,
  Shield,
  ShieldAlert,
  Sparkles,
  Swords,
  Terminal,
  User,
  Zap,
  Search,
} from 'lucide-react';
import { Card } from '@/components/Card';
import { useAuth } from '@/context/AuthContext';
import { firestoreService, type UserProfileDoc } from '@/firebaseConfig';
import { getSingleCadetPresence, isCadetOnline, formatLastSeen, CadetPresence } from '@/data/presence';

interface PublicProfilePageProps {
  playerId?: string;
  navigate: (path: string) => void;
}

export function PublicProfilePage({ playerId = 'me', navigate }: PublicProfilePageProps) {
  const { currentUser, userProfile } = useAuth();
  // Check if target is current authenticated user
  const isTargetingSelf =
    playerId === 'me' ||
    playerId === currentUser?.uid ||
    (userProfile?.username && playerId.toLowerCase() === userProfile.username.toLowerCase()) ||
    (currentUser?.displayName && playerId === currentUser.displayName);

  const initialSelfDoc: UserProfileDoc | null =
    isTargetingSelf && userProfile && currentUser
      ? {
          uid: currentUser.uid,
          email: currentUser.email,
          firstName: userProfile.firstName || '',
          lastName: userProfile.lastName || '',
          username: userProfile.username || 'cadet',
          avatarUrl: userProfile.avatarUrl || currentUser.photoURL,
          campus: userProfile.campus,
          year: userProfile.year,
          batch: userProfile.batch,
          bio: userProfile.bio || 'Cadet Operative in AVENIR ARENA',
          xp: userProfile.academicXP ?? userProfile.xp ?? 0,
          gamesPlayed: userProfile.gamesPlayed ?? 0,
          infiniteTraceStreak: userProfile.infiniteTraceStreak ?? 0,
          socialLinks: {
            linkedin: userProfile.socialLinks?.linkedin || '',
            other: userProfile.socialLinks?.other || '',
          },
          role: userProfile.role || 'cadet',
          isSetupComplete: true,
          createdAt: userProfile.createdAt || new Date().toISOString(),
        }
      : null;

  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(() => initialSelfDoc === null);
  const [profileDoc, setProfileDoc] = useState<UserProfileDoc | null>(initialSelfDoc);
  const [notFound, setNotFound] = useState(false);
  const [targetPresence, setTargetPresence] = useState<CadetPresence | null>(null);

  useEffect(() => {
    if (!profileDoc?.uid) return;
    if (isTargetingSelf) {
      setTargetPresence({
        uid: profileDoc.uid,
        username: profileDoc.username || 'cadet',
        lastSeen: Date.now(),
        status: 'online',
      });
      return;
    }
    let isMounted = true;
    getSingleCadetPresence(profileDoc.uid).then((p) => {
      if (isMounted) setTargetPresence(p);
    });
    return () => {
      isMounted = false;
    };
  }, [profileDoc?.uid, isTargetingSelf]);

  // Fetch from Firestore
  useEffect(() => {
    let isMounted = true;
    if (!profileDoc) {
      setLoading(true);
    }
    setNotFound(false);

    async function loadProfile() {
      try {
        if (isTargetingSelf) {
          if (currentUser?.uid) {
            const doc = await firestoreService.getUserDoc(currentUser.uid);
            if (isMounted) {
              if (doc) {
                setProfileDoc(doc);
              } else if (userProfile) {
                // Fallback to active memory profile
                setProfileDoc({
                  uid: currentUser.uid,
                  email: currentUser.email,
                  firstName: userProfile.firstName || '',
                  lastName: userProfile.lastName || '',
                  username: userProfile.username || 'cadet',
                  avatarUrl: userProfile.avatarUrl || currentUser.photoURL,
                  campus: userProfile.campus,
                  year: userProfile.year,
                  batch: userProfile.batch,
                  bio: userProfile.bio || 'Cadet Operative in AVENIR ARENA',
                  xp: userProfile.xp ?? 0,
                  gamesPlayed: userProfile.gamesPlayed ?? 0,
                  infiniteTraceStreak: userProfile.infiniteTraceStreak ?? 0,
                  socialLinks: {
                    linkedin: userProfile.socialLinks?.linkedin || '',
                    other: userProfile.socialLinks?.other || '',
                  },
                  role: userProfile.role || 'cadet',
                  isSetupComplete: true,
                  createdAt: new Date().toISOString(),
                });
              }
            }
          }
        } else {
          // Query by UID or username
          const doc = await firestoreService.getUserByUidOrUsername(playerId);
          if (isMounted) {
            if (doc) {
              setProfileDoc(doc);
            } else {
              setNotFound(true);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load profile doc:', err);
        if (isMounted) setNotFound(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [playerId, isTargetingSelf, currentUser, userProfile]);

  // Is Consumer Mode vs Owner Mode
  const isOwner = Boolean(
    currentUser &&
    profileDoc &&
    (currentUser.uid === profileDoc.uid || currentUser.email.toLowerCase() === profileDoc.email.toLowerCase())
  );

  const handleCopyLink = () => {
    if (typeof window !== 'undefined' && profileDoc) {
      const url = `${window.location.origin}/#player/${profileDoc.username || profileDoc.uid}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="p-20 text-center space-y-4 max-w-md mx-auto">
        <div className="relative inline-flex items-center justify-center w-14 h-14">
          <div className="w-12 h-12 rounded-full border-2 border-gold-400 border-t-transparent animate-spin" />
          <Shield className="w-6 h-6 text-gold-400 absolute" />
        </div>
        <p className="font-mono text-xs text-gold-400 tracking-widest uppercase">
          DECRYPTING CADET DOSSIER...
        </p>
      </div>
    );
  }

  // 2. 404 Not Found State
  if (notFound || !profileDoc) {
    return (
      <div className="animate-fade-in max-w-lg mx-auto py-12 px-4 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400 shadow-[0_0_25px_rgba(239,68,68,0.2)]">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/15 border border-red-500/30 text-red-400">
            SECTOR VOID · 404
          </span>
          <h2 className="font-display font-bold text-ivory text-xl">
            Cadet Dossier Not Found
          </h2>
          <p className="text-xs text-muted font-mono max-w-sm mx-auto">
            No operative record matching callsign or identifier <strong className="text-ivory">"{playerId}"</strong> exists in the central Firestore database.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/search')}
            className="btn btn-primary text-xs px-4 py-2 flex items-center gap-2 font-mono"
          >
            <Search className="w-3.5 h-3.5" /> Open Cadet Radar
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-secondary text-xs px-4 py-2 flex items-center gap-2 font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Arena
          </button>
        </div>
      </div>
    );
  }

  const fullName =
    profileDoc.firstName && profileDoc.lastName
      ? `${profileDoc.firstName} ${profileDoc.lastName}`
      : profileDoc.username || profileDoc.email.split('@')[0];

  const initials = fullName.slice(0, 2).toUpperCase();

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb & Action bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-xs font-mono text-muted hover:text-gold-400 transition-colors inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </button>

        <div className="flex items-center gap-2">
          {/* Consumer Mode vs Owner Mode */}
          {isOwner ? (
            <button
              onClick={() => navigate('/profile')}
              className="btn btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" /> Edit Settings & Socials
            </button>
          ) : (
            <button
              onClick={() => navigate('/community')}
              className="btn btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5 shadow-[0_0_15px_rgba(208,180,119,0.25)]"
            >
              <Swords className="w-3.5 h-3.5" /> Challenge Player
            </button>
          )}

          <button
            onClick={handleCopyLink}
            className="btn btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
            title="Copy Public Profile URL"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-mono">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Profile</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Gaming Profile Card */}
      <Card className="p-0 overflow-hidden border-gold-400/30 bg-graphite shadow-2xl relative">
        {/* Cover Banner */}
        <div className="h-44 sm:h-52 w-full bg-gradient-to-r from-obsidian via-slate-900 to-graphite relative overflow-hidden border-b border-line">
          {/* Futuristic Mesh Background Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(208,180,119,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(208,180,119,0.08)_1px,transparent_1px)] bg-[size:2rem_2rem] [mask-image:radial-gradient(ellipse_60%_70%_at_50%_40%,#000_70%,transparent_100%)]" />
          <div className="absolute top-0 right-10 w-64 h-64 bg-gold-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Badge Tag in Header */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-mono border backdrop-blur-md shadow-md flex items-center gap-1.5 ${
                profileDoc.role === 'admin'
                  ? 'border-red-500/40 bg-obsidian/80 text-red-400'
                  : 'border-gold-400/40 bg-obsidian/80 text-gold-400'
              }`}
            >
              <Shield className="w-3 h-3" />
              {profileDoc.role === 'admin' ? 'MAIN-ADMIN CLEARANCE' : 'VERIFIED CADET PROFILE'}
            </span>
          </div>
        </div>

        {/* Profile Details Container */}
        <div className="px-6 sm:px-8 pb-8 relative">
          {/* Avatar Positioned Over Cover */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 mb-5 gap-4">
            <div className="relative inline-block">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-obsidian bg-graphite ring-2 ring-gold-400 shadow-[0_0_30px_rgba(208,180,119,0.35)] overflow-hidden flex items-center justify-center">
                {profileDoc.avatarUrl ? (
                  <img
                    src={profileDoc.avatarUrl}
                    alt={fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold font-mono text-gold-400">
                    {initials}
                  </span>
                )}
              </div>

              {/* Status Indicator */}
              {(() => {
                const isOnline = isTargetingSelf || isCadetOnline(targetPresence);
                const statusText = isOnline ? 'Active Now' : formatLastSeen(targetPresence?.lastSeen);
                return (
                  <div
                    className="absolute bottom-1 right-2 w-5 h-5 rounded-full bg-obsidian flex items-center justify-center border-2 border-graphite"
                    title={`Cadet Status: ${statusText}`}
                  >
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-muted/50'
                      }`}
                    />
                  </div>
                );
              })()}
            </div>

            {/* Quick Stats Pill Bar */}
            <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
              <div className="px-3.5 py-1.5 rounded-lg bg-obsidian border border-line flex items-center gap-2">
                <Zap className="w-4 h-4 text-gold-400" />
                <span className="text-muted">Academic XP:</span>
                <span className="font-bold text-ivory">{profileDoc.xp?.toLocaleString() || 0}</span>
              </div>

              <div className="px-3.5 py-1.5 rounded-lg bg-obsidian border border-line flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-muted">Streak:</span>
                <span className="font-bold text-orange-400">
                  {profileDoc.infiniteTraceStreak || 0}d
                </span>
              </div>
            </div>
          </div>

          {/* Identity & Bio */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-ivory">
                  {fullName}
                </h1>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-gold-400/10 border border-gold-400/30 text-gold-400">
                  @{profileDoc.username || 'cadet'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-muted mt-2">
                <span className="flex items-center gap-1.5 text-ivory">
                  <MapPin className="w-3.5 h-3.5 text-gold-400" />
                  {profileDoc.campus}
                </span>
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-gold-400" />
                  Year: {profileDoc.year || '1st'} (Batch {profileDoc.batch})
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  B.Tech Engineering Cadet
                </span>
              </div>
            </div>

            {/* Bio */}
            <p className="text-xs sm:text-sm text-silver font-sans leading-relaxed pt-1 max-w-2xl">
              {profileDoc.bio || 'Cadet Operative in AVENIR ARENA specializing in C++ systems and algorithms.'}
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3 pt-2">
              {profileDoc.socialLinks?.linkedin ? (
                <a
                  href={
                    profileDoc.socialLinks.linkedin.startsWith('http')
                      ? profileDoc.socialLinks.linkedin
                      : `https://${profileDoc.socialLinks.linkedin}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg border border-line bg-obsidian text-muted hover:text-gold-400 hover:border-gold-400/40 text-xs font-mono inline-flex items-center gap-1.5 transition-colors"
                >
                  <Linkedin className="w-3.5 h-3.5 text-sky-400" />
                  <span>LinkedIn Profile</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              ) : null}

              {profileDoc.socialLinks?.other ? (
                <a
                  href={
                    profileDoc.socialLinks.other.startsWith('http')
                      ? profileDoc.socialLinks.other
                      : `https://${profileDoc.socialLinks.other}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg border border-line bg-obsidian text-muted hover:text-gold-400 hover:border-gold-400/40 text-xs font-mono inline-flex items-center gap-1.5 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-gold-400" />
                  <span>External Portfolio</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </Card>

      {/* Stats & Arena Achievements Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-line bg-graphite flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-gold-400/10 border border-gold-400/20 flex items-center justify-center text-gold-400 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-muted uppercase">Academic XP</p>
            <p className="text-xl font-bold font-mono text-ivory">
              {profileDoc.xp?.toLocaleString() || 0}
            </p>
          </div>
        </Card>

        <Card className="p-4 border-line bg-graphite flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 shrink-0">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-muted uppercase">Games Completed</p>
            <p className="text-xl font-bold font-mono text-ivory">
              {profileDoc.gamesPlayed || 0} Missions
            </p>
          </div>
        </Card>

        <Card className="p-4 border-line bg-graphite flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-orange-400/10 border border-orange-400/20 flex items-center justify-center text-orange-400 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-muted uppercase">Infinite Trace Streak</p>
            <p className="text-xl font-bold font-mono text-ivory">
              {profileDoc.infiniteTraceStreak || 0} Days
            </p>
          </div>
        </Card>
      </div>

      {/* Consumer Mode Banner if viewing peer */}
      {!isOwner && (
        <div className="p-4 rounded-xl border border-gold-400/20 bg-obsidian/60 text-xs font-mono text-muted flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-gold-400" />
            <span>Viewing in Consumer Mode (Read-Only Cadet Dossier).</span>
          </div>
          <button
            onClick={() => navigate('/community')}
            className="text-gold-400 hover:underline flex items-center gap-1"
          >
            Issue Challenge in Community <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
