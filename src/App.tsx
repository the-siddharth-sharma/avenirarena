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

function App() {
  const { path, navigate } = useRouter();

  const renderPage = () => {
    switch (path) {
      case '/dashboard':
        return <DashboardPage navigate={navigate} />;
      case '/games':
        return <GamesPage navigate={navigate} />;
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
    <AppLayout currentPath={path} onNavigate={navigate}>
      {renderPage()}
    </AppLayout>
  );
}

export default App;
