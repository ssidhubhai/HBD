import React from 'react';

interface GuideModalProps {
  isOpen: boolean;
  onTeleport: (landmark: 'gate' | 'pavilion' | 'bridge' | 'clearing') => void;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onTeleport, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-panel max-w-md w-full rounded-3xl p-6 relative shadow-2xl">
        <div className="flex items-center justify-between border-b border-amber-400/20 pb-3 mb-4">
          <h2 className="font-cinzel text-lg sm:text-xl font-bold gold-gradient-text">
            Garden Guide & Landmarks
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="glass-pill w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-300">
          <div>
            <div className="text-amber-300 font-semibold mb-1.5">Quick Teleport to Landmarks</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onTeleport('gate');
                  onClose();
                }}
                className="glass-pill hover:border-amber-400 p-2.5 rounded-xl text-left transition"
              >
                <div className="text-amber-200 font-medium">I. Entrance Gate</div>
                <div className="text-[11px] text-slate-400">Southern Wrought-Iron Arch</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  onTeleport('pavilion');
                  onClose();
                }}
                className="glass-pill hover:border-amber-400 p-2.5 rounded-xl text-left transition"
              >
                <div className="text-amber-200 font-medium">II. Memory Pavilion</div>
                <div className="text-[11px] text-slate-400">Keepsake Murals & Stories</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  onTeleport('bridge');
                  onClose();
                }}
                className="glass-pill hover:border-amber-400 p-2.5 rounded-xl text-left transition"
              >
                <div className="text-amber-200 font-medium">III. Lantern Bridge</div>
                <div className="text-[11px] text-slate-400">3-Lantern Arched Crossing</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  onTeleport('clearing');
                  onClose();
                }}
                className="glass-pill hover:border-amber-400 p-2.5 rounded-xl text-left transition"
              >
                <div className="text-amber-200 font-medium">IV. Sacred Tree & Altar</div>
                <div className="text-[11px] text-slate-400">Birthday Cake & Constellation</div>
              </button>
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3.5 space-y-1.5 text-xs">
            <div className="text-amber-300 font-semibold mb-1">Exploration Controls</div>
            <div>• <strong>WASD / Arrow Keys:</strong> Walk across the stone paths and bridge</div>
            <div>• <strong>Scroll Wheel:</strong> Smooth forward/backward glide</div>
            <div>• <strong>Drag Mouse / Touch:</strong> Smooth camera look-around</div>
            <div>• <strong>Proximity Awakening:</strong> Blossoms bloom & lanterns ignite automatically as you glide near!</div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-gold px-5 py-2 rounded-full text-xs sm:text-sm"
          >
            Resume Exploration
          </button>
        </div>
      </div>
    </div>
  );
};
