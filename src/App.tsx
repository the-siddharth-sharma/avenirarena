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
import { useAuth } from '@/context/AuthContext';
import { AuthModal } from '@/components/AuthModal';
import { Logo } from '@/components/Logo';

function App() {
  const { path, navigate } = useRouter();
  const { isLoading } = useAuth();

  if (isLoading) {
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

  const renderPage = () => {
    switch (path) {
      case '/dashboard':
        return <DashboardPage navigate={navigate} />;
      case '/games':
        return <GamesPage navigate={navigate} />;
      case '/mansion-quest':
        return <MansionQuestPage navigate={navigate} />;
      case '/quiz':
        return <DailyQuizPage navigate={navigate} />;
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
      default:
        return <DashboardPage navigate={navigate} />;
    }
  };

  return (
    <>
      <AuthModal />
      <AppLayout currentPath={path} onNavigate={navigate}>
        {renderPage()}
      </AppLayout>
    </>
  );
}

export default App;
