import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Send, Leaf, RefreshCw, AlertCircle, Mic, Square } from "lucide-react";
import { growingTreeAPI } from "../../services/growingTreeApi";

// ─── Sound Engine (Web Audio API — no files needed) ─────────────────────────
const playGrowthSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const play = (freq, start, dur, type = "sine", gain = 0.18) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = type; osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + start + dur * 0.6);
      g.gain.setValueAtTime(0, ctx.currentTime + start);
      g.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    };
    // Leaf rustle chime — C E G B sequence
    play(523, 0,    0.4, "triangle", 0.15);
    play(659, 0.12, 0.4, "triangle", 0.12);
    play(784, 0.24, 0.5, "triangle", 0.14);
    play(988, 0.36, 0.6, "triangle", 0.13);
    // Sub‑bass thump for "weight of growth"
    play(80,  0,    0.3, "sine",     0.08);
  } catch (_) {}
};

const playCompleteSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const play = (freq, start, dur, gain = 0.12) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = "sine"; osc.frequency.value = freq;
      g.gain.setValueAtTime(0, ctx.currentTime + start);
      g.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    };
    play(440, 0, 0.2); play(554, 0.1, 0.2); play(659, 0.2, 0.3);
  } catch (_) {}
};

const playMicStartSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const play = (freq, start, dur) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = "sine"; osc.frequency.value = freq;
      g.gain.setValueAtTime(0, ctx.currentTime + start);
      g.gain.linearRampToValueAtTime(0.08, ctx.currentTime + start + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    };
    // Quick double beep (high pitch)
    play(880, 0, 0.08);
    play(1046, 0.08, 0.12);
  } catch (_) {}
};

const playMicSuccessSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const play = (freq, start, dur) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = "triangle"; osc.frequency.value = freq;
      g.gain.setValueAtTime(0, ctx.currentTime + start);
      g.gain.linearRampToValueAtTime(0.1, ctx.currentTime + start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    };
    // Upward warm chime
    play(523, 0, 0.15);
    play(659, 0.08, 0.15);
    play(784, 0.16, 0.25);
  } catch (_) {}
};

// ─── Tree Stages ─────────────────────────────────────────────────────────────
const STAGES = [
  { min: 0,  img: "/tree_stage_1.png", label: "Seedling",    desc: "A tiny sprout pushing through the soil" },
  { min: 16, img: "/tree_stage_2.png", label: "Sapling",     desc: "Small and hopeful, reaching for the light" },
  { min: 36, img: "/tree_stage_3.png", label: "Young Tree",  desc: "Branches forming, learning to stand tall" },
  { min: 56, img: "/tree_stage_4.png", label: "Fuller Tree", desc: "Spreading wide with growing confidence" },
  { min: 76, img: "/tree_stage_5.png", label: "Tall & Strong", desc: "Nearly there — roots deep, crown full" },
  { min: 96, img: "/tree_stage_6.png", label: "Full Bloom",  desc: "Blossoms, fruit, and golden light 🌸" },
];

const getStage = (growth) => {
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (growth >= STAGES[i].min) return { ...STAGES[i], index: i };
  }
  return { ...STAGES[0], index: 0 };
};

// ─── Particle Component ───────────────────────────────────────────────────────
const GrowthParticles = ({ active }) => {
  if (!active) return null;
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: 30 + Math.random() * 40,
    delay: Math.random() * 0.5,
    size: 4 + Math.random() * 8,
    color: ["#34d399","#6ee7b7","#a7f3d0","#fbbf24","#86efac"][Math.floor(Math.random() * 5)],
    angle: Math.random() * 360,
    dist: 60 + Math.random() * 80,
  }));
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`, bottom: "40%",
            width: p.size, height: p.size,
            background: p.color,
            animation: `particle-fly 1.2s ease-out ${p.delay}s forwards`,
            "--angle": `${p.angle}deg`,
            "--dist": `${p.dist}px`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const GrowingTreeGame = ({ onExit }) => {
  const [treeState, setTreeState] = useState({
    tree_growth: 0, tasks: [], completed_tasks: [], remaining_tasks: [],
    current_mood: "", acknowledgment: "", needs_human_support: false, support_message: ""
  });
  const [statementInput, setStatementInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [isNewThreadMode, setIsNewThreadMode] = useState(false);
  const [apiError, setApiError] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [sttLoading, setSttLoading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // Growth animation state
  const [growing, setGrowing] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [stageUp, setStageUp] = useState(false);
  const [displayedImg, setDisplayedImg] = useState("/tree_stage_1.png");
  const [imgFading, setImgFading] = useState(false);
  const prevStageRef = useRef(0);

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Playpen+Sans:wght@400;600;700&family=Outfit:wght@300;400;600;800&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    loadTreeState();
    return () => { document.head.removeChild(link); };
  }, []);

  // Sync displayed image whenever growth changes — with crossfade if stage changed
  useEffect(() => {
    const stage = getStage(treeState.tree_growth || 0);
    if (stage.index !== prevStageRef.current) {
      // Stage changed — crossfade
      setImgFading(true);
      setTimeout(() => {
        setDisplayedImg(stage.img);
        setImgFading(false);
        prevStageRef.current = stage.index;
        setStageUp(true);
        setTimeout(() => setStageUp(false), 3000);
      }, 350);
    } else {
      setDisplayedImg(stage.img);
    }
  }, [treeState.tree_growth]);

  const triggerGrowthAnimation = useCallback(() => {
    setGrowing(true);
    setShowParticles(true);
    playGrowthSound();
    setTimeout(() => setGrowing(false), 900);
    setTimeout(() => setShowParticles(false), 1500);
  }, []);

  const loadTreeState = async () => {
    try {
      const data = await growingTreeAPI.getState();
      if (data) {
        setTreeState(data);
        const stage = getStage(data.tree_growth || 0);
        setDisplayedImg(stage.img);
        prevStageRef.current = stage.index;
      }
    } catch (err) { console.error("Failed to load tree state", err); }
  };

  const handleSubmitStatement = async (e) => {
    e.preventDefault();
    if (!statementInput.trim()) return;
    try {
      setSubmitting(true);
      setApiError("");
      setStreamingText("");
      
      let accumulated = "";
      
      await growingTreeAPI.generateTasksStream(
        statementInput,
        isNewThreadMode,
        (chunk) => {
          accumulated += chunk;
          setStreamingText(accumulated);
        },
        () => {
          try {
            const data = JSON.parse(accumulated);
            if (data.needs_human_support) {
              setTreeState(prev => ({ ...prev, needs_human_support: true, support_message: data.message, tasks: [], acknowledgment: "" }));
            } else {
              const tasks = (data.tasks || []).map(t => ({ ...t, completed: t.completed || false }));
              setTreeState(prev => ({ ...prev, tasks, acknowledgment: data.acknowledgment || "", needs_human_support: false, support_message: "" }));
            }
            setStatementInput("");
            setIsNewThreadMode(false);
            setStreamingText("");
          } catch (jsonErr) {
            console.error("Failed to parse streamed response", jsonErr);
            setApiError("Failed to process server response. Please try again.");
          }
        },
        (err) => {
          console.error("Failed to generate tasks stream", err);
          setApiError(err.message || "Failed to generate tasks due to an upstream API error.");
          setTreeState(prev => ({ ...prev, tasks: [] }));
          setStreamingText("");
        }
      );
    } finally {
      setSubmitting(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        await handleTranscribe(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      playMicStartSound();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      setApiError("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const handleTranscribe = async (audioBlob) => {
    try {
      setSttLoading(true);
      setApiError("");
      const result = await growingTreeAPI.transcribeAudio(audioBlob);
      if (result && result.text) {
        setStatementInput(prev => (prev ? prev + " " + result.text : result.text));
        playMicSuccessSound();
      } else {
        setApiError("No speech detected. Please speak closer to the microphone.");
      }
    } catch (err) {
      console.error("Transcription error:", err);
      setApiError(err.response?.data?.error || err.message || "Failed to transcribe audio.");
    } finally {
      setSttLoading(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    const task = treeState.tasks.find(t => t.id === taskId);
    const taskSize = task ? (task.size || 1) : 1;
    playCompleteSound();
    try {
      setCompletingTaskId(taskId);
      const data = await growingTreeAPI.completeTask(taskId, taskSize);

      if (data && data.tasks && data.tasks.length > 0) {
        const prevGrowth = treeState.tree_growth || 0;
        setTreeState(data);
        if ((data.tree_growth || 0) > prevGrowth) triggerGrowthAnimation();
      } else {
        const inc = taskSize * 10;
        setTreeState(prev => ({
          ...prev,
          tree_growth: Math.min(100, (prev.tree_growth || 0) + inc),
          tasks: prev.tasks.map(t => t.id === taskId ? { ...t, completed: true } : t)
        }));
        triggerGrowthAnimation();
      }
    } catch (_) {
      const inc = taskSize * 10;
      setTreeState(prev => ({
        ...prev,
        tree_growth: Math.min(100, (prev.tree_growth || 0) + inc),
        tasks: prev.tasks.map(t => t.id === taskId ? { ...t, completed: true } : t)
      }));
      triggerGrowthAnimation();
    } finally { setCompletingTaskId(null); }
  };

  const handleResetTasks = () => {
    setTreeState(prev => ({ ...prev, tasks: [], acknowledgment: "", needs_human_support: false, support_message: "" }));
  };

  const handleReplant = async () => {
    setResetting(true);
    // Fade out then swap to seedling
    setImgFading(true);
    await new Promise(r => setTimeout(r, 500));
    setDisplayedImg("/tree_stage_1.png");
    prevStageRef.current = 0;
    setImgFading(false);
    // Reset all state locally immediately
    const fresh = {
      tree_growth: 0, tasks: [], completed_tasks: [], remaining_tasks: [],
      current_mood: "", acknowledgment: "", needs_human_support: false, support_message: ""
    };
    setTreeState(fresh);
    // Persist to backend
    try { await growingTreeAPI.resetTree(); } catch (_) {}
    setResetting(false);
  };

  const stage = getStage(treeState.tree_growth || 0);
  const hasTasks = treeState.tasks && treeState.tasks.length > 0;
  const allDone = hasTasks && treeState.tasks.every(t => t.completed);

  return (
    <div
      className="min-h-screen w-full flex flex-col relative overflow-hidden"
      style={{ backgroundImage: "url('/growing_tree_bg.png')", backgroundSize: "cover", backgroundPosition: "center", fontFamily: "'Outfit', sans-serif" }}
    >
      <div className="absolute inset-0 bg-black/45 z-0" />

      <style>{`
        @keyframes particle-fly {
          0%   { transform: translate(0,0) scale(1); opacity: 1; }
          100% { transform: translate(calc(cos(var(--angle)) * var(--dist)), calc(sin(var(--angle)) * var(--dist) - 80px)) scale(0); opacity: 0; }
        }
        @keyframes tree-pop {
          0%   { transform: scale(1); filter: brightness(1); }
          30%  { transform: scale(1.12); filter: brightness(1.5) drop-shadow(0 0 24px #34d399); }
          60%  { transform: scale(1.06); filter: brightness(1.2) drop-shadow(0 0 12px #34d399); }
          100% { transform: scale(1); filter: brightness(1); }
        }
        @keyframes stage-badge {
          0%   { opacity: 0; transform: translateY(12px) scale(0.9); }
          15%  { opacity: 1; transform: translateY(0) scale(1.05); }
          80%  { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-6px); }
        }
        @keyframes shimmer-bg {
          0%,100% { opacity: 0; }
          50%      { opacity: 1; }
        }
        .tree-growing { animation: tree-pop 0.9s cubic-bezier(0.36,0.07,0.19,0.97) forwards; }
        .img-fade-out { opacity: 0; transition: opacity 0.35s ease; }
        .img-fade-in  { opacity: 1; transition: opacity 0.35s ease 0.35s; }
        .stage-banner { animation: stage-badge 3s ease forwards; }
        .growth-fill  { background: linear-gradient(90deg, #34d399, #10b981); transition: width 1.2s cubic-bezier(0.25,0.8,0.25,1); }
        .sticky {
          background: linear-gradient(160deg, #fffde0 0%, #fff9b0 100%);
          border-radius: 3px 3px 28px 4px / 3px 3px 12px 18px;
          box-shadow: 3px 3px 12px rgba(0,0,0,0.25), 0 18px 30px rgba(0,0,0,0.15);
          transform: rotate(-1deg); transition: transform 0.3s ease; position: relative;
        }
        .sticky:hover { transform: rotate(0deg) scale(1.01); }
        .sticky::after {
          content:''; position:absolute; bottom:-4px; left:8px; width:90%; height:12px;
          background:rgba(0,0,0,0.12); box-shadow:0 6px 10px rgba(0,0,0,0.22);
          transform:rotate(-1.5deg) skew(-4deg); z-index:-1;
        }
        .task-line { border-bottom: 1.5px dashed rgba(34,85,34,0.15); }
      `}</style>

      {/* Floating Back */}
      <button
        onClick={onExit}
        className="absolute top-5 left-5 z-20 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/30 backdrop-blur-md border border-white/10 text-white/60 hover:text-white hover:bg-black/50 transition-all duration-200 group text-sm font-medium"
      >
        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
        Back
      </button>

      {/* Main layout */}
      <main className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-center gap-8 px-6 py-10 max-w-6xl mx-auto w-full">

        {/* ── LEFT: Tree ── */}
        <section className="flex flex-col items-center justify-center gap-3 md:w-5/12">

          {/* Stage-up banner */}
          {stageUp && (
            <div className="stage-banner px-5 py-2 rounded-full bg-emerald-400/20 backdrop-blur border border-emerald-400/40 text-emerald-300 text-xs font-bold tracking-widest uppercase flex items-center gap-2">
              <Leaf size={12} className="animate-bounce" />
              Your tree grew! → {stage.label}
            </div>
          )}

          {/* Tree image with glow ring during growth */}
          <div className="relative flex items-center justify-center">
            {growing && (
              <div className="absolute inset-0 rounded-full bg-emerald-400/10 animate-ping scale-110 pointer-events-none" />
            )}

            <GrowthParticles active={showParticles} />

            <img
              src={displayedImg}
              alt={stage.label}
              className={`w-[420px] h-[420px] md:w-[480px] md:h-[480px] object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.8)] ${imgFading ? "img-fade-out" : "img-fade-in"} ${growing ? "tree-growing" : ""}`}
            />

            {/* Ground glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-44 h-6 bg-emerald-500/25 blur-2xl rounded-full pointer-events-none" />
          </div>

          {/* Stage info */}
          <div className="text-center space-y-1">
            <p className="text-emerald-300 font-bold tracking-widest uppercase text-xs">{stage.label}</p>
            <p className="text-white/40 text-[11px] italic">{stage.desc}</p>
          </div>

          {/* Growth bar */}
          <div className="w-56 bg-white/10 backdrop-blur-sm rounded-full h-2.5 overflow-hidden border border-white/10">
            <div className="growth-fill h-full rounded-full" style={{ width: `${treeState.tree_growth || 0}%` }} />
          </div>
          <p className="text-white/40 text-[11px]">{treeState.tree_growth || 0}% grown</p>

          <p className="text-center text-white/30 text-[10px] italic max-w-xs leading-relaxed">
            "Every small step is a leaf. If today is hard, your tree just waits."
          </p>

          {/* Replant button — proper button */}
          <button
            onClick={() => {
              // Start a fresh concern thread without resetting the growth progress
              setTreeState(prev => ({ ...prev, tasks: [] }));
              setIsNewThreadMode(true);
              setStatementInput("");
            }}
            disabled={resetting}
            className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/30 border border-amber-400/30 hover:border-amber-400/60 text-amber-300 hover:text-amber-200 font-semibold text-sm transition-all duration-200 group"
          >
            <span className="text-base group-hover:rotate-12 transition-transform inline-block">🌱</span>
            {resetting ? "Replanting…" : "Something else bothering you?"}
          </button>
        </section>

        {/* ── RIGHT: Interaction ── */}
        <section className="flex flex-col gap-5 md:w-7/12 w-full">

          {treeState.needs_human_support ? (
            <div className="bg-black/50 backdrop-blur-md rounded-2xl p-6 border border-red-500/30 text-white space-y-4">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle size={20} />
                <span className="text-xs font-bold uppercase tracking-widest">You deserve real support</span>
              </div>
              <p className="text-gray-200 text-sm leading-relaxed">{treeState.support_message}</p>
              <button onClick={handleResetTasks} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition text-sm">
                Share something else
              </button>
            </div>

          ) : hasTasks ? (
            <div className="space-y-4">
              {treeState.acknowledgment && (
                <p className="text-white/80 italic text-sm font-medium leading-relaxed drop-shadow px-1">
                  <span className="text-emerald-300 font-bold not-italic">✦</span> "{treeState.acknowledgment}"
                </p>
              )}

              {/* Sticky note */}
              <div className="sticky font-hand p-7 pt-10 relative" style={{ fontFamily: "'Playpen Sans', 'Caveat', cursive" }}>
                <svg className="absolute -top-6 left-1/2 -translate-x-1/2 drop-shadow-lg z-20" width="44" height="44" viewBox="0 0 100 100" fill="none">
                  <path d="M47 50 L39 83 L43 84 L51 51 Z" fill="#9ca3af"/>
                  <ellipse cx="50" cy="33" rx="14" ry="14" fill="#ef4444"/>
                  <ellipse cx="50" cy="23" rx="10" ry="5.5" fill="#dc2626"/>
                  <ellipse cx="48" cy="21" rx="3.5" ry="1.8" fill="#fff" opacity="0.55"/>
                  <ellipse cx="50" cy="44" rx="12" ry="4.5" fill="#b91c1c"/>
                </svg>
                <div className="absolute top-0 bottom-0 left-5 w-[2px] bg-red-400/25" />

                <div className="pl-3 space-y-3">
                  <h3 className="text-emerald-900 font-bold uppercase tracking-wide text-base border-b border-emerald-900/10 pb-2 mb-3 flex items-center gap-1.5" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    <Leaf size={14} /> Today's Tasks
                  </h3>

                  {treeState.tasks.map((task) => {
                    const firstPending = treeState.tasks.find(t => !t.completed);
                    const isCurrent = firstPending && firstPending.id === task.id;
                    const isDone = task.completed;

                    return (
                      <div key={task.id} className={`task-line pb-2.5 flex items-start justify-between gap-3 transition-all duration-500 ${isDone ? "opacity-35" : isCurrent ? "" : "opacity-35"}`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${task.size === 3 ? "bg-purple-200 text-purple-900" : task.size === 2 ? "bg-sky-200 text-sky-900" : "bg-emerald-200 text-emerald-900"}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
                              {task.size === 3 ? "big step" : task.size === 2 ? "medium" : "tiny"}
                            </span>
                            {isDone && <span className="text-[10px] text-emerald-800 font-bold" style={{ fontFamily: "'Outfit', sans-serif" }}>✓ done</span>}
                          </div>
                          <p className={`text-lg md:text-xl font-bold leading-tight text-stone-800 ${isDone ? "line-through text-stone-400" : ""}`}>{task.text}</p>
                        </div>

                        {isCurrent && !isDone && (
                          <button
                            onClick={() => handleCompleteTask(task.id)}
                            disabled={completingTaskId === task.id}
                            className="shrink-0 px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition hover:scale-105"
                            style={{ fontFamily: "'Outfit', sans-serif" }}
                          >
                            {completingTaskId === task.id
                              ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              : "✓ Done"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {allDone && (
                <button
                  onClick={handleResetTasks}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02] shadow-xl"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  <RefreshCw size={16} /> Share how you're feeling now
                </button>
              )}
            </div>

          ) : (
            /* Input form */
            <div className="space-y-4">
              <div className="text-white">
                <h2 className="font-extrabold text-3xl mb-2 leading-tight">Grow with Small Steps</h2>
                <p className="text-white/60 text-sm leading-relaxed">
                  Share what's going on — you'll get a short list of tiny tasks matched to your energy today.
                  No streaks. No pressure. Just you and your growing tree.
                </p>
              </div>
              <form onSubmit={handleSubmitStatement} className="flex flex-col gap-4">
                <div>
                  <label className="text-emerald-300 text-[10px] font-bold tracking-widest uppercase block mb-2">What's going on today?</label>
                  <div className="relative">
                  <textarea
                    value={statementInput}
                    onChange={e => setStatementInput(e.target.value)}
                    placeholder="E.g. My dog died, I'm devastated… or just feeling really low today…"
                    className="w-full h-32 pl-5 pr-14 py-4 rounded-2xl bg-black/40 backdrop-blur-sm border border-white/15 text-white placeholder-white/30 focus:outline-none focus:border-emerald-400 transition resize-none text-sm leading-relaxed"
                    required
                  />
                  <div className="absolute right-4 bottom-4 z-10 flex items-center gap-2">
                    {isRecording ? (
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="p-3 bg-red-500/25 hover:bg-red-500/40 text-red-300 border border-red-500/50 rounded-xl hover:scale-105 transition duration-200 flex items-center justify-center gap-1.5 animate-pulse"
                      >
                        <Square size={16} />
                        <span className="text-[10px] font-bold font-mono">{recordingTime}s</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={startRecording}
                        disabled={submitting || sttLoading}
                        className="p-3 bg-white/10 hover:bg-white/20 border border-white/15 text-white/80 hover:text-white rounded-xl hover:scale-105 transition duration-200 flex items-center justify-center disabled:opacity-50"
                        title="Record your voice"
                      >
                        {sttLoading ? (
                          <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Mic size={16} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
                {submitting && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                    <span className="animate-pulse inline-block mr-1">✦</span>
                    {streamingText ? "Generating tasks..." : "Connecting to Gemini..."}
                  </div>
                )}
                {apiError && (
                  <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold leading-relaxed">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{apiError}</span>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={submitting || !statementInput.trim()}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold rounded-2xl shadow-xl transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting
                    ? <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    : <><Send size={16} /> Generate Sized Tasks</>}
                </button>
              </form>
            </div>
          )}
        </section>
      </main>

    </div>
  );
};

export default GrowingTreeGame;
