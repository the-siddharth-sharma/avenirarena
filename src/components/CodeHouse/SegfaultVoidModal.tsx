import { AlertTriangle, RotateCcw, Terminal } from 'lucide-react';
import { houseAudio } from './audio';

interface SegfaultVoidModalProps {
  pointerAddress?: string;
  onRespawn: () => void;
}

export function SegfaultVoidModal({
  pointerAddress = '0x00000000',
  onRespawn,
}: SegfaultVoidModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-fade-in font-mono">
      <div className="relative w-full max-w-lg bg-[#0a0505] border-2 border-red-500/80 rounded-xl p-6 shadow-[0_0_50px_rgba(239,68,68,0.3)] text-red-400 space-y-4">
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-red-500/40 pb-3">
          <div className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
            <span className="font-bold text-sm tracking-wider uppercase">
              SIGSEGV: SEGMENTATION FAULT
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
            EXIT CODE 139
          </span>
        </div>

        {/* Console Crash Dump */}
        <div className="bg-black/80 rounded-lg p-3 text-xs leading-relaxed text-red-300/90 border border-red-900/50 space-y-1">
          <p className="text-red-500 font-semibold">
            *** Kernel Exception: Invalid memory dereference ***
          </p>
          <p>Dumping register state:</p>
          <p className="text-[11px] text-red-400">
            RIP: 0x00007fff8921a410 &nbsp; CR2: {pointerAddress}
          </p>
          <p className="text-[11px] text-red-400">
            RAX: 0x0000000000000000 &nbsp; RBX: 0x00007ffee12b89c0
          </p>
          <p className="text-[11px] text-red-300/60 mt-2 italic">
            Process terminated: Tried to read memory at unmapped or null pointer address {pointerAddress}.
          </p>
        </div>

        <p className="text-xs text-muted leading-relaxed">
          In C++, memory safety requires verifying pointer addresses before accessing them. The estate kernel has isolated the fault to prevent host system instability.
        </p>

        {/* Respawn Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={() => {
              houseAudio.playTerminalBeep();
              onRespawn();
            }}
            className="px-5 py-2 rounded-lg bg-red-600/30 text-red-200 border border-red-500/60 hover:bg-red-600/50 text-xs font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-red-500/20"
          >
            <RotateCcw className="w-4 h-4" /> Respawn at Safe Memory Space
          </button>
        </div>
      </div>
    </div>
  );
}
