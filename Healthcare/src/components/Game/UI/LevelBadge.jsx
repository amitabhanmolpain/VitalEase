import { motion } from 'framer-motion';

const LevelBadge = ({ level }) => {
  return (
    <motion.div
      className="relative flex items-center justify-center"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      whileHover={{ scale: 1.08 }}
    >
      <div className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full" />
      
      {/* 3D Gold Level Badge SVG */}
      <svg viewBox="0 0 100 100" className="w-24 h-24 drop-shadow-[0_8px_16px_rgba(251,191,36,0.4)]">
        <defs>
          <linearGradient id="goldGradBadge" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="35%" stopColor="#eab308" />
            <stop offset="70%" stopColor="#ca8a04" />
            <stop offset="100%" stopColor="#854d0e" />
          </linearGradient>
          <linearGradient id="shineGradBadge" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Outer Glowing Ring */}
        <circle cx="50" cy="50" r="46" fill="none" stroke="#fef08a" strokeWidth="2.5" opacity="0.6" strokeDasharray="8 4" />

        {/* Badge Base */}
        <polygon points="50,12 85,30 85,70 50,88 15,70 15,30" fill="url(#goldGradBadge)" stroke="#fef08a" strokeWidth="3" />

        {/* Inner Shield */}
        <polygon points="50,18 80,33 80,67 50,82 20,67 20,33" fill="#1e1b4b" opacity="0.9" />

        {/* Shiny Highlight */}
        <path d="M 23 35 C 40 22, 60 22, 77 35 C 60 26, 40 26, 23 35 Z" fill="url(#shineGradBadge)" />

        {/* Crown Icon */}
        <path d="M 40 46 L 44 50 L 50 42 L 56 50 L 60 46 L 57 56 L 43 56 Z" fill="#eab308" />

        {/* Level text */}
        <text x="50" y="74" fill="#ffffff" fontSize="24" fontWeight="bold" textAnchor="middle" letterSpacing="1">
          Lvl {level}
        </text>
      </svg>
    </motion.div>
  );
};

export default LevelBadge;
