import { motion } from 'framer-motion';
import { X, Music, Minimize2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const MusicPlayer = ({ onClose }) => {
  const [isMinimized, setIsMinimized] = useState(true);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = new Audio("https://ia800704.us.archive.org/15/items/retro-game-music-pack/Retro%20Game%20Music%20Pack/Loop%2001.mp3");
    audio.loop = true;
    audio.volume = 0.4;
    
    const playAudio = () => {
      if (audio.paused) {
        audio.play().catch(err => console.log("Play failed:", err));
      }
    };

    audio.play().catch(err => {
      console.log("Autoplay blocked, waiting for interaction");
      window.addEventListener('click', playAudio, { once: true });
      window.addEventListener('keydown', playAudio, { once: true });
    });
    audioRef.current = audio;

    // Audio ducking interval: Check if TTS is speaking and lower music volume!
    const interval = setInterval(() => {
      if (audioRef.current) {
        const isSpeaking = window.speechSynthesis && window.speechSynthesis.speaking;
        if (isSpeaking) {
          // Lower volume slightly so it's still audible in background
          if (audioRef.current.volume !== 0.08) {
            audioRef.current.volume = 0.08;
          }
        } else {
          // Restore to 0.4
          if (audioRef.current.volume !== 0.4) {
            audioRef.current.volume = 0.4;
          }
        }
      }
    }, 100);

    return () => {
      clearInterval(interval);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleTogglePlay = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play().catch(err => console.log(err));
    } else {
      audioRef.current.pause();
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
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
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
              🎧 Audio is playing in the background. It will automatically lower when the situation is read out loud!
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MusicPlayer;
