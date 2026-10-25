import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { GardenConfig } from '../../types/garden';
import { audioEngine } from '../../services/audioEngine';

interface FinaleModalProps {
  isOpen: boolean;
  config: GardenConfig;
  candlesBlown: boolean;
  onBlowCandles: (forceState?: boolean) => void;
  onReplayFilm: () => void;
  onLaunchSkyLanterns: () => void;
  onOpenPostcard: () => void;
  onClose: () => void;
}

export const FinaleModal: React.FC<FinaleModalProps> = ({
  isOpen,
  config,
  candlesBlown,
  onBlowCandles,
  onReplayFilm,
  onLaunchSkyLanterns,
  onOpenPostcard,
  onClose
}) => {
  const [micListening, setMicListening] = useState(false);

  if (!isOpen) return null;

  const handleCandleAction = () => {
    onBlowCandles(!candlesBlown);
    if (!candlesBlown) {
      // Trigger festive confetti burst!
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#38bdf8', '#f472b6', '#34d399', '#fef08a']
      });
      audioEngine.playChord([523.25, 659.25, 783.99, 1046.5], 2.8);
    }
  };

  const handleStartMic = () => {
    audioEngine.startMicCandleListener(
      () => setMicListening(true),
      () => {
        setMicListening(false);
        handleCandleAction();
      },
      () => setMicListening(false)
    );
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-panel max-w-2xl w-full rounded-3xl p-6 sm:p-8 text-center relative max-h-[94vh] overflow-y-auto custom-scrollbar shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="glass-pill absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-slate-300 hover:text-white transition"
        >
          ✕
        </button>

        <div className="inline-flex items-center gap-2 glass-pill px-3.5 py-1 rounded-full text-xs text-amber-300 mb-3">
          <span>🎂</span>
          <span>Grand Celebration Ceremony</span>
        </div>

        <h2 className="font-cinzel text-2xl sm:text-4xl font-bold gold-gradient-text mb-2">
          {config.finaleTitle}
        </h2>
        <p className="font-serif-editorial italic text-xs sm:text-sm text-amber-100/90 mb-4">
          {config.finaleSubtitle}
        </p>

        {/* Hero Artwork with Ceremony Controls */}
        <div className="rounded-2xl overflow-hidden border border-amber-400/35 mb-4 relative aspect-[16/9] bg-slate-900 shadow-xl">
          <img
            src="https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=80"
            alt="Birthday Sanctuary"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/20 to-transparent flex flex-wrap items-end justify-between gap-2 p-3 sm:p-4">
            <div className="text-left">
              <div className="text-[10px] uppercase tracking-widest text-amber-300">
                Beneath the Sacred Canopy
              </div>
              <div className="text-xs sm:text-sm text-white font-medium">
                The SHUBHAM Constellation Shines Above
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={handleStartMic}
                className="glass-pill hover:border-amber-400 text-xs text-amber-200 px-3 py-1.5 rounded-full flex items-center gap-1 transition"
                title="Blow gently into microphone to extinguish candles"
              >
                <span>🎙️</span>
                <span>{micListening ? 'Listening... Blow!' : 'Blow via Mic'}</span>
              </button>
              <button
                type="button"
                onClick={handleCandleAction}
                className="btn-gold text-xs px-3.5 py-1.5 rounded-full flex items-center gap-1.5"
              >
                <span>🕯️</span>
                <span>{candlesBlown ? 'Relight Candles' : 'Make a Wish & Blow'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Brother's Tribute Letter */}
        <div className="text-left bg-slate-900/75 border border-amber-400/25 p-4 sm:p-5 rounded-2xl mb-5 text-xs sm:text-sm text-slate-200 leading-relaxed shadow-inner">
          <p className="whitespace-pre-line">{config.finaleMessage}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-gold px-5 py-2.5 rounded-full text-xs sm:text-sm font-cinzel tracking-wider uppercase"
          >
            Explore Garden Freely
          </button>
          <button
            type="button"
            onClick={onReplayFilm}
            className="glass-pill hover:border-amber-400 text-amber-200 px-4 py-2.5 rounded-full text-xs sm:text-sm font-medium transition"
          >
            ↻ Replay 55s Film
          </button>
          <button
            type="button"
            onClick={onLaunchSkyLanterns}
            className="glass-pill hover:border-amber-400 text-amber-200 px-4 py-2.5 rounded-full text-xs sm:text-sm transition"
          >
            Release Sky Lanterns ✦
          </button>
          <button
            type="button"
            onClick={() => audioEngine.playBirthdaySymphony()}
            className="glass-pill hover:border-amber-400 text-amber-200 px-4 py-2.5 rounded-full text-xs sm:text-sm transition"
          >
            ♫ Birthday Symphony
          </button>
          <button
            type="button"
            onClick={onOpenPostcard}
            className="glass-pill hover:border-amber-400 text-slate-200 px-4 py-2.5 rounded-full text-xs sm:text-sm transition"
          >
            📸 Save Souvenir Postcard
          </button>
        </div>
      </div>
    </div>
  );
};
