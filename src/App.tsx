import { useEffect } from 'react';
import { useRouter } from '@/router';
import { AppLayout } from '@/components/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { GamesPage } from '@/pages/GamesPage';
import { QuestsPage } from '@/pages/QuestsPage';
import { LeaderboardPage } from '@/pages/LeaderboardPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ActivityPage } from '@/pages/ActivityPage';
import { FacultyPage } from '@/pages/FacultyPage';
import { DailyQuizPage } from '@/pages/DailyQuizPage';
import { MansionQuestPage } from '@/pages/MansionQuestPage';
import { CommunityPage } from '@/pages/CommunityPage';
import { PublicProfilePage } from '@/pages/PublicProfilePage';
import { SearchPage } from '@/pages/SearchPage';
import { AdminPage } from '@/pages/AdminPage';
import { useAuth } from '@/context/AuthContext';
import { AuthModal } from '@/components/AuthModal';
import { LandingAuthScreen } from '@/components/LandingAuthScreen';
import { OnboardingModal } from '@/components/OnboardingModal';
import { Logo } from '@/components/Logo';

function App() {
  const { path, navigate, isPublic } = useRouter();
  const {
    currentUser,
    loading,
    isLoading,
    isOnboardingRequired,
    needsRegistration,
    isAdmin,
  } = useAuth();

  const isAuthInitializing = loading ?? isLoading;

  const isAdminSession =
    typeof window !== 'undefined' &&
    sessionStorage.getItem('avenir_admin_session') === 'true';

  // Smoothly route authenticated cadet from public ingress URL to /dashboard
  // Prevents bounce-backs and ensures returning users enter the main dashboard
  useEffect(() => {
    if (
      !isAuthInitializing &&
      currentUser &&
      isPublic &&
      !(isOnboardingRequired || needsRegistration)
    ) {
      navigate('/dashboard');
    }
  }, [isAuthInitializing, currentUser, isPublic, isOnboardingRequired, needsRegistration, navigate]);

  // 1. Cinematic Auth Initializing Screen
  // Prevents white-screen flash and stops route guards from redirecting prematurely while Firebase verifies session
  if (isAuthInitializing) {
    return (
      <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="relative flex items-center justify-center h-16 w-16 mb-4">
          <div className="absolute inset-0 rounded-full border-2 border-gold-400/20 animate-ping" />
          <div className="h-12 w-12 rounded-full border-2 border-gold-400 border-t-transparent animate-spin" />
          <Logo size={24} className="absolute text-gold-400" />
        </div>
        <span className="font-mono text-xs text-gold-400 tracking-widest uppercase">
          INITIALIZING ARENA AUTH...
        </span>
      </div>
    );
  }

  // 2. Direct Admin Access if authenticated via Admin Portal
  if (path === '/admin' && isAdminSession) {
    return (
      <AppLayout currentPath={path} onNavigate={navigate}>
        <AdminPage navigate={navigate} />
      </AppLayout>
    );
  }

  // 3. Unauthenticated -> Show Landing/Auth Screen
  // Validates session presence: prevents infinite bounce loops by presenting ingress
  if (!currentUser) {
    return (
      <>
        <AuthModal />
        <LandingAuthScreen />
      </>
    );
  }

  const renderPage = () => {
    // Dynamic matching for /player/:id
    if (path.startsWith('/player/')) {
      const playerId = path.replace(/^\/player\/?/, '') || 'me';
      return <PublicProfilePage playerId={playerId} navigate={navigate} />;
    }

    switch (path) {
      case '/':
      case '/dashboard':
        return <DashboardPage navigate={navigate} />;
      case '/search':
        return <SearchPage navigate={navigate} />;
      case '/games':
        return <GamesPage navigate={navigate} />;
      case '/mansion-quest':
        return <MansionQuestPage navigate={navigate} />;
      case '/quiz':
        return <DailyQuizPage navigate={navigate} />;
      case '/community':
        return <CommunityPage navigate={navigate} />;
      case '/quests':
        return <QuestsPage />;
      case '/leaderboard':
        return <LeaderboardPage />;
      case '/profile':
        return <ProfilePage />;
      case '/activity':
        return <ActivityPage />;
      case '/faculty':
        return <FacultyPage />;
      case '/admin':
        if (!isAdmin && !isAdminSession) {
          return <DashboardPage navigate={navigate} />;
        }
        return <AdminPage navigate={navigate} />;
      default:
        return <DashboardPage navigate={navigate} />;
    }
  };

  return (
    <>
      <AuthModal />
      {/* 4. Authenticated Cadet with Incomplete Registration -> Mandatory Registration Terminal */}
      {(isOnboardingRequired || needsRegistration) ? (
        <OnboardingModal />
      ) : (
        /* 5. Main Arena Portal */
        <AppLayout currentPath={path === '/' ? '/dashboard' : path} onNavigate={navigate}>
          {renderPage()}
        </AppLayout>
      )}
    </>
  );
}

export default App;
