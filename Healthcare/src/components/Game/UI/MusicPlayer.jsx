import { motion } from 'framer-motion';
import { X, Music, Minimize2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const MusicPlayer = ({ onClose }) => {
  const [isMinimized, setIsMinimized] = useState(true);
  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const isPlayingRef = useRef(true);

  useEffect(() => {
    let timer = null;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.15, ctx.currentTime);
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      // Soft ambient 8-bit synth arpeggio progression (C - Am - F - G)
      const chordProgressions = [
        [261.63, 329.63, 392.00], // C major
        [220.00, 261.63, 329.63], // A minor
        [174.61, 220.00, 261.63], // F major
        [196.00, 246.94, 293.66]  // G major
      ];

      let chordIdx = 0;
      let noteIdx = 0;

      const playNextSynthNote = () => {
        if (!isPlayingRef.current || !audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const chord = chordProgressions[chordIdx];
        const freq = chord[noteIdx];

        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        
        osc.type = 'triangle'; // Soft retro synth wave
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        noteGain.gain.setValueAtTime(0.08, ctx.currentTime);
        noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

        osc.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);

        noteIdx++;
        if (noteIdx >= chord.length) {
          noteIdx = 0;
          chordIdx = (chordIdx + 1) % chordProgressions.length;
        }
      };

      // Play note every 300ms
      timer = setInterval(playNextSynthNote, 300);

      // Ducking interval: lower volume when TTS is speaking
      const duckingInterval = setInterval(() => {
        if (masterGainRef.current && audioCtxRef.current) {
          const isSpeaking = window.speechSynthesis && window.speechSynthesis.speaking;
          const targetVol = isSpeaking ? 0.03 : 0.15;
          masterGainRef.current.gain.setTargetAtTime(targetVol, audioCtxRef.current.currentTime, 0.1);
        }
      }, 100);

      return () => {
        clearInterval(timer);
        clearInterval(duckingInterval);
        isPlayingRef.current = false;
        if (audioCtxRef.current) {
          audioCtxRef.current.close();
        }
      };
    } catch (e) {
      console.log("Web Audio Ambient Synth Init Error:", e);
    }
  }, []);

  const handleTogglePlay = () => {
    if (!masterGainRef.current || !audioCtxRef.current) return;
    if (isPlayingRef.current) {
      isPlayingRef.current = false;
      masterGainRef.current.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
    } else {
      isPlayingRef.current = true;
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      masterGainRef.current.gain.setValueAtTime(0.15, audioCtxRef.current.currentTime);
    }
  };

  if (isMinimized) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 z-[100] p-4 bg-gradient-to-r from-red-600 to-pink-600 rounded-full shadow-2xl border-2 border-white/20"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
        >
          <Music size={28} className="text-white" />
        </motion.div>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md"
      >
        {/* Control Buttons */}
        <div className="absolute -top-12 right-0 flex gap-2">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition backdrop-blur-sm flex items-center gap-2"
          >
            <Minimize2 size={20} />
            <span className="font-semibold">Minimize</span>
          </button>
          <button
            onClick={onClose}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition backdrop-blur-sm flex items-center gap-2"
          >
            <X size={24} />
            <span className="font-semibold">Close</span>
          </button>
        </div>

        {/* Audio Player Card */}
        <div className="bg-gradient-to-br from-purple-900/95 to-pink-900/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl border-4 border-purple-500/50">
          <div className="text-center mb-6">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center cursor-pointer"
              onClick={handleTogglePlay}
              title="Click to Pause/Play"
            >
              <Music size={48} className="text-white" />
            </motion.div>
            <h3 className="text-2xl font-bold text-white mb-2">🎵 Battle Music Playing</h3>
            <p className="text-purple-200">Keep fighting those negative thoughts!</p>
          </div>

          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-white/90 text-center text-sm">
              🎧 Ambient synth loop is playing. It will automatically lower volume when scenario speech is active!
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MusicPlayer;
