import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Send, 
  Award, 
  Heart, 
  CheckCircle, 
  ArrowLeft, 
  RotateCcw, 
  AlertCircle, 
  Loader2, 
  HelpCircle,
  TrendingDown
} from 'lucide-react';
import { reframeAPI } from '../../services/reframeApi';

// Pre-generated pixel-art sprites hosted on Cloudinary
const CHARACTER_SPRITES = {
  catastrophizing: "https://res.cloudinary.com/dxnpcuppm/image/upload/v1784916957/reframe_game/reframe_game/sprite_catastrophizing.jpg",
  black_and_white: "https://res.cloudinary.com/dxnpcuppm/image/upload/v1784917018/reframe_game/reframe_game/sprite_black_and_white.jpg",
  mind_reading: "https://res.cloudinary.com/dxnpcuppm/image/upload/v1784917018/reframe_game/reframe_game/sprite_mind_reading.jpg",
  overgeneralization: "https://res.cloudinary.com/dxnpcuppm/image/upload/v1784917019/reframe_game/reframe_game/sprite_overgeneralization.jpg",
  personalization: "https://res.cloudinary.com/dxnpcuppm/image/upload/v1784917020/reframe_game/reframe_game/sprite_personalization.jpg"
};

// Hardcoded opening statements per distortion type
const DEFAULT_OPENING_LINES = {
  catastrophizing: "One mistake here, and everything falls apart, you know that right?",
  black_and_white: "If you aren't completely perfect at this, you're a total failure.",
  mind_reading: "They are all looking at you and thinking how incompetent you are.",
  overgeneralization: "You always mess things up; this time won't be any different.",
  personalization: "This is all your fault. If you had just done better, everyone would be happy."
};

const preProcessDistortionName = (name) => {
  if (!name) return "";
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const ReframeGame = ({ onExit }) => {
  const [stage, setStage] = useState('select'); // 'select', 'chat', 'settled'
  const [distortionTypes, setDistortionTypes] = useState({});
  const [selectedType, setSelectedType] = useState('');
  const [intensity, setIntensity] = useState(100);
  const [chatLog, setChatLog] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const chatEndRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }, [chatLog, prefersReducedMotion]);

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const listener = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // Fetch distortion types on load
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        setIsLoading(true);
        const data = await reframeAPI.getDistortionTypes();
        setDistortionTypes(data);
        setError(null);
      } catch (err) {
        console.error("Failed to load distortion types:", err);
        setError("Could not load distortion options. Please check your backend connection.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTypes();
  }, []);

  const handleStartGame = (typeKey) => {
    setSelectedType(typeKey);
    setIntensity(100);
    const openingText = DEFAULT_OPENING_LINES[typeKey] || "Things are looking pretty hopeless right now.";
    setChatLog([
      { sender: 'monster', text: openingText }
    ]);
    setStage('chat');
    setUserInput('');
    setError(null);
  };

  const handleSubmitReframe = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const playerText = userInput.trim();
    setUserInput('');
    setError(null);

    // Append player message to chat log
    setChatLog(prev => [...prev, { sender: 'player', text: playerText }]);
    setIsLoading(true);

    // Get the last monster statement from chatLog
    const lastMonsterMessage = [...chatLog]
      .reverse()
      .find(msg => msg.sender === 'monster');
    const monsterStatement = lastMonsterMessage ? lastMonsterMessage.text : "";

    try {
      const response = await reframeAPI.judgeReframe({
        distortion_type: selectedType,
        monster_statement: monsterStatement,
        player_reframe: playerText
      });

      const damageValue = response.damage || 0;
      const feedbackText = response.feedback;
      const nextMonsterResponse = response.monster_response;

      // Compute new intensity, floor at 0
      const newIntensity = Math.max(0, intensity - damageValue);
      setIntensity(newIntensity);

      // Append evaluation feedback
      setChatLog(prev => [
        ...prev,
        { 
          sender: 'feedback', 
          text: feedbackText, 
          isPositive: response.addresses_distortion 
        }
      ]);

      if (newIntensity <= 15) {
        // Transition to settled phase
        setTimeout(() => {
          setStage('settled');
        }, prefersReducedMotion ? 0 : 800);
      } else {
        // Let monster respond with next line
        setChatLog(prev => [...prev, { sender: 'monster', text: nextMonsterResponse }]);
      }
    } catch (err) {
      console.error("Evaluation error:", err);
      // Restore user input so they can retry without re-typing everything
      setUserInput(playerText);
      setError("The connection to the judging engine failed. Please try sending your reframe again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStage('select');
    setSelectedType('');
    setIntensity(100);
    setChatLog([]);
    setUserInput('');
    setError(null);
  };

  const handleBack = () => {
    if (onExit) {
      onExit();
    } else {
      window.location.href = '/';
    }
  };

  // Selection Phase Render
  if (stage === 'select') {
    return (
      <div className="min-h-screen bg-slate-950 text-white font-poppins flex flex-col p-6 overflow-x-hidden relative">
        {/* Nav Header */}
        <div className="flex items-center justify-between mb-8 max-w-7xl mx-auto w-full z-10">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border-2 border-slate-700 hover:border-slate-500 rounded-none text-white font-pixel-body text-lg transition"
          >
            <ArrowLeft size={16} />
            BACK
          </button>
          <div className="flex items-center gap-2">
            <span className="font-pixel-title text-base text-teal-400 tracking-wider">THOUGHT EXPLORER</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center max-w-5xl mx-auto w-full z-10 mb-12">
          <motion.div 
            className="text-center mb-12"
            initial={prefersReducedMotion ? {} : { opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-2xl md:text-3xl font-pixel-title leading-relaxed mb-4 text-white">
              THOUGHT REFRAMING ARENA
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
              Explore your mind's automated cognitive distortions. Choose a specific distortion pattern to confront, and practice reframing it with rational CBT principles.
            </p>
          </motion.div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-12 h-12 text-teal-400 animate-spin" />
              <p className="text-gray-400 font-pixel-body text-lg">LOADING COGNITIVE DISTORTIONS...</p>
            </div>
          ) : error && Object.keys(distortionTypes).length === 0 ? (
            <div className="bg-slate-900 border-4 border-red-700 rounded-none p-8 text-center max-w-md">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-pixel-title mb-4">CONNECTION ERROR</h3>
              <p className="text-red-200/80 mb-6">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-red-800 hover:bg-red-700 border-2 border-red-600 text-white font-pixel-body text-lg rounded-none transition"
              >
                RETRY CONNECTION
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
              {Object.entries(distortionTypes).map(([key, desc], idx) => (
                <motion.div
                  key={key}
                  onClick={() => handleStartGame(key)}
                  className="bg-slate-900 border-4 border-slate-700 hover:border-teal-400 p-6 rounded-none cursor-pointer flex flex-col justify-between group transition-all duration-200 hover:bg-slate-900 relative"
                  initial={prefersReducedMotion ? {} : { opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.05 }}
                  whileHover={prefersReducedMotion ? {} : { y: -4 }}
                >
                  <div>
                    {/* Character Sprite Container */}
                    <div className="w-full aspect-square bg-slate-950 border-4 border-slate-700 rounded-none flex items-center justify-center mb-6 overflow-hidden">
                      <img 
                        src={CHARACTER_SPRITES[key]} 
                        alt={key} 
                        className="w-full h-full object-cover" 
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>
                    <h3 className="font-pixel-body text-2xl font-bold text-teal-400 mb-3 group-hover:text-teal-300 transition-colors">
                      {preProcessDistortionName(key)}
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed mb-6">
                      {desc}
                    </p>
                  </div>
                  <span className="font-pixel-body text-base font-bold uppercase tracking-wider text-purple-400 group-hover:text-teal-400 flex items-center gap-1">
                    CONFRONT PATTERN &rarr;
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Conversation/Battle Phase Render
  return (
    <div className="min-h-screen bg-slate-950 text-white font-poppins flex flex-col p-6 overflow-x-hidden relative">
      
      {/* Dialogue Header */}
      <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto w-full z-10">
        <button 
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border-2 border-slate-700 hover:border-slate-500 rounded-none text-white font-pixel-body text-lg transition"
        >
          <ArrowLeft size={16} />
          SELECT DISTORTION
        </button>
        <div className="flex items-center gap-2">
          <span className="font-pixel-body text-xl text-teal-400 tracking-wider font-bold">
            {preProcessDistortionName(selectedType).toUpperCase()}
          </span>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch z-10 mb-6">
        
        {/* Left Column: Portrait, Stats & Clarity meter */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-slate-900 border-4 border-slate-700 rounded-none p-6 flex flex-col gap-6 shadow-none h-full justify-between">
            <div>
              <span className="font-pixel-body text-sm uppercase font-bold tracking-wider text-purple-400">Current Pattern</span>
              <h2 className="font-pixel-body text-3xl font-bold mt-1 text-white leading-tight">
                {preProcessDistortionName(selectedType)}
              </h2>
              
              {/* Character Portrait */}
              <div className="w-full aspect-square bg-slate-950 border-4 border-slate-700 rounded-none overflow-hidden my-4">
                <img 
                  src={CHARACTER_SPRITES[selectedType]} 
                  alt={selectedType}
                  className="w-full h-full object-cover"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>

              <p className="text-slate-300 text-sm leading-relaxed border-b border-slate-700 pb-4">
                {distortionTypes[selectedType]}
              </p>

              {/* Clarity meter */}
              <div className="mt-6 space-y-3">
                <div className="flex justify-between items-end">
                  <span className="font-pixel-body text-base text-slate-400 font-semibold flex items-center gap-1">
                    <TrendingDown size={16} className="text-teal-400" />
                    DISTORTION INTENSITY
                  </span>
                  <span className={`font-pixel-body text-lg font-bold ${intensity > 50 ? 'text-red-400' : 'text-teal-400'}`}>
                    {intensity}%
                  </span>
                </div>
                <div className="bg-slate-950 border-4 border-slate-700 rounded-none h-7 relative p-[2px]">
                  <div 
                    className="h-full bg-red-700 transition-all duration-700 ease-out"
                    style={{ width: `${intensity}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 leading-relaxed italic mt-2">
                  Dismantle the negative voice by providing realistic, balanced perspectives. Reduce distortion intensity below 15% to resolve the thought.
                </p>
              </div>
            </div>

            {/* Support box */}
            <div className="bg-slate-950 border-2 border-teal-800 rounded-none p-4">
              <h4 className="font-pixel-body text-sm text-teal-400 font-bold mb-1 flex items-center gap-1">
                <Heart size={14} />
                CBT GUIDANCE
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Take a deep breath. Focus on gathering evidence against the negative claim. Try to think what you would say to a close friend facing the same doubt.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Chat Screen */}
        <div className="lg:col-span-8 flex flex-col bg-slate-900 border-4 border-slate-700 rounded-none p-6 shadow-none h-[600px] lg:h-auto justify-between">
          
          {/* Chat message feed */}
          <div className="flex-1 overflow-y-auto space-y-4 p-4 mb-4 bg-slate-950 border-4 border-slate-800 rounded-none flex flex-col justify-start">
            <AnimatePresence initial={false}>
              {chatLog.map((msg, index) => {
                if (msg.sender === 'monster') {
                  return (
                    <motion.div 
                      key={index}
                      className="flex flex-col max-w-[85%] self-start"
                      initial={prefersReducedMotion ? {} : { opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <span className="font-pixel-body text-xs text-purple-400 uppercase tracking-widest font-bold ml-1 mb-1">
                        Negative Voice
                      </span>
                      <div className="bg-purple-950 border-2 border-purple-800 text-purple-100 rounded-none p-4 shadow-none leading-relaxed text-sm">
                        {msg.text}
                      </div>
                    </motion.div>
                  );
                } else if (msg.sender === 'player') {
                  return (
                    <motion.div 
                      key={index}
                      className="flex flex-col max-w-[85%] self-end"
                      initial={prefersReducedMotion ? {} : { opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <span className="font-pixel-body text-xs text-teal-400 uppercase tracking-widest font-bold mr-1 mb-1 text-right">
                        Your Reframe
                      </span>
                      <div className="bg-indigo-950 border-2 border-indigo-700 text-white rounded-none p-4 shadow-none leading-relaxed text-sm">
                        {msg.text}
                      </div>
                    </motion.div>
                  );
                } else {
                  // Feedback from evaluation
                  return (
                    <motion.div 
                      key={index}
                      className="w-full flex justify-center py-2"
                      initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4 }}
                    >
                      <div className={`flex items-start gap-3 rounded-none p-4 border max-w-[90%] text-sm leading-relaxed ${
                        msg.isPositive 
                          ? 'bg-teal-950/40 border-teal-800/40 text-teal-200' 
                          : 'bg-amber-950/40 border-amber-800/40 text-amber-200'
                      }`}>
                        <div className="mt-[2px] flex-shrink-0">
                          {msg.isPositive ? <CheckCircle size={18} className="text-teal-400" /> : <AlertCircle size={18} className="text-amber-400" />}
                        </div>
                        <div>
                          <span className="font-pixel-body text-xs block uppercase font-bold tracking-wider text-slate-400 mb-1">
                            CBT REFLECTION
                          </span>
                          {msg.text}
                        </div>
                      </div>
                    </motion.div>
                  );
                }
              })}
            </AnimatePresence>

            {isLoading && (
              <motion.div 
                className="flex items-center gap-2 self-start bg-slate-900 border-2 border-slate-800 rounded-none p-4 text-slate-400 text-sm font-pixel-body"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                EVALUATING THOUGHT REFRAME...
              </motion.div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Form input panel */}
          <form onSubmit={handleSubmitReframe} className="space-y-3">
            {error && (
              <div className="flex items-center gap-2 bg-red-950/40 border-2 border-red-800 rounded-none p-3 text-red-200 text-sm">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                <p className="flex-1 font-pixel-body">{error}</p>
              </div>
            )}

            <div className="relative flex flex-col md:flex-row items-stretch gap-3">
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type your healthy reframe here..."
                disabled={isLoading || stage === 'settled'}
                maxLength={400}
                className="flex-1 bg-slate-950 border-2 border-slate-700 rounded-none p-4 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none min-h-[80px] disabled:opacity-50 text-sm leading-relaxed"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitReframe(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={!userInput.trim() || isLoading || stage === 'settled'}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border-4 border-slate-600 disabled:border-slate-800 disabled:bg-slate-900 text-white font-pixel-body text-base font-bold rounded-none shadow-none transition duration-200 flex items-center justify-center gap-2 self-end md:self-stretch disabled:opacity-50"
              >
                <Send size={18} />
                SEND
              </button>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-400 px-1 font-pixel-body">
              <span>Press Enter to send</span>
              <span>{userInput.length}/400 chars</span>
            </div>
          </form>
        </div>
      </div>

      {/* Settle Resolution Overlay Stage */}
      <AnimatePresence>
        {stage === 'settled' && (
          <motion.div 
            className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-6"
            initial={prefersReducedMotion ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-slate-900 border-8 border-slate-700 rounded-none p-8 max-w-xl w-full text-center shadow-none relative overflow-hidden"
              initial={prefersReducedMotion ? {} : { scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              transition={{ duration: 0.5, type: 'spring' }}
            >
              <div className="w-20 h-20 bg-slate-950 border-4 border-teal-500 rounded-none flex items-center justify-center mx-auto mb-6 text-teal-400">
                <CheckCircle size={40} className="animate-pulse" />
              </div>

              <h2 className="text-xl md:text-2xl font-pixel-title leading-relaxed mb-6 text-teal-400">
                THE THOUGHT HAS SETTLED
              </h2>

              <p className="text-slate-300 text-base leading-relaxed mb-8">
                Through mindful CBT reframing, you have successfully dismantled the negative distortion and reduced its intensity down to <span className="text-teal-400 font-bold">{intensity}%</span>. The voice has lost its grip, and calm clarity is restored to your mind.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={handleReset}
                  className="px-6 py-4 bg-slate-950 border-4 border-slate-700 hover:border-slate-500 rounded-none text-white font-pixel-body text-lg font-bold transition flex items-center justify-center gap-2"
                >
                  <RotateCcw size={18} />
                  REFRAME ANOTHER
                </button>
                <button
                  onClick={handleBack}
                  className="px-6 py-4 bg-gradient-to-r from-teal-500 to-emerald-600 border-4 border-teal-400 text-slate-950 font-pixel-body text-lg font-bold rounded-none shadow-none transition flex items-center justify-center gap-2 hover:scale-[1.02]"
                >
                  <Award size={18} />
                  COMPLETE SESSION
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReframeGame;
