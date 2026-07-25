import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { X, Play, Pause } from 'lucide-react';

const BreathingExercise = ({ onComplete, onClose }) => {
  const [phase, setPhase] = useState('inhale'); // inhale, hold, exhale
  const [count, setCount] = useState(4);
  const [cycle, setCycle] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setCount((prev) => {
        if (prev > 1) return prev - 1;
        
        // Move to next phase
        if (phase === 'inhale') {
          setPhase('hold');
          return 4;
        } else if (phase === 'hold') {
          setPhase('exhale');
          return 4;
        } else {
          // Complete cycle
          const newCycle = cycle + 1;
          setCycle(newCycle);
          
          if (newCycle >= 3) {
            // Completed 3 cycles
            setIsActive(false);
            setTimeout(() => onComplete(), 500);
            return 0;
          }
          
          setPhase('inhale');
          return 4;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, phase, count, cycle, onComplete]);

  const phaseColors = {
    inhale: 'from-amber-500 to-orange-600 shadow-[0_0_30px_rgba(245,158,11,0.6)]',
    hold: 'from-yellow-400 to-amber-500 shadow-[0_0_30px_rgba(251,191,36,0.6)]',
    exhale: 'from-red-600 to-rose-700 shadow-[0_0_30px_rgba(225,29,72,0.6)]',
  };

  const phaseText = {
    inhale: 'Breathe In',
    hold: 'Hold',
    exhale: 'Breathe Out',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-br from-[#2d0f0f] to-[#421515] p-8 max-w-md w-full border-4 border-amber-500 shadow-[0_0_40px_rgba(245,158,11,0.25)] relative font-mono text-center rounded-none"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-amber-500/60 hover:text-amber-400 transition font-pixel-body font-bold text-sm bg-[#1e0a0a] border border-amber-500/30 hover:border-amber-500/70 w-8 h-8 flex items-center justify-center rounded-none"
        >
          X
        </button>

        <h2 className="text-amber-400 font-bold text-2xl font-pixel-body mb-4 tracking-wider uppercase">
          🧘 Meditative Breathing
        </h2>

        <p className="text-amber-100/75 text-xs font-pixel-body mb-8 leading-relaxed">
          Complete 3 breathing cycles to steady your mind.
        </p>

        {/* Breathing Circle */}
        <div className="flex items-center justify-center mb-8 h-56">
          <motion.div
            animate={{
              scale: phase === 'inhale' ? 1.4 : phase === 'hold' ? 1.4 : 0.95,
            }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className={`w-40 h-40 rounded-full bg-gradient-to-br ${phaseColors[phase]} flex items-center justify-center transition-shadow duration-500`}
          >
            <div className="text-center">
              <p className="text-white text-lg font-bold font-pixel-body drop-shadow-md tracking-wide uppercase mb-1">{phaseText[phase]}</p>
              <p className="text-white text-5xl font-black font-pixel-body drop-shadow-lg">{count}</p>
            </div>
          </motion.div>
        </div>

        {/* Progress Cycles */}
        <div className="mb-8 bg-[#1e0a0a] border-2 border-amber-500/20 p-3 rounded-none">
          <div className="flex items-center justify-center gap-3 mb-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 border-2 border-amber-500 transition-all duration-300 ${
                  i < cycle ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-[#2d0f0f]'
                }`}
              />
            ))}
          </div>
          <p className="text-center text-amber-200/80 text-xs font-pixel-body uppercase tracking-wider">
            Cycle {cycle + 1} of 3
          </p>
        </div>

        {/* Control Button */}
        <button
          onClick={() => setIsActive(!isActive)}
          className={`w-full py-3.5 rounded-none font-bold text-sm font-pixel-body tracking-widest uppercase transition-all duration-200 border-2 ${
            isActive
              ? 'bg-[#5a1c1c] hover:bg-[#782525] border-red-500 text-red-200'
              : 'bg-[#451414] hover:bg-[#5c1a1a] border-amber-500 text-amber-200 shadow-md hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]'
          }`}
        >
          {isActive ? 'Pause Meditation' : (cycle > 0 ? 'Resume' : 'Begin Meditation')}
        </button>
      </motion.div>
    </motion.div>
  );
};

export default BreathingExercise;
