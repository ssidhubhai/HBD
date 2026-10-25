import React from 'react';
import { MemoryKeepsake } from '../../types/garden';
import { audioEngine } from '../../services/audioEngine';

interface PavilionModalProps {
  isOpen: boolean;
  activeIndex: number;
  memories: MemoryKeepsake[];
  onSelectMemory: (index: number) => void;
  onClose: () => void;
}

export const PavilionModal: React.FC<PavilionModalProps> = ({
  isOpen,
  activeIndex,
  memories,
  onSelectMemory,
  onClose
}) => {
  if (!isOpen) return null;

  const currentMem = memories[activeIndex] || memories[0];

  const handlePlayChime = () => {
    if (currentMem.noteFreq) {
      audioEngine.playChord([currentMem.noteFreq, currentMem.noteFreq * 1.25, currentMem.noteFreq * 1.5], 2.2);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-panel max-w-3xl w-full rounded-3xl p-5 sm:p-7 relative max-h-[92vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-400/20 pb-3 mb-4">
          <div>
            <span className="text-[11px] uppercase tracking-[0.25em] text-amber-300/80 font-semibold">
              Stage IV • Sanctuary of Keepsakes
            </span>
            <h2 className="font-cinzel text-xl sm:text-2xl font-bold gold-gradient-text">
              The Memory Pavilion
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="glass-pill hover:border-amber-400 w-9 h-9 rounded-full flex items-center justify-center text-slate-300 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {memories.map((mem, idx) => (
            <button
              key={mem.id}
              type="button"
              onClick={() => onSelectMemory(idx)}
              className={`p-2 rounded-xl text-xs font-medium transition text-center truncate ${
                idx === activeIndex
                  ? 'btn-gold shadow-lg'
                  : 'glass-pill text-slate-300 hover:text-white hover:border-amber-400/60'
              }`}
            >
              {`Keepsake ${idx + 1}: ${mem.title}`}
            </button>
          ))}
        </div>

        {/* Active Keepsake Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center overflow-y-auto custom-scrollbar pr-1">
          <div className="md:col-span-6 rounded-2xl overflow-hidden border border-amber-400/30 bg-slate-900 relative aspect-[4/3] shadow-inner">
            <img
              src={currentMem.image}
              alt={currentMem.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 glass-pill px-3 py-1 rounded-full text-[11px] text-amber-200 font-medium">
              {currentMem.tag}
            </div>
          </div>

          <div className="md:col-span-6 flex flex-col justify-between text-left space-y-3">
            <div>
              <div className="text-xs text-amber-300/80 uppercase tracking-widest mb-1">
                {currentMem.date}
              </div>
              <h3 className="font-serif-editorial text-xl sm:text-2xl text-white font-semibold mb-2">
                {currentMem.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                {currentMem.body}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="font-serif-editorial italic text-xs sm:text-sm text-amber-200">
                {currentMem.author}
              </span>
              <button
                type="button"
                onClick={handlePlayChime}
                className="glass-pill hover:border-amber-400 px-3 py-1.5 rounded-full text-xs text-amber-200 flex items-center gap-1.5 transition"
              >
                <span>♪</span><span>Play Melody Note</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-5 pt-3 border-t border-amber-400/20 flex items-center justify-between">
          <span className="text-xs text-slate-400 hidden sm:inline">
            Keepsakes float as 3D holographic frames inside the Pavilion sanctuary.
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => onSelectMemory((activeIndex - 1 + memories.length) % memories.length)}
              className="glass-pill hover:border-amber-400 px-4 py-1.5 rounded-full text-xs text-slate-200"
            >
              ← Previous
            </button>
            <button
              type="button"
              onClick={() => onSelectMemory((activeIndex + 1) % memories.length)}
              className="btn-gold px-4 py-1.5 rounded-full text-xs"
            >
              Next Keepsake →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
