import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Swords, Shield, Brain, Heart, ArrowRight, ArrowLeft, Music } from 'lucide-react';
import { useState, useEffect } from 'react';
import MusicPlayer from './UI/MusicPlayer';

const GameStart = ({ onStart, onExit }) => {
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);

  useEffect(() => {
    // Auto-play music when game starts
    setShowMusicPlayer(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-zinc-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Back Button */}
      {onExit && (
        <motion.button
          onClick={() => {
            import('../EmotionQuest/soundManager').then(m => m.default.playClick());
            onExit();
          }}
          className="absolute top-6 left-6 z-20 flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md rounded-xl text-white font-semibold hover:bg-white/20 transition border border-white/20"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onMouseEnter={() => import('../EmotionQuest/soundManager').then(m => m.default.playHover())}
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </motion.button>
      )}

      {/* Music Controls */}
      <div className="absolute top-6 right-6 z-20 flex gap-2">
        {/* Play YouTube Music Button */}
        <motion.button
          onClick={() => {
            import('../EmotionQuest/soundManager').then(m => m.default.playClick());
            setShowMusicPlayer(true);
          }}
          className="p-3 bg-gradient-to-r from-red-600 to-pink-600 backdrop-blur-md rounded-xl text-white hover:from-red-700 hover:to-pink-700 transition border border-white/20 flex items-center gap-2"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Play Battle Music"
          onMouseEnter={() => import('../EmotionQuest/soundManager').then(m => m.default.playHover())}
        >
          <Music size={24} />
          <span className="font-semibold">🎵 Play Music</span>
        </motion.button>

        {/* Reset Level Button */}
        <motion.button
          onClick={async () => {
            import('../EmotionQuest/soundManager').then(m => m.default.playClick());
            if (window.confirm("Are you sure you want to reset your Thought Battle progress back to Level 1?")) {
              const gameStore = (await import('../../store/gameStore')).default;
              await gameStore.getState().resetGame();
              alert("Your stats have been successfully reset to Level 1!");
            }
          }}
          className="p-3 bg-gradient-to-r from-gray-700 to-slate-800 backdrop-blur-md rounded-xl text-white hover:from-gray-800 hover:to-slate-900 transition border border-white/20 flex items-center gap-2"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Reset Game to Level 1"
          onMouseEnter={() => import('../EmotionQuest/soundManager').then(m => m.default.playHover())}
        >
          <span className="font-semibold">🔄 Reset Level</span>
        </motion.button>
      </div>
      
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
            animate={{
              y: [0, -50, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.5, 1]
            }}
            transition={{
              repeat: Infinity,
              duration: 3 + Math.random() * 3,
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-4xl w-full">
        {/* Title Section */}
        <motion.div
          className="text-center mb-12"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
        >
          <motion.div
            className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-full flex items-center justify-center shadow-2xl"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              repeat: Infinity,
              duration: 3
            }}
          >
            <Swords size={64} className="text-white" />
          </motion.div>

          <motion.h1
            className="text-7xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          >
            Thought Battle Arena
          </motion.h1>

          <motion.p
            className="text-2xl text-white/90 font-semibold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Defeat Your Negative Thoughts Through CBT
          </motion.p>
        </motion.div>

        {/* Description */}
        <motion.div
          className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 mb-8 border border-white/20"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-white text-xl leading-relaxed text-center mb-6">
            Welcome, Mind Warrior! 🧠⚔️ Face your negative thoughts as animated monsters and defeat them 
            by choosing healthy, rational responses based on Cognitive Behavioral Therapy principles.
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <motion.div
              className="bg-gradient-to-br from-purple-600/40 to-pink-600/40 rounded-2xl p-6 text-center border-2 border-purple-400/50"
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: "spring" }}
            >
              <Shield size={40} className="text-purple-300 mx-auto mb-3" />
              <h3 className="text-white font-bold text-lg mb-2">Challenge Thoughts</h3>
              <p className="text-white/80 text-sm">Identify and battle negative thinking patterns</p>
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-blue-600/40 to-cyan-600/40 rounded-2xl p-6 text-center border-2 border-blue-400/50"
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: "spring", delay: 0.1 }}
            >
              <Brain size={40} className="text-blue-300 mx-auto mb-3" />
              <h3 className="text-white font-bold text-lg mb-2">Learn CBT</h3>
              <p className="text-white/80 text-sm">Practice evidence-based mental health skills</p>
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-green-600/40 to-emerald-600/40 rounded-2xl p-6 text-center border-2 border-green-400/50"
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: "spring", delay: 0.2 }}
            >
              <Trophy size={40} className="text-green-300 mx-auto mb-3" />
              <h3 className="text-white font-bold text-lg mb-2">Level Up</h3>
              <p className="text-white/80 text-sm">Earn XP, badges, and track your progress</p>
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-orange-600/40 to-red-600/40 rounded-2xl p-6 text-center border-2 border-orange-400/50"
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: "spring", delay: 0.3 }}
            >
              <Heart size={40} className="text-orange-300 mx-auto mb-3" />
              <h3 className="text-white font-bold text-lg mb-2">Heal Mind</h3>
              <p className="text-white/80 text-sm">Build resilience and mental strength</p>
            </motion.div>
          </div>
        </motion.div>

        {/* How to Play */}
        <motion.div
          className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-xl rounded-3xl p-8 mb-8 border-2 border-yellow-400/30"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <h2 className="text-white font-bold text-3xl mb-6 text-center flex items-center justify-center gap-3">
            <span className="text-4xl">🎮</span>
            How to Play
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white/90">
            <div className="flex items-start gap-3">
              <span className="text-2xl">1️⃣</span>
              <div>
                <h4 className="font-bold mb-1">Face the Monster</h4>
                <p className="text-sm">A negative thought appears as an animated enemy</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">2️⃣</span>
              <div>
                <h4 className="font-bold mb-1">Choose Your Weapon</h4>
                <p className="text-sm">Select the healthiest CBT-based response</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">3️⃣</span>
              <div>
                <h4 className="font-bold mb-1">Defeat & Learn</h4>
                <p className="text-sm">Correct answer = +20 XP & defeat the monster!</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">4️⃣</span>
              <div>
                <h4 className="font-bold mb-1">Build Streaks</h4>
                <p className="text-sm">5 wins in a row = Mind Warrior Badge! 🏆</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Start Button */}
        <motion.button
          onClick={() => {
            import('../EmotionQuest/soundManager').then(m => m.default.playClick());
            onStart();
          }}
          className="w-full py-8 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-2xl text-white font-bold text-3xl shadow-2xl border-4 border-white/30 hover:shadow-3xl transition-all"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1, type: "spring", stiffness: 200 }}
          whileHover={{ scale: 1.02, y: -5 }}
          whileTap={{ scale: 0.98 }}
          onMouseEnter={() => import('../EmotionQuest/soundManager').then(m => m.default.playHover())}
        >
          <motion.div
            className="flex items-center justify-center gap-4"
            animate={{
              x: [0, 10, 0]
            }}
            transition={{
              repeat: Infinity,
              duration: 1.5
            }}
          >
            <Swords size={40} />
            <span>Start Battle</span>
            <ArrowRight size={40} />
          </motion.div>
        </motion.button>

        {/* Footer Note */}
        <motion.p
          className="text-center text-white/60 mt-6 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          🎯 Based on Cognitive Behavioral Therapy • 🧠 Build Mental Resilience • 💪 Level Up Your Mind
        </motion.p>
      </div>

      {/* Music Player Modal */}
      <AnimatePresence>
        {showMusicPlayer && <MusicPlayer onClose={() => setShowMusicPlayer(false)} />}
      </AnimatePresence>
    </div>
  );
};

export default GameStart;
