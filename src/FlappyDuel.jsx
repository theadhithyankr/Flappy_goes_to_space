import React, { useState, useEffect, useRef } from 'react';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GROUND_HEIGHT = 50;
const BIRD_WIDTH = 30;
const BIRD_HEIGHT = 30;
const ALIEN_WIDTH = 40;
const ALIEN_HEIGHT = 40;
const PILLAR_WIDTH = 70;
const MIN_GAP_SIZE = 120;
const MAX_GAP_SIZE = 200;

export default function FlappyDuel() {
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  
  const [screen, setScreen] = useState('start'); // 'start', 'playing', 'gameover'
  const [finalScore, setFinalScore] = useState(0);
  const [gameMode, setGameMode] = useState('blended'); // 'original', 'blended', 'space'

  const getAltitude = (score, mode) => {
    if (mode === 'original') return 0;
    if (mode === 'space') return 1;
    return Math.min(1, score / 20); // blended
  };

  const gameState = useRef({
    bird: { x: 100, y: CANVAS_HEIGHT / 2, vy: 0, rotation: 0 },
    pillars: [],
    score: 0,
    groundX: 0,
    stars: [],
    planets: [],
    
    // Shooter mini-game state
    phase: 'pillars', // 'pillars', 'shooter_transition', 'shooter'
    shooterTriggered: { 25: false, 50: false, 100: false },
    aliens: [],
    bullets: [],
    aliensToDefeat: 0,
    frames: 0,
    lastShotFrame: 0
  });

  const keys = useRef({});

  const initGame = () => {
    const stars = Array.from({length: 150}).map(() => ({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * CANVAS_HEIGHT,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.8 + 0.2
    }));

    const planets = [
      { x: CANVAS_WIDTH + 100, y: 100, size: 80, color: '#ff6b6b', speed: 0.2 },
      { x: CANVAS_WIDTH + 600, y: 400, size: 120, color: '#4ecdc4', speed: 0.5, ring: true },
      { x: CANVAS_WIDTH + 1200, y: 200, size: 40, color: '#ffe66d', speed: 0.7 }
    ];

    gameState.current = {
      bird: { x: 100, y: CANVAS_HEIGHT / 2, vy: 0, rotation: 0 },
      pillars: [{ x: CANVAS_WIDTH / 2 + 200, gapCenter: CANVAS_HEIGHT / 2, gapSize: 200, passed: false }],
      score: 0,
      groundX: 0,
      stars,
      planets,
      phase: 'pillars',
      shooterTriggered: { 25: false, 50: false, 100: false },
      aliens: [],
      bullets: [],
      aliensToDefeat: 0,
      frames: 0,
      lastShotFrame: 0
    };
  };

  const handleKeyDown = (e) => {
    keys.current[e.code] = true;
    
    const altitude = getAltitude(gameState.current.score, gameMode);
    const isInSpace = altitude >= 0.8;

    if (e.code === 'Space' || e.code === 'KeyW') {
      if (screen === 'start') {
        initGame();
        setScreen('playing');
      } else if (screen === 'gameover') {
        setScreen('start');
      } else if (screen === 'playing' && !isInSpace) {
        gameState.current.bird.vy = -8; // Flap power
      }
    }
  };

  const handleKeyUp = (e) => {
    keys.current[e.code] = false;
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [screen, gameMode]);

  const update = () => {
    if (screen !== 'playing') return;
    
    const state = gameState.current;
    const { bird, pillars, planets, stars, aliens, bullets } = state;
    state.frames++;

    const altitude = getAltitude(state.score, gameMode);
    const baseSpeed = 4 + (altitude >= 0.8 ? (state.score / 50) : 0); // Speed scales up in space
    const currentSpeed = Math.min(baseSpeed, 12); // cap speed
    const currentGravity = 0.5 * (1 - altitude); // Gravity fades 
    
    // --- BIRD MOVEMENT & PHYSICS ---
    const upThrust = (keys.current['Space'] || keys.current['KeyW']) && altitude >= 0.8;
    const downThrust = keys.current['KeyS'] && altitude >= 0.8;

    if (upThrust) bird.vy -= 0.5;
    if (downThrust) bird.vy += 0.5;

    bird.vy += currentGravity;
    
    if (altitude >= 0.8) {
      bird.vy *= 0.92; // Friction in zero-G
    }

    bird.y += bird.vy;
    
    if (bird.vy < -1) {
      bird.rotation = Math.max(-0.5, bird.rotation - 0.1);
    } else if (bird.vy > 1) {
      bird.rotation = Math.min(Math.PI / 4, bird.rotation + 0.05);
    } else {
      bird.rotation *= 0.9;
    }

    state.groundX = (state.groundX - currentSpeed) % 20;

    const bLeft = bird.x + 4;
    const bRight = bird.x + BIRD_WIDTH - 4;
    const bTop = bird.y + 4;
    const bBottom = bird.y + BIRD_HEIGHT - 4;

    const groundOffset = altitude * (GROUND_HEIGHT + 20);
    // Floor/Ceiling collisions
    if (bBottom >= CANVAS_HEIGHT - Math.max(0, GROUND_HEIGHT - groundOffset) || bTop <= 0) {
      setFinalScore(state.score);
      setScreen('gameover');
      return;
    }

    // --- PHASE MANAGEMENT ---
    // Check if we hit a milestone (25, 50, 100)
    if (state.phase === 'pillars' && altitude >= 0.8) {
      if (state.score === 25 && !state.shooterTriggered[25]) {
        state.phase = 'shooter_transition';
        state.shooterTriggered[25] = true;
        state.aliensToDefeat = 10;
      } else if (state.score === 50 && !state.shooterTriggered[50]) {
        state.phase = 'shooter_transition';
        state.shooterTriggered[50] = true;
        state.aliensToDefeat = 20;
      } else if (state.score === 100 && !state.shooterTriggered[100]) {
        state.phase = 'shooter_transition';
        state.shooterTriggered[100] = true;
        state.aliensToDefeat = 35;
      }
    }

    if (state.phase === 'shooter_transition') {
      // Wait for pillars to clear screen
      if (pillars.length === 0 || pillars[pillars.length - 1].x < -PILLAR_WIDTH) {
        pillars.length = 0;
        state.phase = 'shooter';
      }
    }


    // --- ENTITY UPDATES ---
    
    // Background Planets
    if (altitude > 0.2) {
      for (let planet of planets) {
        planet.x -= currentSpeed * planet.speed;
        if (planet.x + planet.size * 2 < 0) {
          planet.x = CANVAS_WIDTH + Math.random() * 500;
          planet.y = Math.random() * CANVAS_HEIGHT;
        }
      }
    }
    
    if (state.phase !== 'shooter') {
      // 1. Pillars Update
      let spawnNew = false;
      for (let p of pillars) {
        p.x -= currentSpeed;
        
        if (!p.passed && p.x + PILLAR_WIDTH < bird.x) {
          p.passed = true;
          state.score++;
        }
        
        // Collision against normal pillars
        const gapTop = p.gapCenter - p.gapSize / 2;
        const gapBottom = p.gapCenter + p.gapSize / 2;

        if (bRight > p.x && bLeft < p.x + PILLAR_WIDTH) {
          if (bTop < gapTop || bBottom > gapBottom) {
            setFinalScore(state.score);
            setScreen('gameover');
            return;
          }
        }
      }

      if (state.phase === 'pillars') {
        if (pillars.length === 0 || pillars[pillars.length - 1].x < CANVAS_WIDTH - 250 - (currentSpeed * 10)) {
          spawnNew = true;
        }
      }

      if (spawnNew) {
        const gapSize = Math.max(MIN_GAP_SIZE, MAX_GAP_SIZE - (state.score * 2));
        const minCenter = gapSize / 2 + 50;
        const maxCenter = CANVAS_HEIGHT - gapSize / 2 - 50;
        const randomCenter = Math.random() * (maxCenter - minCenter) + minCenter;
        
        pillars.push({
          x: CANVAS_WIDTH,
          gapCenter: randomCenter,
          gapSize: gapSize,
          passed: false
        });
      }

      if (pillars.length > 0 && pillars[0].x + PILLAR_WIDTH < 0) {
        pillars.shift();
      }

    } else if (state.phase === 'shooter') {
      // 2. Shooter Mini-game Update
      
      // Bird can shoot
      if (keys.current['Enter'] || keys.current['KeyD'] || upThrust || downThrust) {
        if (state.frames - state.lastShotFrame > 15) { // Cooldown
          bullets.push({ x: bird.x + BIRD_WIDTH, y: bird.y + BIRD_HEIGHT / 2, active: true });
          state.lastShotFrame = state.frames;
        }
      }

      // Spawn Aliens
      if (state.frames % 60 === 0 && Math.random() > 0.3) {
        aliens.push({
          x: CANVAS_WIDTH,
          y: 50 + Math.random() * (CANVAS_HEIGHT - 100),
          vy: (Math.random() - 0.5) * 4,
          active: true
        });
      }

      // Update Bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += 10;
        if (b.x > CANVAS_WIDTH || !b.active) bullets.splice(i, 1);
      }

      // Update Aliens
      for (let i = aliens.length - 1; i >= 0; i--) {
        const a = aliens[i];
        a.x -= currentSpeed * 1.5;
        a.y += a.vy;
        
        if (a.y < 50 || a.y > CANVAS_HEIGHT - 50) a.vy *= -1; // Bounce off edges
        
        // Bullet collision
        for (let j = bullets.length - 1; j >= 0; j--) {
          const bul = bullets[j];
          if (bul.active && a.active && bul.x > a.x && bul.x < a.x + ALIEN_WIDTH && bul.y > a.y && bul.y < a.y + ALIEN_HEIGHT) {
            bul.active = false;
            a.active = false;
            state.aliensToDefeat--;
          }
        }
        
        // Bird collision
        if (a.active && bRight > a.x && bLeft < a.x + ALIEN_WIDTH && bTop < a.y + ALIEN_HEIGHT && bBottom > a.y) {
          setFinalScore(state.score);
          setScreen('gameover');
          return;
        }

        if (a.x + ALIEN_WIDTH < 0 || !a.active) aliens.splice(i, 1);
      }

      // End shooter phase
      if (state.aliensToDefeat <= 0) {
        state.aliens.length = 0;
        state.bullets.length = 0;
        // Increase score so we don't trigger it again immediately
        state.score++; 
        state.phase = 'pillars';
      }
    }
  };

  const draw = (ctx) => {
    const state = gameState.current;
    const altitude = getAltitude(state.score, gameMode);

    // --- BACKGROUND ---
    const lerp = (start, end, t) => start + (end - start) * t;
    const r = Math.round(lerp(113, 8, altitude));
    const g = Math.round(lerp(197, 9, altitude));
    const b = Math.round(lerp(207, 30, altitude));
    
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (altitude > 0) {
      const baseSpeed = 4 + (altitude >= 0.8 ? (state.score / 50) : 0);
      
      // Stars
      state.stars.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * altitude})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        star.x -= baseSpeed * 0.05 * (star.size);
        if (star.x < 0) star.x = CANVAS_WIDTH;
      });

      // Planets
      state.planets.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = altitude;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        if (p.ring) {
          ctx.strokeStyle = 'rgba(255,255,255,0.4)';
          ctx.lineWidth = 10;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.size * 1.5, p.size * 0.4, Math.PI / 6, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1.0;
      });
    }

    // --- FOREGROUND ---
    const pr = Math.round(lerp(116, 120, Math.max(0, altitude - 0.2)));
    const pg = Math.round(lerp(191, 130, Math.max(0, altitude - 0.2)));
    const pb = Math.round(lerp(46, 140, Math.max(0, altitude - 0.2)));
    
    ctx.fillStyle = `rgb(${pr}, ${pg}, ${pb})`;
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    
    // Pillars
    for (let p of state.pillars) {
      const gapTop = p.gapCenter - p.gapSize / 2;
      const gapBottom = p.gapCenter + p.gapSize / 2;
      
      ctx.fillRect(p.x, 0, PILLAR_WIDTH, gapTop);
      ctx.strokeRect(p.x, 0, PILLAR_WIDTH, gapTop);
      ctx.fillRect(p.x - 2, gapTop - 20, PILLAR_WIDTH + 4, 20);
      ctx.strokeRect(p.x - 2, gapTop - 20, PILLAR_WIDTH + 4, 20);

      let bottomLimit = CANVAS_HEIGHT;
      const groundDrop = altitude * (GROUND_HEIGHT + 20);
      if (GROUND_HEIGHT - groundDrop > 0) bottomLimit -= (GROUND_HEIGHT - groundDrop);
      
      const bottomHeight = Math.max(0, bottomLimit - gapBottom);
      if (bottomHeight > 0) {
        ctx.fillRect(p.x, gapBottom, PILLAR_WIDTH, bottomHeight);
        ctx.strokeRect(p.x, gapBottom, PILLAR_WIDTH, bottomHeight);
        ctx.fillRect(p.x - 2, gapBottom, PILLAR_WIDTH + 4, 20);
        ctx.strokeRect(p.x - 2, gapBottom, PILLAR_WIDTH + 4, 20);
      }
    }

    // Ground
    const currentGroundY = CANVAS_HEIGHT - GROUND_HEIGHT + (altitude * (GROUND_HEIGHT + 50));
    if (currentGroundY < CANVAS_HEIGHT) {
      ctx.fillStyle = '#ded895';
      ctx.fillRect(0, currentGroundY, CANVAS_WIDTH, CANVAS_HEIGHT - currentGroundY);
      ctx.fillStyle = '#74BF2E';
      ctx.fillRect(0, currentGroundY, CANVAS_WIDTH, 10);
      
      ctx.fillStyle = '#c5bf7e';
      for (let i = 0; i <= CANVAS_WIDTH / 20 + 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 20 + state.groundX, currentGroundY + 10);
        ctx.lineTo(i * 20 + 10 + state.groundX, CANVAS_HEIGHT);
        ctx.lineTo(i * 20 + 20 + state.groundX, CANVAS_HEIGHT);
        ctx.lineTo(i * 20 + 10 + state.groundX, currentGroundY + 10);
        ctx.fill();
      }
    }

    // --- SHOOTER PHASE ENTITIES ---
    if (state.phase === 'shooter') {
      ctx.fillStyle = 'red';
      for (let a of state.aliens) {
        if (!a.active) continue;
        ctx.beginPath();
        ctx.arc(a.x + ALIEN_WIDTH/2, a.y + ALIEN_HEIGHT/2, ALIEN_WIDTH/2, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#333'; // Alien visor
        ctx.fillRect(a.x + 5, a.y + 10, 15, 10);
        ctx.fillStyle = 'red';
      }

      ctx.fillStyle = '#0f0';
      for (let b of state.bullets) {
        if (b.active) {
          ctx.fillRect(b.x, b.y - 2, 15, 4);
        }
      }
      
      // Draw objective counter
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Aliens to defeat: ${state.aliensToDefeat}`, CANVAS_WIDTH / 2, 90);
    }

    // --- BIRD ---
    ctx.save();
    ctx.translate(state.bird.x + BIRD_WIDTH / 2, state.bird.y + BIRD_HEIGHT / 2);
    ctx.rotate(state.bird.rotation);
    
    if (altitude >= 0.8) {
      if (keys.current['Space'] || keys.current['KeyW']) {
        ctx.fillStyle = '#ff9900';
        ctx.beginPath();
        ctx.moveTo(-BIRD_WIDTH/2 + 5, BIRD_HEIGHT/2);
        ctx.lineTo(-BIRD_WIDTH/2 + 25, BIRD_HEIGHT/2);
        ctx.lineTo(-BIRD_WIDTH/2 + 15, BIRD_HEIGHT/2 + 20 + Math.random() * 10);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(-BIRD_WIDTH/2 + 10, BIRD_HEIGHT/2);
        ctx.lineTo(-BIRD_WIDTH/2 + 20, BIRD_HEIGHT/2);
        ctx.lineTo(-BIRD_WIDTH/2 + 15, BIRD_HEIGHT/2 + 15);
        ctx.fill();
      }
      
      if (keys.current['KeyS']) {
        ctx.fillStyle = '#ff9900'; 
        ctx.beginPath();
        ctx.moveTo(-BIRD_WIDTH/2 + 5, -BIRD_HEIGHT/2);
        ctx.lineTo(-BIRD_WIDTH/2 + 25, -BIRD_HEIGHT/2);
        ctx.lineTo(-BIRD_WIDTH/2 + 15, -BIRD_HEIGHT/2 - 20 - Math.random() * 10);
        ctx.fill();
      }
    }

    if (altitude > 0.3) {
      ctx.fillStyle = `rgba(255, 255, 255, ${altitude * 0.4})`;
      ctx.beginPath();
      ctx.arc(0, 0, BIRD_WIDTH/1.1, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 255, 255, ${altitude * 0.8})`;
      ctx.stroke();
    }

    ctx.fillStyle = '#f4d03f';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.fillRect(-BIRD_WIDTH / 2, -BIRD_HEIGHT / 2, BIRD_WIDTH, BIRD_HEIGHT);
    ctx.strokeRect(-BIRD_WIDTH / 2, -BIRD_HEIGHT / 2, BIRD_WIDTH, BIRD_HEIGHT);
    
    ctx.fillStyle = '#fff';
    ctx.fillRect(BIRD_WIDTH / 4, -BIRD_HEIGHT / 4 - 2, 8, 8);
    ctx.fillStyle = '#000';
    ctx.fillRect(BIRD_WIDTH / 4 + 4, -BIRD_HEIGHT / 4, 2, 4);
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(BIRD_WIDTH / 2, 0, 10, 8);
    ctx.strokeRect(BIRD_WIDTH / 2, 0, 10, 8);
    
    ctx.restore();

    // --- HUD ---
    if (screen === 'playing') {
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 4;
      ctx.font = 'bold 48px sans-serif';
      ctx.textAlign = 'center';
      
      if (state.phase === 'shooter_transition') {
        ctx.strokeText(`WARNING: HOSTILES INBOUND`, CANVAS_WIDTH / 2, 60);
        ctx.fillText(`WARNING: HOSTILES INBOUND`, CANVAS_WIDTH / 2, 60);
      } else {
        ctx.strokeText(Math.floor(state.score).toString(), CANVAS_WIDTH / 2, 60);
        ctx.fillText(Math.floor(state.score).toString(), CANVAS_WIDTH / 2, 60);
      }
    }
  };

  const loop = () => {
    update();
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) draw(ctx);
    requestRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [screen, gameMode]);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 font-sans">
      <div className="relative" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border-4 border-gray-700 rounded-lg shadow-2xl block"
        />

        {/* Start Screen Overlay */}
        {screen === 'start' && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white text-center p-8 transition-opacity duration-500 rounded-lg">
            <h1 className="text-5xl font-black mb-4 text-purple-400 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] tracking-wider">
              FLAPPY GOES TO SPACE
            </h1>
            <p className="text-xl mb-6 font-medium text-gray-300">
              Select your mode to begin
            </p>

            <div className="flex gap-4 mb-10 text-lg font-bold z-10 pointer-events-auto">
              <button 
                onClick={() => setGameMode('original')}
                className={`px-6 py-2 border-2 rounded transition-colors ${gameMode === 'original' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700'}`}
              >
                Classic
              </button>
              <button 
                onClick={() => setGameMode('blended')}
                className={`px-6 py-2 border-2 rounded transition-colors ${gameMode === 'blended' ? 'bg-purple-600 border-purple-400 text-white' : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700'}`}
              >
                Blended
              </button>
              <button 
                onClick={() => setGameMode('space')}
                className={`px-6 py-2 border-2 rounded transition-colors ${gameMode === 'space' ? 'bg-gray-900 border-gray-400 text-white' : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700'}`}
              >
                Deep Space
              </button>
            </div>
            
            <p className="text-2xl font-bold animate-pulse text-white bg-purple-600 px-8 py-4 rounded-full border-4 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.5)]">
              PRESS SPACE TO START
            </p>
          </div>
        )}

        {/* Game Over Screen Overlay */}
        {screen === 'gameover' && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white text-center rounded-lg">
            <h1 className="text-6xl font-black mb-4 uppercase drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] text-red-500">
              GAME OVER
            </h1>

            <div className="bg-gray-800 p-8 rounded-2xl border-4 border-gray-700 shadow-2xl mb-8">
              <p className="text-2xl mb-2 text-gray-300">Final Score</p>
              <p className="text-7xl font-bold text-white mb-2">{finalScore}</p>
              <p className="text-md text-gray-400">
                {finalScore < 25 
                  ? "Gravity/Obstacles won this time." 
                  : "Stunning! You are a space pioneer."}
              </p>
            </div>

            <p className="text-xl font-bold animate-pulse bg-white text-black px-8 py-4 rounded-full hover:bg-gray-200 transition-colors">
              PRESS SPACE TO TRY AGAIN
            </p>
          </div>
        )}
      </div>
    </div>
  );
}