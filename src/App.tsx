import React, { useState, useRef, useEffect } from 'react';
import { GardenConfig, CameraMode, GardenStage, LightingAtmosphere } from './types/garden';
import { DEFAULT_CONFIG, FILM_CHAPTERS } from './utils/constants';
import { ThreeCanvas } from './components/ThreeCanvas';
import { FilmOverlay } from './components/FilmOverlay';
import { ControlDock } from './components/ControlDock';
import { PavilionModal } from './components/Modals/PavilionModal';
import { FinaleModal } from './components/Modals/FinaleModal';
import { CustomizeModal } from './components/Modals/CustomizeModal';
import { PostcardModal } from './components/Modals/PostcardModal';
import { GuideModal } from './components/Modals/GuideModal';
import { audioEngine } from './services/audioEngine';

export default function App() {
  // Load configuration from local storage if available
  const [config, setConfig] = useState<GardenConfig>(() => {
    try {
      const saved = localStorage.getItem('secret_garden_shubham_config_v2');
      if (saved) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_CONFIG;
  });

  const [stage, setStage] = useState<GardenStage>('INVITATION');
  const [cameraMode, setCameraMode] = useState<CameraMode>('FREE_ROAM');
  const [isFilmPlaying, setIsFilmPlaying] = useState(false);
  const [filmElapsed, setFilmElapsed] = useState(0);
  const [isStarted, setIsStarted] = useState(false);

  // Progression milestones
  const [gateOpened, setGateOpened] = useState(false);
  const [flowersAwakened, setFlowersAwakened] = useState<Set<number>>(new Set());
  const [memoriesRead, setMemoriesRead] = useState<Set<number>>(new Set());
  const [lanternsLit, setLanternsLit] = useState<Set<number>>(new Set());
  const [bridgeUnlocked, setBridgeUnlocked] = useState(false);
  const [finaleTriggered, setFinaleTriggered] = useState(false);
  const [candlesBlown, setCandlesBlown] = useState(false);

  // Interactive Modals
  const [activeMemoryIndex, setActiveMemoryIndex] = useState(0);
  const [showPavilionModal, setShowPavilionModal] = useState(false);
  const [showFinaleModal, setShowFinaleModal] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [showPostcardModal, setShowPostcardModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);

  // Toast banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  // Nearby interactable
  const [nearbyObject, setNearbyObject] = useState<{
    id: string;
    title: string;
    subtitle: string;
    onInteract: () => void;
  } | null>(null);

  const exportPostcardRef = useRef<(() => string | null) | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleStartExperience = (playFilm: boolean) => {
    audioEngine.resume();
    setIsStarted(true);
    if (playFilm) {
      start55SecondFilm();
    } else {
      setGateOpened(true);
      setStage('LIVING_GARDEN');
      showToast('Free Exploration active! Walk with WASD or glide with the mouse wheel.');
    }
  };

  const start55SecondFilm = () => {
    audioEngine.resume();
    setIsFilmPlaying(true);
    setFilmElapsed(0);
    setCameraMode('FILM_55S');
    setShowPavilionModal(false);
    setShowFinaleModal(false);
    setShowCustomizeModal(false);
    setShowPostcardModal(false);
    setShowGuideModal(false);
    audioEngine.playGateOpening();
  };

  const handleFilmComplete = () => {
    setIsFilmPlaying(false);
    setCameraMode('FREE_ROAM');
    setGateOpened(true);
    setBridgeUnlocked(true);
    setFinaleTriggered(true);
    setStage('BIRTHDAY_FINALE');
    showToast(`55-second journey complete! Happy Birthday, ${config.recipientName}!`);
  };

  const handleSaveConfig = (newConfig: GardenConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem('secret_garden_shubham_config_v2', JSON.stringify(newConfig));
    } catch {}
    showToast(`Updated sanctuary for ${newConfig.recipientName}!`);
  };

  const handleTakePostcardSnapshot = () => {
    if (exportPostcardRef.current) {
      const url = exportPostcardRef.current();
      setSnapshotUrl(url);
      setShowPostcardModal(true);
    }
  };

  const handleToggleMute = () => {
    const newMuted = !config.muted;
    setConfig({ ...config, muted: newMuted });
    audioEngine.setMuted(newMuted);
    showToast(newMuted ? 'Sound muted.' : 'Sound unmuted.');
  };

  const handleToggleLetterbox = () => {
    const newLetterbox = !config.letterboxEnabled;
    setConfig({ ...config, letterboxEnabled: newLetterbox });
    document.body.classList.toggle('letterbox-active', newLetterbox);
  };

  const [teleportTarget, setTeleportTarget] = useState<{ x: number; y: number; z: number; yaw: number } | null>(null);

  const handleTeleport = (landmark: 'gate' | 'pavilion' | 'bridge' | 'clearing') => {
    if (isFilmPlaying) setIsFilmPlaying(false);
    setCameraMode('FREE_ROAM');
    if (landmark === 'gate') {
      setStage('GARDEN_ENTRANCE');
      setTeleportTarget({ x: 0, y: 1.75, z: 32, yaw: 0 });
      showToast('Teleported to Garden Entrance Gate.');
    } else if (landmark === 'pavilion') {
      setStage('MEMORY_PAVILION');
      setTeleportTarget({ x: -10.5, y: 1.75, z: 6.5, yaw: Math.PI * 0.45 });
      showToast('Teleported to Memory Pavilion.');
    } else if (landmark === 'bridge') {
      setStage('LANTERN_BRIDGE');
      setTeleportTarget({ x: 0, y: 1.75, z: -6.5, yaw: 0 });
      showToast('Teleported to Lantern Bridge.');
    } else if (landmark === 'clearing') {
      setStage('HIDDEN_CLEARING');
      setTeleportTarget({ x: 0, y: 1.75, z: -28.5, yaw: 0 });
      showToast('Teleported to Sacred Ancient Tree & Altar.');
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#050914]">
      {/* 3D WebGL Canvas Layer */}
      <ThreeCanvas
        config={config}
        stage={stage}
        cameraMode={cameraMode}
        isFilmPlaying={isFilmPlaying}
        filmElapsed={filmElapsed}
        gateOpened={gateOpened}
        bridgeUnlocked={bridgeUnlocked}
        finaleTriggered={finaleTriggered}
        candlesBlown={candlesBlown}
        teleportTarget={teleportTarget}
        onFilmProgress={(elapsed) => setFilmElapsed(elapsed)}
        onFilmComplete={handleFilmComplete}
        onGateUnlocked={() => setGateOpened(true)}
        onFlowerAwakened={(idx) => {
          setFlowersAwakened((prev) => new Set(prev).add(idx));
          const wish = config.flowerWishes[idx % config.flowerWishes.length];
          showToast(`✦ Spirit Blossom #${idx + 1}: "${wish}"`);
        }}
        onMemoryRead={(idx) => {
          setMemoriesRead((prev) => new Set(prev).add(idx));
          if (!isFilmPlaying && !showPavilionModal) {
            setActiveMemoryIndex(idx);
            setShowPavilionModal(true);
          }
        }}
        onLanternIgnited={(idx) => {
          setLanternsLit((prev) => new Set(prev).add(idx));
        }}
        onBridgeUnlocked={() => {
          setBridgeUnlocked(true);
          showToast('✦ All 3 Guardian Lanterns ignite! The Lantern Bridge opens.');
        }}
        onFinaleAwakened={() => {
          setFinaleTriggered(true);
          setShowFinaleModal(true);
        }}
        onNearbyObjectChange={(obj) => setNearbyObject(obj)}
        onShowToast={showToast}
        exportPostcardRef={exportPostcardRef}
      />

      {/* 55-Second Cinematic Film Overlay & Scrubber */}
      <FilmOverlay
        isFilmPlaying={isFilmPlaying}
        filmElapsed={filmElapsed}
        chapters={FILM_CHAPTERS}
        letterboxEnabled={config.letterboxEnabled}
        onSkipFilm={() => handleFilmComplete()}
      />

      {/* Top Floating Utility Pills (Clean & minimal, zero screen clutter) */}
      {isStarted && !isFilmPlaying && (
        <div className="fixed top-4 right-4 z-20 flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={start55SecondFilm}
            className="btn-gold px-4 py-2 rounded-full text-xs font-cinzel tracking-wider uppercase shadow-xl flex items-center gap-1.5"
          >
            <span>🎬</span>
            <span>Replay 55s Film</span>
          </button>
          <button
            type="button"
            onClick={() => setShowFinaleModal(true)}
            className="glass-panel hover:border-amber-400 text-amber-200 px-4 py-2 rounded-full text-xs flex items-center gap-1.5 shadow-xl transition"
          >
            <span>🎂</span>
            <span>Birthday Card</span>
          </button>
        </div>
      )}

      {/* Top Header Milestone Badge */}
      {isStarted && !isFilmPlaying && (
        <div className="fixed top-4 left-4 z-20 flex items-center gap-2 pointer-events-auto">
          <div className="glass-pill px-3.5 py-1.5 rounded-full flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_#f59e0b]" />
            <span className="font-cinzel tracking-wider text-amber-200 font-semibold uppercase">
              {config.recipientName}'S SANCTUARY
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300">
              Blossoms {flowersAwakened.size}/6 • Keepsakes {memoriesRead.size}/3 • Lanterns {lanternsLit.size}/3
            </span>
          </div>
        </div>
      )}

      {/* Bottom Center Interaction Prompt */}
      {nearbyObject && !isFilmPlaying && (
        <div className="fixed bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <button
            type="button"
            onClick={nearbyObject.onInteract}
            className="glass-panel hover:border-amber-300 px-5 py-2.5 rounded-full flex items-center gap-3 shadow-2xl transition transform hover:scale-105"
          >
            <span className="w-7 h-7 rounded-full bg-amber-400/20 border border-amber-400 text-amber-300 flex items-center justify-center text-xs font-bold">
              E
            </span>
            <div className="text-left">
              <div className="text-xs sm:text-sm font-semibold text-amber-200">{nearbyObject.title}</div>
              <div className="text-[11px] text-slate-300">{nearbyObject.subtitle}</div>
            </div>
          </button>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-all duration-300 max-w-md w-11/12">
          <div className="glass-panel px-4 py-2.5 rounded-2xl text-center border-amber-400/40 shadow-xl">
            <p className="text-xs sm:text-sm text-amber-100 font-medium">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Unified Bottom Control Dock (Collapsible, Zero Viewport Clutter) */}
      {isStarted && !isFilmPlaying && (
        <ControlDock
          cameraMode={cameraMode}
          atmosphere={config.atmosphere}
          isMuted={config.muted}
          letterboxEnabled={config.letterboxEnabled}
          onSelectCameraMode={(mode) => setCameraMode(mode)}
          onSelectAtmosphere={(atm) => setConfig({ ...config, atmosphere: atm })}
          onToggleMute={handleToggleMute}
          onToggleLetterbox={handleToggleLetterbox}
          onPlayAnthem={() => {
            audioEngine.playBirthdaySymphony();
            showToast(`♫ Playing Birthday Symphony for ${config.recipientName}!`);
          }}
          onOpenPostcard={handleTakePostcardSnapshot}
          onOpenPersonalize={() => setShowCustomizeModal(true)}
          onOpenGuide={() => setShowGuideModal(true)}
          onReplayFilm={start55SecondFilm}
          onTeleport={handleTeleport}
        />
      )}

      {/* Opening Invitation Vista Overlay */}
      {!isStarted && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end items-center p-6 sm:p-10 pointer-events-none transition-opacity duration-700">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pointer-events-auto mb-4">
            <button
              type="button"
              onClick={() => handleStartExperience(true)}
              className="btn-gold py-3.5 px-8 rounded-full font-cinzel tracking-widest text-xs sm:text-sm uppercase flex items-center justify-center gap-2 shadow-2xl"
            >
              Open the Garden Gates ✦
            </button>
            <button
              type="button"
              onClick={() => handleStartExperience(false)}
              className="glass-pill hover:border-amber-400 text-amber-200 py-3.5 px-6 rounded-full font-cinzel tracking-wider text-xs uppercase transition shadow-xl"
            >
              Explore Freely First
            </button>
          </div>
        </div>
      )}

      {/* Interactive Modals */}
      <PavilionModal
        isOpen={showPavilionModal}
        activeIndex={activeMemoryIndex}
        memories={config.memories}
        onSelectMemory={(idx) => setActiveMemoryIndex(idx)}
        onClose={() => setShowPavilionModal(false)}
      />

      <FinaleModal
        isOpen={showFinaleModal}
        config={config}
        candlesBlown={candlesBlown}
        onBlowCandles={(val) => {
          setCandlesBlown(typeof val === 'boolean' ? val : !candlesBlown);
        }}
        onReplayFilm={start55SecondFilm}
        onLaunchSkyLanterns={() => {
          showToast('✦ Glowing sky lanterns launched into the starry night!');
        }}
        onOpenPostcard={handleTakePostcardSnapshot}
        onClose={() => setShowFinaleModal(false)}
      />

      <CustomizeModal
        isOpen={showCustomizeModal}
        config={config}
        onSave={handleSaveConfig}
        onClose={() => setShowCustomizeModal(false)}
      />

      <PostcardModal
        isOpen={showPostcardModal}
        config={config}
        snapshotUrl={snapshotUrl}
        onClose={() => setShowPostcardModal(false)}
      />

      <GuideModal
        isOpen={showGuideModal}
        onTeleport={handleTeleport}
        onClose={() => setShowGuideModal(false)}
      />
    </div>
  );
}
