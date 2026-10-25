import React, { useRef } from 'react';
import { GardenConfig } from '../../types/garden';

interface PostcardModalProps {
  isOpen: boolean;
  config: GardenConfig;
  snapshotUrl: string | null;
  onClose: () => void;
}

export const PostcardModal: React.FC<PostcardModalProps> = ({
  isOpen,
  config,
  snapshotUrl,
  onClose
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!snapshotUrl) return;
    const link = document.createElement('a');
    link.download = `Birthday_Postcard_For_${config.recipientName}_Secret_Garden.png`;
    link.href = snapshotUrl;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md">
      <div className="glass-panel max-w-xl w-full rounded-3xl p-5 sm:p-7 relative max-h-[92vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between border-b border-amber-400/20 pb-3 mb-4">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-amber-300 font-semibold">
              Souvenir Keepsake
            </span>
            <h2 className="font-cinzel text-lg sm:text-xl font-bold gold-gradient-text">
              Birthday Postcard Studio
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="glass-pill w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Postcard Preview Frame */}
        <div
          ref={cardRef}
          className="relative rounded-2xl overflow-hidden border-2 border-amber-400/50 p-2.5 bg-gradient-to-br from-slate-900 to-slate-950 shadow-2xl mb-4"
        >
          {snapshotUrl ? (
            <div className="rounded-xl overflow-hidden relative aspect-[16/10] bg-slate-950">
              <img src={snapshotUrl} alt="Sanctuary Postcard" className="w-full h-full object-cover" />
              {/* Postcard Stamp & Watermark Overlay */}
              <div className="absolute top-3 right-3 bg-slate-950/80 border border-amber-400/60 p-2 rounded-lg text-center shadow-lg">
                <div className="text-[9px] uppercase tracking-widest text-amber-300 font-bold">
                  POSTAGE
                </div>
                <div className="text-xs text-white">✦ SHUBHAM ✦</div>
                <div className="text-[8px] text-slate-400">SECRET GARDEN</div>
              </div>

              <div className="absolute bottom-3 left-3 right-3 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent p-3 rounded-lg text-left">
                <div className="font-cinzel text-base sm:text-lg text-amber-200 font-bold">
                  Happy Birthday, {config.recipientName}!
                </div>
                <div className="font-serif-editorial italic text-xs text-slate-200">
                  {config.finaleSubtitle}
                </div>
              </div>
            </div>
          ) : (
            <div className="aspect-[16/10] flex items-center justify-center text-slate-400 text-xs">
              Capturing 3D sanctuary view...
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <span className="text-xs text-slate-400 hidden sm:inline">
            Direct snapshot from the real-time WebGL canvas.
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="glass-pill px-4 py-2 rounded-full text-xs text-slate-300"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="btn-gold px-5 py-2 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1.5"
            >
              <span>💾</span><span>Download Postcard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
