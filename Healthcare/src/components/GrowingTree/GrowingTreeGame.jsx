import { useState, useEffect } from "react";
import { ArrowLeft, Send, Sparkles, AlertCircle, CheckCircle, Leaf, RefreshCw } from "lucide-react";
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
    // Dynamically load handwriting and premium fonts
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Playpen+Sans:wght@400;500;700&family=Outfit:wght@300;400;600;800&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    
    loadTreeState();

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const loadTreeState = async () => {
    try {
      setLoading(true);
      const data = await growingTreeAPI.getState();
      if (data) {
        setTreeState(data);
      }
    } catch (err) {
      console.error("Failed to load tree state", err);
    } finally {
      setLoading(false);
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
        // Directly apply returned tasks — avoids race condition with getState()
        const returnedTasks = (data.tasks || []).map(t => ({
          ...t,
          completed: t.completed || false
        }));
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
      // Show fallback tasks so the UI doesn't get stuck
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
    // Find the task locally first so we can apply optimistic update
    const task = treeState.tasks.find(t => t.id === taskId);
    const taskSize = task ? (task.size || 1) : 1;

    try {
      setCompletingTaskId(taskId);
      const data = await growingTreeAPI.completeTask(taskId, taskSize);

      if (data && data.tasks && data.tasks.length > 0) {
        // DB is live — use full returned state
        setTreeState(data);
      } else {
        // Fallback: MongoDB offline — update locally
        const growthIncrement = taskSize * 10;
        setTreeState(prev => ({
          ...prev,
          tree_growth: Math.min(100, (prev.tree_growth || 0) + growthIncrement),
          tasks: prev.tasks.map(t =>
            t.id === taskId ? { ...t, completed: true } : t
          )
        }));
      }
    } catch (err) {
      console.error("Failed to complete task", err);
      // Still mark it done locally so the UX isn't broken
      const growthIncrement = taskSize * 10;
      setTreeState(prev => ({
        ...prev,
        tree_growth: Math.min(100, (prev.tree_growth || 0) + growthIncrement),
        tasks: prev.tasks.map(t =>
          t.id === taskId ? { ...t, completed: true } : t
        )
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

  const renderTreeImage = () => {
    const growth = treeState ? treeState.tree_growth : 0;
    
    let stageImg = "/tree_stage_1.png";
    let stageName = "Seedling";
    let stageDesc = "A tiny sprout taking its first breath in the soil.";

    if (growth >= 96) {
      stageImg = "/tree_stage_6.png";
      stageName = "Full Bloom";
      stageDesc = "A magnificent tree adorned with warm, glowing blossoms.";
    } else if (growth >= 76) {
      stageImg = "/tree_stage_5.png";
      stageName = "Nearly Full Tree";
      stageDesc = "Strong branches and a dense, lush green canopy.";
    } else if (growth >= 56) {
      stageImg = "/tree_stage_4.png";
      stageName = "Fuller Tree";
      stageDesc = "Spreading branches showing visible signs of resilience.";
    } else if (growth >= 36) {
      stageImg = "/tree_stage_3.png";
      stageName = "Young Tree";
      stageDesc = "A young tree growing stronger, branching outward.";
    } else if (growth >= 16) {
      stageImg = "/tree_stage_2.png";
      stageName = "Small Sapling";
      stageDesc = "Sprouting a thin trunk and a few delicate leaves.";
    }

    return (
      <div className="flex flex-col items-center justify-center space-y-4 w-full">
        <div className="relative w-64 h-64 md:w-72 md:h-72 rounded-3xl overflow-hidden bg-slate-950/40 border border-white/5 flex items-center justify-center p-4 shadow-inner group">
          {/* Ambient background glow */}
          <div className="absolute inset-0 bg-radial-gradient from-emerald-500/20 to-transparent opacity-60 blur-xl group-hover:scale-110 transition-transform duration-1000" />
          
          <img 
            src={stageImg} 
            alt={stageName} 
            className="w-full h-full object-contain relative z-10 transition-all duration-1000 transform group-hover:scale-105 filter drop-shadow-[0_10px_20px_rgba(16,185,129,0.3)]"
          />
        </div>
        <div className="text-center">
          <h4 className="text-emerald-400 font-extrabold tracking-wide uppercase text-sm">{stageName}</h4>
          <p className="text-gray-400 text-xs mt-1 max-w-[240px] mx-auto italic">{stageDesc}</p>
        </div>
      </div>
    );
  };

  const hasTasks = treeState && treeState.tasks && treeState.tasks.length > 0;
  const isSafetyTriggered = treeState && treeState.needs_human_support;

  return (
    <div className="min-h-screen bg-[#060810] text-white flex flex-col font-outfit relative overflow-hidden">
      
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 bg-radial-gradient from-emerald-950/20 via-slate-950 to-[#060810] z-0 pointer-events-none" />
      
      {/* Decorative Fireflies */}
      <div className="absolute top-1/4 left-1/10 w-2 h-2 bg-emerald-400 rounded-full blur-[2px] opacity-40 animate-ping duration-1000" />
      <div className="absolute top-2/3 right-1/8 w-3 h-3 bg-emerald-300 rounded-full blur-[3px] opacity-30 animate-pulse duration-2000" />
      <div className="absolute bottom-1/5 left-1/3 w-1.5 h-1.5 bg-emerald-400 rounded-full blur-[1px] opacity-50 animate-bounce duration-3000" />
      
      {/* Inline Styles for Sticky Note and custom layouts */}
      <style>{`
        .font-handwriting {
          font-family: 'Playpen Sans', 'Caveat', cursive;
        }
        .font-outfit {
          font-family: 'Outfit', sans-serif;
        }
        .sticky-note-container {
          perspective: 1000px;
        }
        .sticky-note {
          background: linear-gradient(145deg, #fffbc7 0%, #fffaad 100%);
          box-shadow: 
            0 2px 2px rgba(0,0,0,0.1),
            0 12px 28px rgba(0,0,0,0.25),
            0 4px 8px rgba(0,0,0,0.15);
          color: #27272a;
          position: relative;
          transform: rotate(-1.5deg);
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          border-bottom-left-radius: 40px 10px;
          border-bottom-right-radius: 5px 25px;
          border-top-left-radius: 4px;
          border-top-right-radius: 8px;
        }
        .sticky-note::after {
          content: "";
          position: absolute;
          bottom: 2px;
          left: 10px;
          width: 85%;
          height: 15px;
          background: rgba(0, 0, 0, 0.15);
          box-shadow: 0 8px 12px rgba(0, 0, 0, 0.3);
          transform: rotate(-2.5deg) skew(-5deg);
          z-index: -1;
        }
        .sticky-note:hover {
          transform: rotate(-0.5deg) translateY(-4px) scale(1.01);
          box-shadow: 
            0 4px 6px rgba(0,0,0,0.12),
            0 16px 36px rgba(0,0,0,0.3),
            0 6px 12px rgba(0,0,0,0.2);
        }
        .ruled-line {
          border-bottom: 1.5px dashed rgba(22, 101, 52, 0.15);
        }
      `}</style>

      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between bg-black/30 backdrop-blur-md sticky top-0 z-50">
        <button onClick={onExit} className="flex items-center gap-2 text-gray-400 hover:text-white transition duration-300 group">
          <ArrowLeft size={20} className="transform group-hover:-translate-x-1 transition" />
          <span className="text-sm font-medium tracking-wide">Back to Dashboard</span>
        </button>
        <h1 className="font-extrabold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 flex items-center gap-2 tracking-wider">
          <Leaf className="text-emerald-400 animate-pulse" size={24} />
          THE GROWING TREE
        </h1>
        <div className="w-20" />
      </header>

      {/* Main Grid Layout */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-8 items-center z-10">
        
        {/* Left Panel: Terrarium/Tree View (5 columns) */}
        <section className="md:col-span-5 bg-gradient-to-b from-white/5 to-white/0 rounded-3xl p-8 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-md min-h-[460px] shadow-2xl">
          <div className="absolute top-4 left-4 bg-emerald-500/10 text-emerald-300 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border border-emerald-500/20">
            <Sparkles size={13} className="text-emerald-400 animate-spin-slow" />
            MY LIVING TREE
          </div>

          <div className="absolute top-4 right-4 bg-slate-900/40 text-gray-400 px-3 py-1 rounded-full text-xs font-bold border border-white/5 flex items-center gap-1">
            <span>Growth Progress:</span>
            <span className="text-emerald-400 font-extrabold">{treeState ? treeState.tree_growth : 0}%</span>
          </div>

          {isSafetyTriggered ? (
            <div className="text-center p-6 space-y-4">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20 animate-pulse">
                <AlertCircle size={32} className="text-red-400" />
              </div>
              <h3 className="text-white font-extrabold text-lg">Safe Haven</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Your tree is waiting patiently. We want to make sure you have resources and support.
              </p>
            </div>
          ) : (
            <>
              {renderTreeImage()}
              <div className="bg-emerald-950/20 border border-emerald-500/10 rounded-2xl p-4 mt-6 max-w-xs text-center shadow-inner">
                <p className="text-xs text-emerald-300/80 font-medium italic leading-relaxed">
                  "Every tiny task you finish sprouts a leaf. If today is hard, your tree waits with no penalties."
                </p>
              </div>
            </>
          )}
        </section>

        {/* Right Panel: Gameplay Loops & Task Note (7 columns) */}
        <section className="md:col-span-7 flex flex-col gap-6 sticky-note-container">
          {isSafetyTriggered ? (
            /* Safety/Crisis Response Block */
            <div className="bg-gradient-to-br from-red-950/30 to-slate-950/40 rounded-3xl p-8 border border-red-500/20 shadow-2xl space-y-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="text-red-400 animate-bounce" size={24} />
                <span className="text-xs font-extrabold text-red-400 uppercase tracking-widest">Support Resource</span>
              </div>
              <p className="text-gray-200 text-base leading-relaxed whitespace-pre-line bg-red-950/10 p-5 rounded-2xl border border-red-500/10">
                {treeState.support_message}
              </p>
              <button
                onClick={handleResetTasks}
                className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-gray-300 font-bold rounded-2xl transition duration-300 border border-white/10"
              >
                Go Back & Share Something Else
              </button>
            </div>
          ) : hasTasks ? (
            /* STICKY NOTE FOR CHEKLIST */
            <div className="space-y-6">
              
              {/* Warm Acknowledgment Banner */}
              <div className="bg-emerald-950/20 rounded-2xl p-4 border border-emerald-500/15 backdrop-blur-sm flex items-start gap-3">
                <Sparkles className="text-emerald-400 mt-1 shrink-0" size={18} />
                <div>
                  <h4 className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase mb-1">A Gentle Note</h4>
                  <p className="text-gray-200 text-sm italic font-medium leading-relaxed">
                    "{treeState.acknowledgment}"
                  </p>
                </div>
              </div>

              {/* STICKY NOTE */}
              <div className="sticky-note p-8 pt-10 font-handwriting select-none">
                
                {/* Red pushpin */}
                <svg 
                  className="absolute -top-7 left-1/2 transform -translate-x-1/2 drop-shadow-[0_6px_6px_rgba(0,0,0,0.35)] z-20"
                  width="52" 
                  height="52" 
                  viewBox="0 0 100 100" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M47 50 L38 85 L42 86 L51 51 Z" fill="#9ca3af" />
                  <path d="M49 48 L41 85" stroke="#4b5563" strokeWidth="2.5" strokeLinecap="round" />
                  <ellipse cx="50" cy="35" rx="15" ry="15" fill="#ef4444" />
                  <path d="M38 35 C38 21 62 21 62 35 C62 49 38 49 38 35 Z" fill="#ef4444" />
                  <ellipse cx="50" cy="24" rx="11" ry="6" fill="#dc2626" />
                  <ellipse cx="48" cy="22" rx="4" ry="2" fill="#fff" opacity="0.6" />
                  <ellipse cx="50" cy="46" rx="13" ry="5" fill="#b91c1c" />
                </svg>

                {/* Vertical red margin line */}
                <div className="absolute top-0 bottom-0 left-6 w-[2px] bg-red-400/20" />

                <div className="pl-4 space-y-4">
                  <h3 className="text-lg font-bold text-emerald-900 border-b border-emerald-900/10 pb-2 mb-4 tracking-wide uppercase font-outfit flex items-center gap-1.5">
                    <Leaf size={16} /> My Sized Tasks
                  </h3>

                  {treeState.tasks.map((task) => {
                    const firstUncompleted = treeState.tasks.find(t => !t.completed);
                    const isCurrent = firstUncompleted && firstUncompleted.id === task.id;
                    const isCompleted = task.completed;

                    return (
                      <div
                        key={task.id}
                        className={`ruled-line pb-3 flex items-start justify-between gap-4 transition-all duration-300 ${
                          isCompleted ? "opacity-50" : isCurrent ? "scale-[1.01]" : "opacity-40"
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-outfit ${
                              task.size === 3 
                                ? "bg-purple-200 text-purple-900"
                                : task.size === 2
                                ? "bg-blue-200 text-blue-900"
                                : "bg-emerald-200 text-emerald-900"
                            }`}>
                              Size {task.size}
                            </span>
                            {isCompleted && (
                              <span className="text-xs text-emerald-700 font-extrabold flex items-center gap-1 font-outfit">
                                ✓ Done
                              </span>
                            )}
                          </div>
                          
                          <p className={`text-base md:text-lg font-bold leading-snug ${
                            isCompleted ? "line-through text-stone-500" : "text-stone-850"
                          }`}>
                            {task.text}
                          </p>
                        </div>

                        {/* Action buttons */}
                        {isCurrent && !isCompleted && (
                          <button
                            onClick={() => handleCompleteTask(task.id)}
                            disabled={completingTaskId === task.id}
                            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl transition duration-300 font-outfit shadow-md flex items-center gap-1.5 shrink-0 transform hover:scale-105"
                          >
                            {completingTaskId === task.id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <span>Check In</span>
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Show option to request new tasks once all are complete */}
              {treeState.tasks.every(t => t.completed) && (
                <div className="pt-2">
                  <button
                    onClick={handleResetTasks}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold rounded-2xl shadow-xl transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-[1.02]"
                  >
                    <RefreshCw size={18} className="animate-spin-slow" />
                    Share how you're feeling now
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* INPUT FORM LAYOUT */
            <div className="space-y-6">
              
              {/* Introduction Card */}
              <div className="bg-white/5 rounded-3xl p-8 border border-white/10 backdrop-blur-md shadow-2xl">
                <h2 className="text-white font-extrabold text-3xl mb-3 tracking-wide">Grow with Small Steps</h2>
                <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                  Every day is different. Share how you're feeling to receive a short list of micro-tasks tailored to fit your energy levels. No streaks to break, just a gentle path forward.
                </p>
              </div>

              {/* Input Form */}
              <form onSubmit={handleSubmitStatement} className="bg-gradient-to-b from-white/5 to-white/0 rounded-3xl p-8 border border-white/10 flex flex-col gap-6 shadow-2xl backdrop-blur-md">
                <div>
                  <label className="text-xs font-bold tracking-widest text-emerald-400 uppercase block mb-3">
                    What's going on today?
                  </label>
                  <textarea
                    value={statementInput}
                    onChange={(e) => setStatementInput(e.target.value)}
                    placeholder="E.g. Just feeling really off today... or My dog died, I'm depressed..."
                    className="w-full h-32 px-5 py-4 rounded-2xl bg-slate-950 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition duration-300 resize-none text-base leading-relaxed shadow-inner"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !statementInput.trim()}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold rounded-2xl shadow-xl transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={16} />
                      Generate Sized Tasks
                    </>
                  )}
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
