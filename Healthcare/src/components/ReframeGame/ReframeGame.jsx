import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Send, 
  Award, 
  Heart, 
  CheckCircle, 
  ArrowLeft, 
  RotateCcw, 
  AlertCircle, 
  Loader2, 
  TrendingDown
} from 'lucide-react';
import { reframeAPI } from '../../services/reframeApi';

// Pre-generated pixel-art sprites hosted on Cloudinary
const CHARACTER_SPRITES = {
  catastrophizing: "https://res.cloudinary.com/dxnpcuppm/image/upload/v1784916957/reframe_game/reframe_game/sprite_catastrophizing.jpg",
  black_and_white: "https://res.cloudinary.com/dxnpcuppm/image/upload/v1784917018/reframe_game/reframe_game/sprite_black_and_white.jpg",
  mind_reading: "https://res.cloudinary.com/dxnpcuppm/image/upload/v1784917018/reframe_game/reframe_game/sprite_mind_reading.jpg",
  overgeneralization: "https://res.cloudinary.com/dxnpcuppm/image/upload/v1784917019/reframe_game/reframe_game/sprite_overgeneralization.jpg",
  personalization: "https://res.cloudinary.com/dxnpcuppm/image/upload/v1784917020/reframe_game/reframe_game/sprite_personalization.jpg"
};

// Hardcoded opening statements per distortion type
const DEFAULT_OPENING_LINES = {
  catastrophizing: "One mistake here, and everything falls apart, you know that right?",
  black_and_white: "If you aren't completely perfect at this, you're a total failure.",
  mind_reading: "They are all looking at you and thinking how incompetent you are.",
  overgeneralization: "You always mess things up; this time won't be any different.",
  personalization: "This is all your fault. If you had just done better, everyone would be happy."
};

// Map configuration
const TILE_SIZE = 40;
const COLS = 20;
const ROWS = 15;

const TILE_MAP = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,0,1,1,1,1,1,1,0,1,1,1,0,1],
  [1,0,1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1,0,1],
  [1,0,1,0,1,1,1,1,1,1,0,1,0,1,0,1,0,1,0,1],
  [1,0,0,0,1,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1],
  [1,1,1,0,1,0,1,1,0,1,1,1,0,1,1,1,1,1,0,1],
  [1,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,1,0,1],
  [1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,0,1,0,1],
  [1,0,1,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1],
  [1,0,1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,1,0,1],
  [1,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,1,0,1],
  [1,0,1,1,1,0,0,1,1,1,1,1,0,1,1,1,0,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// NPCs placement list
const NPC_LIST = [
  { type: 'catastrophizing', col: 3, row: 5 },
  { type: 'black_and_white', col: 14, row: 5 },
  { type: 'mind_reading', col: 2, row: 11 },
  { type: 'overgeneralization', col: 12, row: 11 },
  { type: 'personalization', col: 15, row: 11 }
];

const preProcessDistortionName = (name) => {
  if (!name) return "";
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Client-side flood fill transparency processor
const floodFillAlpha = (imgData) => {
  const data = imgData.data;
  const width = imgData.width;
  const height = imgData.height;
  const visited = new Uint8Array(width * height);
  const queue = [];

  const getIndex = (x, y) => (y * width + x) * 4;

  const isWhite = (x, y) => {
    const idx = getIndex(x, y);
    return data[idx] > 220 && data[idx+1] > 220 && data[idx+2] > 220 && data[idx+3] > 0;
  };

  const add = (x, y) => {
    if (x >= 0 && x < width && y >= 0 && y < height) {
      const vIdx = y * width + x;
      if (!visited[vIdx] && isWhite(x, y)) {
        visited[vIdx] = 1;
        queue.push([x, y]);
      }
    }
  };

  // Seed from edges
  for (let x = 0; x < width; x++) {
    add(x, 0);
    add(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    add(0, y);
    add(width - 1, y);
  }

  while (queue.length > 0) {
    const [cx, cy] = queue.shift();
    const idx = getIndex(cx, cy);
    data[idx+3] = 0; // Transparent

    add(cx + 1, cy);
    add(cx - 1, cy);
    add(cx, cy + 1);
    add(cx, cy - 1);
  }
};

const makeImageTransparent = (imgUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        floodFillAlpha(imgData);
        
        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL());
      } catch (e) {
        console.error("Transparency filter error:", e);
        resolve(imgUrl);
      }
    };
    img.onerror = () => resolve(imgUrl);
    img.src = imgUrl;
  });
};

const ReframeGame = ({ onExit }) => {
  const [stage, setStage] = useState('select'); // 'select', 'chat', 'settled'
  const [distortionTypes, setDistortionTypes] = useState({});
  const [selectedType, setSelectedType] = useState('');
  const [intensity, setIntensity] = useState(100);
  const [chatLog, setChatLog] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  // Retro Sprite States
  const [processedSprites, setProcessedSprites] = useState({});
  const spriteImagesRef = useRef({});

  // Background Image State
  const bgImageRef = useRef(null);
  const [bgLoaded, setBgLoaded] = useState(false);

  // Rain weather particles reference
  const rainParticles = useRef([]);

  // Canvas movement references
  const canvasRef = useRef(null);
  const player = useRef({
    x: 9 * TILE_SIZE + 20, // Spawn at col 9 center
    y: 7 * TILE_SIZE + 20, // Spawn at row 7 center
    radius: 12,
    speed: 150
  });

  const keysPressed = useRef({});
  const animationFrameId = useRef(null);
  const lastTime = useRef(0);
  const chatEndRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }, [chatLog, prefersReducedMotion]);

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const listener = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // Fetch distortion types on load
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        setIsLoading(true);
        const data = await reframeAPI.getDistortionTypes();
        setDistortionTypes(data);
        setError(null);
      } catch (err) {
        console.error("Failed to load distortion types:", err);
        setError("Could not load distortion options. Please check your backend connection.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTypes();
  }, []);

  // Pre-process Cloudinary sprites on component mount
  useEffect(() => {
    const processAll = async () => {
      const processed = {};
      for (const [key, url] of Object.entries(CHARACTER_SPRITES)) {
        try {
          processed[key] = await makeImageTransparent(url);
        } catch (e) {
          processed[key] = url;
        }
      }
      setProcessedSprites(processed);

      // Pre-load Image objects for canvas drawing
      for (const [key, src] of Object.entries(processed)) {
        const img = new Image();
        img.src = src;
        spriteImagesRef.current[key] = img;
      }
    };
    processAll();
  }, []);

  // Pre-load background image from Cloudinary on mount
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "https://res.cloudinary.com/dxnpcuppm/image/upload/v1784918536/reframe_game/reframe_game/background_night.jpg";
    img.onload = () => {
      bgImageRef.current = img;
      setBgLoaded(true);
    };
  }, []);

  // Initialize rain particles
  useEffect(() => {
    if (rainParticles.current.length === 0) {
      const particles = [];
      for (let i = 0; i < 60; i++) {
        particles.push({
          x: Math.random() * 800,
          y: Math.random() * 600,
          len: 10 + Math.random() * 15,
          speed: 300 + Math.random() * 200
        });
      }
      rainParticles.current = particles;
    }
  }, []);

  // Keyboard controls for canvas
  useEffect(() => {
    if (stage !== 'select') return;

    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
        e.preventDefault();
      }
      keysPressed.current[key] = true;
    };

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      keysPressed.current[key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [stage]);

  // Canvas collision checker
  const checkCollision = (newX, newY) => {
    const r = player.current.radius;
    const corners = [
      { x: newX - r, y: newY - r },
      { x: newX + r, y: newY - r },
      { x: newX - r, y: newY + r },
      { x: newX + r, y: newY + r }
    ];

    for (let corner of corners) {
      const col = Math.floor(corner.x / TILE_SIZE);
      const row = Math.floor(corner.y / TILE_SIZE);

      if (col < 0 || col >= COLS || row < 0 || row >= ROWS) {
        return true;
      }

      if (TILE_MAP[row][col] === 1) {
        return true;
      }
    }
    return false;
  };

  // Check if player collided with any NPC
  const checkNPCCollision = (x, y) => {
    for (let npc of NPC_LIST) {
      const npcX = npc.col * TILE_SIZE + TILE_SIZE / 2;
      const npcY = npc.row * TILE_SIZE + TILE_SIZE / 2;
      const dist = Math.hypot(x - npcX, y - npcY);
      
      // Trigger encounter if close
      if (dist < 24) {
        return npc.type;
      }
    }
    return null;
  };

  // Top-down World Render Game Loop
  useEffect(() => {
    if (stage !== 'select' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    lastTime.current = 0;

    const gameLoop = (timestamp) => {
      if (!lastTime.current) lastTime.current = timestamp;
      const dt = Math.min((timestamp - lastTime.current) / 1000, 0.1);
      lastTime.current = timestamp;

      // 1. Player movement
      let dx = 0;
      let dy = 0;

      if (keysPressed.current['w'] || keysPressed.current['arrowup']) dy -= 1;
      if (keysPressed.current['s'] || keysPressed.current['arrowdown']) dy += 1;
      if (keysPressed.current['a'] || keysPressed.current['arrowleft']) dx -= 1;
      if (keysPressed.current['d'] || keysPressed.current['arrowright']) dx += 1;

      if (dx !== 0 && dy !== 0) {
        const len = Math.sqrt(dx*dx + dy*dy);
        dx /= len;
        dy /= len;
      }

      const move = player.current.speed * dt;
      let nextX = player.current.x + dx * move;
      let nextY = player.current.y + dy * move;

      if (!checkCollision(nextX, player.current.y)) player.current.x = nextX;
      if (!checkCollision(player.current.x, nextY)) player.current.y = nextY;

      // Check NPC interactions
      const hitNPCType = checkNPCCollision(player.current.x, player.current.y);
      if (hitNPCType) {
        cancelAnimationFrame(animationFrameId.current);
        keysPressed.current = {};
        handleStartGame(hitNPCType);
        return;
      }

      // 2. Draw Background and Floor Tiles
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (bgImageRef.current && bgLoaded) {
        // Draw Gemini-generated retro night rooftop background
        ctx.drawImage(bgImageRef.current, 0, 0, canvas.width, canvas.height);
      } else {
        // Fallback default dark tiles if image loading
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            const tile = TILE_MAP[r][c];
            if (tile === 1) {
              ctx.fillStyle = '#0f172a'; // Slate-900 wall fallback
            } else {
              ctx.fillStyle = '#1e293b'; // Slate-800 floor fallback
            }
            ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          }
        }
      }

      // 3. Draw Grid/Wall Overlay lines (translucent for RPG alignment)
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.25)';
      ctx.lineWidth = 0.5;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          ctx.strokeRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }

      // 4. Draw Translucent Water Puddles (retro texture reflection overlay)
      ctx.fillStyle = 'rgba(14, 165, 233, 0.12)';
      const drawPuddle = (px, py, rx, ry) => {
        ctx.beginPath();
        ctx.ellipse(px, py, rx, ry, 0, 0, Math.PI*2);
        ctx.fill();
      };
      drawPuddle(180, 240, 30, 10);
      drawPuddle(580, 320, 45, 15);
      drawPuddle(380, 460, 35, 12);

      // 5. Draw spotlight cast cone (soft yellow light effect overlay)
      ctx.fillStyle = 'rgba(253, 224, 71, 0.08)';
      ctx.beginPath();
      ctx.moveTo(100, 460); // Spotlight base
      ctx.lineTo(800, 150); // Light upper limit
      ctx.lineTo(800, 600); // Light lower limit
      ctx.closePath();
      ctx.fill();

      // 6. Draw NPCs
      NPC_LIST.forEach((npc) => {
        const img = spriteImagesRef.current[npc.type];
        if (img && img.complete) {
          ctx.drawImage(
            img, 
            npc.col * TILE_SIZE + 4, 
            npc.row * TILE_SIZE + 4, 
            TILE_SIZE - 8, 
            TILE_SIZE - 8
          );
        } else {
          ctx.fillStyle = '#a855f7';
          ctx.beginPath();
          ctx.arc(npc.col * TILE_SIZE + 20, npc.row * TILE_SIZE + 20, 12, 0, Math.PI*2);
          ctx.fill();
        }
      });

      // 7. Draw Player
      ctx.fillStyle = '#14b8a6'; // Teal player character
      ctx.fillRect(
        player.current.x - player.current.radius,
        player.current.y - player.current.radius,
        player.current.radius * 2,
        player.current.radius * 2
      );
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(
        player.current.x - player.current.radius,
        player.current.y - player.current.radius,
        player.current.radius * 2,
        player.current.radius * 2
      );

      // 8. Draw Dynamic Weather (drifting monsoon rain lines)
      if (!prefersReducedMotion && rainParticles.current.length > 0) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
        ctx.lineWidth = 1;
        rainParticles.current.forEach((p) => {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 2, p.y + p.len);
          ctx.stroke();

          // Move diagonal speed downwards and left
          p.y += p.speed * dt;
          p.x -= (p.speed * 0.18) * dt;

          if (p.y > 600) {
            p.y = -20;
            p.x = Math.random() * 800;
          }
        });
      }

      // 9. Draw dark radial ambient vignette (creates cozy/night contrast)
      const vignette = ctx.createRadialGradient(400, 300, 250, 400, 300, 520);
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    animationFrameId.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId.current);
    };
  }, [stage, bgLoaded, prefersReducedMotion]);

  const handleStartGame = (typeKey) => {
    setSelectedType(typeKey);
    setIntensity(100);
    const openingText = DEFAULT_OPENING_LINES[typeKey] || "Things are looking pretty hopeless right now.";
    setChatLog([
      { sender: 'monster', text: openingText }
    ]);
    setStage('chat');
    setUserInput('');
    setError(null);
  };

  const handleSubmitReframe = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const playerText = userInput.trim();
    setUserInput('');
    setError(null);

    setChatLog(prev => [...prev, { sender: 'player', text: playerText }]);
    setIsLoading(true);

    const lastMonsterMessage = [...chatLog]
      .reverse()
      .find(msg => msg.sender === 'monster');
    const monsterStatement = lastMonsterMessage ? lastMonsterMessage.text : "";

    try {
      const response = await reframeAPI.judgeReframe({
        distortion_type: selectedType,
        monster_statement: monsterStatement,
        player_reframe: playerText
      });

      const damageValue = response.damage || 0;
      const feedbackText = response.feedback;
      const nextMonsterResponse = response.monster_response;

      const newIntensity = Math.max(0, intensity - damageValue);
      setIntensity(newIntensity);

      setChatLog(prev => [
        ...prev,
        { 
          sender: 'feedback', 
          text: feedbackText, 
          isPositive: response.addresses_distortion 
        }
      ]);

      if (newIntensity <= 15) {
        setTimeout(() => {
          setStage('settled');
        }, prefersReducedMotion ? 0 : 800);
      } else {
        setChatLog(prev => [...prev, { sender: 'monster', text: nextMonsterResponse }]);
      }
    } catch (err) {
      console.error("Evaluation error:", err);
      setUserInput(playerText);
      setError("The connection to the judging engine failed. Please try sending your reframe again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    player.current.x = 9 * TILE_SIZE + 20;
    player.current.y = 7 * TILE_SIZE + 20;
    
    setStage('select');
    setSelectedType('');
    setIntensity(100);
    setChatLog([]);
    setUserInput('');
    setError(null);
  };

  const handleBack = () => {
    if (onExit) {
      onExit();
    } else {
      window.location.href = '/';
    }
  };

  // Selection Phase (Top-down Interactive Map)
  if (stage === 'select') {
    return (
      <div className="min-h-screen bg-slate-950 text-white font-poppins flex flex-col p-6 overflow-x-hidden relative">
        {/* Nav Header */}
        <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto w-full z-10">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border-2 border-slate-700 hover:border-slate-500 rounded-none text-white font-pixel-body text-lg transition"
          >
            <ArrowLeft size={16} />
            BACK
          </button>
          <div className="flex items-center gap-2">
            <Brain className="text-purple-400 w-6 h-6" />
            <span className="font-pixel-title text-sm text-teal-400 tracking-wider">THOUGHT REFRAMING ARENA</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center max-w-5xl mx-auto w-full z-10 mb-6">
          <div className="text-center mb-6">
            <h1 className="text-xl md:text-2xl font-pixel-title leading-relaxed mb-2 text-white">
              WALK TO CONFRONT COGNITIVE DISTORTIONS
            </h1>
            <p className="text-gray-300 text-sm max-w-xl mx-auto">
              Use WASD or ARROW KEYS to move your teal character. Walk into the custom pixel-art sprites scattered around the night rooftop map to challenge each thought pattern.
            </p>
          </div>

          {/* Core Interactive Canvas Grid */}
          <div className="bg-slate-900 border-8 border-slate-700 rounded-none p-2 shadow-none overflow-auto max-w-full">
            <canvas 
              ref={canvasRef} 
              width={COLS * TILE_SIZE} 
              height={ROWS * TILE_SIZE}
              className="block bg-slate-950 max-w-full"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>

          {/* Legend panel */}
          <div className="w-full max-w-3xl bg-slate-900 border-4 border-slate-700 rounded-none p-4 mt-6 grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs font-pixel-body text-center">
            {NPC_LIST.map((npc) => (
              <div key={npc.type} className="flex flex-col items-center gap-1">
                <img 
                  src={processedSprites[npc.type] || CHARACTER_SPRITES[npc.type]} 
                  alt={npc.type} 
                  className="w-10 h-10 object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
                <span className="text-teal-400">{preProcessDistortionName(npc.type)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Conversation/Battle Phase Render
  return (
    <div className="min-h-screen bg-slate-950 text-white font-poppins flex flex-col p-6 overflow-x-hidden relative">
      
      {/* Dialogue Header */}
      <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto w-full z-10">
        <button 
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border-2 border-slate-700 hover:border-slate-500 rounded-none text-white font-pixel-body text-lg transition"
        >
          <ArrowLeft size={16} />
          SELECT DISTORTION
        </button>
        <div className="flex items-center gap-2">
          <span className="font-pixel-body text-xl text-teal-400 tracking-wider font-bold">
            {preProcessDistortionName(selectedType).toUpperCase()}
          </span>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch z-10 mb-6">
        
        {/* Left Column: Portrait, Stats & Clarity meter */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-slate-900 border-4 border-slate-700 rounded-none p-6 flex flex-col gap-6 shadow-none h-full justify-between">
            <div>
              <span className="font-pixel-body text-sm uppercase font-bold tracking-wider text-purple-400">Current Pattern</span>
              <h2 className="font-pixel-body text-3xl font-bold mt-1 text-white leading-tight">
                {preProcessDistortionName(selectedType)}
              </h2>
              
              {/* Character Portrait */}
              <div className="w-full aspect-square bg-slate-950 border-4 border-slate-700 rounded-none overflow-hidden my-4">
                <img 
                  src={processedSprites[selectedType] || CHARACTER_SPRITES[selectedType]} 
                  alt={selectedType}
                  className="w-full h-full object-cover"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>

              <p className="text-slate-300 text-sm leading-relaxed border-b border-slate-700 pb-4">
                {distortionTypes[selectedType]}
              </p>

              {/* Clarity meter */}
              <div className="mt-6 space-y-3">
                <div className="flex justify-between items-end">
                  <span className="font-pixel-body text-base text-slate-400 font-semibold flex items-center gap-1">
                    <TrendingDown size={16} className="text-teal-400" />
                    DISTORTION INTENSITY
                  </span>
                  <span className={`font-pixel-body text-lg font-bold ${intensity > 50 ? 'text-red-400' : 'text-teal-400'}`}>
                    {intensity}%
                  </span>
                </div>
                <div className="bg-slate-950 border-4 border-slate-700 rounded-none h-7 relative p-[2px]">
                  <div 
                    className="h-full bg-red-700 transition-all duration-700 ease-out"
                    style={{ width: `${intensity}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 leading-relaxed italic mt-2">
                  Dismantle the negative voice by providing realistic, balanced perspectives. Reduce distortion intensity below 15% to resolve the thought.
                </p>
              </div>
            </div>

            {/* Support box */}
            <div className="bg-slate-950 border-2 border-teal-800 rounded-none p-4">
              <h4 className="font-pixel-body text-sm text-teal-400 font-bold mb-1 flex items-center gap-1">
                <Heart size={14} />
                CBT GUIDANCE
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Take a deep breath. Focus on gathering evidence against the negative claim. Try to think what you would say to a close friend facing the same doubt.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Chat Screen */}
        <div className="lg:col-span-8 flex flex-col bg-slate-900 border-4 border-slate-700 rounded-none p-6 shadow-none h-[600px] lg:h-auto justify-between">
          
          {/* Chat message feed */}
          <div className="flex-1 overflow-y-auto space-y-4 p-4 mb-4 bg-slate-950 border-4 border-slate-800 rounded-none flex flex-col justify-start">
            <AnimatePresence initial={false}>
              {chatLog.map((msg, index) => {
                if (msg.sender === 'monster') {
                  return (
                    <motion.div 
                      key={index}
                      className="flex flex-col max-w-[85%] self-start"
                      initial={prefersReducedMotion ? {} : { opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <span className="font-pixel-body text-xs text-purple-400 uppercase tracking-widest font-bold ml-1 mb-1">
                        Negative Voice
                      </span>
                      <div className="bg-purple-950 border-2 border-purple-800 text-purple-100 rounded-none p-4 shadow-none leading-relaxed text-sm">
                        {msg.text}
                      </div>
                    </motion.div>
                  );
                } else if (msg.sender === 'player') {
                  return (
                    <motion.div 
                      key={index}
                      className="flex flex-col max-w-[85%] self-end"
                      initial={prefersReducedMotion ? {} : { opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <span className="font-pixel-body text-xs text-teal-400 uppercase tracking-widest font-bold mr-1 mb-1 text-right">
                        Your Reframe
                      </span>
                      <div className="bg-indigo-950 border-2 border-indigo-700 text-white rounded-none p-4 shadow-none leading-relaxed text-sm">
                        {msg.text}
                      </div>
                    </motion.div>
                  );
                } else {
                  // Feedback from evaluation
                  return (
                    <motion.div 
                      key={index}
                      className="w-full flex justify-center py-2"
                      initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4 }}
                    >
                      <div className={`flex items-start gap-3 rounded-none p-4 border max-w-[90%] text-sm leading-relaxed ${
                        msg.isPositive 
                          ? 'bg-teal-950/40 border-teal-800/40 text-teal-200' 
                          : 'bg-amber-950/40 border-amber-800/40 text-amber-200'
                      }`}>
                        <div className="mt-[2px] flex-shrink-0">
                          {msg.isPositive ? <CheckCircle size={18} className="text-teal-400" /> : <AlertCircle size={18} className="text-amber-400" />}
                        </div>
                        <div>
                          <span className="font-pixel-body text-xs block uppercase font-bold tracking-wider text-slate-400 mb-1">
                            CBT REFLECTION
                          </span>
                          {msg.text}
                        </div>
                      </div>
                    </motion.div>
                  );
                }
              })}
            </AnimatePresence>

            {isLoading && (
              <motion.div 
                className="flex items-center gap-2 self-start bg-slate-900 border-2 border-slate-800 rounded-none p-4 text-slate-400 text-sm font-pixel-body"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                EVALUATING THOUGHT REFRAME...
              </motion.div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Form input panel */}
          <form onSubmit={handleSubmitReframe} className="space-y-3">
            {error && (
              <div className="flex items-center gap-2 bg-red-950/40 border-2 border-red-800 rounded-none p-3 text-red-200 text-sm">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                <p className="flex-1 font-pixel-body">{error}</p>
              </div>
            )}

            <div className="relative flex flex-col md:flex-row items-stretch gap-3">
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type your healthy reframe here..."
                disabled={isLoading || stage === 'settled'}
                maxLength={400}
                className="flex-1 bg-slate-950 border-2 border-slate-700 rounded-none p-4 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none min-h-[80px] disabled:opacity-50 text-sm leading-relaxed"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitReframe(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={!userInput.trim() || isLoading || stage === 'settled'}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border-4 border-slate-600 disabled:border-slate-800 disabled:bg-slate-900 text-white font-pixel-body text-base font-bold rounded-none shadow-none transition duration-200 flex items-center justify-center gap-2 self-end md:self-stretch disabled:opacity-50"
              >
                <Send size={18} />
                SEND
              </button>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-400 px-1 font-pixel-body">
              <span>Press Enter to send</span>
              <span>{userInput.length}/400 chars</span>
            </div>
          </form>
        </div>
      </div>

      {/* Settle Resolution Overlay Stage */}
      <AnimatePresence>
        {stage === 'settled' && (
          <motion.div 
            className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-6"
            initial={prefersReducedMotion ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-slate-900 border-8 border-slate-700 rounded-none p-8 max-w-xl w-full text-center shadow-none relative overflow-hidden"
              initial={prefersReducedMotion ? {} : { scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              transition={{ duration: 0.5, type: 'spring' }}
            >
              <div className="w-20 h-20 bg-slate-950 border-4 border-teal-500 rounded-none flex items-center justify-center mx-auto mb-6 text-teal-400">
                <CheckCircle size={40} className="animate-pulse" />
              </div>

              <h2 className="text-xl md:text-2xl font-pixel-title leading-relaxed mb-6 text-teal-400">
                THE THOUGHT HAS SETTLED
              </h2>

              <p className="text-slate-300 text-base leading-relaxed mb-8">
                Through mindful CBT reframing, you have successfully dismantled the negative distortion and reduced its intensity down to <span className="text-teal-400 font-bold">{intensity}%</span>. The voice has lost its grip, and calm clarity is restored to your mind.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={handleReset}
                  className="px-6 py-4 bg-slate-950 border-4 border-slate-700 hover:border-slate-500 rounded-none text-white font-pixel-body text-lg font-bold transition flex items-center justify-center gap-2"
                >
                  <RotateCcw size={18} />
                  REFRAME ANOTHER
                </button>
                <button
                  onClick={handleBack}
                  className="px-6 py-4 bg-gradient-to-r from-teal-500 to-emerald-600 border-4 border-teal-400 text-slate-950 font-pixel-body text-lg font-bold rounded-none shadow-none transition flex items-center justify-center gap-2 hover:scale-[1.02]"
                >
                  <Award size={18} />
                  COMPLETE SESSION
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReframeGame;
