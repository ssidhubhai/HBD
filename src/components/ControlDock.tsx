import React, { useState } from 'react';
import { CameraMode, LightingAtmosphere } from '../types/garden';
import { ATMOSPHERE_PALETTES } from '../utils/constants';

interface ControlDockProps {
  cameraMode: CameraMode;
  atmosphere: LightingAtmosphere;
  isMuted: boolean;
  letterboxEnabled: boolean;
  onSelectCameraMode: (mode: CameraMode) => void;
  onSelectAtmosphere: (atm: LightingAtmosphere) => void;
  onToggleMute: () => void;
  onToggleLetterbox: () => void;
  onPlayAnthem: () => void;
  onOpenPostcard: () => void;
  onOpenPersonalize: () => void;
  onOpenGuide: () => void;
  onReplayFilm: () => void;
  onTeleport: (landmark: 'gate' | 'pavilion' | 'bridge' | 'clearing') => void;
}

export const ControlDock: React.FC<ControlDockProps> = ({
  cameraMode,
  atmosphere,
  isMuted,
  letterboxEnabled,
  onSelectCameraMode,
  onSelectAtmosphere,
  onToggleMute,
  onToggleLetterbox,
  onPlayAnthem,
  onOpenPostcard,
  onOpenPersonalize,
  onOpenGuide,
  onReplayFilm,
  onTeleport
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'camera' | 'atmosphere' | 'landmarks' | 'audio'>('camera');

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-auto max-w-[95vw] w-full sm:w-auto">
      {/* Collapse/Expand Toggle Tab */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="glass-pill hover:border-amber-400/80 text-[11px] text-amber-200 px-3.5 py-1 rounded-t-xl -mb-[1px] flex items-center gap-1.5 transition shadow-lg"
      >
        <span>{isCollapsed ? '▴ Show Controls' : '▾ Hide Controls (Zen Mode)'}</span>
      </button>

      {/* Main Dock Container */}
      {!isCollapsed && (
        <div className="glass-panel px-4 py-3 rounded-2xl sm:rounded-full flex flex-col sm:flex-row items-center gap-3 sm:gap-4 shadow-2xl transition-all">
          {/* Sub-tabs */}
          <div className="flex items-center gap-1.5 glass-pill px-2 py-1 rounded-full text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('camera')}
              className={`px-2.5 py-1 rounded-full transition ${activeTab === 'camera' ? 'btn-gold text-[11px]' : 'text-slate-300 hover:text-white'}`}
            >
              Camera
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('atmosphere')}
              className={`px-2.5 py-1 rounded-full transition ${activeTab === 'atmosphere' ? 'btn-gold text-[11px]' : 'text-slate-300 hover:text-white'}`}
            >
              Atmosphere
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('landmarks')}
              className={`px-2.5 py-1 rounded-full transition ${activeTab === 'landmarks' ? 'btn-gold text-[11px]' : 'text-slate-300 hover:text-white'}`}
            >
              Landmarks
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('audio')}
              className={`px-2.5 py-1 rounded-full transition ${activeTab === 'audio' ? 'btn-gold text-[11px]' : 'text-slate-300 hover:text-white'}`}
            >
              Audio
            </button>
          </div>

          {/* Active Tab Controls */}
          {activeTab === 'camera' && (
            <div className="flex items-center gap-1.5 flex-wrap justify-center text-xs">
              <button
                type="button"
                onClick={onReplayFilm}
                className="btn-gold px-3 py-1 rounded-full flex items-center gap-1"
                title="Play 55-Second Cinematic Film"
              >
                <span>🎬</span><span>55s Film</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectCameraMode('AERIAL_DRONE')}
                className={`px-3 py-1 rounded-full transition ${cameraMode === 'AERIAL_DRONE' ? 'bg-amber-400/30 border border-amber-400 text-amber-200' : 'glass-pill text-slate-300 hover:text-white'}`}
              >
                🛸 Drone
              </button>
              <button
                type="button"
                onClick={() => onSelectCameraMode('FREE_ROAM')}
                className={`px-3 py-1 rounded-full transition ${cameraMode === 'FREE_ROAM' ? 'bg-amber-400/30 border border-amber-400 text-amber-200' : 'glass-pill text-slate-300 hover:text-white'}`}
              >
                🚶 Walk
              </button>
              <button
                type="button"
                onClick={() => onSelectCameraMode('ALTAR_ORBIT')}
                className={`px-3 py-1 rounded-full transition ${cameraMode === 'ALTAR_ORBIT' ? 'bg-amber-400/30 border border-amber-400 text-amber-200' : 'glass-pill text-slate-300 hover:text-white'}`}
              >
                🎂 Altar Orbit
              </button>
              <button
                type="button"
                onClick={onToggleLetterbox}
                className={`px-2.5 py-1 rounded-full transition hidden md:inline-flex ${letterboxEnabled ? 'border border-amber-400 text-amber-300' : 'glass-pill text-slate-400'}`}
              >
                2.39:1 {letterboxEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          )}

          {activeTab === 'atmosphere' && (
            <div className="flex items-center gap-1.5 flex-wrap justify-center text-xs">
              {(Object.keys(ATMOSPHERE_PALETTES) as LightingAtmosphere[]).map((atmKey) => (
                <button
                  key={atmKey}
                  type="button"
                  onClick={() => onSelectAtmosphere(atmKey)}
                  className={`px-3 py-1 rounded-full transition ${atmosphere === atmKey ? 'bg-amber-400/30 border border-amber-400 text-amber-200 font-medium' : 'glass-pill text-slate-300 hover:text-white'}`}
                >
                  {ATMOSPHERE_PALETTES[atmKey].name}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'landmarks' && (
            <div className="flex items-center gap-1.5 flex-wrap justify-center text-xs">
              <button
                type="button"
                onClick={() => onTeleport('gate')}
                className="glass-pill hover:border-amber-400 text-slate-200 px-2.5 py-1 rounded-full"
              >
                I. Gate
              </button>
              <button
                type="button"
                onClick={() => onTeleport('pavilion')}
                className="glass-pill hover:border-amber-400 text-slate-200 px-2.5 py-1 rounded-full"
              >
                II. Pavilion
              </button>
              <button
                type="button"
                onClick={() => onTeleport('bridge')}
                className="glass-pill hover:border-amber-400 text-slate-200 px-2.5 py-1 rounded-full"
              >
                III. Bridge
              </button>
              <button
                type="button"
                onClick={() => onTeleport('clearing')}
                className="glass-pill hover:border-amber-400 text-slate-200 px-2.5 py-1 rounded-full"
              >
                IV. Ancient Tree
              </button>
            </div>
          )}

          {activeTab === 'audio' && (
            <div className="flex items-center gap-2 flex-wrap justify-center text-xs">
              <button
                type="button"
                onClick={onToggleMute}
                className="glass-pill hover:border-amber-400 text-slate-200 px-3 py-1 rounded-full flex items-center gap-1"
              >
                <span>{isMuted ? '🔇' : '🔊'}</span>
                <span>{isMuted ? 'Unmute' : 'Muted'}</span>
              </button>
              <button
                type="button"
                onClick={onPlayAnthem}
                className="glass-pill hover:border-amber-400 text-amber-200 px-3 py-1 rounded-full flex items-center gap-1"
              >
                <span>♫</span><span>Play Birthday Song</span>
              </button>
            </div>
          )}

          {/* Action Utilities (Postcard, Personalize, Guide) */}
          <div className="flex items-center gap-1.5 border-t sm:border-t-0 sm:border-l border-amber-400/20 pt-2 sm:pt-0 sm:pl-3">
            <button
              type="button"
              onClick={onOpenPostcard}
              className="glass-pill hover:border-amber-400 text-xs text-amber-200 px-3 py-1 rounded-full flex items-center gap-1"
              title="Save a High-Resolution Souvenir Birthday Postcard"
            >
              <span>📸</span><span>Postcard</span>
            </button>
            <button
              type="button"
              onClick={onOpenPersonalize}
              className="glass-pill hover:border-amber-400 text-xs text-slate-200 px-3 py-1 rounded-full flex items-center gap-1"
              title="Personalize Name, Wishes & Messages"
            >
              <span>✎</span><span>Edit</span>
            </button>
            <button
              type="button"
              onClick={onOpenGuide}
              className="glass-pill hover:border-amber-400 text-xs text-slate-300 w-7 h-7 rounded-full flex items-center justify-center"
              title="Controls & Guide"
            >
              ?
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
