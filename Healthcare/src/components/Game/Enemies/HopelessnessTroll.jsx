import { motion } from 'framer-motion';

const HopelessnessTroll = ({ isHit, isDefeated }) => {
  return (
    <motion.div
      className="relative w-48 h-48 flex items-center justify-center"
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: isDefeated ? 0 : isHit ? 0.9 : 1,
        opacity: isDefeated ? 0 : 1,
        y: isHit ? -15 : [0, -10, 0],
        rotate: isHit ? [0, -8, 8, -8, 8, 0] : 0
      }}
      transition={{
        y: { repeat: isHit ? 0 : Infinity, duration: 3.2, ease: "easeInOut" },
        rotate: { duration: 0.5 },
        scale: { duration: isDefeated ? 0.5 : 0.3 },
        opacity: { duration: isDefeated ? 0.5 : 0.3 }
      }}
    >
      {/* Outer Glow */}
      <div className="absolute inset-2 bg-gradient-to-br from-slate-500 to-zinc-600 rounded-full filter blur-2xl opacity-30 animate-pulse" />

      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_10px_15px_rgba(71,85,105,0.4)]">
        <defs>
          <linearGradient id="trollGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="50%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>

          <linearGradient id="trollHair" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
          
          <linearGradient id="trollCheek" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6b7280" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#374151" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Ground Shadow */}
        <ellipse cx="100" cy="180" rx="55" ry="10" fill="#1e293b" opacity="0.4" />

        {/* Troll Body */}
        <ellipse cx="100" cy="135" rx="55" ry="40" fill="url(#trollGrad)" />

        {/* Troll Head */}
        <ellipse cx="100" cy="85" rx="48" ry="45" fill="url(#trollGrad)" />

        {/* Ears - droopy Noto-style */}
        <path d="M 52 75 C 35 70, 30 90, 52 90 Z" fill="#475569" stroke="#64748b" strokeWidth="2" />
        <path d="M 148 75 C 165 70, 170 90, 148 90 Z" fill="#475569" stroke="#64748b" strokeWidth="2" />

        {/* Hair Tuft Spikes */}
        <path d="M 80 44 L 80 25 L 92 41" fill="url(#trollHair)" />
        <path d="M 95 41 L 100 18 L 105 41" fill="url(#trollHair)" />
        <path d="M 108 41 L 120 25 L 120 44" fill="url(#trollHair)" />

        {/* Droopy Sad Eyes */}
        <g>
          {/* Left Eye */}
          <ellipse cx="80" cy="85" rx="10" ry="12" fill="#0f172a" />
          <ellipse cx="82" cy="81" rx="4" ry="5" fill="#ffffff" />
          <path d="M 66 72 Q 80 78 94 72" stroke="#1e293b" strokeWidth="2.5" fill="none" />

          {/* Right Eye */}
          <ellipse cx="120" cy="85" rx="10" ry="12" fill="#0f172a" />
          <ellipse cx="122" cy="81" rx="4" ry="5" fill="#ffffff" />
          <path d="M 106 72 Q 120 78 134 72" stroke="#1e293b" strokeWidth="2.5" fill="none" />
        </g>

        {/* Red nose (representing cold hopelessness) */}
        <ellipse cx="100" cy="98" rx="8" ry="6" fill="#f87171" opacity="0.8" />

        {/* Wavy sad Frown */}
        <path
          d={isHit ? "M 92 120 Q 100 128 108 120" : "M 88 122 Q 100 112 112 122"}
          stroke="#0f172a"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Big droopy feet */}
        <ellipse cx="75" cy="170" rx="16" ry="10" fill="#475569" />
        <ellipse cx="125" cy="170" rx="16" ry="10" fill="#475569" />
      </svg>

      {/* Title Tag */}
      <motion.div
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap z-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="bg-gradient-to-r from-slate-600 to-zinc-700 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-500/50 shadow-lg">
          <span className="text-white font-bold text-sm tracking-wide">Hopelessness Troll</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HopelessnessTroll;
