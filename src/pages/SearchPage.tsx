import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  MapPin,
  Zap,
  Shield,
  ShieldAlert,
  ArrowRight,
  Radar,
  Users,
  Compass,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { db } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { firestoreService, fetchRealtimeCadets } from '@/firebaseConfig';

export interface FirestoreCadet {
  uid: string;
  displayName: string;
  photoURL?: string;
  avatarUrl?: string;
  email?: string;
  campus?: string;
  academicXP?: number;
  xp?: number;
  username?: string;
  role?: string;
}

interface SearchPageProps {
  navigate: (path: string) => void;
}

const CAMPUS_FILTERS = [
  { id: 'all', label: 'All Sectors' },
  { id: 'MSOT Ghaziabad', label: 'MSOT Ghaziabad' },
  { id: 'MSOT Bangalore', label: 'MSOT Bangalore' },
  { id: 'MSOT Jaipur', label: 'MSOT Jaipur' },
];

export function SearchPage({ navigate }: SearchPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampus, setSelectedCampus] = useState('all');
  const [results, setResults] = useState<FirestoreCadet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasQueried, setHasQueried] = useState(false);

  /**
   * Search users directly using unified fetchRealtimeCadets
   * Performs client-side partial matching for callsigns, names, and emails
   */
  const searchUsers = async (queryTerm: string, campus: string = 'all'): Promise<FirestoreCadet[]> => {
    const users = await fetchRealtimeCadets();
    const term = queryTerm.trim().toLowerCase();

    // Client-side filtering for partial matches
    return users.filter((u) => {
      if (campus !== 'all' && u.campus?.toLowerCase() !== campus.toLowerCase()) {
        return false;
      }

      if (!term) return true;

      return (
        u.displayName.toLowerCase().includes(term) ||
        (u.email || '').toLowerCase().includes(term) ||
        (u.username || '').toLowerCase().includes(term) ||
        (u.campus || '').toLowerCase().includes(term)
      );
    });
  };

  // Debounced search query against Firestore (300ms delay)
  useEffect(() => {
    setIsLoading(true);
    const handler = setTimeout(async () => {
      try {
        const users = await searchUsers(searchTerm, selectedCampus);
        setResults(users);
      } catch (err) {
        console.error('Failed to search users from Firestore:', err);
      } finally {
        setIsLoading(false);
        setHasQueried(true);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm, selectedCampus]);

  const clearSearch = () => {
    setSearchTerm('');
    setSelectedCampus('all');
  };

  return (
    <div className="animate-fade-in space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Global Cadet Search"
        subtitle="Real-time operative radar across Mirai School of Technology sectors. Locate peers, inspect dossiers, and initiate challenges."
      />

      {/* Frosted Glass Search & Filter Command Bar */}
      <div className="p-6 rounded-2xl border border-gold-400/20 bg-graphite/60 backdrop-blur-xl shadow-2xl relative overflow-hidden space-y-5">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-gold-400/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-60 h-60 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

        {/* Centered Search Bar */}
        <div className="max-w-2xl mx-auto relative">
          <div className="relative flex items-center">
            <div className="absolute left-4 text-gold-400/80 pointer-events-none">
              <Search className="w-5 h-5" />
            </div>

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by callsign, real name, email, or campus..."
              className="w-full pl-12 pr-28 py-3.5 bg-obsidian/90 border border-gold-400/30 rounded-xl text-ivory placeholder-muted/60 text-sm font-sans focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30 shadow-inner transition-all"
            />

            {isLoading && (
              <div className="absolute right-12 flex items-center gap-1.5 text-xs text-gold-400 font-mono">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-gold-400" />
                <span className="hidden sm:inline">Searching...</span>
              </div>
            )}

            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 p-1 rounded-full text-muted hover:text-ivory hover:bg-elevated/60 transition-colors"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Campus Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <div className="flex items-center gap-1.5 text-xs font-mono text-muted mr-2">
            <Compass className="w-3.5 h-3.5 text-gold-400" />
            <span>Sector Filter:</span>
          </div>

          {CAMPUS_FILTERS.map((campus) => {
            const isActive = selectedCampus === campus.id;
            return (
              <button
                key={campus.id}
                onClick={() => setSelectedCampus(campus.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono transition-all border ${
                  isActive
                    ? 'bg-gold-400/20 text-gold-400 border-gold-400/60 shadow-[0_0_12px_rgba(208,180,119,0.25)] font-bold'
                    : 'bg-obsidian/60 text-muted border-line hover:border-gold-400/30 hover:text-ivory'
                }`}
              >
                {campus.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Header / Telemetry Bar */}
      <div className="flex items-center justify-between text-xs font-mono px-2">
        <div className="flex items-center gap-2 text-muted">
          <Users className="w-3.5 h-3.5 text-gold-400" />
          <span>
            {isLoading ? (
              <span className="text-gold-400 animate-pulse">Scanning telemetry radar...</span>
            ) : (
              <>
                <strong className="text-ivory font-bold">{results.length}</strong>{' '}
                {results.length === 1 ? 'operative' : 'operatives'} located in this sector
              </>
            )}
          </span>
        </div>

        {(searchTerm || selectedCampus !== 'all') && (
          <button
            onClick={clearSearch}
            className="text-muted hover:text-gold-400 transition-colors flex items-center gap-1 underline underline-offset-4"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Results Grid or Empty State */}
      {isLoading ? (
        <div className="p-16 text-center space-y-4">
          <div className="relative inline-flex items-center justify-center w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-gold-400/20 animate-ping" />
            <div className="w-12 h-12 rounded-full border-2 border-gold-400 border-t-transparent animate-spin" />
            <Radar className="w-6 h-6 text-gold-400 absolute" />
          </div>
          <p className="text-xs font-mono text-gold-400 uppercase tracking-widest">
            INTERCEPTING OPERATIVE FREQUENCIES...
          </p>
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((player) => (
            <Card
              key={player.uid}
                onClick={() => navigate(`/player/${player.uid}`)}
                className="p-5 border-line bg-graphite/80 hover:bg-graphite hover:border-gold-400/50 transition-all duration-300 cursor-pointer group shadow-lg hover:shadow-[0_0_25px_rgba(208,180,119,0.15)] flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Top Bar: Role & Status */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono border flex items-center gap-1 ${
                        player.role === 'admin'
                          ? 'bg-red-500/10 border-red-500/30 text-red-400 font-bold'
                          : 'bg-gold-400/10 border-gold-400/30 text-gold-400'
                      }`}
                    >
                      {player.role === 'admin' ? (
                        <>
                          <ShieldAlert className="w-3 h-3 text-red-400" />
                          ADMIN
                        </>
                      ) : (
                        <>
                          <Shield className="w-3 h-3 text-gold-400" />
                          CADET
                        </>
                      )}
                    </span>

                    <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      ONLINE
                    </span>
                  </div>

                  {/* Identity Row */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-13 h-13 rounded-full border-2 border-gold-400/40 p-0.5 bg-obsidian shrink-0 group-hover:border-gold-400 transition-colors overflow-hidden">
                      {player.photoURL ? (
                        <img
                          src={player.photoURL}
                          alt={player.displayName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gold-400/10 flex items-center justify-center text-gold-400 font-mono font-bold text-sm">
                          {(player.displayName || 'AA').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="font-display font-semibold text-ivory text-sm truncate group-hover:text-gold-400 transition-colors">
                        {player.displayName}
                      </h4>
                      {player.username && (
                        <p className="text-xs font-mono text-gold-400/90 truncate">
                          @{player.username}
                        </p>
                      )}
                      <p className="text-[11px] font-mono text-muted flex items-center gap-1 mt-0.5 truncate">
                        <MapPin className="w-3 h-3 shrink-0 text-muted" />
                        <span className="truncate">{player.campus || 'MSOT Ghaziabad'}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Stats: Academic XP & Action link */}
                <div className="mt-5 pt-3.5 border-t border-line/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-mono">
                    <Zap className="w-3.5 h-3.5 text-gold-400" />
                    <span className="text-ivory font-bold">{player.academicXP?.toLocaleString() || 0}</span>
                    <span className="text-[10px] text-muted">Academic XP</span>
                  </div>

                  <span className="text-xs font-mono text-gold-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    View Dossier <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Card>
            ))}
        </div>
      ) : (
        /* Empty State */
        <div className="p-16 rounded-2xl border border-line bg-graphite/40 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-gold-400/10 border border-gold-400/20 flex items-center justify-center mx-auto text-gold-400">
            <Radar className="w-8 h-8 animate-pulse text-gold-400/80" />
          </div>
          <div>
            <h3 className="font-display font-bold text-ivory text-base">
              No cadets found in the Arena.
            </h3>
            <p className="text-xs text-muted font-mono mt-1">
              Radar scan yielded no matching callsigns or operatives matching your criteria.
            </p>
          </div>
          <button
            onClick={clearSearch}
            className="btn btn-secondary text-xs px-4 py-2 inline-flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
            Reset Radar Filters
          </button>
        </div>
      )}
    </div>
  );
}
