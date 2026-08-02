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
        addXP(20);
        incrementStreak();
        incrementVictories();
        
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
            xp: 20
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
            xp: 5
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
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
          className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/20"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
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
              <div className="bg-gradient-to-br from-yellow-500/30 to-orange-500/30 rounded-xl p-3 text-center border border-yellow-400/30">
                <Zap size={20} className="text-yellow-400 mx-auto mb-1" />
                <p className="text-white font-bold text-lg">{streak}</p>
                <p className="text-white/70 text-xs">Streak</p>
              </div>
              <div className="bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-xl p-3 text-center border border-green-400/30">
                <Target size={20} className="text-green-400 mx-auto mb-1" />
                <p className="text-white font-bold text-lg">{victories}/{totalBattles}</p>
                <p className="text-white/70 text-xs">Wins</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-xl p-3 text-center border border-purple-400/30">
                <Award size={20} className="text-purple-400 mx-auto mb-1" />
                <p className="text-white font-bold text-lg">{badges.length}</p>
                <p className="text-white/70 text-xs">Badges</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Battle Arena */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Enemy Side */}
          <motion.div
            className="bg-gradient-to-br from-red-900/40 to-purple-900/40 backdrop-blur-md rounded-2xl p-8 border-2 border-red-500/30 min-h-[400px] flex flex-col items-center justify-center"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
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
                  className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg text-white font-semibold shadow-lg"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: idx * 0.1, type: "spring" }}
                  whileHover={{ scale: 1.05, y: -2 }}
                >
                  🏆 {badge}
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
    </div>
  );
};

export default BattleArena;
