import { motion } from 'framer-motion';

const DoomsdayDragon = ({ isHit, isDefeated }) => {
  return (
    <motion.div
      className="relative w-48 h-48 flex items-center justify-center"
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: isDefeated ? 0 : isHit ? 0.9 : 1,
        opacity: isDefeated ? 0 : 1,
        y: isHit ? -15 : [0, -10, 0],
        rotate: isHit ? [0, -10, 10, -10, 10, 0] : 0
      }}
      transition={{
        y: { repeat: isHit ? 0 : Infinity, duration: 2.5, ease: "easeInOut" },
        rotate: { duration: 0.5 },
        scale: { duration: isDefeated ? 0.5 : 0.3 },
        opacity: { duration: isDefeated ? 0.5 : 0.3 }
      }}
    >
      {/* Outer Glowing Aura */}
      <div className="absolute inset-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full filter blur-2xl opacity-40 animate-pulse" />

      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_10px_15px_rgba(168,85,247,0.4)]">
        <defs>
          {/* Dragon Gradient */}
          <linearGradient id="dragonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="50%" stopColor="#9333ea" />
            <stop offset="100%" stopColor="#6b21a8" />
          </linearGradient>

          <linearGradient id="wingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#db2777" />
          </linearGradient>
          
          {/* Glass Highlight */}
          <linearGradient id="glassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Shadow */}
        <ellipse cx="100" cy="180" rx="45" ry="8" fill="#581c87" opacity="0.3" />

        {/* Dragon Wings */}
        <g>
          {/* Left Wing */}
          <path d="M 65 110 L 15 85 L 35 125 Z" fill="url(#wingGrad)" stroke="#f472b6" strokeWidth="2.5" />
          {/* Right Wing */}
          <path d="M 135 110 L 185 85 L 165 125 Z" fill="url(#wingGrad)" stroke="#f472b6" strokeWidth="2.5" />
        </g>

        {/* Dragon Body */}
        <ellipse cx="100" cy="130" rx="42" ry="46" fill="url(#dragonGrad)" />

        {/* Dragon Head */}
        <circle cx="100" cy="72" r="34" fill="url(#dragonGrad)" />

        {/* Dragon Horns */}
        <path d="M 82 46 L 70 20 L 88 40 L 92 42 Z" fill="#c084fc" stroke="#e9d5ff" strokeWidth="1.5" />
        <path d="M 118 46 L 130 20 L 112 40 L 108 42 Z" fill="#c084fc" stroke="#e9d5ff" strokeWidth="1.5" />

        {/* Angry Glowing Eyes */}
        <g>
          {/* Left Eye */}
          <polygon points="74,68 90,75 74,78" fill="#facc15" />
          <circle cx="82" cy="74" r="2.5" fill="#ffffff" />
          <path d="M 70 62 L 92 69" stroke="#581c87" strokeWidth="3" />

          {/* Right Eye */}
          <polygon points="126,68 110,75 126,78" fill="#facc15" />
          <circle cx="118" cy="74" r="2.5" fill="#ffffff" />
          <path d="M 130 62 L 108 69" stroke="#581c87" strokeWidth="3" />
        </g>

        {/* Cheeks blush */}
        <circle cx="75" cy="85" r="5" fill="#db2777" opacity="0.4" />
        <circle cx="125" cy="85" r="5" fill="#db2777" opacity="0.4" />

        {/* Mouth with tiny fangs */}
        <path
          d={isHit ? "M 88 95 Q 100 102 112 95" : "M 86 92 Q 100 84 114 92"}
          stroke="#581c87"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Tail with spike */}
        <path d="M 100 172 Q 130 195 115 205" stroke="url(#dragonGrad)" strokeWidth="8" fill="none" strokeLinecap="round" />
        <polygon points="115,200 125,208 110,212" fill="#facc15" />
      </svg>

      {/* Title Tag */}
      <motion.div
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap z-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 backdrop-blur-md px-4 py-1.5 rounded-full border border-purple-500/50 shadow-lg">
          <span className="text-white font-bold text-sm tracking-wide">Doomsday Dragon</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DoomsdayDragon;
