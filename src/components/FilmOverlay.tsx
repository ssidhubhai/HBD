import React from 'react';
import { FilmChapter } from '../types/garden';

interface FilmOverlayProps {
  isFilmPlaying: boolean;
  filmElapsed: number;
  chapters: FilmChapter[];
  letterboxEnabled: boolean;
  onSkipFilm: () => void;
}

export const FilmOverlay: React.FC<FilmOverlayProps> = ({
  isFilmPlaying,
  filmElapsed,
  chapters,
  letterboxEnabled,
  onSkipFilm
}) => {
  if (!isFilmPlaying) return null;

  const currentChapter =
    chapters.find((ch) => filmElapsed >= ch.start && filmElapsed < ch.end) || chapters[chapters.length - 1];

  return (
    <>
      {/* 2.39:1 Anamorphic Cinema Letterbox Bars */}
      <div className={`letterbox-bar letterbox-top top-0 ${letterboxEnabled ? 'h-[7vh] border-b border-amber-400/20' : 'h-0'}`} />
      <div className={`letterbox-bar letterbox-bottom bottom-0 ${letterboxEnabled ? 'h-[7vh] border-t border-amber-400/20' : 'h-0'}`} />

      {/* Pure Cinematic Movie Subtitle (Timer and Chapter Tags are hidden per user request) */}
      <div className="fixed bottom-8 sm:bottom-12 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none w-11/12 max-w-xl text-center px-4">
        <div className="bg-slate-950/60 backdrop-blur-sm border border-amber-400/25 px-6 py-3 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.85)] transition-all duration-500">
          <p className="font-serif-editorial italic text-base sm:text-xl text-amber-100/95 leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            {currentChapter.subtitle}
          </p>
        </div>
      </div>

      {/* Minimalist discreet skip pill in corner */}
      <div className="fixed top-4 right-4 z-30 pointer-events-auto">
        <button
          type="button"
          onClick={onSkipFilm}
          className="text-[11px] font-sans text-amber-200/70 hover:text-amber-100 bg-slate-950/50 hover:bg-slate-900/90 border border-amber-400/25 px-3 py-1.5 rounded-full transition shadow-lg flex items-center gap-1.5"
          title="Skip to Free Exploration"
        >
          <span>Explore Freely</span>
          <span>⏭</span>
        </button>
      </div>
    </>
  );
};
