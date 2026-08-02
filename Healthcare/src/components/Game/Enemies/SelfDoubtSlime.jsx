import { motion } from 'framer-motion';

const SelfDoubtSlime = ({ isHit, isDefeated }) => {
  return (
    <motion.div
      className="relative w-48 h-48 flex items-center justify-center"
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: isDefeated ? 0 : isHit ? 0.9 : 1,
        opacity: isDefeated ? 0 : 1,
        y: isHit ? -15 : [0, -12, 0],
        rotate: isHit ? [0, -10, 10, -10, 10, 0] : 0
      }}
      transition={{
        y: { repeat: isHit ? 0 : Infinity, duration: 3, ease: "easeInOut" },
        rotate: { duration: 0.5 },
        scale: { duration: isDefeated ? 0.5 : 0.3 },
        opacity: { duration: isDefeated ? 0.5 : 0.3 }
      }}
    >
      {/* Outer Glowing Aura */}
      <div className="absolute inset-2 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full filter blur-2xl opacity-40 animate-pulse" />

      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_10px_15px_rgba(16,185,129,0.3)]">
        <defs>
          {/* Main Body Gradient */}
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#059669" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          
          {/* Highlight Gradient for Glassy Look */}
          <linearGradient id="highlightGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Cheeks Gradient */}
          <radialGradient id="cheekGrad">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Shadow Underneath Slime */}
        <ellipse cx="100" cy="175" rx="50" ry="10" fill="#022c22" opacity="0.4" />

        {/* Main Fluid Body */}
        <motion.path
          d="M 100 40 
             C 145 40, 165 70, 165 110 
             C 165 140, 145 160, 100 160 
             C 55 160, 35 140, 35 110 
             C 35 70, 55 40, 100 40 Z"
          fill="url(#bodyGrad)"
          animate={{
            d: isHit 
              ? [
                  "M 100 45 C 135 45, 155 75, 155 115 C 155 135, 135 155, 100 155 C 65 155, 45 135, 45 115 C 45 75, 65 45, 100 45 Z"
                ]
              : [
                  "M 100 40 C 145 40, 165 70, 165 110 C 165 140, 145 160, 100 160 C 55 160, 35 140, 35 110 C 35 70, 55 40, 100 40 Z",
                  "M 100 45 C 148 45, 162 65, 162 105 C 162 142, 148 162, 100 162 C 52 162, 38 142, 38 105 C 38 65, 52 45, 100 45 Z",
                  "M 100 40 C 145 40, 165 70, 165 110 C 165 140, 145 160, 100 160 C 55 160, 35 140, 35 110 C 35 70, 55 40, 100 40 Z"
                ]
          }}
          transition={{
            repeat: isHit ? 0 : Infinity,
            duration: 3,
            ease: "easeInOut"
          }}
        />

        {/* 3D Highlight Curve */}
        <path
          d="M 60 70 C 80 55, 120 55, 140 70 C 120 60, 80 60, 60 70 Z"
          fill="url(#highlightGrad)"
        />

        {/* Blushing Cheeks */}
        <circle cx="65" cy="115" r="12" fill="url(#cheekGrad)" />
        <circle cx="135" cy="115" r="12" fill="url(#cheekGrad)" />

        {/* Large Eyes */}
        <g>
          {/* Left Eye */}
          <circle cx="75" cy="100" r="12" fill="#042f1a" />
          <circle cx="78" cy="96" r="5" fill="#ffffff" />
          {isHit && <path d="M 68 88 L 82 94 M 68 94 L 82 88" stroke="#ffffff" strokeWidth="2.5" />}

          {/* Right Eye */}
          <circle cx="125" cy="100" r="12" fill="#042f1a" />
          <circle cx="128" cy="96" r="5" fill="#ffffff" />
          {isHit && <path d="M 118 88 L 132 94 M 118 94 L 132 88" stroke="#ffffff" strokeWidth="2.5" />}
        </g>

        {/* Sad / Worry Mouth */}
        <path
          d={isHit ? "M 92 125 Q 100 135 108 125" : "M 90 128 Q 100 118 110 128"}
          stroke="#042f1a"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Floating Crown / Antlers (Representing Self-Doubt's fake authority) */}
        <path
          d="M 85 28 L 92 35 L 100 24 L 108 35 L 115 28 L 108 40 L 92 40 Z"
          fill="#fbbf24"
          opacity="0.8"
        />
      </svg>

      {/* Title Tag */}
      <motion.div
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap z-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 backdrop-blur-md px-4 py-1.5 rounded-full border border-emerald-400/50 shadow-lg">
          <span className="text-white font-bold text-sm tracking-wide">Self-Doubt Slime</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SelfDoubtSlime;
