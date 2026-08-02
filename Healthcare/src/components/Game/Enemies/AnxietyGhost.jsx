import { motion } from 'framer-motion';

const AnxietyGhost = ({ isHit, isDefeated }) => {
  return (
    <motion.div
      className="relative w-48 h-48 flex items-center justify-center"
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: isDefeated ? 0 : isHit ? 0.9 : 1,
        opacity: isDefeated ? 0 : 1,
        y: isHit ? -15 : [0, -20, 0],
        rotate: isHit ? [0, -10, 10, -10, 10, 0] : 0
      }}
      transition={{
        y: { repeat: isHit ? 0 : Infinity, duration: 2.8, ease: "easeInOut" },
        rotate: { duration: 0.5 },
        scale: { duration: isDefeated ? 0.5 : 0.3 },
        opacity: { duration: isDefeated ? 0.5 : 0.3 }
      }}
    >
      {/* Outer Glowing Aura */}
      <div className="absolute inset-2 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full filter blur-2xl opacity-40 animate-pulse" />

      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_10px_15px_rgba(59,130,246,0.35)]">
        <defs>
          {/* Ghost Gradient */}
          <linearGradient id="ghostGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          
          {/* Glassy Overlay */}
          <linearGradient id="glassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Blush Gradient */}
          <radialGradient id="blushGrad">
            <stop offset="0%" stopColor="#ec4899" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Shadow */}
        <ellipse cx="100" cy="180" rx="40" ry="8" fill="#1e3a8a" opacity="0.3" />

        {/* Wavy Floating Ghost Body */}
        <motion.path
          d="M 60 50 
             C 60 20, 140 20, 140 50 
             C 145 75, 150 110, 145 140 
             C 135 155, 125 140, 115 150 
             C 105 160, 95 140, 85 150 
             C 75 160, 65 140, 55 140 
             C 50 110, 55 75, 60 50 Z"
          fill="url(#ghostGrad)"
          animate={{
            d: isHit
              ? [
                  "M 65 55 C 65 30, 135 30, 135 55 C 140 78, 145 108, 140 135 C 132 148, 122 135, 112 145 C 102 155, 92 135, 82 145 C 72 155, 62 135, 52 135 C 48 108, 52 78, 65 55 Z"
                ]
              : [
                  "M 60 50 C 60 20, 140 20, 140 50 C 145 75, 150 110, 145 140 C 135 155, 125 140, 115 150 C 105 160, 95 140, 85 150 C 75 160, 65 140, 55 140 C 50 110, 55 75, 60 50 Z",
                  "M 60 48 C 60 18, 140 18, 140 48 C 146 73, 148 112, 146 142 C 138 152, 124 142, 114 152 C 104 162, 96 142, 86 152 C 76 162, 62 142, 54 142 C 48 112, 54 73, 60 48 Z",
                  "M 60 50 C 60 20, 140 20, 140 50 C 145 75, 150 110, 145 140 C 135 155, 125 140, 115 150 C 105 160, 95 140, 85 150 C 75 160, 65 140, 55 140 C 50 110, 55 75, 60 50 Z"
                ]
          }}
          transition={{
            repeat: isHit ? 0 : Infinity,
            duration: 3,
            ease: "easeInOut"
          }}
        />

        {/* Glossy Reflection Highlight */}
        <path
          d="M 75 42 C 90 32, 110 32, 125 42 C 110 35, 90 35, 75 42 Z"
          fill="url(#glassGrad)"
        />

        {/* Big Worried Eyes */}
        <g>
          {/* Left Eye */}
          <ellipse cx="80" cy="85" rx="10" ry="14" fill="#0f172a" />
          <ellipse cx="82" cy="81" rx="4" ry="6" fill="#ffffff" />
          <path d="M 68 68 Q 80 74 92 68" stroke="#1e293b" strokeWidth="2.5" fill="none" />

          {/* Right Eye */}
          <ellipse cx="120" cy="85" rx="10" ry="14" fill="#0f172a" />
          <ellipse cx="122" cy="81" rx="4" ry="6" fill="#ffffff" />
          <path d="M 108 68 Q 120 74 132 68" stroke="#1e293b" strokeWidth="2.5" fill="none" />
        </g>

        {/* Blush */}
        <circle cx="70" cy="98" r="8" fill="url(#blushGrad)" />
        <circle cx="130" cy="98" r="8" fill="url(#blushGrad)" />

        {/* Shivering Mouth */}
        <path
          d={isHit ? "M 94 115 Q 100 120 106 115" : "M 92 110 Q 96 114 100 110 Q 104 114 108 110"}
          stroke="#0f172a"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      {/* Floating Sparkles around Ghost */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-blue-300/40 rounded-full"
          style={{
            left: `${20 + i * 15}%`,
            top: `${30 + (i % 2) * 20}%`
          }}
          animate={{
            y: [-10, 10, -10],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.3, 1]
          }}
          transition={{
            repeat: Infinity,
            duration: 2 + i * 0.4,
            delay: i * 0.3
          }}
        />
      ))}

      {/* Title Tag */}
      <motion.div
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap z-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 backdrop-blur-md px-4 py-1.5 rounded-full border border-blue-400/50 shadow-lg">
          <span className="text-white font-bold text-sm tracking-wide">Anxiety Ghost</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AnxietyGhost;
