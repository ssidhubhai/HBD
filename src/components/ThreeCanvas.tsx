import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GardenConfig, CameraMode, GardenStage } from '../types/garden';
import { FILM_CHAPTERS, ATMOSPHERE_PALETTES } from '../utils/constants';
import { audioEngine } from '../services/audioEngine';

interface ThreeCanvasProps {
  config: GardenConfig;
  stage: GardenStage;
  cameraMode: CameraMode;
  isFilmPlaying: boolean;
  filmElapsed: number;
  gateOpened: boolean;
  bridgeUnlocked: boolean;
  finaleTriggered: boolean;
  candlesBlown: boolean;
  teleportTarget: { x: number; y: number; z: number; yaw: number } | null;
  onFilmProgress: (elapsed: number) => void;
  onFilmComplete: () => void;
  onGateUnlocked: () => void;
  onFlowerAwakened: (index: number) => void;
  onMemoryRead: (index: number) => void;
  onLanternIgnited: (index: number) => void;
  onBridgeUnlocked: () => void;
  onFinaleAwakened: () => void;
  onNearbyObjectChange: (object: { id: string; title: string; subtitle: string; onInteract: () => void } | null) => void;
  onShowToast: (msg: string) => void;
  exportPostcardRef: React.MutableRefObject<(() => string | null) | null>;
}

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({
  config,
  stage,
  cameraMode,
  isFilmPlaying,
  filmElapsed,
  gateOpened,
  bridgeUnlocked,
  finaleTriggered,
  candlesBlown,
  teleportTarget,
  onFilmProgress,
  onFilmComplete,
  onGateUnlocked,
  onFlowerAwakened,
  onMemoryRead,
  onLanternIgnited,
  onBridgeUnlocked,
  onFinaleAwakened,
  onNearbyObjectChange,
  onShowToast,
  exportPostcardRef
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const lastTeleportRef = useRef<{ x: number; y: number; z: number; yaw: number } | null>(null);

  // References to keep render loop in sync without tearing down Three.js canvas
  const stateRef = useRef({
    config,
    stage,
    cameraMode,
    isFilmPlaying,
    filmElapsed,
    gateOpened,
    bridgeUnlocked,
    finaleTriggered,
    candlesBlown,
    teleportTarget,
    onFilmProgress,
    onFilmComplete,
    onGateUnlocked,
    onFlowerAwakened,
    onMemoryRead,
    onLanternIgnited,
    onBridgeUnlocked,
    onFinaleAwakened,
    onNearbyObjectChange,
    onShowToast
  });

  useEffect(() => {
    stateRef.current = {
      config,
      stage,
      cameraMode,
      isFilmPlaying,
      filmElapsed,
      gateOpened,
      bridgeUnlocked,
      finaleTriggered,
      candlesBlown,
      teleportTarget,
      onFilmProgress,
      onFilmComplete,
      onGateUnlocked,
      onFlowerAwakened,
      onMemoryRead,
      onLanternIgnited,
      onBridgeUnlocked,
      onFinaleAwakened,
      onNearbyObjectChange,
      onShowToast
    };
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Software WebGL Guard & Modern Renderer
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050914);
    scene.fog = new THREE.FogExp2(0x070d1e, 0.013);

    const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 280);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Provide postcard screenshot exporter to parent
    exportPostcardRef.current = () => {
      try {
        renderer.render(scene, camera);
        return renderer.domElement.toDataURL('image/png');
      } catch {
        return null;
      }
    };

    // 2. Procedural Studio Environment Reflection
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Lighting Setup
    const hemiLight = new THREE.HemisphereLight(0x3b5998, 0x0b1911, 0.85);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0x93c5fd, 0.95);
    dirLight.position.set(28, 48, 24);
    if (!isSoftwareGl) {
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      dirLight.shadow.camera.near = 5;
      dirLight.shadow.camera.far = 130;
      const d = 52;
      dirLight.shadow.camera.left = -d;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = -d;
      dirLight.shadow.bias = -0.0005;
      dirLight.shadow.normalBias = 0.02;
    }
    scene.add(dirLight);

    const clearingMainLight = new THREE.PointLight(0xffb74d, 1.2, 45, 1.4);
    clearingMainLight.position.set(0, 6.5, -36);
    scene.add(clearingMainLight);

    // Helpers & Procedural Textures
    function createGlowTexture(colorHex: string) {
      const c = document.createElement('canvas');
      c.width = 128;
      c.height = 128;
      const ctx = c.getContext('2d');
      if (!ctx) return new THREE.Texture();
      const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 60);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.35, colorHex);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }

    const warmGlowTex = createGlowTexture('rgba(245, 185, 85, 0.92)');
    const cyanGlowTex = createGlowTexture('rgba(94, 234, 212, 0.92)');
    const magentaGlowTex = createGlowTexture('rgba(244, 114, 182, 0.92)');

    // -------------------------------------------------------------------------
    // PROCEDURAL TERRAIN, RIVER STREAM & STONE PATHS
    // -------------------------------------------------------------------------
    function getTerrainHeight(x: number, z: number) {
      const distFromCenterLine = Math.abs(x);
      if (distFromCenterLine < 9 || (x < -4 && x > -24 && z > -2 && z < 16)) {
        return 0;
      }
      return Math.sin(x * 0.08) * Math.cos(z * 0.08) * 1.15 + Math.max(0, (Math.abs(x) - 18) * 0.08);
    }

    const groundGeo = new THREE.PlaneGeometry(160, 160, 80, 80);
    groundGeo.rotateX(-Math.PI / 2);
    const posAttr = groundGeo.attributes.position;
    const colors: number[] = [];
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      let vy = getTerrainHeight(vx, vz);
      if (vz > -15.5 && vz < -8.5) {
        const streamFactor = 1 - Math.abs(vz + 12) / 3.5;
        vy -= streamFactor * 1.15;
      }
      posAttr.setY(i, vy);

      const c = new THREE.Color(0x0c2318);
      if (Math.abs(vx) < 3.2) {
        c.lerp(new THREE.Color(0x1e3a2b), 0.5);
      }
      colors.push(c.r, c.g, c.b);
    }
    groundGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.92,
      metalness: 0.05
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // River Stream
    const streamGeo = new THREE.PlaneGeometry(150, 6.6, 32, 8);
    streamGeo.rotateX(-Math.PI / 2);
    const streamMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x082f49,
      emissiveIntensity: 0.55,
      roughness: 0.16,
      metalness: 0.8,
      transparent: true,
      opacity: 0.88
    });
    const streamMesh = new THREE.Mesh(streamGeo, streamMat);
    streamMesh.position.set(0, -0.28, -12);
    scene.add(streamMesh);

    // Floating Water Lilies on the Stream
    const waterLilies: THREE.Group[] = [];
    for (let w = -20; w <= 20; w += 5.5) {
      if (Math.abs(w) < 3.0) continue; // Keep under-bridge clear
      const lilyGroup = new THREE.Group();
      lilyGroup.position.set(w + Math.sin(w) * 1.2, -0.2, -12 + (w % 2 === 0 ? 0.9 : -0.9));

      const pad = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.58, 0.04, 12),
        new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 })
      );
      lilyGroup.add(pad);

      const flower = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xfda4af, emissive: 0xf43f5e, emissiveIntensity: 0.4 })
      );
      flower.position.y = 0.12;
      lilyGroup.add(flower);

      scene.add(lilyGroup);
      waterLilies.push(lilyGroup);
    }

    // Path Stepping Stones
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.8,
      metalness: 0.12
    });
    function addPathStone(x: number, z: number, radius: number, rotY: number) {
      const geo = new THREE.CylinderGeometry(radius, radius * 1.08, 0.14, 7);
      const mesh = new THREE.Mesh(geo, stoneMat);
      mesh.position.set(x, 0.04, z);
      mesh.rotation.y = rotY || 0;
      mesh.receiveShadow = true;
      scene.add(mesh);
    }
    for (let z = 45; z >= -34; z -= 1.8) {
      if (z < -8.5 && z > -15.5) continue;
      const offset = Math.sin(z * 0.16) * 0.9;
      addPathStone(offset, z, 0.85 + (Math.abs(z) % 0.35), z * 0.4);
      addPathStone(offset + (z % 2 === 0 ? 0.95 : -0.95), z + 0.5, 0.55, z);
    }
    for (let t = 0; t <= 1; t += 0.08) {
      const px = -13 * t;
      const pz = 12 - 6 * t + Math.sin(t * Math.PI) * 1.2;
      addPathStone(px, pz, 0.75, t * 3);
    }

    // -------------------------------------------------------------------------
    // REALISTIC GARDEN ELEMENTS: BENCHES, SIGNPOST & NATURAL WILDFLOWERS
    // -------------------------------------------------------------------------
    const benchWoodMat = new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 0.75 });
    const benchIronMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.75 });

    function buildParkBench(x: number, y: number, z: number, rotY: number) {
      const bench = new THREE.Group();
      bench.position.set(x, y, z);
      bench.rotation.y = rotY;

      // Seat planks
      for (let p = -0.22; p <= 0.22; p += 0.15) {
        const plank = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.06, 0.12), benchWoodMat);
        plank.position.set(0, 0.65, p);
        plank.castShadow = true;
        plank.receiveShadow = true;
        bench.add(plank);
      }
      // Backrest planks
      for (let b = 0.85; b <= 1.25; b += 0.18) {
        const backPlank = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.12, 0.05), benchWoodMat);
        backPlank.position.set(0, b, -0.25);
        backPlank.rotation.x = -0.18;
        backPlank.castShadow = true;
        bench.add(backPlank);
      }
      // Iron legs & armrests
      [-0.9, 0.9].forEach((lx) => {
        const legFront = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.65, 6), benchIronMat);
        legFront.position.set(lx, 0.32, 0.22);
        bench.add(legFront);

        const legBack = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 1.25, 6), benchIronMat);
        legBack.position.set(lx, 0.62, -0.25);
        bench.add(legBack);

        const arm = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.025, 6, 12, Math.PI), benchIronMat);
        arm.position.set(lx, 0.82, 0.0);
        arm.rotation.z = Math.PI;
        bench.add(arm);
      });

      scene.add(bench);
      return bench;
    }

    // Cozy garden benches beside flowers & stream
    buildParkBench(-5.5, 0.05, 20, 0.38);
    buildParkBench(5.6, 0.05, -5.5, -0.42);

    // Carved Wooden Welcome Signpost at Entrance
    const signpostGroup = new THREE.Group();
    signpostGroup.position.set(-4.6, 0, 34.5);
    scene.add(signpostGroup);

    const postWood = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.11, 2.8, 8),
      new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.85 })
    );
    postWood.position.y = 1.4;
    signpostGroup.add(postWood);

    function createSignBoard(text: string, yPos: number, rotY: number, arrowRight: boolean) {
      const sc = document.createElement('canvas');
      sc.width = 256;
      sc.height = 64;
      const sctx = sc.getContext('2d');
      if (sctx) {
        sctx.fillStyle = '#3e2723';
        sctx.fillRect(0, 0, 256, 64);
        sctx.strokeStyle = '#d97706';
        sctx.lineWidth = 3;
        sctx.strokeRect(3, 3, 250, 58);
        sctx.fillStyle = '#fef3c7';
        sctx.font = 'bold 20px Cinzel, serif';
        sctx.textAlign = 'center';
        sctx.fillText(text, 128, 40);
      }
      const stex = new THREE.CanvasTexture(sc);
      stex.colorSpace = THREE.SRGBColorSpace;
      const board = new THREE.Mesh(
        new THREE.BoxGeometry(1.25, 0.28, 0.05),
        new THREE.MeshStandardMaterial({ map: stex, roughness: 0.7 })
      );
      board.position.set(arrowRight ? 0.35 : -0.35, yPos, 0);
      board.rotation.y = rotY;
      signpostGroup.add(board);
    }
    createSignBoard('✦ MEMORY PAVILION ➔', 2.3, 0.35, false);
    createSignBoard('✦ LANTERN BRIDGE ➔', 1.9, -0.25, true);
    createSignBoard('✦ SHUBHAM\'S TREE ➔', 1.5, 0.15, true);

    // 70+ Lush Grass Tufts & Wildflower Bunches along paths
    const grassMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.8, side: THREE.DoubleSide });
    const flowerWildMat1 = new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x7e22ce, emissiveIntensity: 0.3 });
    const flowerWildMat2 = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xca8a04, emissiveIntensity: 0.3 });

    for (let g = 0; g < 75; g++) {
      const gz = 42 - g * 1.05;
      if (gz < -8.5 && gz > -15.5) continue;
      const side = g % 2 === 0 ? 1 : -1;
      const gx = (2.2 + (g % 3) * 0.9) * side + Math.sin(g) * 0.5;

      const tuft = new THREE.Group();
      tuft.position.set(gx, getTerrainHeight(gx, gz), gz);

      // 4 grass blades
      for (let b = 0; b < 4; b++) {
        const blade = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.45 + (g % 3) * 0.1, 4), grassMat);
        blade.position.set((b - 1.5) * 0.06, 0.2, (b % 2) * 0.04);
        blade.rotation.z = (b - 1.5) * 0.2;
        tuft.add(blade);
      }

      // Add wildflower heads on some tufts
      if (g % 3 === 0) {
        const wf = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), g % 2 === 0 ? flowerWildMat1 : flowerWildMat2);
        wf.position.set(0, 0.45, 0);
        tuft.add(wf);
      }

      scene.add(tuft);
    }

    // -------------------------------------------------------------------------
    // 3. WROUGHT-IRON SANCTUARY GATE (Composite 3-12 Part Model)
    // -------------------------------------------------------------------------
    const gateGroup = new THREE.Group();
    gateGroup.position.set(0, 0, 36);
    scene.add(gateGroup);

    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.8 });
    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xf5c469,
      emissive: 0xd97706,
      emissiveIntensity: 0.35,
      roughness: 0.25,
      metalness: 0.85
    });

    [-3.4, 3.4].forEach((px) => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.3, 4.8, 1.3), pillarMat);
      pillar.position.set(px, 2.4, 0);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      gateGroup.add(pillar);

      const cap = new THREE.Mesh(new THREE.ConeGeometry(1.05, 0.9, 4), pillarMat);
      cap.position.set(px, 5.25, 0);
      cap.rotation.y = Math.PI / 4;
      gateGroup.add(cap);

      const lanternBox = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.65, 6), goldTrimMat);
      lanternBox.position.set(px, 5.95, 0);
      gateGroup.add(lanternBox);

      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: warmGlowTex, transparent: true }));
      sprite.scale.set(2.8, 2.8, 1);
      sprite.position.set(px, 5.95, 0);
      gateGroup.add(sprite);

      const wall = new THREE.Mesh(new THREE.BoxGeometry(26, 3.4, 0.9), pillarMat);
      wall.position.set(px > 0 ? px + 13.5 : px - 13.5, 1.7, 0);
      gateGroup.add(wall);
    });

    const archCrown = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.18, 8, 24, Math.PI), ironMat);
    archCrown.position.set(0, 4.6, 0);
    gateGroup.add(archCrown);

    const leftGateDoor = new THREE.Group();
    leftGateDoor.position.set(-2.75, 0, 0);
    gateGroup.add(leftGateDoor);

    const rightGateDoor = new THREE.Group();
    rightGateDoor.position.set(2.75, 0, 0);
    gateGroup.add(rightGateDoor);

    function buildGateDoorLeaf(group: THREE.Group, dir: number) {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(2.6, 4.1, 0.12), ironMat);
      frame.position.set(dir * 1.3, 2.1, 0);
      group.add(frame);

      for (let i = 0.35; i <= 2.45; i += 0.42) {
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4.0, 6), ironMat);
        bar.position.set(dir * i, 2.1, 0);
        group.add(bar);

        const spear = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.28, 4), goldTrimMat);
        spear.position.set(dir * i, 4.2, 0);
        group.add(spear);
      }
    }
    buildGateDoorLeaf(leftGateDoor, 1);
    buildGateDoorLeaf(rightGateDoor, -1);

    const gateLight = new THREE.PointLight(0xffb74d, 1.6, 18);
    gateLight.position.set(0, 5.2, 37);
    scene.add(gateLight);

    // -------------------------------------------------------------------------
    // 4. ANIMATED SPIRIT BLOSSOMS (6 Multi-petal procedural flowers)
    // -------------------------------------------------------------------------
    const flowerLocations = [
      { x: -3.2, z: 27, color: 0x38bdf8 },
      { x: 3.4, z: 21, color: 0xf472b6 },
      { x: -4.8, z: 14, color: 0x34d399 },
      { x: -9.5, z: 10.5, color: 0xa78bfa },
      { x: 3.6, z: 7.5, color: 0xfbbf24 },
      { x: 2.8, z: -2.0, color: 0x2dd4bf }
    ];

    const animatedFlowers: {
      group: THREE.Group;
      glow: THREE.Sprite;
      mat: THREE.MeshStandardMaterial;
      phase: number;
      awakened: boolean;
      worldPos: THREE.Vector3;
    }[] = [];

    flowerLocations.forEach((loc, idx) => {
      const flowerGroup = new THREE.Group();
      flowerGroup.position.set(loc.x, 0, loc.z);
      scene.add(flowerGroup);

      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.1, 1.15, 6),
        new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 })
      );
      stem.position.y = 0.58;
      flowerGroup.add(stem);

      const blossomMat = new THREE.MeshStandardMaterial({
        color: loc.color,
        emissive: loc.color,
        emissiveIntensity: 0.35,
        roughness: 0.3
      });

      const petalsGroup = new THREE.Group();
      petalsGroup.position.y = 1.2;
      flowerGroup.add(petalsGroup);

      for (let p = 0; p < 6; p++) {
        const angle = (p / 6) * Math.PI * 2;
        const petal = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), blossomMat);
        petal.scale.set(1.4, 0.45, 0.8);
        petal.position.set(Math.cos(angle) * 0.26, 0.05, Math.sin(angle) * 0.26);
        petal.rotation.y = -angle;
        petal.rotation.z = 0.35;
        petalsGroup.add(petal);
      }

      const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 10, 10),
        new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 0.9 })
      );
      petalsGroup.add(core);

      const glowSprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: idx % 2 === 0 ? cyanGlowTex : magentaGlowTex, transparent: true, opacity: 0.65 })
      );
      glowSprite.position.y = 1.35;
      glowSprite.scale.set(1.9, 1.9, 1);
      flowerGroup.add(glowSprite);

      animatedFlowers.push({
        group: petalsGroup,
        glow: glowSprite,
        mat: blossomMat,
        phase: idx * 1.1,
        awakened: false,
        worldPos: new THREE.Vector3(loc.x, 1.2, loc.z)
      });
    });

    // -------------------------------------------------------------------------
    // 5. MEMORY PAVILION & 3D FLOATING KEEPSAKE FRAMES
    // -------------------------------------------------------------------------
    const pavilionGroup = new THREE.Group();
    pavilionGroup.position.set(-14, 0, 6);
    scene.add(pavilionGroup);

    const marbleMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.55, metalness: 0.1 });
    const pavilionBase = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.6, 0.45, 8), marbleMat);
    pavilionBase.position.y = 0.22;
    pavilionBase.receiveShadow = true;
    pavilionGroup.add(pavilionBase);

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const cx = Math.cos(angle) * 4.2;
      const cz = Math.sin(angle) * 4.2;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 4.2, 10), marbleMat);
      col.position.set(cx, 2.5, cz);
      col.castShadow = true;
      pavilionGroup.add(col);
    }

    const domeRoof = new THREE.Mesh(
      new THREE.ConeGeometry(5.4, 2.4, 8),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.4 })
    );
    domeRoof.position.y = 5.8;
    pavilionGroup.add(domeRoof);

    const pavilionLight = new THREE.PointLight(0xffca7a, 1.8, 18);
    pavilionLight.position.set(0, 4.3, 0);
    pavilionGroup.add(pavilionLight);

    const pavilionFrames3D: THREE.Mesh[] = [];

    function createKeepsakeCanvasTexture(title: string, tag: string, author: string, imageUrl: string) {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 384;
      const ctx = c.getContext('2d');
      if (!ctx) return new THREE.Texture();

      ctx.fillStyle = '#091326';
      ctx.fillRect(0, 0, 512, 384);
      ctx.strokeStyle = '#f5c469';
      ctx.lineWidth = 8;
      ctx.strokeRect(10, 10, 492, 364);

      ctx.fillStyle = '#fde68a';
      ctx.font = '600 20px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.fillText(tag.toUpperCase(), 256, 52);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px Georgia, serif';
      ctx.fillText(title, 256, 92);

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, 36, 110, 440, 220);
        ctx.strokeStyle = 'rgba(245, 196, 105, 0.6)';
        ctx.lineWidth = 3;
        ctx.strokeRect(36, 110, 440, 220);
        ctx.fillStyle = '#fef3c7';
        ctx.font = 'italic 18px Georgia, serif';
        ctx.fillText(author, 256, 355);
        tex.needsUpdate = true;
      };
      img.src = imageUrl;
      return tex;
    }

    config.memories.slice(0, 3).forEach((mem, m) => {
      const a = (m - 1) * 0.9 + Math.PI * 0.15;
      const kx = Math.cos(a) * 2.4;
      const kz = Math.sin(a) * 2.4;

      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.48, 1.1, 8), marbleMat);
      stand.position.set(kx, 0.95, kz);
      pavilionGroup.add(stand);

      const portraitTex = createKeepsakeCanvasTexture(mem.title, mem.tag, mem.author, mem.image);
      const portraitMat = new THREE.MeshBasicMaterial({ map: portraitTex, side: THREE.DoubleSide });
      const frameMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.75, 1.32), portraitMat);
      frameMesh.position.set(kx, 2.35, kz);
      frameMesh.lookAt(-10, 2.25, 6.5);
      pavilionGroup.add(frameMesh);
      pavilionFrames3D.push(frameMesh);

      const aura = new THREE.Sprite(new THREE.SpriteMaterial({ map: warmGlowTex, transparent: true, opacity: 0.75 }));
      aura.position.set(kx, 2.35, kz);
      aura.scale.set(2.4, 2.4, 1);
      pavilionGroup.add(aura);
    });

    // -------------------------------------------------------------------------
    // 6. LANTERN BRIDGE & 3 GUARDIAN LANTERNS
    // -------------------------------------------------------------------------
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(0, 0, -12);
    scene.add(bridgeGroup);

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.82 });
    for (let i = -4.2; i <= 4.2; i += 0.55) {
      const norm = i / 4.2;
      const archY = Math.cos(norm * (Math.PI / 2)) * 1.15;
      const plank = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.16, 0.46), woodMat);
      plank.position.set(0, archY, i);
      plank.receiveShadow = true;
      bridgeGroup.add(plank);
    }

    const barrierMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.9,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide
    });
    const bridgeBarrierMesh = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.6), barrierMat);
    bridgeBarrierMesh.position.set(0, 1.9, -15.6);
    scene.add(bridgeBarrierMesh);

    const bridgeLanternPositions = [
      { x: -2.2, y: 1.5, z: -8.6 },
      { x: 2.2, y: 2.1, z: -12.0 },
      { x: -2.2, y: 1.5, z: -15.0 }
    ];

    const bridgeLanternObjs: {
      orb: THREE.Mesh;
      mat: THREE.MeshStandardMaterial;
      glow: THREE.Sprite;
      ptLight: THREE.PointLight;
      worldPos: THREE.Vector3;
    }[] = [];

    bridgeLanternPositions.forEach((lp) => {
      const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 1.5, 8), pillarMat);
      pedestal.position.set(lp.x, lp.y - 0.65, lp.z);
      scene.add(pedestal);

      const lanternOrbMat = new THREE.MeshStandardMaterial({
        color: 0x64748b,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.12,
        roughness: 0.25
      });
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 14), lanternOrbMat);
      orb.position.set(lp.x, lp.y + 0.3, lp.z);
      scene.add(orb);

      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: warmGlowTex, transparent: true, opacity: 0.22 }));
      glow.position.set(lp.x, lp.y + 0.3, lp.z);
      glow.scale.set(1.6, 1.6, 1);
      scene.add(glow);

      const ptLight = new THREE.PointLight(0xffb74d, 0, 14);
      ptLight.position.set(lp.x, lp.y + 0.5, lp.z);
      scene.add(ptLight);

      bridgeLanternObjs.push({
        orb,
        mat: lanternOrbMat,
        glow,
        ptLight,
        worldPos: new THREE.Vector3(lp.x, lp.y, lp.z)
      });
    });

    // -------------------------------------------------------------------------
    // 7. HIDDEN CLEARING, SACRED ANCIENT TREE & BIRTHDAY CAKE ALTAR
    // -------------------------------------------------------------------------
    const clearingGroup = new THREE.Group();
    clearingGroup.position.set(0, 0, -37);
    scene.add(clearingGroup);

    const plazaFloor = new THREE.Mesh(new THREE.CylinderGeometry(13.5, 14.2, 0.3, 32), marbleMat);
    plazaFloor.position.y = 0.15;
    plazaFloor.receiveShadow = true;
    clearingGroup.add(plazaFloor);

    const goldRing = new THREE.Mesh(new THREE.RingGeometry(11.8, 12.3, 32), goldTrimMat);
    goldRing.rotation.x = -Math.PI / 2;
    goldRing.position.y = 0.32;
    clearingGroup.add(goldRing);

    // Sacred Ancient Tree
    const ancientTreeGroup = new THREE.Group();
    ancientTreeGroup.position.set(0, 0, -6.5);
    clearingGroup.add(ancientTreeGroup);

    const barkMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.8, 9.5, 12), barkMat);
    trunk.position.y = 4.75;
    trunk.castShadow = true;
    ancientTreeGroup.add(trunk);

    for (let r = 0; r < 6; r++) {
      const ra = (r / 6) * Math.PI * 2;
      const rootMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.65, 4.2, 8), barkMat);
      rootMesh.position.set(Math.cos(ra) * 2.4, 0.8, Math.sin(ra) * 2.4);
      rootMesh.rotation.z = Math.cos(ra) * 0.8;
      rootMesh.rotation.x = -Math.sin(ra) * 0.8;
      ancientTreeGroup.add(rootMesh);
    }

    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0x11422c,
      emissive: 0x064e3b,
      emissiveIntensity: 0.25,
      roughness: 0.75
    });
    const canopyOffsets = [
      [0, 11.2, 0, 5.8],
      [-4.2, 9.8, 1.8, 4.2],
      [4.2, 9.8, 1.8, 4.2],
      [-3.5, 10.4, -2.8, 4.0],
      [3.5, 10.4, -2.8, 4.0],
      [0, 12.8, 1.5, 4.4]
    ];
    canopyOffsets.forEach(([cx, cy, cz, cr]) => {
      const leafSphere = new THREE.Mesh(new THREE.DodecahedronGeometry(cr, 1), canopyMat);
      leafSphere.position.set(cx, cy, cz);
      leafSphere.castShadow = true;
      ancientTreeGroup.add(leafSphere);
    });

    const clearingFairyLights: THREE.Sprite[] = [];
    for (let i = 0; i < 36; i++) {
      const angle = (i / 36) * Math.PI * 2;
      const rad = 2.6 + (i % 3) * 1.65;
      const hx = Math.cos(angle) * rad;
      const hz = Math.sin(angle) * rad;
      const hy = 6.2 + (i % 4) * 0.75;

      const cord = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 1.6, 4),
        new THREE.MeshBasicMaterial({ color: 0x475569 })
      );
      cord.position.set(hx, hy + 0.8, hz);
      ancientTreeGroup.add(cord);

      const spMat = new THREE.SpriteMaterial({
        map: warmGlowTex,
        transparent: true,
        opacity: 0.42
      });
      const sp = new THREE.Sprite(spMat);
      sp.position.set(hx, hy, hz);
      sp.scale.set(1.25, 1.25, 1);
      ancientTreeGroup.add(sp);
      clearingFairyLights.push(sp);
    }

    // Birthday Cake Altar (Composite 3-12 parts)
    const altarGroup = new THREE.Group();
    altarGroup.position.set(0, 0, 1.5);
    clearingGroup.add(altarGroup);

    const altarPedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.65, 1.35, 16), marbleMat);
    altarPedestal.position.y = 0.82;
    altarPedestal.castShadow = true;
    altarGroup.add(altarPedestal);

    const altarRim = new THREE.Mesh(new THREE.CylinderGeometry(1.48, 1.48, 0.12, 16), goldTrimMat);
    altarRim.position.y = 1.52;
    altarGroup.add(altarRim);

    const cakeGroup = new THREE.Group();
    cakeGroup.position.y = 1.58;
    altarGroup.add(cakeGroup);

    const icingMat = new THREE.MeshStandardMaterial({ color: 0xfffbeb, roughness: 0.35 });
    const berryGoldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.45,
      roughness: 0.25,
      metalness: 0.6
    });

    const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.88, 0.42, 20), icingMat);
    tier1.position.y = 0.21;
    cakeGroup.add(tier1);

    const tier1Trim = new THREE.Mesh(new THREE.CylinderGeometry(0.87, 0.87, 0.08, 20), berryGoldMat);
    tier1Trim.position.y = 0.4;
    cakeGroup.add(tier1Trim);

    const tier2 = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.64, 0.36, 20), icingMat);
    tier2.position.y = 0.6;
    cakeGroup.add(tier2);

    const tier3 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.42, 0.32, 20), icingMat);
    tier3.position.y = 0.94;
    cakeGroup.add(tier3);

    const candleFlames: THREE.Sprite[] = [];
    for (let c = 0; c < 7; c++) {
      const ca = c === 0 ? 0 : ((c - 1) / 6) * Math.PI * 2;
      const crad = c === 0 ? 0 : 0.26;
      const cx = Math.cos(ca) * crad;
      const cz = Math.sin(ca) * crad;

      const candleStick = new THREE.Mesh(
        new THREE.CylinderGeometry(0.028, 0.028, 0.28, 8),
        new THREE.MeshStandardMaterial({ color: 0xfef3c7 })
      );
      candleStick.position.set(cx, 1.22, cz);
      cakeGroup.add(candleStick);

      const flameSprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: warmGlowTex, transparent: true, opacity: 0.95 })
      );
      flameSprite.position.set(cx, 1.42, cz);
      flameSprite.scale.set(0.55, 0.75, 1);
      cakeGroup.add(flameSprite);
      candleFlames.push(flameSprite);
    }

    // -------------------------------------------------------------------------
    // SPECIAL BIRTHDAY TOUCHES FOR SHUBHAM: PRESENTS, BALLOONS, CAMPFIRE & TREE CARVING
    // -------------------------------------------------------------------------
    // 1. Wrapped Birthday Presents & Gift Boxes with Satin Ribbons
    const giftBoxGroup = new THREE.Group();
    clearingGroup.add(giftBoxGroup);

    function createGiftBox(
      w: number,
      h: number,
      d: number,
      boxColor: number,
      ribbonColor: number,
      posX: number,
      posY: number,
      posZ: number,
      rotY: number
    ) {
      const box = new THREE.Group();
      box.position.set(posX, posY, posZ);
      box.rotation.y = rotY;

      const bodyMat = new THREE.MeshStandardMaterial({
        color: boxColor,
        roughness: 0.35,
        metalness: 0.3
      });
      const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bodyMat);
      bodyMesh.castShadow = true;
      bodyMesh.receiveShadow = true;
      box.add(bodyMesh);

      const ribMat = new THREE.MeshStandardMaterial({
        color: ribbonColor,
        emissive: ribbonColor,
        emissiveIntensity: 0.25,
        roughness: 0.2,
        metalness: 0.8
      });
      // Cross ribbons
      const ribX = new THREE.Mesh(new THREE.BoxGeometry(w * 1.02, h * 1.01, d * 0.18), ribMat);
      box.add(ribX);
      const ribZ = new THREE.Mesh(new THREE.BoxGeometry(w * 0.18, h * 1.01, d * 1.02), ribMat);
      box.add(ribZ);

      // Top 3D Satin Bow
      const bowLeft = new THREE.Mesh(new THREE.TorusGeometry(w * 0.15, h * 0.04, 6, 12, Math.PI * 1.5), ribMat);
      bowLeft.position.set(-w * 0.1, h * 0.56, 0);
      bowLeft.rotation.z = Math.PI * 0.25;
      box.add(bowLeft);

      const bowRight = new THREE.Mesh(new THREE.TorusGeometry(w * 0.15, h * 0.04, 6, 12, Math.PI * 1.5), ribMat);
      bowRight.position.set(w * 0.1, h * 0.56, 0);
      bowRight.rotation.z = -Math.PI * 0.25;
      box.add(bowRight);

      giftBoxGroup.add(box);
      return box;
    }

    // Five luxury wrapped presents beside the cake altar
    createGiftBox(0.65, 0.48, 0.65, 0x059669, 0xf59e0b, 1.6, 0.4, 2.1, 0.25); // Emerald with Gold
    createGiftBox(0.58, 0.55, 0.58, 0x1d4ed8, 0xe2e8f0, -1.65, 0.42, 2.0, -0.3); // Sapphire with Silver
    createGiftBox(0.52, 0.4, 0.52, 0xb91c1c, 0xfcd34d, 1.8, 0.35, 2.8, -0.4); // Ruby with Gold
    createGiftBox(0.7, 0.36, 0.68, 0xd97706, 0x991b1b, -1.5, 0.33, 2.9, 0.15); // Gold with Crimson
    createGiftBox(0.38, 0.32, 0.38, 0x9333ea, 0xffedd5, -1.65, 0.85, 2.0, 0.1); // Stacked Lavender Box

    // 2. Floating Metallic Birthday Balloon Cluster
    const balloonGroup = new THREE.Group();
    balloonGroup.position.set(2.4, 0.3, 1.0);
    clearingGroup.add(balloonGroup);

    const balloonColors = [0xf59e0b, 0xf43f5e, 0x38bdf8, 0xfef08a, 0xa855f7];
    const balloonsList: THREE.Mesh[] = [];
    balloonColors.forEach((bColor, bi) => {
      const bMat = new THREE.MeshStandardMaterial({
        color: bColor,
        roughness: 0.12,
        metalness: 0.82
      });
      const bMesh = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 16), bMat);
      bMesh.scale.set(1.0, 1.28, 1.0);
      const bAngle = (bi / 5) * Math.PI * 2;
      bMesh.position.set(Math.cos(bAngle) * 0.45, 2.6 + (bi % 3) * 0.4, Math.sin(bAngle) * 0.45);
      balloonGroup.add(bMesh);
      balloonsList.push(bMesh);

      // Ribbon string to ground
      const stringMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, bMesh.position.y, 4),
        new THREE.MeshBasicMaterial({ color: 0x94a3b8 })
      );
      stringMesh.position.set(bMesh.position.x * 0.5, bMesh.position.y * 0.5, bMesh.position.z * 0.5);
      balloonGroup.add(stringMesh);
    });

    // 3. Cozy Stone Fire Pit / Brother's Hearth
    const firePitGroup = new THREE.Group();
    firePitGroup.position.set(-9.5, 0.05, -33.5);
    scene.add(firePitGroup);

    const stonePitMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
    for (let s = 0; s < 10; s++) {
      const sa = (s / 10) * Math.PI * 2;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32, 1), stonePitMat);
      rock.position.set(Math.cos(sa) * 1.1, 0.2, Math.sin(sa) * 1.1);
      rock.rotation.set(s, s * 0.5, s * 0.2);
      firePitGroup.add(rock);
    }
    // Glowing coal bed
    const coalBed = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 0.9, 0.15, 12),
      new THREE.MeshStandardMaterial({
        color: 0x1f140e,
        emissive: 0xea580c,
        emissiveIntensity: 1.2,
        roughness: 0.9
      })
    );
    coalBed.position.y = 0.1;
    firePitGroup.add(coalBed);

    // Crossed campfire logs
    for (let lg = 0; lg < 3; lg++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.4, 6), barkMat);
      log.position.set(0, 0.3, 0);
      log.rotation.x = Math.PI * 0.35;
      log.rotation.y = (lg / 3) * Math.PI * 2;
      firePitGroup.add(log);
    }

    const fireLight = new THREE.PointLight(0xf97316, 1.8, 14, 1.6);
    fireLight.position.set(0, 0.8, 0);
    firePitGroup.add(fireLight);

    const fireFlameSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: warmGlowTex, transparent: true, opacity: 0.92 })
    );
    fireFlameSprite.position.set(0, 0.7, 0);
    fireFlameSprite.scale.set(1.4, 1.8, 1);
    firePitGroup.add(fireFlameSprite);

    // Campfire rising ember spark particles
    const emberCount = 35;
    const emberGeo = new THREE.BufferGeometry();
    const emberPos = new Float32Array(emberCount * 3);
    const emberVels: THREE.Vector3[] = [];
    for (let e = 0; e < emberCount; e++) {
      emberPos[e * 3] = -9.5 + (Math.random() - 0.5) * 0.8;
      emberPos[e * 3 + 1] = 0.4 + Math.random() * 2.2;
      emberPos[e * 3 + 2] = -33.5 + (Math.random() - 0.5) * 0.8;
      emberVels.push(new THREE.Vector3((Math.random() - 0.5) * 0.3, 0.6 + Math.random() * 0.8, (Math.random() - 0.5) * 0.3));
    }
    emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPos, 3));
    const emberMat = new THREE.PointsMaterial({
      size: 0.5,
      map: warmGlowTex,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    const emberParticles = new THREE.Points(emberGeo, emberMat);
    scene.add(emberParticles);

    // 4. Sacred Ancient Tree Trunk Golden Carving
    const treeCarvingCanvas = document.createElement('canvas');
    treeCarvingCanvas.width = 512;
    treeCarvingCanvas.height = 256;
    const tcCtx = treeCarvingCanvas.getContext('2d');
    if (tcCtx) {
      tcCtx.fillStyle = '#2b1810';
      tcCtx.fillRect(0, 0, 512, 256);
      tcCtx.strokeStyle = '#f59e0b';
      tcCtx.lineWidth = 4;
      tcCtx.strokeRect(6, 6, 500, 244);

      tcCtx.fillStyle = '#fef08a';
      tcCtx.font = '700 28px Cinzel, serif';
      tcCtx.textAlign = 'center';
      tcCtx.fillText(`✧ FOR SHUBHAM ✧`, 256, 65);

      tcCtx.fillStyle = '#fef3c7';
      tcCtx.font = 'bold 36px Georgia, serif';
      tcCtx.fillText(`BROTHERHOOD & STRENGTH`, 256, 130);

      tcCtx.fillStyle = '#fcd34d';
      tcCtx.font = 'italic 22px Georgia, serif';
      tcCtx.fillText(`"May your year soar as high as the stars."`, 256, 195);
    }
    const treeCarvingTex = new THREE.CanvasTexture(treeCarvingCanvas);
    treeCarvingTex.colorSpace = THREE.SRGBColorSpace;
    const treeCarvingMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 1.2),
      new THREE.MeshStandardMaterial({
        map: treeCarvingTex,
        roughness: 0.6,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.25
      })
    );
    treeCarvingMesh.position.set(0, 3.4, 1.55); // Flush on tree front
    treeCarvingMesh.rotation.y = 0;
    ancientTreeGroup.add(treeCarvingMesh);

    // 5. Drifting Soft Blossom Petal Breeze Particle System
    const petalCount = 120;
    const petalGeo = new THREE.BufferGeometry();
    const petalPos = new Float32Array(petalCount * 3);
    const petalPhases = new Float32Array(petalCount);
    for (let p = 0; p < petalCount; p++) {
      petalPos[p * 3] = (Math.random() - 0.5) * 60;
      petalPos[p * 3 + 1] = 0.5 + Math.random() * 8.0;
      petalPos[p * 3 + 2] = (Math.random() - 0.5) * 80;
      petalPhases[p] = Math.random() * Math.PI * 2;
    }
    petalGeo.setAttribute('position', new THREE.BufferAttribute(petalPos, 3));
    const petalMat = new THREE.PointsMaterial({
      size: 0.65,
      map: magentaGlowTex,
      transparent: true,
      opacity: 0.75,
      blending: THREE.NormalBlending
    });
    const petalParticles = new THREE.Points(petalGeo, petalMat);
    scene.add(petalParticles);

    // -------------------------------------------------------------------------
    // 8. CELESTIAL STARRY SKY & NAME CONSTELLATION ("SHUBHAM")
    // -------------------------------------------------------------------------
    const starCount = 1800;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(0.12 + Math.random() * 0.88);
      const r = 135 + Math.random() * 25;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.cos(phi);
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) - 10;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xe2e8f0,
      size: 0.85,
      transparent: true,
      opacity: 0.85
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // Starlight constellation banner
    let birthdayBannerSprite: THREE.Sprite | null = null;
    let constellationSprite: THREE.Sprite | null = null;

    function buildConstellationSprites(name: string) {
      if (birthdayBannerSprite) scene.remove(birthdayBannerSprite);
      if (constellationSprite) scene.remove(constellationSprite);

      // Banner above tree canopy
      const c = document.createElement('canvas');
      c.width = 1024;
      c.height = 256;
      const ctx = c.getContext('2d');
      if (ctx) {
        const grad = ctx.createRadialGradient(512, 128, 20, 512, 128, 460);
        grad.addColorStop(0, 'rgba(245, 196, 105, 0.36)');
        grad.addColorStop(1, 'rgba(6, 11, 23, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1024, 256);

        ctx.font = '700 52px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 26;
        ctx.fillStyle = '#fff3c4';
        ctx.fillText(`HAPPY BIRTHDAY, ${name.toUpperCase()}!`, 512, 118);

        ctx.font = 'italic 28px Georgia, serif';
        ctx.shadowBlur = 14;
        ctx.fillStyle = '#fde68a';
        ctx.fillText('✦ Beneath the Ancient Canopy of the Secret Garden ✦', 512, 174);

        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: stateRef.current.finaleTriggered ? 1.0 : 0.0 });
        birthdayBannerSprite = new THREE.Sprite(mat);
        birthdayBannerSprite.position.set(0, 11.4, -39);
        birthdayBannerSprite.scale.set(17.5, 4.4, 1);
        scene.add(birthdayBannerSprite);
      }

      // High starry constellation ("✧ NAME ✧")
      const sc = document.createElement('canvas');
      sc.width = 1024;
      sc.height = 256;
      const sctx = sc.getContext('2d');
      if (sctx) {
        sctx.strokeStyle = 'rgba(245, 196, 105, 0.55)';
        sctx.lineWidth = 2;
        const pts = [
          [120, 140], [210, 95], [320, 130], [450, 85], [570, 135], [700, 90], [820, 130], [910, 100]
        ];
        sctx.beginPath();
        pts.forEach(([x, y], i) => {
          if (i === 0) sctx.moveTo(x, y);
          else sctx.lineTo(x, y);
        });
        sctx.stroke();
        pts.forEach(([x, y]) => {
          sctx.fillStyle = '#fffbeb';
          sctx.beginPath();
          sctx.arc(x, y, 5, 0, Math.PI * 2);
          sctx.fill();
        });

        sctx.font = '700 68px Cinzel, serif';
        sctx.textAlign = 'center';
        sctx.shadowColor = '#38bdf8';
        sctx.shadowBlur = 28;
        sctx.fillStyle = '#fef08a';
        sctx.fillText(`✧ ${name.toUpperCase()} ✧`, 512, 195);

        const stex = new THREE.CanvasTexture(sc);
        stex.colorSpace = THREE.SRGBColorSpace;
        const smat = new THREE.SpriteMaterial({ map: stex, transparent: true, opacity: stateRef.current.finaleTriggered ? 0.95 : 0.25 });
        constellationSprite = new THREE.Sprite(smat);
        constellationSprite.position.set(0, 26, -54);
        constellationSprite.scale.set(34, 8.5, 1);
        scene.add(constellationSprite);
      }
    }
    buildConstellationSprites(config.recipientName);

    // -------------------------------------------------------------------------
    // 9. DYNAMIC SKY LANTERNS & 3D FIREWORK BURSTS
    // -------------------------------------------------------------------------
    const skyLanterns: { group: THREE.Group; speedY: number; swayPhase: number }[] = [];
    const fireworkBursts: {
      points: THREE.Points;
      geo: THREE.BufferGeometry;
      mat: THREE.PointsMaterial;
      vels: THREE.Vector3[];
      age: number;
    }[] = [];

    function spawnSkyLanterns(count: number) {
      for (let i = 0; i < count; i++) {
        const lGroup = new THREE.Group();
        const angle = Math.random() * Math.PI * 2;
        const rad = 3.5 + Math.random() * 14;
        lGroup.position.set(
          Math.cos(angle) * rad,
          1.2 + Math.random() * 3.5,
          -37 + Math.sin(angle) * rad
        );

        const paperMat = new THREE.MeshStandardMaterial({
          color: 0xffedd5,
          emissive: 0xf59e0b,
          emissiveIntensity: 1.4,
          roughness: 0.3
        });
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.2, 0.65, 8), paperMat);
        lGroup.add(body);

        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: warmGlowTex, transparent: true, opacity: 0.95 }));
        sp.scale.set(2.4, 2.4, 1);
        lGroup.add(sp);

        scene.add(lGroup);
        skyLanterns.push({
          group: lGroup,
          speedY: 0.9 + Math.random() * 1.1,
          swayPhase: Math.random() * Math.PI * 2
        });
      }
    }

    function addFirework(x: number, y: number, z: number, colorHex: number) {
      if (stateRef.current.config.reducedEffects) return;
      const count = 70;
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 3);
      const vels: THREE.Vector3[] = [];
      for (let i = 0; i < count; i++) {
        pos[i * 3] = x;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = z;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = 4 + Math.random() * 7;
        vels.push(
          new THREE.Vector3(
            speed * Math.sin(phi) * Math.cos(theta),
            speed * Math.cos(phi),
            speed * Math.sin(phi) * Math.sin(theta)
          )
        );
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({
        color: colorHex,
        size: 0.95,
        map: warmGlowTex,
        transparent: true,
        opacity: 1,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const points = new THREE.Points(geo, mat);
      scene.add(points);
      fireworkBursts.push({ points, geo, mat, vels, age: 0 });
      audioEngine.playFireworkBurst();
    }

    // -------------------------------------------------------------------------
    // 10. FIREFLIES SYSTEM
    // -------------------------------------------------------------------------
    const fireflyCount = 300;
    const fireflyGeo = new THREE.BufferGeometry();
    const fireflyPos = new Float32Array(fireflyCount * 3);
    const fireflyPhases = new Float32Array(fireflyCount);
    for (let i = 0; i < fireflyCount; i++) {
      fireflyPos[i * 3] = (Math.random() - 0.5) * 75;
      fireflyPos[i * 3 + 1] = 0.8 + Math.random() * 8.0;
      fireflyPos[i * 3 + 2] = (Math.random() - 0.5) * 95;
      fireflyPhases[i] = Math.random() * Math.PI * 2;
    }
    fireflyGeo.setAttribute('position', new THREE.BufferAttribute(fireflyPos, 3));
    const fireflyMat = new THREE.PointsMaterial({
      size: 0.9,
      map: warmGlowTex,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const fireflyPoints = new THREE.Points(fireflyGeo, fireflyMat);
    scene.add(fireflyPoints);

    // -------------------------------------------------------------------------
    // 11. 55-SECOND CATMULL-ROM CAMERA CURVES
    // -------------------------------------------------------------------------
    const filmCameraCurve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(0, 6.5, 52), // 0s: Grand aerial establishing
        new THREE.Vector3(0, 3.2, 41), // 5s: Toward gate
        new THREE.Vector3(0, 2.7, 31), // 9s: Passing gate
        new THREE.Vector3(0, 2.6, 21), // 14s: Along lantern avenue
        new THREE.Vector3(-3.5, 2.7, 13.0), // 19s: Arcing toward pavilion
        new THREE.Vector3(-8.8, 2.6, 8.0), // 24s: Wide pavilion view
        new THREE.Vector3(-9.2, 2.6, 4.5), // 28s: Keepsake murals
        new THREE.Vector3(-3.2, 2.6, 0.5), // 33s: Rejoining avenue
        new THREE.Vector3(0, 2.8, -6.5), // 37s: Toward Lantern Bridge
        new THREE.Vector3(0, 3.5, -12.0), // 41s: Over the bridge
        new THREE.Vector3(0, 2.9, -21.0), // 45s: Entering clearing
        new THREE.Vector3(3.2, 2.8, -29.5), // 49s: Arcing altar
        new THREE.Vector3(-2.4, 2.9, -29.5), // 52s: Sacred tree & constellation
        new THREE.Vector3(0, 2.2, -27.5) // 55s: Settle at altar
      ],
      false,
      'centripetal',
      0.5
    );

    const filmLookCurve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(0, 3.8, 30),
        new THREE.Vector3(0, 3.0, 24),
        new THREE.Vector3(0, 2.6, 14),
        new THREE.Vector3(-2.0, 2.6, 8),
        new THREE.Vector3(-14.0, 2.7, 6.2),
        new THREE.Vector3(-15.2, 2.6, 5.8),
        new THREE.Vector3(-14.0, 2.6, 4.2),
        new THREE.Vector3(0, 2.6, -9.0),
        new THREE.Vector3(0, 2.8, -15.0),
        new THREE.Vector3(0, 3.4, -26.0),
        new THREE.Vector3(0, 5.0, -37.0),
        new THREE.Vector3(0, 3.2, -36.0),
        new THREE.Vector3(0, 11.0, -42.0),
        new THREE.Vector3(0, 4.2, -36.5)
      ],
      false,
      'centripetal',
      0.5
    );

    // Drone Aerial Circle
    const droneLookTarget = new THREE.Vector3(0, 4.5, -10);

    // -------------------------------------------------------------------------
    // 12. PLAYER KINEMATICS, INPUT & RAYCASTING
    // -------------------------------------------------------------------------
    const player = {
      pos: new THREE.Vector3(0, 1.75, 46),
      velocity: new THREE.Vector3(),
      yaw: 0,
      pitch: 0.05,
      speed: 8.2,
      radius: 0.85
    };

    const keys: { [code: string]: boolean } = {};
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target && ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      keys[e.code] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    let isPointerDragging = false;
    let prevPointer = { x: 0, y: 0 };
    const onPointerDown = (e: PointerEvent) => {
      isPointerDragging = true;
      prevPointer.x = e.clientX;
      prevPointer.y = e.clientY;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isPointerDragging || stateRef.current.isFilmPlaying || stateRef.current.cameraMode !== 'FREE_ROAM') return;
      const dx = e.clientX - prevPointer.x;
      const dy = e.clientY - prevPointer.y;
      prevPointer.x = e.clientX;
      prevPointer.y = e.clientY;

      player.yaw -= dx * 0.0042;
      player.pitch = Math.max(-0.45, Math.min(0.55, player.pitch - dy * 0.0032));
    };
    const onPointerUp = () => {
      isPointerDragging = false;
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // -------------------------------------------------------------------------
    // 13. MAIN ANIMATION & SIMULATION LOOP
    // -------------------------------------------------------------------------
    const clock = new THREE.Clock();
    let animFrameId = 0;
    let filmTime = 0;

    const tick = () => {
      const dt = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();
      const current = stateRef.current;

      // Atmosphere updates
      const pal = ATMOSPHERE_PALETTES[current.config.atmosphere] || ATMOSPHERE_PALETTES.TWILIGHT;
      scene.background = new THREE.Color(pal.skyColor);
      if (scene.fog) {
        scene.fog.color = new THREE.Color(pal.fogColor);
      }
      hemiLight.color.setHex(pal.hemiSky);
      hemiLight.groundColor.setHex(pal.hemiGround);
      dirLight.color.setHex(pal.dirLight);
      dirLight.intensity = pal.dirIntensity;

      // Gate opening animation
      if (current.gateOpened) {
        leftGateDoor.rotation.y = THREE.MathUtils.damp(leftGateDoor.rotation.y, -Math.PI * 0.65, 3.5, dt);
        rightGateDoor.rotation.y = THREE.MathUtils.damp(rightGateDoor.rotation.y, Math.PI * 0.65, 3.5, dt);
      } else {
        leftGateDoor.rotation.y = THREE.MathUtils.damp(leftGateDoor.rotation.y, 0, 3.5, dt);
        rightGateDoor.rotation.y = THREE.MathUtils.damp(rightGateDoor.rotation.y, 0, 3.5, dt);
      }

      // Bridge barrier dissolution
      if (current.bridgeUnlocked) {
        barrierMat.opacity = THREE.MathUtils.damp(barrierMat.opacity, 0, 2.5, dt);
        bridgeBarrierMesh.position.y = THREE.MathUtils.damp(bridgeBarrierMesh.position.y, -3.0, 2.0, dt);
        if (barrierMat.opacity < 0.02) bridgeBarrierMesh.visible = false;
      }

      // 55-Second Film Director Mode
      if (current.isFilmPlaying) {
        filmTime += dt;
        current.onFilmProgress(filmTime);
        const t = Math.min(1.0, filmTime / 55.0);

        const camPos = filmCameraCurve.getPointAt(t);
        const lookTarget = filmLookCurve.getPointAt(t);

        if (filmTime <= dt * 2.0) {
          camera.position.copy(camPos);
        } else {
          camera.position.lerp(camPos, Math.min(1.0, dt * 8.0));
        }
        camera.lookAt(lookTarget);
        player.pos.copy(camera.position);

        // Auto triggers during film
        if (filmTime >= 3.5 && !current.gateOpened) {
          current.onGateUnlocked();
          audioEngine.playGateOpening();
        }

        // Auto bloom blossoms
        animatedFlowers.forEach((fl, idx) => {
          if (!fl.awakened && camPos.distanceTo(fl.worldPos) < 9.5) {
            fl.awakened = true;
            current.onFlowerAwakened(idx);
            audioEngine.playChime(440 + idx * 60, 1.4, 0.1);
          }
        });

        // Auto mark keepsakes
        if (filmTime >= 24.0) current.onMemoryRead(0);
        if (filmTime >= 27.0) current.onMemoryRead(1);
        if (filmTime >= 30.0) current.onMemoryRead(2);

        // Auto ignite bridge lanterns
        if (filmTime >= 36.5) current.onLanternIgnited(0);
        if (filmTime >= 38.5) current.onLanternIgnited(1);
        if (filmTime >= 40.5) current.onLanternIgnited(2);
        if (filmTime >= 41.5 && !current.bridgeUnlocked) {
          current.onBridgeUnlocked();
          audioEngine.playLanternBridge();
        }

        // Auto ignite finale
        if (filmTime >= 45.0 && !current.finaleTriggered) {
          current.onFinaleAwakened();
          spawnSkyLanterns(26);
          addFirework(-5, 17, -42, 0xfbbf24);
          setTimeout(() => addFirework(5, 19, -44, 0x38bdf8), 600);
          setTimeout(() => addFirework(0, 20, -40, 0xf472b6), 1200);
        }

        if (filmTime >= 55.0) {
          filmTime = 0;
          current.onFilmComplete();
        }
      } else if (current.cameraMode === 'AERIAL_DRONE') {
        const droneAngle = elapsed * 0.14;
        const droneRad = 48;
        camera.position.set(Math.sin(droneAngle) * droneRad, 22 + Math.sin(elapsed * 0.25) * 4, Math.cos(droneAngle) * droneRad - 10);
        camera.lookAt(droneLookTarget);
      } else if (current.cameraMode === 'ALTAR_ORBIT') {
        const orbitAngle = elapsed * 0.25;
        const ox = Math.sin(orbitAngle) * 9.5;
        const oz = -35.5 + Math.cos(orbitAngle) * 9.5;
        camera.position.set(ox, 3.2, oz);
        camera.lookAt(0, 2.2, -35.5);
      } else {
        // Handle instantaneous landmark teleportation
        if (current.teleportTarget && current.teleportTarget !== lastTeleportRef.current) {
          lastTeleportRef.current = current.teleportTarget;
          player.pos.set(current.teleportTarget.x, current.teleportTarget.y, current.teleportTarget.z);
          player.yaw = current.teleportTarget.yaw;
          player.pitch = 0.05;
          player.velocity.set(0, 0, 0);
        }

        // Free Roam Movement
        let forwardInput = 0;
        let rightInput = 0;
        if (keys.KeyW || keys.ArrowUp) forwardInput += 1;
        if (keys.KeyS || keys.ArrowDown) forwardInput -= 1;
        if (keys.KeyD || keys.ArrowRight) rightInput += 1;
        if (keys.KeyA || keys.ArrowLeft) rightInput -= 1;

        const forward = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
        const right = new THREE.Vector3(Math.cos(player.yaw), 0, -Math.sin(player.yaw));

        const wishDir = new THREE.Vector3();
        wishDir.addScaledVector(forward, forwardInput);
        wishDir.addScaledVector(right, rightInput);
        if (wishDir.lengthSq() > 1) wishDir.normalize();

        const targetVx = wishDir.x * player.speed;
        const targetVz = wishDir.z * player.speed;

        player.velocity.x += (targetVx - player.velocity.x) * Math.min(1, dt * 10);
        player.velocity.z += (targetVz - player.velocity.z) * Math.min(1, dt * 10);

        let nextX = player.pos.x + player.velocity.x * dt;
        let nextZ = player.pos.z + player.velocity.z * dt;

        nextX = Math.max(-24, Math.min(24, nextX));
        nextZ = Math.max(-46, Math.min(46, nextZ));

        // Proximity auto-unlock
        if (!current.gateOpened && nextZ < 39.5) {
          current.onGateUnlocked();
          audioEngine.playGateOpening();
        }

        // Bridge & Stream blocking if not unlocked
        if (nextZ < -8.3 && nextZ > -15.7) {
          if (Math.abs(nextX) > 1.75) {
            if (player.pos.z >= -8.3) nextZ = -8.3;
            else if (player.pos.z <= -15.7) nextZ = -15.7;
            else nextX = Math.sign(nextX) * 1.75;
          }
        }

        player.pos.x = nextX;
        player.pos.z = nextZ;

        let groundY = getTerrainHeight(player.pos.x, player.pos.z);
        if (player.pos.z <= -7.8 && player.pos.z >= -16.2 && Math.abs(player.pos.x) <= 2.1) {
          const norm = (player.pos.z + 12) / 4.2;
          groundY = Math.cos(Math.max(-1, Math.min(1, norm)) * (Math.PI / 2)) * 1.15;
        }
        player.pos.y = groundY + 1.75;

        camera.position.copy(player.pos);
        const lookTarget = new THREE.Vector3(
          player.pos.x - Math.sin(player.yaw) * Math.cos(player.pitch) * 10,
          player.pos.y + Math.sin(player.pitch) * 10,
          player.pos.z - Math.cos(player.yaw) * Math.cos(player.pitch) * 10
        );
        camera.lookAt(lookTarget);

        // Check proximity interactables
        let nearby: { id: string; title: string; subtitle: string; onInteract: () => void } | null = null;
        if (player.pos.distanceTo(new THREE.Vector3(0, 1.8, 36)) < 5.0) {
          nearby = {
            id: 'gate',
            title: current.gateOpened ? 'Wrought-Iron Gate' : 'Open Sanctuary Gate',
            subtitle: current.gateOpened ? 'The gates stand open for Shubham' : 'Click or press E to unlock',
            onInteract: () => {
              if (!current.gateOpened) {
                current.onGateUnlocked();
                audioEngine.playGateOpening();
              }
            }
          };
        } else if (player.pos.distanceTo(new THREE.Vector3(-4.6, 1.8, 34.5)) < 3.8) {
          nearby = {
            id: 'signpost',
            title: 'Sanctuary Guide Signpost',
            subtitle: 'Click or press E to view directions to Shubham\'s landmarks',
            onInteract: () => {
              audioEngine.playWindChime();
              current.onShowToast('🗺️ Sanctuary Guide: Follow the glowing stones to the Memory Pavilion, Lantern Bridge & Ancient Tree!');
            }
          };
        } else if (player.pos.distanceTo(new THREE.Vector3(-5.5, 1.8, 20)) < 3.8 || player.pos.distanceTo(new THREE.Vector3(5.6, 1.8, -5.5)) < 3.8) {
          nearby = {
            id: 'bench',
            title: 'Garden Reflection Bench',
            subtitle: 'Click or press E to rest & listen to the wind chimes',
            onInteract: () => {
              audioEngine.playWindChime();
              current.onShowToast('🌿 Sitting with Shubham — take a peaceful breath, brother. This sanctuary was built for you.');
            }
          };
        } else if (player.pos.distanceTo(new THREE.Vector3(-14, 1.8, 6)) < 6.5) {
          nearby = {
            id: 'pavilion',
            title: 'Memory Pavilion',
            subtitle: 'Inspect keepsakes & brotherhood stories',
            onInteract: () => current.onMemoryRead(0)
          };
        } else if (player.pos.distanceTo(new THREE.Vector3(-9.5, 1.8, -33.5)) < 4.2) {
          nearby = {
            id: 'campfire',
            title: 'Brother\'s Hearth & Campfire',
            subtitle: 'Click or press E to warm hands & hear brother\'s blessing',
            onInteract: () => {
              audioEngine.playCampfireCrackle();
              current.onShowToast('🔥 Warming by the campfire — may health, bold courage, and boundless laughter walk with you, Shubham!');
            }
          };
        } else if (player.pos.distanceTo(new THREE.Vector3(1.6, 1.8, -35.2)) < 3.8) {
          nearby = {
            id: 'gifts',
            title: "Shubham's Birthday Presents",
            subtitle: 'Click or press E to open the birthday gifts & cards',
            onInteract: () => {
              current.onShowToast('🎁 Celebrating Shubham with birthday presents and brotherly love!');
              current.onFinaleAwakened();
            }
          };
        } else if (player.pos.distanceTo(new THREE.Vector3(0, 1.8, -35.5)) < 5.0) {
          nearby = {
            id: 'altar',
            title: "Shubham's Birthday Cake & Altar",
            subtitle: 'Open Birthday Card & Ceremony',
            onInteract: () => current.onFinaleAwakened()
          };
        }
        current.onNearbyObjectChange(nearby);
      }

      // Animate Flowers, Keepsake Panels & Fairy Lights
      animatedFlowers.forEach((fl) => {
        fl.group.rotation.y = elapsed * (fl.awakened ? 1.2 : 0.4) + fl.phase;
        fl.group.position.y = 1.2 + Math.sin(elapsed * 2.2 + fl.phase) * 0.05;
        if (fl.awakened) {
          fl.mat.emissiveIntensity = THREE.MathUtils.damp(fl.mat.emissiveIntensity, 1.45, 3.0, dt);
          fl.glow.scale.set(3.2, 3.2, 1);
        }
      });

      pavilionFrames3D.forEach((fm, idx) => {
        fm.position.y = 2.35 + Math.sin(elapsed * 1.8 + idx * 1.4) * 0.08;
      });

      waterLilies.forEach((lily, idx) => {
        lily.position.y = -0.25 + Math.sin(elapsed * 1.5 + idx) * 0.04;
        lily.rotation.y = elapsed * 0.2 + idx;
      });

      // Animate Campfire Flames & Rising Embers
      fireFlameSprite.scale.set(1.3 + Math.sin(elapsed * 14) * 0.1, 1.7 + Math.cos(elapsed * 12) * 0.15, 1);
      const eArr = emberGeo.attributes.position.array as Float32Array;
      for (let e = 0; e < emberCount; e++) {
        eArr[e * 3 + 1] += emberVels[e].y * dt;
        eArr[e * 3] += Math.sin(elapsed * 3 + e) * 0.008;
        if (eArr[e * 3 + 1] > 3.8) {
          eArr[e * 3 + 1] = 0.4;
          eArr[e * 3] = -9.5 + (Math.random() - 0.5) * 0.6;
          eArr[e * 3 + 2] = -33.5 + (Math.random() - 0.5) * 0.6;
        }
      }
      emberGeo.attributes.position.needsUpdate = true;

      // Animate Drifting Petals Breeze
      const ptArr = petalGeo.attributes.position.array as Float32Array;
      for (let p = 0; p < petalCount; p++) {
        ptArr[p * 3] += Math.sin(elapsed * 0.8 + petalPhases[p]) * 0.02 - 0.015;
        ptArr[p * 3 + 1] -= dt * 0.4;
        ptArr[p * 3 + 2] += Math.cos(elapsed * 0.6 + petalPhases[p]) * 0.02 - 0.02;
        if (ptArr[p * 3 + 1] < 0.2) {
          ptArr[p * 3 + 1] = 7.5;
        }
      }
      petalGeo.attributes.position.needsUpdate = true;

      // Animate Birthday Balloons swaying
      balloonsList.forEach((bMesh, bi) => {
        bMesh.position.x += Math.sin(elapsed * 2 + bi) * 0.002;
        bMesh.position.y += Math.cos(elapsed * 1.5 + bi) * 0.002;
      });

      // Candles flicker or blow out
      candleFlames.forEach((flame) => {
        if (current.candlesBlown) {
          flame.material.opacity = THREE.MathUtils.damp(flame.material.opacity, 0.02, 4.0, dt);
        } else {
          flame.material.opacity = 0.85 + Math.sin(elapsed * 16 + flame.position.x * 20) * 0.15;
          const s = 0.55 + Math.sin(elapsed * 18) * 0.08;
          flame.scale.set(s, s * 1.35, 1);
        }
      });

      // Fireflies floating animation
      const pArr = fireflyGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < fireflyCount; i++) {
        pArr[i * 3 + 1] += Math.sin(elapsed * 1.5 + fireflyPhases[i]) * 0.005;
        pArr[i * 3] += Math.cos(elapsed * 0.8 + fireflyPhases[i]) * 0.003;
      }
      fireflyGeo.attributes.position.needsUpdate = true;

      // Sky Lanterns ascending
      for (let l = skyLanterns.length - 1; l >= 0; l--) {
        const sl = skyLanterns[l];
        sl.group.position.y += sl.speedY * dt;
        sl.group.position.x += Math.sin(elapsed + sl.swayPhase) * 0.25 * dt;
        if (sl.group.position.y > 52) {
          sl.group.position.y = 2.0;
        }
      }

      // Fireworks update
      for (let b = fireworkBursts.length - 1; b >= 0; b--) {
        const fb = fireworkBursts[b];
        fb.age += dt;
        const arr = fb.geo.attributes.position.array as Float32Array;
        for (let i = 0; i < fb.vels.length; i++) {
          arr[i * 3] += fb.vels[i].x * dt;
          arr[i * 3 + 1] += fb.vels[i].y * dt;
          arr[i * 3 + 2] += fb.vels[i].z * dt;
          fb.vels[i].y -= 3.2 * dt; // Gravity
        }
        fb.geo.attributes.position.needsUpdate = true;
        fb.mat.opacity = Math.max(0, 1 - fb.age / 2.6);
        if (fb.age >= 2.6) {
          scene.remove(fb.points);
          fireworkBursts.splice(b, 1);
        }
      }

      renderer.render(scene, camera);
      animFrameId = requestAnimationFrame(tick);
    };

    animFrameId = requestAnimationFrame(tick);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="fixed inset-0 w-full h-full z-0 pointer-events-auto" />;
};
