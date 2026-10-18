import { useState, useEffect, useMemo } from 'react';
import {
  Check,
  X,
  Loader2,
  Sparkles,
  Shield,
  User,
  GraduationCap,
  Building2,
  Calendar,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { useAuth, checkUsernameUnique } from '@/context/AuthContext';
import { FUTURISTIC_AVATARS, type AvatarOption } from '@/data/avatars';

const CAMPUS_OPTIONS = [
  {
    id: 'MSOT Ghaziabad',
    name: 'MSOT Ghaziabad',
    subtitle: 'Cyber & Systems Engineering Complex',
    code: 'GZB-01',
    region: 'North Sector',
  },
  {
    id: 'MSOT Jaipur',
    name: 'MSOT Jaipur',
    subtitle: 'AI & Quantum Robotics Research Hub',
    code: 'JPR-02',
    region: 'West Sector',
  },
  {
    id: 'MSOT Bangalore',
    name: 'MSOT Bangalore',
    subtitle: 'Advanced Cloud & Semiconductor Division',
    code: 'BLR-03',
    region: 'South Sector',
  },
];

const YEAR_OF_STUDY_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year'] as const;
const BATCH_COHORT_PRESETS = ['2025-2029', '2026-2030', '2027-2031', '2028-2032'] as const;

export function OnboardingModal() {
  const { currentUser, isOnboardingRequired, saveUserProfile } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);

  // Avatar choices: Include Google photo if present
  const avatarOptions: AvatarOption[] = useMemo(() => {
    const list: AvatarOption[] = [];
    if (currentUser?.photoURL) {
      list.push({
        id: 'google-profile',
        name: 'Google Identity',
        callsign: 'OAUTH-PIC',
        role: 'Google Profile',
        accentColor: '#4285F4',
        url: currentUser.photoURL,
      });
    }
    return [...list, ...FUTURISTIC_AVATARS];
  }, [currentUser]);

  // Form states
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>('');
  
  // Default first & last name from Google display name
  const [firstName, setFirstName] = useState<string>(() => {
    if (currentUser?.displayName && currentUser.displayName !== 'Google User') {
      const parts = currentUser.displayName.trim().split(' ');
      return parts[0] || '';
    }
    return '';
  });

  const [lastName, setLastName] = useState<string>(() => {
    if (currentUser?.displayName && currentUser.displayName !== 'Google User') {
      const parts = currentUser.displayName.trim().split(' ');
      return parts.slice(1).join(' ') || '';
    }
    return '';
  });

  // Social Links
  const [linkedinUrl, setLinkedinUrl] = useState<string>('');
  const [otherUrl, setOtherUrl] = useState<string>('');

  // Initialize username ONCE from Google display name, but allow complete backspacing and custom typing
  const [username, setUsername] = useState<string>(() => {
    if (currentUser?.displayName && currentUser.displayName !== 'Google User') {
      const sanitized = currentUser.displayName.replace(/[^a-zA-Z0-9_]/g, '');
      if (sanitized.length >= 3) return sanitized;
    }
    return '';
  });
  const [selectedCampus, setSelectedCampus] = useState<string>('MSOT Ghaziabad');
  const [yearOfStudy, setYearOfStudy] = useState<string>('1st Year');
  const [batchCohort, setBatchCohort] = useState<string>('2025-2029');

  // Username validation states
  const [isCheckingUsername, setIsCheckingUsername] = useState<boolean>(false);
  const [usernameStatus, setUsernameStatus] = useState<
    'idle' | 'validating' | 'available' | 'taken' | 'invalid'
  >('idle');
  const [usernameError, setUsernameError] = useState<string>('');

  // Batch Cohort validation (MSOT was established in 2025; batches prior to 2025 prohibited)
  const batchStartYear = parseInt(batchCohort.trim().split('-')[0], 10);
  const isBatchPriorTo2025 =
    batchCohort.trim().length >= 4 &&
    !isNaN(batchStartYear) &&
    batchStartYear < 2025;
  const isBatchValid = useMemo(() => {
    return /^\d{4}-\d{4}$/.test(batchCohort.trim()) && !isBatchPriorTo2025;
  }, [batchCohort, isBatchPriorTo2025]);

  const academicYearErrorMessage =
    'MSOT was established in 2025. Please select a valid academic year from 2025 onwards.';

  // Initialize avatar selection
  useEffect(() => {
    if (avatarOptions.length > 0 && !selectedAvatarUrl) {
      setSelectedAvatarUrl(avatarOptions[0].url);
    }
  }, [avatarOptions, selectedAvatarUrl]);

  // Real-time debounced username verification
  useEffect(() => {
    const trimmed = username.trim();
    if (!trimmed) {
      setUsernameStatus('idle');
      setUsernameError('');
      setIsCheckingUsername(false);
      return;
    }

    if (trimmed.length < 3) {
      setUsernameStatus('invalid');
      setUsernameError('Callsign must be at least 3 characters.');
      setIsCheckingUsername(false);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setUsernameStatus('invalid');
      setUsernameError('Only alphanumeric characters and underscores allowed.');
      setIsCheckingUsername(false);
      return;
    }

    setIsCheckingUsername(true);
    setUsernameStatus('validating');
    setUsernameError('');

    let isMounted = true;
    const timer = setTimeout(async () => {
      try {
        const isUnique = await checkUsernameUnique(trimmed);
        if (!isMounted) return;
        setIsCheckingUsername(false);
        if (isUnique) {
          setUsernameStatus('available');
          setUsernameError('');
        } else {
          setUsernameStatus('taken');
          setUsernameError(`Callsign '${trimmed}' is already claimed by an operative.`);
        }
      } catch {
        if (!isMounted) return;
        setIsCheckingUsername(false);
        setUsernameStatus('available');
      }
    }, 350);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [username]);

  if (!isOnboardingRequired || !currentUser) {
    return null;
  }

  // Step 1 validation
  const isStep1Valid =
    selectedAvatarUrl &&
    username.trim().length >= 3 &&
    usernameStatus === 'available' &&
    !isCheckingUsername;

  // Step 2 validation
  const isStep2Valid =
    Boolean(selectedCampus) &&
    Boolean(yearOfStudy) &&
    isBatchValid &&
    !isBatchPriorTo2025;

  const handleNextStep = () => {
    if (isStep1Valid) {
      setStep(2);
    }
  };

  const handleSubmitProfile = () => {
    if (!isStep1Valid || !isStep2Valid || isBatchPriorTo2025) return;

    saveUserProfile({
      username: username.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      avatarUrl: selectedAvatarUrl,
      campus: selectedCampus,
      year: yearOfStudy,
      batch: batchCohort.trim(),
      socialLinks: {
        linkedin: linkedinUrl.trim(),
        other: otherUrl.trim(),
      },
    });
  };

  return (
    <div
      data-registration-terminal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/90 backdrop-blur-xl animate-fade-in overflow-y-auto"
    >
      {/* Cinematic Sci-Fi Backdrop Aura */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gold-400/10 blur-[150px] rounded-full" />
        <div className="absolute top-20 right-20 w-[400px] h-[400px] bg-cyan-500/10 blur-[140px] rounded-full" />
      </div>

      {/* Main Glassmorphism Terminal Dialog */}
      <div className="relative w-full max-w-2xl rounded-2xl border border-gold-400/40 bg-graphite/95 shadow-[0_0_80px_rgba(0,0,0,0.85)] text-left overflow-hidden z-10 flex flex-col my-8">
        {/* Terminal Header Bar */}
        <div className="px-6 py-4 border-b border-line bg-elevated/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gold-400/15 border border-gold-400/30 text-gold-400">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-display font-bold text-ivory tracking-wide flex items-center gap-2">
                CADET REGISTRATION TERMINAL
                <span className="text-[10px] px-2 py-0.5 rounded bg-gold-400/20 text-gold-400 font-mono border border-gold-400/30">
                  PROTOCOL 01
                </span>
              </h2>
              <p className="text-[10px] text-muted font-mono">
                INITIAL CLEARANCE REQUIRED BEFORE ARENA INGRESS
              </p>
            </div>
          </div>

          {/* Stepper Indicator */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                step === 1
                  ? 'bg-gold-400 text-obsidian shadow-[0_0_10px_rgba(208,180,119,0.5)]'
                  : 'bg-elevated text-gold-400 border border-gold-400/40'
              }`}
            >
              01
            </span>
            <span className="text-muted">/</span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                step === 2
                  ? 'bg-gold-400 text-obsidian shadow-[0_0_10px_rgba(208,180,119,0.5)]'
                  : 'bg-elevated text-muted border border-line'
              }`}
            >
              02
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-line h-1">
          <div
            className="bg-gradient-to-r from-gold-500 to-gold-400 h-1 transition-all duration-300 shadow-[0_0_10px_rgba(208,180,119,0.8)]"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* STEP 1: AVATAR & IDENTITY */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-gold-400 font-semibold">
                  STEP 01 OF 02
                </span>
                <h3 className="text-xl font-display font-bold text-ivory mt-0.5">
                  Select Avatar & Declare Callsign
                </h3>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Design your arena persona. This avatar and callsign will be broadcasted on the
                  global leaderboards, Infinite Trace records, and multiplayer matches.
                </p>
              </div>

              {/* Avatar Selector Grid / Scroll */}
              <div>
                <label className="block text-xs font-mono font-medium text-ivory mb-2.5">
                  SELECT BATTLE AVATAR
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {avatarOptions.map((avatar) => {
                    const isSelected = selectedAvatarUrl === avatar.url;
                    return (
                      <button
                        key={avatar.id}
                        type="button"
                        onClick={() => setSelectedAvatarUrl(avatar.url)}
                        className={`relative group flex flex-col items-center p-2 rounded-xl border transition-all duration-200 text-center ${
                          isSelected
                            ? 'border-gold-400 bg-gold-400/10 shadow-[0_0_20px_rgba(208,180,119,0.3)] ring-1 ring-gold-400'
                            : 'border-line bg-elevated/40 hover:border-line-light hover:bg-elevated'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center bg-obsidian border border-line mb-1.5 shrink-0">
                          <img
                            src={avatar.url}
                            alt={avatar.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-[10px] font-mono text-ivory font-medium truncate w-full">
                          {avatar.name}
                        </span>
                        <span className="text-[9px] font-mono text-gold-400/80">
                          {avatar.callsign}
                        </span>

                        {isSelected && (
                          <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-gold-400 text-obsidian flex items-center justify-center text-[10px] font-bold shadow-md">
                            ✓
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Operative Full Name (Formatted as First Name Last Name) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-medium text-ivory mb-1.5">
                    FIRST NAME
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Siddharth"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-obsidian text-ivory text-xs font-sans focus:border-gold-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-medium text-ivory mb-1.5">
                    LAST NAME
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-obsidian text-ivory text-xs font-sans focus:border-gold-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Callsign / Username Input */}
              <div>
                <label className="block text-xs font-mono font-medium text-ivory mb-2">
                  ARENA CALLSIGN (USERNAME)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. CyberVance or NeonSniper"
                    maxLength={20}
                    className={`w-full pl-10 pr-10 py-3 rounded-xl border bg-obsidian text-ivory text-sm font-mono placeholder:text-muted/60 transition-all focus:outline-none ${
                      usernameStatus === 'taken' || usernameStatus === 'invalid'
                        ? 'border-red-500/80 focus:border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                        : usernameStatus === 'available'
                        ? 'border-emerald-500/80 focus:border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        : 'border-line focus:border-gold-400 focus:shadow-[0_0_20px_rgba(208,180,119,0.2)]'
                    }`}
                  />

                  {/* Indicator Icon */}
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                    {isCheckingUsername ? (
                      <Loader2 className="h-4 w-4 text-gold-400 animate-spin" />
                    ) : usernameStatus === 'available' ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : usernameStatus === 'taken' || usernameStatus === 'invalid' ? (
                      <X className="h-4 w-4 text-red-400" />
                    ) : null}
                  </div>
                </div>

                {/* Validation Feedback Message */}
                <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
                  {usernameError ? (
                    <span className="text-red-400 flex items-center gap-1.5">
                      <X className="h-3 w-3" />
                      {usernameError}
                    </span>
                  ) : usernameStatus === 'available' ? (
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <Check className="h-3 w-3" />
                      Callsign available and cleared for use.
                    </span>
                  ) : (
                    <span className="text-muted">Min 3 characters, alphanumeric only.</span>
                  )}
                  <span className="text-muted">{username.length}/20</span>
                </div>
              </div>

              {/* Live Character Preview Card */}
              <div className="p-3.5 rounded-xl border border-line-light/50 bg-elevated/40 flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-obsidian border border-gold-400/40 p-0.5 shrink-0 shadow-[0_0_15px_rgba(208,180,119,0.2)]">
                  {selectedAvatarUrl ? (
                    <img
                      src={selectedAvatarUrl}
                      alt="Selected"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-graphite flex items-center justify-center text-xs text-muted">
                      ?
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-gold-400">
                    CLEARANCE PREVIEW
                  </p>
                  <p className="text-sm font-bold text-ivory font-mono truncate">
                    {username.trim() || 'Unassigned Cadet'}
                  </p>
                  <p className="text-[10px] text-muted font-mono">
                    STATUS:{' '}
                    {usernameStatus === 'available' ? (
                      <span className="text-emerald-400 font-bold">READY FOR INGRESS</span>
                    ) : (
                      <span className="text-amber-400">AWAITING CALLSIGN</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: ACADEMIC DETAILS */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-gold-400 font-semibold">
                  STEP 02 OF 02
                </span>
                <h3 className="text-xl font-display font-bold text-ivory mt-0.5">
                  Academic Campus Clearance
                </h3>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Anchor your competitive standing to your regional institute division. XP gained
                  will boost your campus leaderboard standings.
                </p>
              </div>

              {/* Custom Styled Campus Radio Cards */}
              <div>
                <label className="block text-xs font-mono font-medium text-ivory mb-2.5">
                  ASSIGNED CAMPUS DIVISION
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {CAMPUS_OPTIONS.map((campus) => {
                    const isSelected = selectedCampus === campus.id;
                    return (
                      <div
                        key={campus.id}
                        onClick={() => setSelectedCampus(campus.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-200 text-left ${
                          isSelected
                            ? 'border-gold-400 bg-gold-400/10 shadow-[0_0_20px_rgba(208,180,119,0.25)] ring-1 ring-gold-400'
                            : 'border-line bg-elevated/40 hover:border-line-light hover:bg-elevated'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-obsidian border border-line text-gold-400 font-bold">
                            {campus.code}
                          </span>
                          <div
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? 'border-gold-400 bg-gold-400 text-obsidian'
                                : 'border-line-light'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-obsidian" />}
                          </div>
                        </div>
                        <p className="text-xs font-bold text-ivory">{campus.name}</p>
                        <p className="text-[10px] text-muted mt-0.5 leading-snug">
                          {campus.subtitle}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Year Selection & Batch Input Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Current Year of Study Selection Chips */}
                <div>
                  <label className="block text-xs font-mono font-medium text-ivory mb-2">
                    CURRENT YEAR OF STUDY
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {YEAR_OF_STUDY_OPTIONS.map((yr) => {
                      const isSelected = yearOfStudy === yr;
                      return (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => setYearOfStudy(yr)}
                          className={`py-2.5 px-2 rounded-xl border text-xs font-mono font-bold transition-all text-center ${
                            isSelected
                              ? 'border-gold-400 bg-gold-400 text-obsidian shadow-[0_0_15px_rgba(208,180,119,0.4)]'
                              : 'border-line bg-elevated/50 text-muted hover:text-ivory hover:border-line-light'
                          }`}
                        >
                          {yr}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Batch Cohort Input & Selection Chips */}
                <div>
                  <label className="block text-xs font-mono font-medium text-ivory mb-2">
                    BATCH COHORT
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      value={batchCohort}
                      onChange={(e) => setBatchCohort(e.target.value)}
                      placeholder="e.g. 2025-2029"
                      maxLength={12}
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border bg-obsidian text-ivory text-xs font-mono placeholder:text-muted/60 transition-all focus:outline-none ${
                        (!isBatchValid && batchCohort.length > 0) || isBatchPriorTo2025
                          ? 'border-red-500/80 focus:border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                          : 'border-line focus:border-gold-400 focus:shadow-[0_0_20px_rgba(208,180,119,0.2)]'
                      }`}
                    />
                  </div>

                  {/* Inline Respectful Error UI if batch starts before 2025 */}
                  {isBatchPriorTo2025 ? (
                    <div className="mt-2 flex items-start gap-1.5 text-[11px] font-mono text-amber-400 bg-amber-400/10 border border-amber-400/30 p-2.5 rounded-xl animate-fade-in">
                      <X className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{academicYearErrorMessage}</span>
                    </div>
                  ) : (
                    /* Preset Cohorts starting from 2025-2029 */
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[10px] font-mono text-muted">Cohorts:</span>
                      {BATCH_COHORT_PRESETS.map((cohort) => {
                        const isSelected = batchCohort === cohort;
                        return (
                          <button
                            key={cohort}
                            type="button"
                            onClick={() => setBatchCohort(cohort)}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-all ${
                              isSelected
                                ? 'border-gold-400 bg-gold-400 text-obsidian shadow-[0_0_8px_rgba(208,180,119,0.4)]'
                                : 'border-line bg-elevated/50 text-muted hover:text-ivory hover:border-line-light'
                            }`}
                          >
                            {cohort}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {!isBatchPriorTo2025 && !isBatchValid && batchCohort.length > 0 && (
                    <div className="mt-1.5 text-[10px] font-mono text-red-400">
                      Format required: YYYY-YYYY
                    </div>
                  )}
                </div>
              </div>

              {/* Social Media Links & Portfolio */}
              <div>
                <label className="block text-xs font-mono font-medium text-ivory mb-2">
                  SOCIAL LINKS & PORTFOLIO (OPTIONAL)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="LinkedIn URL (e.g. https://linkedin.com/in/...)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-obsidian text-ivory text-xs font-mono placeholder:text-muted/50 focus:border-gold-400 focus:outline-none"
                  />
                  <input
                    type="url"
                    value={otherUrl}
                    onChange={(e) => setOtherUrl(e.target.value)}
                    placeholder="Other URL (GitHub, Website, X/Twitter)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-obsidian text-ivory text-xs font-mono placeholder:text-muted/50 focus:border-gold-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Full Summary Clearance Card */}
              <div className="p-4 rounded-xl border border-gold-400/30 bg-gold-400/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedAvatarUrl}
                    alt={username}
                    className="w-10 h-10 rounded-lg object-cover border border-gold-400/40 bg-obsidian shrink-0"
                  />
                  <div>
                    <p className="text-xs font-bold text-ivory font-mono">{username}</p>
                    <p className="text-[10px] text-muted font-mono">
                      {selectedCampus} • {yearOfStudy} ({batchCohort})
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    CLEARANCE READY
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Bar */}
        <div className="px-6 py-4 border-t border-line bg-elevated/80 flex items-center justify-between">
          {step === 2 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2.5 rounded-xl border border-line bg-graphite hover:bg-elevated text-xs font-mono font-medium text-muted hover:text-ivory transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Identity</span>
            </button>
          ) : (
            <div className="text-[11px] font-mono text-muted flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-gold-400" />
              <span>Setup takes under 30 seconds</span>
            </div>
          )}

          {step === 1 ? (
            <button
              type="button"
              disabled={!isStep1Valid}
              onClick={handleNextStep}
              className="px-6 py-2.5 rounded-xl border border-gold-400 bg-gold-400 hover:bg-gold-300 disabled:opacity-40 disabled:pointer-events-none text-obsidian text-xs font-bold font-mono flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(208,180,119,0.3)] ml-auto"
            >
              <span>Continue to Academic Setup</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={!isStep2Valid || isBatchPriorTo2025}
              onClick={handleSubmitProfile}
              className="px-6 py-2.5 rounded-xl border border-gold-400 bg-gold-400 hover:bg-gold-300 disabled:opacity-40 disabled:pointer-events-none text-obsidian text-xs font-bold font-mono flex items-center gap-2 transition-all shadow-[0_0_25px_rgba(208,180,119,0.4)] ml-auto active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Complete Character Setup & Ingress</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
