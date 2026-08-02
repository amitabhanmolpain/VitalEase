import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Zap, Target, Award, Volume2, VolumeX, Sparkles, Music } from 'lucide-react';
import useGameStore from '../../store/gameStore';
import { statsAPI } from '../../services/statsApi';
import XPBar from './UI/XPBar';
import LevelBadge from './UI/LevelBadge';
import ChoiceButton from './UI/ChoiceButton';
import FeedbackPopup from './UI/FeedbackPopup';
import MusicPlayer from './UI/MusicPlayer';
import DoomsdayDragon from './Enemies/DoomsdayDragon';
import SelfDoubtSlime from './Enemies/SelfDoubtSlime';
import AnxietyGhost from './Enemies/AnxietyGhost';
import HopelessnessTroll from './Enemies/HopelessnessTroll';

const renderBadgeIcon = (name) => {
  let badgeTitle = name;
  let emoji = "🎖️";
  let colors = {
    bg: "from-slate-700 to-slate-900",
    border: "border-slate-500",
    glow: "shadow-slate-500/30"
  };

  if (name.includes("Level")) {
    const lvlNum = parseInt(name.replace(/\D/g, "")) || 1;
    if (lvlNum === 1) {
      emoji = "🛡️";
      colors = {
        bg: "from-blue-500 via-indigo-600 to-indigo-850",
        border: "border-blue-400",
        glow: "shadow-blue-500/40"
      };
    } else if (lvlNum === 2) {
      emoji = "⚔️";
      colors = {
        bg: "from-cyan-500 via-teal-600 to-teal-850",
        border: "border-cyan-400",
        glow: "shadow-cyan-500/40"
      };
    } else if (lvlNum === 3) {
      emoji = "👑";
      colors = {
        bg: "from-yellow-400 via-amber-500 to-amber-700",
        border: "border-yellow-300",
        glow: "shadow-yellow-500/40"
      };
    } else if (lvlNum === 4) {
      emoji = "🔮";
      colors = {
        bg: "from-purple-500 via-pink-600 to-pink-850",
        border: "border-purple-400",
        glow: "shadow-purple-500/40"
      };
    } else {
      emoji = "⚡";
      colors = {
        bg: "from-red-500 via-orange-500 to-yellow-600",
        border: "border-orange-400",
        glow: "shadow-orange-500/40"
      };
    }
  } else if (name === "Mind Warrior") {
    emoji = "🥋";
    colors = {
      bg: "from-emerald-500 to-teal-600",
      border: "border-emerald-400",
      glow: "shadow-emerald-500/30"
    };
  } else if (name === "Thought Champion") {
    emoji = "🏆";
    colors = {
      bg: "from-yellow-400 to-amber-500",
      border: "border-yellow-300",
      glow: "shadow-yellow-400/30"
    };
  } else if (name === "10 Victories") {
    emoji = "🥇";
    colors = {
      bg: "from-yellow-500 to-yellow-600",
      border: "border-yellow-300",
      glow: "shadow-yellow-500/30"
    };
  } else if (name === "Battle Master") {
    emoji = "🎖️";
    colors = {
      bg: "from-rose-500 to-red-600",
      border: "border-rose-400",
      glow: "shadow-rose-500/30"
    };
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg ${colors.glow} text-white hover:bg-white/10 transition-all cursor-pointer`}>
      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${colors.bg} border-2 ${colors.border} flex items-center justify-center relative shadow-inner overflow-hidden flex-shrink-0`}>
        {/* Shiny Gloss Highlight */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/20 rounded-t-full pointer-events-none" />
        <span className="text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">{emoji}</span>
      </div>
      <span className="font-extrabold text-sm tracking-wide whitespace-nowrap">{badgeTitle}</span>
    </div>
  );
};

const BattleArena = ({ onExit }) => {
  const {
    xp,
    level,
    streak,
    victories,
    totalBattles,
    badges,
    currentScenario,
    scenarios,
    showResult,
    lastResult,
    soundEnabled,
    loading,
    addXP,
    incrementStreak,
    resetStreak,
    incrementVictories,
    incrementBattles,
    setResult,
    nextScenario,
    toggleSound
  } = useGameStore();

  const [enemyHit, setEnemyHit] = useState(false);
  const [enemyDefeated, setEnemyDefeated] = useState(false);
  const [buttonsDisabled, setButtonsDisabled] = useState(false);
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unlockedBadge, setUnlockedBadge] = useState(null);

  const playLevelUpSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.25, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.5);
      });
    } catch (e) {
      console.error(e);
    }
  };

  const scenario = scenarios[currentScenario];

  const speakSituation = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = 1.0;
      utterance.rate = 0.95;
      
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Zira') || v.name.includes('David')));
      if (voice) {
        utterance.voice = voice;
      }
      window.speechSynthesis.speak(utterance);
    }
  };

  // Typing animation effect
  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    let currentIndex = 0;
    const text = scenario.situation;
    
    // Auto-speak situation loudly on load
    speakSituation(text);

    const typingInterval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.substring(0, currentIndex + 1));
        // Play typing sound every 3rd character
        if (currentIndex % 3 === 0) {
          import('../EmotionQuest/soundManager').then(module => {
            module.default.playTyping();
          });
        }
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typingInterval);
      }
    }, 30);

    return () => {
      clearInterval(typingInterval);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentScenario, scenario.situation]);

  useEffect(() => {
    // Auto-play music when battle starts
    setShowMusicPlayer(true);
  }, []);

  const getEnemyComponent = () => {
    switch (scenario.enemy) {
      case 'doomsday-dragon':
        return <DoomsdayDragon isHit={enemyHit} isDefeated={enemyDefeated} />;
      case 'self-doubt-slime':
        return <SelfDoubtSlime isHit={enemyHit} isDefeated={enemyDefeated} />;
      case 'anxiety-ghost':
        return <AnxietyGhost isHit={enemyHit} isDefeated={enemyDefeated} />;
      case 'hopelessness-troll':
        return <HopelessnessTroll isHit={enemyHit} isDefeated={enemyDefeated} />;
      default:
        return <DoomsdayDragon isHit={enemyHit} isDefeated={enemyDefeated} />;
    }
  };

  const getEnemyName = () => {
    switch (scenario.enemy) {
      case 'doomsday-dragon':
        return 'Doomsday Dragon';
      case 'self-doubt-slime':
        return 'Self-Doubt Slime';
      case 'anxiety-ghost':
        return 'Anxiety Ghost';
      case 'hopelessness-troll':
        return 'Hopelessness Troll';
      default:
        return 'Unknown Enemy';
    }
  };

  const playSound = (type) => {
    if (!soundEnabled) return;
    
    // Simple beep sounds using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'hit') {
      oscillator.frequency.value = 800;
      gainNode.gain.value = 0.3;
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    } else if (type === 'victory') {
      // Victory fanfare
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.value = freq;
        gain.gain.value = 0.2;
        osc.start(audioContext.currentTime + i * 0.15);
        osc.stop(audioContext.currentTime + i * 0.15 + 0.2);
      });
    } else if (type === 'wrong') {
      oscillator.frequency.value = 200;
      gainNode.gain.value = 0.2;
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
    }
  };

  const handleChoice = async (option) => {
    setButtonsDisabled(true);
    setEnemyHit(true);
    playSound('hit');
    
    incrementBattles();
    
    setTimeout(async () => {
      if (option.isCorrect) {
        setEnemyDefeated(true);
        playSound('victory');
        
        const oldLevel = level;
        addXP(20);
        incrementStreak();
        incrementVictories();

        // Level up or Streak badge check
        const newXP = xp + 20;
        const newLevel = Math.floor(newXP / 100) + 1;
        if (newLevel > oldLevel) {
          setTimeout(() => {
            playLevelUpSound();
            setUnlockedBadge(`Level ${newLevel} Warrior`);
          }, 1200);
        } else if (streak + 1 === 5 && !badges.includes("Mind Warrior")) {
          setTimeout(() => {
            playLevelUpSound();
            setUnlockedBadge("Mind Warrior");
          }, 1200);
        } else if (streak + 1 === 10 && !badges.includes("Thought Champion")) {
          setTimeout(() => {
            playLevelUpSound();
            setUnlockedBadge("Thought Champion");
          }, 1200);
        }
        
        const correctOption = scenario.options.find(opt => opt.isCorrect);
        setResult({
          isCorrect: true,
          feedback: option.feedback,
          correctAnswer: correctOption.text,
          streak: streak + 1
        });

        // Submit victory to backend
        try {
          await statsAPI.updateStats({
            game: 'thoughtbattle',
            win: true,
            xp: 20,
            badges: useGameStore.getState().badges
          });
        } catch (error) {
          console.error('Failed to update stats:', error);
        }
      } else {
        playSound('wrong');
        addXP(5);
        resetStreak();
        
        const correctOption = scenario.options.find(opt => opt.isCorrect);
        setResult({
          isCorrect: false,
          feedback: option.feedback,
          correctAnswer: correctOption.text,
          streak: 0
        });

        // Submit loss to backend
        try {
          await statsAPI.updateStats({
            game: 'thoughtbattle',
            win: false,
            xp: 5,
            badges: useGameStore.getState().badges
          });
        } catch (error) {
          console.error('Failed to update stats:', error);
        }
      }
      
      setEnemyHit(false);
    }, 800);
  };

  const handleNext = () => {
    setEnemyDefeated(false);
    setButtonsDisabled(false);
    nextScenario();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-zinc-950 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.5, 1]
            }}
            transition={{
              repeat: Infinity,
              duration: 3 + Math.random() * 2,
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>

      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        {/* Top Bar */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => {
              import('../../components/EmotionQuest/soundManager').then(m => m.default.playClick());
              onExit();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition backdrop-blur-sm"
            onMouseEnter={() => import('../../components/EmotionQuest/soundManager').then(m => m.default.playHover())}
          >
            <ArrowLeft size={20} />
            <span className="font-semibold">Exit Battle</span>
          </button>

          <div className="flex gap-2">
            {/* Play YouTube Music Button */}
            <motion.button
              onClick={() => {
                import('../EmotionQuest/soundManager').then(m => m.default.playClick());
                setShowMusicPlayer(true);
              }}
              className="p-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 rounded-xl text-white transition backdrop-blur-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Play Battle Music"
              onMouseEnter={() => import('../EmotionQuest/soundManager').then(m => m.default.playHover())}
            >
              <Music size={24} />
            </motion.button>

            <motion.button
              onClick={() => {
                import('../EmotionQuest/soundManager').then(m => m.default.playClick());
                toggleSound();
              }}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition backdrop-blur-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Mute Sound Effects"
              onMouseEnter={() => import('../EmotionQuest/soundManager').then(m => m.default.playHover())}
            >
              {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
            </motion.button>
          </div>
        </div>

        {/* Stats Bar */}
        <motion.div
          className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 mb-6 border border-white/10 shadow-2xl relative overflow-hidden"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-indigo-500/5 pointer-events-none" />
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center relative z-10">
            {/* Level Badge */}
            <div className="flex items-center justify-center">
              <LevelBadge level={level} />
            </div>

            {/* XP Bar */}
            <div className="md:col-span-2 flex items-center">
              <XPBar xp={xp} level={level} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 md:col-span-2">
              {/* Streak Card */}
              <motion.div 
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-center hover:bg-white/10 transition shadow-lg flex flex-col items-center justify-center"
                whileHover={{ scale: 1.05, y: -2 }}
              >
                {/* 3D Noto Lightning Bolt */}
                <svg viewBox="0 0 100 100" className="w-12 h-12 mb-2 drop-shadow-[0_4px_8px_rgba(251,191,36,0.4)]">
                  <defs>
                    <linearGradient id="boltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fef08a" />
                      <stop offset="50%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#d97706" />
                    </linearGradient>
                  </defs>
                  <path d="M 55 10 L 25 55 L 48 55 L 40 90 L 75 42 L 52 42 Z" fill="url(#boltGrad)" stroke="#fef08a" strokeWidth="2.5" />
                </svg>
                <p className="text-white font-black text-2xl tracking-wide">{streak}</p>
                <p className="text-purple-300 font-bold text-xs uppercase tracking-wider">Streak</p>
              </motion.div>

              {/* Wins Card */}
              <motion.div 
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-center hover:bg-white/10 transition shadow-lg flex flex-col items-center justify-center"
                whileHover={{ scale: 1.05, y: -2 }}
              >
                {/* 3D Noto Target */}
                <svg viewBox="0 0 100 100" className="w-12 h-12 mb-2 drop-shadow-[0_4px_8px_rgba(239,68,68,0.4)]">
                  <circle cx="50" cy="50" r="40" fill="#ef4444" stroke="#fca5a5" strokeWidth="3" />
                  <circle cx="50" cy="50" r="28" fill="#ffffff" />
                  <circle cx="50" cy="50" r="16" fill="#ef4444" />
                  <circle cx="50" cy="50" r="6" fill="#ffffff" />
                  {/* Dart */}
                  <path d="M 50 50 L 75 25 L 80 30 Z" fill="#10b981" />
                </svg>
                <p className="text-white font-black text-2xl tracking-wide">{victories}</p>
                <p className="text-purple-300 font-bold text-xs uppercase tracking-wider">Wins</p>
              </motion.div>

              {/* Badges Card */}
              <motion.div 
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-center hover:bg-white/10 transition shadow-lg flex flex-col items-center justify-center"
                whileHover={{ scale: 1.05, y: -2 }}
              >
                {/* 3D Noto Badge */}
                <svg viewBox="0 0 100 100" className="w-12 h-12 mb-2 drop-shadow-[0_4px_8px_rgba(168,85,247,0.4)]">
                  <defs>
                    <linearGradient id="badgeShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#c084fc" />
                      <stop offset="100%" stopColor="#7e22ce" />
                    </linearGradient>
                  </defs>
                  <polygon points="50,15 80,30 80,65 50,85 20,65 20,30" fill="url(#badgeShieldGrad)" stroke="#e9d5ff" strokeWidth="3" />
                  <polygon points="50,22 73,34 73,61 50,77 27,61 27,34" fill="#ffffff" opacity="0.15" />
                  <path d="M 50 32 L 53 41 L 62 42 L 55 48 L 57 57 L 50 52 L 43 57 L 45 48 L 38 42 L 47 41 Z" fill="#fbbf24" />
                </svg>
                <p className="text-white font-black text-2xl tracking-wide">{badges.length}</p>
                <p className="text-purple-300 font-bold text-xs uppercase tracking-wider">Badges</p>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Battle Arena */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Enemy Side */}
          <motion.div
            className="bg-gradient-to-br from-purple-950/60 via-slate-900/60 to-purple-950/60 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent pointer-events-none" />
            <motion.div
              className="mb-4 text-center"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <span className="inline-block px-4 py-2 bg-red-500/30 rounded-full text-red-200 font-semibold text-sm mb-2 border border-red-400/50">
                ⚔️ ENEMY
              </span>
              <h2 className="text-3xl font-bold text-white">{getEnemyName()}</h2>
            </motion.div>

            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6, type: "spring" }}
            >
              {getEnemyComponent()}
            </motion.div>
          </motion.div>

          {/* Scenario Side */}
          <motion.div
            className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={20} className="text-blue-400" />
                  <span className="text-blue-300 font-semibold text-sm">SITUATION</span>
                </div>
                <motion.button
                  onClick={() => speakSituation(scenario.situation)}
                  className="p-2 bg-blue-500/20 hover:bg-blue-500/40 rounded-lg text-blue-300 transition"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Read Aloud"
                >
                  <Volume2 size={16} />
                </motion.button>
              </div>
              <motion.p
                className="text-white text-xl leading-relaxed pl-4 border-l-4 border-blue-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {displayedText}
                {isTyping && <span className="animate-pulse">|</span>}
              </motion.p>
            </div>

            <motion.div
              className="bg-red-500/20 border-2 border-red-500/50 rounded-xl p-6"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">👹</span>
                <span className="text-red-300 font-semibold">NEGATIVE THOUGHT ATTACK</span>
              </div>
              <p className="text-red-100 text-lg font-semibold italic pl-4 border-l-4 border-red-400">
                "{scenario.negativeThought}"
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* Choice Buttons */}
        <motion.div
          className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <h3 className="text-white font-bold text-2xl mb-6 flex items-center gap-3">
            <span className="text-3xl">⚔️</span>
            Choose Your Response Weapon:
          </h3>
          <div className="space-y-4">
            {scenario.options.map((option, index) => (
              <ChoiceButton
                key={index}
                option={option}
                index={index}
                onClick={handleChoice}
                disabled={buttonsDisabled}
              />
            ))}
          </div>
        </motion.div>

        {/* Badges Display */}
        {badges.length > 0 && (
          <motion.div
            className="mt-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-md rounded-2xl p-6 border border-yellow-400/30"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <h4 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
              <Award size={24} className="text-yellow-400" />
              Your Badges:
            </h4>
            <div className="flex flex-wrap gap-3">
              {badges.map((badge, idx) => (
                <motion.div
                  key={idx}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: idx * 0.1, type: "spring" }}
                  whileHover={{ scale: 1.05, y: -2 }}
                >
                  {renderBadgeIcon(badge)}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Feedback Popup */}
      <AnimatePresence>
        {showResult && lastResult && (
          <FeedbackPopup result={lastResult} onNext={handleNext} />
        )}
      </AnimatePresence>

      {/* Music Player Modal */}
      <AnimatePresence>
        {showMusicPlayer && <MusicPlayer onClose={() => setShowMusicPlayer(false)} />}
      </AnimatePresence>

      {/* Badge Unlock Popup */}
      <AnimatePresence>
        {unlockedBadge && (
          <motion.div
            className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[150] p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-4 border-yellow-400 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl relative overflow-hidden"
              initial={{ scale: 0.8, rotate: -5 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.8, rotate: 5 }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/10 to-transparent pointer-events-none" />
              
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                className="w-32 h-32 mx-auto mb-6 opacity-20 absolute top-10 left-1/2 -translate-x-1/2 pointer-events-none"
              >
                <svg viewBox="0 0 100 100" className="w-full h-full fill-yellow-400">
                  <path d="M50 50 L40 0 L60 0 Z" />
                  <path d="M50 50 L100 40 L100 60 Z" />
                  <path d="M50 50 L40 100 L60 100 Z" />
                  <path d="M50 50 L0 40 L0 60 Z" />
                </svg>
              </motion.div>

              <div className="relative z-10 flex flex-col items-center justify-center">
                <span className="text-5xl mb-4">🏆</span>
                <h3 className="text-3xl font-black text-yellow-400 mb-2 tracking-wide">UNLOCKED!</h3>
                <p className="text-white/80 text-sm mb-6">You earned a new Badge of Honor!</p>
                
                <div className="flex justify-center mb-6">
                  {renderBadgeIcon(unlockedBadge)}
                </div>

                <motion.button
                  onClick={() => setUnlockedBadge(null)}
                  className="w-full py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 rounded-xl text-slate-950 font-black text-lg shadow-lg"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  AWESOME!
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BattleArena;
