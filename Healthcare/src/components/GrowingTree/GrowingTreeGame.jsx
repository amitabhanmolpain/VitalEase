import { useState, useEffect } from "react";
import { ArrowLeft, Send, Leaf, RefreshCw, AlertCircle, Sparkles } from "lucide-react";
import { growingTreeAPI } from "../../services/growingTreeApi";

const GrowingTreeGame = ({ onExit }) => {
  const [treeState, setTreeState] = useState({
    tree_growth: 0,
    tasks: [],
    completed_tasks: [],
    remaining_tasks: [],
    current_mood: "",
    acknowledgment: "",
    needs_human_support: false,
    support_message: ""
  });
  const [statementInput, setStatementInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState(null);

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Playpen+Sans:wght@400;600;700&family=Outfit:wght@300;400;600;800&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    loadTreeState();
    return () => { document.head.removeChild(link); };
  }, []);

  const loadTreeState = async () => {
    try {
      const data = await growingTreeAPI.getState();
      if (data) setTreeState(data);
    } catch (err) {
      console.error("Failed to load tree state", err);
    }
  };

  const handleSubmitStatement = async (e) => {
    e.preventDefault();
    if (!statementInput.trim()) return;
    try {
      setSubmitting(true);
      const data = await growingTreeAPI.generateTasks(statementInput);
      if (data.needs_human_support) {
        setTreeState(prev => ({
          ...prev,
          needs_human_support: true,
          support_message: data.message,
          tasks: [],
          acknowledgment: ""
        }));
      } else {
        const returnedTasks = (data.tasks || []).map(t => ({ ...t, completed: t.completed || false }));
        setTreeState(prev => ({
          ...prev,
          tasks: returnedTasks,
          acknowledgment: data.acknowledgment || "",
          needs_human_support: false,
          support_message: ""
        }));
      }
      setStatementInput("");
    } catch (err) {
      console.error("Failed to generate tasks", err);
      setTreeState(prev => ({
        ...prev,
        tasks: [
          { id: "t1", text: "Drink a glass of water slowly.", size: 1, completed: false },
          { id: "t2", text: "Sit somewhere comfortable for a few minutes.", size: 1, completed: false },
          { id: "t3", text: "Step outside or open a window.", size: 2, completed: false }
        ],
        acknowledgment: "I hear you. Let's take it one small step at a time.",
        needs_human_support: false
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    const task = treeState.tasks.find(t => t.id === taskId);
    const taskSize = task ? (task.size || 1) : 1;
    try {
      setCompletingTaskId(taskId);
      const data = await growingTreeAPI.completeTask(taskId, taskSize);
      if (data && data.tasks && data.tasks.length > 0) {
        setTreeState(data);
      } else {
        const growthIncrement = taskSize * 10;
        setTreeState(prev => ({
          ...prev,
          tree_growth: Math.min(100, (prev.tree_growth || 0) + growthIncrement),
          tasks: prev.tasks.map(t => t.id === taskId ? { ...t, completed: true } : t)
        }));
      }
    } catch (err) {
      const growthIncrement = taskSize * 10;
      setTreeState(prev => ({
        ...prev,
        tree_growth: Math.min(100, (prev.tree_growth || 0) + growthIncrement),
        tasks: prev.tasks.map(t => t.id === taskId ? { ...t, completed: true } : t)
      }));
    } finally {
      setCompletingTaskId(null);
    }
  };

  const handleResetTasks = () => {
    setTreeState(prev => ({
      ...prev,
      tasks: [],
      acknowledgment: "",
      needs_human_support: false,
      support_message: ""
    }));
  };

  const getTreeStage = () => {
    const g = treeState.tree_growth || 0;
    if (g >= 96) return { img: "/tree_stage_6.png", label: "Full Bloom" };
    if (g >= 76) return { img: "/tree_stage_5.png", label: "Nearly Full" };
    if (g >= 56) return { img: "/tree_stage_4.png", label: "Fuller Tree" };
    if (g >= 36) return { img: "/tree_stage_3.png", label: "Young Tree" };
    if (g >= 16) return { img: "/tree_stage_2.png", label: "Sapling" };
    return { img: "/tree_stage_1.png", label: "Seedling" };
  };

  const hasTasks = treeState.tasks && treeState.tasks.length > 0;
  const isSafetyTriggered = treeState.needs_human_support;
  const stage = getTreeStage();
  const allDone = hasTasks && treeState.tasks.every(t => t.completed);

  return (
    <div
      className="min-h-screen w-full flex flex-col relative overflow-hidden"
      style={{
        backgroundImage: "url('/growing_tree_bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        fontFamily: "'Outfit', sans-serif"
      }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/45 z-0" />

      {/* Inline styles */}
      <style>{`
        .font-hand { font-family: 'Playpen Sans', 'Caveat', cursive; }
        .sticky {
          background: linear-gradient(160deg, #fffde0 0%, #fff9b0 100%);
          border-radius: 3px 3px 28px 4px / 3px 3px 12px 18px;
          box-shadow: 3px 3px 12px rgba(0,0,0,0.25), 0 18px 30px rgba(0,0,0,0.15);
          transform: rotate(-1deg);
          transition: transform 0.3s ease;
          position: relative;
        }
        .sticky:hover { transform: rotate(0deg) scale(1.01); }
        .sticky::after {
          content: '';
          position: absolute;
          bottom: -4px; left: 8px;
          width: 90%;
          height: 12px;
          background: rgba(0,0,0,0.12);
          box-shadow: 0 6px 10px rgba(0,0,0,0.22);
          transform: rotate(-1.5deg) skew(-4deg);
          z-index: -1;
        }
        .task-line { border-bottom: 1.5px dashed rgba(34,85,34,0.15); }
        .growth-bar-fill {
          background: linear-gradient(90deg, #34d399, #10b981);
          transition: width 1.2s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
      `}</style>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 bg-black/30 backdrop-blur-sm border-b border-white/10">
        <button
          onClick={onExit}
          className="flex items-center gap-2 text-white/70 hover:text-white transition group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <h1 className="text-white font-extrabold text-xl tracking-widest flex items-center gap-2">
          <Leaf className="text-emerald-400 animate-pulse" size={22} />
          THE GROWING TREE
        </h1>
        <div className="w-24" />
      </header>

      {/* Main layout */}
      <main className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-center gap-8 px-6 py-8 max-w-6xl mx-auto w-full">

        {/* LEFT: Tree */}
        <section className="flex flex-col items-center justify-center gap-3 md:w-5/12">
          {/* Tree image — no card, just floats on the background */}
          <div className="relative group">
            <img
              src={stage.img}
              alt={stage.label}
              className="w-72 h-72 md:w-80 md:h-80 object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.7)] transition-all duration-1000 group-hover:scale-105"
            />
            {/* Soft ground glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-6 bg-emerald-500/20 blur-2xl rounded-full" />
          </div>

          {/* Stage label */}
          <div className="text-center">
            <p className="text-emerald-300 font-bold tracking-widest uppercase text-xs">{stage.label}</p>
            <p className="text-white/50 text-xs mt-0.5 italic">Growth: {treeState.tree_growth || 0}%</p>
          </div>

          {/* Growth bar */}
          <div className="w-56 bg-white/10 backdrop-blur-sm rounded-full h-2.5 overflow-hidden border border-white/10">
            <div
              className="growth-bar-fill h-full rounded-full"
              style={{ width: `${treeState.tree_growth || 0}%` }}
            />
          </div>

          {/* Tagline */}
          <p className="text-center text-white/40 text-[11px] italic max-w-xs mt-1 leading-relaxed">
            "Every small step is a leaf. If today is hard, your tree just waits."
          </p>
        </section>

        {/* RIGHT: Interaction */}
        <section className="flex flex-col gap-5 md:w-7/12 w-full">

          {/* SAFETY BLOCK */}
          {isSafetyTriggered ? (
            <div className="bg-black/50 backdrop-blur-md rounded-2xl p-6 border border-red-500/30 text-white space-y-4">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle size={20} />
                <span className="text-xs font-bold uppercase tracking-widest">You deserve real support</span>
              </div>
              <p className="text-gray-200 text-sm leading-relaxed">{treeState.support_message}</p>
              <button
                onClick={handleResetTasks}
                className="mt-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition text-sm"
              >
                Share something else
              </button>
            </div>
          ) : hasTasks ? (
            <div className="space-y-4">
              {/* Acknowledgment — minimal text, no card */}
              {treeState.acknowledgment && (
                <p className="text-white/80 italic text-sm font-medium leading-relaxed drop-shadow px-1">
                  <span className="text-emerald-300 font-bold not-italic">✦</span>{" "}
                  "{treeState.acknowledgment}"
                </p>
              )}

              {/* STICKY NOTE */}
              <div className="sticky font-hand p-7 pt-10 relative">
                {/* Red Pushpin SVG */}
                <svg
                  className="absolute -top-6 left-1/2 -translate-x-1/2 drop-shadow-lg z-20"
                  width="44" height="44" viewBox="0 0 100 100" fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M47 50 L39 83 L43 84 L51 51 Z" fill="#9ca3af"/>
                  <path d="M49 48 L41 83" stroke="#4b5563" strokeWidth="2.5" strokeLinecap="round"/>
                  <ellipse cx="50" cy="33" rx="14" ry="14" fill="#ef4444"/>
                  <path d="M38 33 C38 20 62 20 62 33 C62 46 38 46 38 33 Z" fill="#ef4444"/>
                  <ellipse cx="50" cy="23" rx="10" ry="5.5" fill="#dc2626"/>
                  <ellipse cx="48" cy="21" rx="3.5" ry="1.8" fill="#fff" opacity="0.55"/>
                  <ellipse cx="50" cy="44" rx="12" ry="4.5" fill="#b91c1c"/>
                </svg>

                {/* Left margin line */}
                <div className="absolute top-0 bottom-0 left-5 w-[2px] bg-red-400/25" />

                <div className="pl-3 space-y-3">
                  <h3 className="text-emerald-900 font-bold uppercase tracking-wide text-base border-b border-emerald-900/10 pb-2 mb-3 flex items-center gap-1.5" style={{fontFamily: "'Outfit', sans-serif"}}>
                    <Leaf size={14}/> Today's Tasks
                  </h3>

                  {treeState.tasks.map((task) => {
                    const firstPending = treeState.tasks.find(t => !t.completed);
                    const isCurrent = firstPending && firstPending.id === task.id;
                    const isDone = task.completed;

                    return (
                      <div
                        key={task.id}
                        className={`task-line pb-2.5 flex items-start justify-between gap-3 transition-all duration-300 ${
                          isDone ? "opacity-40" : isCurrent ? "" : "opacity-35"
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              task.size === 3 ? "bg-purple-200 text-purple-900"
                              : task.size === 2 ? "bg-sky-200 text-sky-900"
                              : "bg-emerald-200 text-emerald-900"
                            }`} style={{fontFamily: "'Outfit', sans-serif"}}>
                              {task.size === 3 ? "big step" : task.size === 2 ? "medium" : "tiny"}
                            </span>
                            {isDone && (
                              <span className="text-[10px] text-emerald-800 font-bold" style={{fontFamily: "'Outfit', sans-serif"}}>✓ done</span>
                            )}
                          </div>
                          <p className={`text-lg md:text-xl font-bold leading-tight text-stone-800 ${isDone ? "line-through text-stone-400" : ""}`}>
                            {task.text}
                          </p>
                        </div>

                        {isCurrent && !isDone && (
                          <button
                            onClick={() => handleCompleteTask(task.id)}
                            disabled={completingTaskId === task.id}
                            className="shrink-0 px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition hover:scale-105"
                            style={{fontFamily: "'Outfit', sans-serif"}}
                          >
                            {completingTaskId === task.id
                              ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                              : "✓ Done"
                            }
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
                  style={{fontFamily: "'Outfit', sans-serif"}}
                >
                  <RefreshCw size={16} />
                  Share how you're feeling now
                </button>
              )}
            </div>
          ) : (
            /* INPUT FORM */
            <div className="space-y-4">
              <div className="text-white">
                <h2 className="font-extrabold text-3xl mb-2 leading-tight">Grow with Small Steps</h2>
                <p className="text-white/60 text-sm leading-relaxed">
                  Share what's going on — you'll get a short list of tiny tasks matched to your energy today.
                  No streaks. No pressure. Just you and your growing tree.
                </p>
              </div>

              <form
                onSubmit={handleSubmitStatement}
                className="flex flex-col gap-4"
              >
                <div>
                  <label className="text-emerald-300 text-[10px] font-bold tracking-widest uppercase block mb-2">
                    What's going on today?
                  </label>
                  <textarea
                    value={statementInput}
                    onChange={e => setStatementInput(e.target.value)}
                    placeholder="E.g. My dog died, I'm devastated… or just feeling really low today…"
                    className="w-full h-32 px-5 py-4 rounded-2xl bg-black/40 backdrop-blur-sm border border-white/15 text-white placeholder-white/30 focus:outline-none focus:border-emerald-400 transition resize-none text-sm leading-relaxed"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !statementInput.trim()}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold rounded-2xl shadow-xl transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting
                    ? <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"/>
                    : <><Send size={16}/> Generate Sized Tasks</>
                  }
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
