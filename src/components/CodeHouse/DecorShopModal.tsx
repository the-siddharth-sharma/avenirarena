import { useState } from 'react';
import {
  Coins,
  Sparkles,
  ShoppingBag,
  Check,
  X,
  Plus,
  Trash2,
  Tv,
  Flower2,
  Gamepad2,
  Coffee,
  Server,
  Trophy,
  Grid,
  Monitor,
} from 'lucide-react';
import { DECOR_CATALOG } from './decorShop';
import type { DecorItem, FloorId, PlacedDecor, Position } from './types';
import { houseAudio } from './audio';

interface DecorShopModalProps {
  currentFloorId: FloorId;
  playerPos: Position;
  byteBits: number;
  unlockedDecorIds: string[];
  placedDecors: PlacedDecor[];
  isRoomRestored: boolean;
  onClose: () => void;
  onPurchase: (item: DecorItem) => void;
  onPlace: (decorId: string, pos: Position) => void;
  onRemovePlaced: (instanceId: string) => void;
}

export function DecorShopModal({
  currentFloorId,
  playerPos,
  byteBits,
  unlockedDecorIds,
  placedDecors,
  isRoomRestored,
  onClose,
  onPurchase,
  onPlace,
  onRemovePlaced,
}: DecorShopModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'catalog' | 'placed'>('catalog');

  const filteredCatalog = DECOR_CATALOG.filter((item) => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  const currentFloorPlaced = placedDecors.filter((d) => d.floorId === currentFloorId);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles': return <Sparkles className="w-5 h-5" />;
      case 'Gamepad2': return <Gamepad2 className="w-5 h-5" />;
      case 'Flower2': return <Flower2 className="w-5 h-5" />;
      case 'Coffee': return <Coffee className="w-5 h-5" />;
      case 'Grid': return <Grid className="w-5 h-5" />;
      case 'Server': return <Server className="w-5 h-5" />;
      case 'Trophy': return <Trophy className="w-5 h-5" />;
      case 'Monitor': return <Monitor className="w-5 h-5" />;
      default: return <Tv className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-graphite border border-line rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-line bg-elevated">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base text-ivory">
                  Estate Decor & Renovation Studio
                </h3>
                <span className="badge bg-purple-500/10 text-purple-400 text-[10px] border border-purple-500/30">
                  The Sims Layer
                </span>
              </div>
              <p className="text-xs text-muted">
                Furnish restored estate chambers with cybernetic artefacts and cozy tech.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Currency Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-400 font-mono text-xs font-semibold">
              <Coins className="w-4 h-4 text-gold-400" />
              <span>{byteBits} Byte Bits</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded text-muted hover:text-ivory transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-line bg-obsidian/40 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 rounded font-medium transition-all ${
                activeTab === 'catalog'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'text-muted hover:text-ivory'
              }`}
            >
              Decor Catalog ({DECOR_CATALOG.length})
            </button>
            <button
              onClick={() => setActiveTab('placed')}
              className={`px-3 py-1.5 rounded font-medium transition-all ${
                activeTab === 'placed'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'text-muted hover:text-ivory'
              }`}
            >
              Placed in Room ({currentFloorPlaced.length})
            </button>
          </div>

          {activeTab === 'catalog' && (
            <div className="flex items-center gap-1">
              {['all', 'furniture', 'neon', 'plant', 'appliance'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded capitalize text-[11px] ${
                    selectedCategory === cat
                      ? 'bg-elevated text-ivory border border-line'
                      : 'text-muted hover:text-ivory'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {!isRoomRestored && (
            <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                Room is currently <span className="font-semibold uppercase">Corrupted</span>. Solve the room challenge terminal to restore power before placing decor.
              </span>
            </div>
          )}

          {activeTab === 'catalog' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredCatalog.map((item) => {
                const isOwned = unlockedDecorIds.includes(item.id);
                const canAfford = byteBits >= item.cost;

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-lg border border-line bg-elevated/40 hover:bg-elevated/80 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div
                          className="p-2.5 rounded-lg border flex items-center justify-center"
                          style={{
                            backgroundColor: `${item.color}15`,
                            borderColor: `${item.color}35`,
                            color: item.color,
                          }}
                        >
                          {getIcon(item.icon)}
                        </div>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-obsidian text-muted border border-line">
                          {item.category}
                        </span>
                      </div>

                      <h4 className="font-medium text-sm text-ivory mb-1 group-hover:text-gold-400 transition-colors">
                        {item.name}
                      </h4>
                      <p className="text-xs text-muted leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs font-mono font-semibold text-gold-400">
                        <Coins className="w-3.5 h-3.5" />
                        <span>{item.cost} Bits</span>
                      </div>

                      {isOwned ? (
                        <button
                          onClick={() => {
                            if (!isRoomRestored) return;
                            houseAudio.playDecorPlace();
                            onPlace(item.id, { x: playerPos.x, y: playerPos.y });
                          }}
                          disabled={!isRoomRestored}
                          className="px-3 py-1.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" /> Place Here
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (!canAfford) return;
                            houseAudio.playDecorPlace();
                            onPurchase(item);
                          }}
                          disabled={!canAfford}
                          className="px-3 py-1.5 rounded text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all"
                        >
                          Buy Item
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div>
              {currentFloorPlaced.length === 0 ? (
                <div className="py-12 text-center text-muted">
                  <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No decor items placed in this room yet.</p>
                  <p className="text-xs text-muted/70 mt-1">
                    Select items from the catalog to place them at your character's current coordinates.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {currentFloorPlaced.map((placed) => {
                    const decorInfo = DECOR_CATALOG.find((d) => d.id === placed.decorId);
                    if (!decorInfo) return null;

                    return (
                      <div
                        key={placed.instanceId}
                        className="p-3 rounded-lg border border-line bg-elevated/40 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="p-2 rounded border"
                            style={{
                              backgroundColor: `${decorInfo.color}15`,
                              borderColor: `${decorInfo.color}35`,
                              color: decorInfo.color,
                            }}
                          >
                            {getIcon(decorInfo.icon)}
                          </div>
                          <div>
                            <h5 className="text-xs font-medium text-ivory">{decorInfo.name}</h5>
                            <span className="text-[10px] text-muted font-mono">
                              Pos: ({Math.round(placed.x)}, {Math.round(placed.y)})
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            houseAudio.playLineClick();
                            onRemovePlaced(placed.instanceId);
                          }}
                          className="p-1.5 rounded text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Store back into inventory"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
