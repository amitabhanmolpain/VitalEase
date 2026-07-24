import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';

// Tile Map: 0 = Walkable, 1 = Wall, 2 = Door
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
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

const ReframeWorldTest = () => {
  const canvasRef = useRef(null);
  
  // Game Loop States & Refs
  const player = useRef({
    x: 60, // col 1.5 * 40
    y: 60, // row 1.5 * 40
    radius: 12,
    speed: 150 // pixels per second
  });
  
  const keysPressed = useRef({});
  const hasLoggedDoor = useRef(false);
  const animationFrameId = useRef(null);
  const lastTime = useRef(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const listener = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // Keyboard Event Handlers
  useEffect(() => {
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
  }, []);

  // Collision Checking
  // Bounding box collision against wall tiles
  const checkCollision = (newX, newY) => {
    const r = player.current.radius;
    // Four bounding box corners around the circle
    const corners = [
      { x: newX - r, y: newY - r }, // Top-Left
      { x: newX + r, y: newY - r }, // Top-Right
      { x: newX - r, y: newY + r }, // Bottom-Left
      { x: newX + r, y: newY + r }  // Bottom-Right
    ];

    for (let corner of corners) {
      const col = Math.floor(corner.x / TILE_SIZE);
      const row = Math.floor(corner.y / TILE_SIZE);

      // Check map bounds
      if (col < 0 || col >= COLS || row < 0 || row >= ROWS) {
        return true;
      }

      // Check wall tile
      if (TILE_MAP[row][col] === 1) {
        return true;
      }
    }

    return false;
  };

  // Check if player is standing on the door
  const checkDoor = (x, y) => {
    const col = Math.floor(x / TILE_SIZE);
    const row = Math.floor(y / TILE_SIZE);

    if (col >= 0 && col < COLS && row >= 0 && row < ROWS) {
      return TILE_MAP[row][col] === 2;
    }
    return false;
  };

  // Main Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const updateAndRender = (timestamp) => {
      if (!lastTime.current) lastTime.current = timestamp;
      // Cap delta time to prevent large leaps during lag
      const dt = Math.min((timestamp - lastTime.current) / 1000, 0.1);
      lastTime.current = timestamp;

      // 1. Move Player
      let dx = 0;
      let dy = 0;

      if (keysPressed.current['w'] || keysPressed.current['arrowup']) dy -= 1;
      if (keysPressed.current['s'] || keysPressed.current['arrowdown']) dy += 1;
      if (keysPressed.current['a'] || keysPressed.current['arrowleft']) dx -= 1;
      if (keysPressed.current['d'] || keysPressed.current['arrowright']) dx += 1;

      // Normalize diagonal speed
      if (dx !== 0 && dy !== 0) {
        const length = Math.sqrt(dx * dx + dy * dy);
        dx /= length;
        dy /= length;
      }

      const moveAmount = player.current.speed * dt;
      let targetX = player.current.x + dx * moveAmount;
      let targetY = player.current.y + dy * moveAmount;

      // Axis-by-axis collision checking to allow smooth wall-sliding
      if (!checkCollision(targetX, player.current.y)) {
        player.current.x = targetX;
      }
      if (!checkCollision(player.current.x, targetY)) {
        player.current.y = targetY;
      }

      // 2. Door triggers
      const isOnDoor = checkDoor(player.current.x, player.current.y);
      if (isOnDoor) {
        if (!hasLoggedDoor.current) {
          console.log("entered door");
          hasLoggedDoor.current = true;
        }
      } else {
        hasLoggedDoor.current = false;
      }

      // 3. Render map
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const tile = TILE_MAP[r][c];
          if (tile === 1) {
            ctx.fillStyle = '#1e293b'; // Slate-800 wall
          } else if (tile === 2) {
            ctx.fillStyle = '#eab308'; // Yellow-500 door
          } else {
            ctx.fillStyle = '#cbd5e1'; // Slate-300 floor
          }
          ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          
          // Draw thin outline grid for retro feel
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }

      // 4. Render Player (Retro RPG styled character sprite box)
      ctx.fillStyle = '#ef4444'; // Red character
      ctx.fillRect(
        player.current.x - player.current.radius,
        player.current.y - player.current.radius,
        player.current.radius * 2,
        player.current.radius * 2
      );

      // Character border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        player.current.x - player.current.radius,
        player.current.y - player.current.radius,
        player.current.radius * 2,
        player.current.radius * 2
      );

      // Choice: Smooth pixel-based movement with axis-aligned bounding box collision detection for a responsive feeling.
      animationFrameId.current = requestAnimationFrame(updateAndRender);
    };

    animationFrameId.current = requestAnimationFrame(updateAndRender);

    return () => {
      cancelAnimationFrame(animationFrameId.current);
    };
  }, []);

  const handleBack = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-poppins flex flex-col items-center justify-center p-6 select-none">
      
      {/* HUD Header */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-4">
        <button 
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border-4 border-slate-700 hover:border-slate-500 rounded-none text-white font-pixel-body text-lg transition"
        >
          <ArrowLeft size={16} />
          BACK
        </button>
        <span className="font-pixel-title text-sm text-teal-400 tracking-wider">ENGINE TEST</span>
      </div>

      {/* Screen container */}
      <div className="bg-slate-900 border-8 border-slate-700 rounded-none p-2 shadow-none max-w-full overflow-auto">
        <canvas 
          ref={canvasRef} 
          width={COLS * TILE_SIZE} 
          height={ROWS * TILE_SIZE}
          className="block bg-slate-950 max-w-full"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* Retro Instructions Panel */}
      <div className="w-full max-w-4xl bg-slate-900 border-4 border-slate-700 rounded-none p-4 mt-6 text-center">
        <h3 className="font-pixel-body text-xl text-teal-400 font-bold mb-2">
          CONTROLS: WASD / ARROW KEYS TO MOVE
        </h3>
        <p className="text-slate-300 text-sm leading-relaxed max-w-xl mx-auto">
          Verify collision detection by pushing against dark walls. Walk onto the yellow tile on the bottom-right corner to trigger a console log.
        </p>
      </div>

    </div>
  );
};

export default ReframeWorldTest;
