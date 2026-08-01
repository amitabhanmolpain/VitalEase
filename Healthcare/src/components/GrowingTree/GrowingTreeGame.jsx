import { useState, useEffect } from "react";
import { ArrowLeft, Send, Sparkles, AlertCircle, CheckCircle, Leaf } from "lucide-react";
import { growingTreeAPI } from "../../services/growingTreeApi";

const GrowingTreeGame = ({ onExit }) => {
  const [treeState, setTreeState] = useState(null);
  const [statementInput, setStatementInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState(null);

  useEffect(() => {
    loadTreeState();
  }, []);

  const loadTreeState = async () => {
    try {
      setLoading(true);
      const data = await growingTreeAPI.getState();
      setTreeState(data);
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
      // Backend returns either needs_human_support structure or tasks & acknowledgment
      if (data.needs_human_support) {
        setTreeState({
          ...treeState,
          needs_human_support: true,
          support_message: data.message,
          tasks: [],
          acknowledgment: ""
        });
      } else {
        // Fetch fresh state to update all fields including growth
        const freshState = await growingTreeAPI.getState();
        setTreeState(freshState);
      }
      setStatementInput("");
    } catch (err) {
      console.error("Failed to generate tasks", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      setCompletingTaskId(taskId);
      const data = await growingTreeAPI.completeTask(taskId);
      setTreeState(data);
    } catch (err) {
      console.error("Failed to complete task", err);
    } finally {
      setCompletingTaskId(null);
    }
  };

  const handleResetTasks = () => {
    // Allows user to re-input statement to get a new list of tasks
    setTreeState(prev => ({
      ...prev,
      tasks: [],
      acknowledgment: "",
      needs_human_support: false,
      support_message: ""
    }));
  };

  // Dynamically render a tree based on growth scale (0 to 100)
  const renderTreeSVG = () => {
    const growth = treeState ? treeState.tree_growth : 0;
    // Calculate parameters based on growth progress (0 to 100)
    const trunkHeight = Math.min(100, 20 + growth * 0.8);
    const canopyRadiusX = Math.min(80, 10 + growth * 0.7);
    const canopyRadiusY = Math.min(70, 8 + growth * 0.6);
    const leafCount = Math.min(40, Math.floor(growth / 2.5) + (growth > 0 ? 3 : 0));

    const leaves = [];
    for (let i = 0; i < leafCount; i++) {
      const angle = (i * 2.39996) * (180 / Math.PI); // Golden angle
      const radius = Math.sqrt(i) * (canopyRadiusX / Math.sqrt(leafCount));
      const lx = 150 + Math.cos(angle * Math.PI / 180) * radius;
      const ly = (250 - trunkHeight) + Math.sin(angle * Math.PI / 180) * radius * 0.8;
      leaves.push({ x: lx, y: ly, id: i });
    }

    return (
      <svg className="w-full h-80 max-w-sm mx-auto" viewBox="0 0 300 320" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Pot */}
        <path d="M120 280 L180 280 L190 310 L110 310 Z" fill="#4e342e" stroke="#3e2723" strokeWidth="3" />
        <ellipse cx="150" cy="280" rx="30" ry="6" fill="#3e2723" />

        {/* Tree Trunk */}
        {growth > 0 && (
          <path 
            d={`M 144,280 Q 148,${280 - trunkHeight * 0.5} 146,${280 - trunkHeight} L 154,${280 - trunkHeight} Q 152,${280 - trunkHeight * 0.5} 156,280 Z`} 
            fill="#5d4037" 
            stroke="#4e342e" 
            strokeWidth="1.5" 
            className="transition-all duration-700"
          />
        )}

        {/* Canopy backing outline (glowing aura) */}
        {growth > 10 && (
          <ellipse 
            cx="150" 
            cy={280 - trunkHeight} 
            rx={canopyRadiusX + 5} 
            ry={canopyRadiusY + 5} 
            fill="rgba(76, 175, 80, 0.12)" 
            className="transition-all duration-700"
          />
        )}

        {/* Individual organic leaves */}
        {leaves.map((leaf) => (
          <g key={leaf.id} className="transition-all duration-700 transform hover:scale-125 origin-center">
            <path
              d={`M ${leaf.x} ${leaf.y} C ${leaf.x - 6} ${leaf.y - 6}, ${leaf.x - 6} ${leaf.y - 12}, ${leaf.x} ${leaf.y - 18} C ${leaf.x + 6} ${leaf.y - 12}, ${leaf.x + 6} ${leaf.y - 6}, ${leaf.x} ${leaf.y}`}
              fill={leaf.id % 2 === 0 ? "#81c784" : "#4caf50"}
            />
          </g>
        ))}

        {/* Dynamic Growth Score Text */}
        <text x="150" y="40" fill="#a5d6a7" textAnchor="middle" className="font-poppins font-semibold text-lg">
          Growth: {growth}%
        </text>
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400 font-medium">Entering the Garden...</p>
      </div>
    );
  }

  const hasTasks = treeState && treeState.tasks && treeState.tasks.length > 0;
  const isSafetyTriggered = treeState && treeState.needs_human_support;

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white flex flex-col font-poppins">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between bg-white/5 backdrop-blur-sm sticky top-0 z-50">
        <button onClick={onExit} className="flex items-center gap-2 text-gray-400 hover:text-white transition">
          <ArrowLeft size={20} />
          <span>Exit to Dashboard</span>
        </button>
        <h1 className="font-bold text-xl text-emerald-400 flex items-center gap-2">
          <Leaf className="text-emerald-400 animate-pulse" />
          The Growing Tree
        </h1>
        <div className="w-20" />
      </div>

      <div className="flex-1 max-w-4xl w-full mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left Side: Tree Visualization */}
        <div className="bg-white/5 rounded-3xl p-8 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-sm min-h-[400px]">
          <div className="absolute top-4 left-4 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border border-emerald-500/30">
            <Sparkles size={12} />
            Companion Garden
          </div>
          {isSafetyTriggered ? (
            <div className="text-center p-6 space-y-4">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                <AlertCircle size={32} className="text-red-400" />
              </div>
              <h3 className="text-white font-bold text-lg">Safe Haven</h3>
              <p className="text-gray-400 text-sm">Our tree is waiting patiently. Let's make sure you get the support you need first.</p>
            </div>
          ) : (
            <>
              {renderTreeSVG()}
              <p className="text-center text-sm text-gray-400 mt-4 italic max-w-xs">
                "One small step today forms a leaf. If you struggle, the tree just waits."
              </p>
            </>
          )}
        </div>

        {/* Right Side: Gameplay Loop */}
        <div className="flex flex-col gap-6">
          {/* Safety Branch Block */}
          {isSafetyTriggered ? (
            <div className="bg-gradient-to-br from-red-950/40 to-slate-900/40 rounded-3xl p-6 border border-red-500/20 shadow-xl space-y-4">
              <span className="text-xs font-semibold text-red-400 uppercase tracking-widest block">Important Message</span>
              <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-line">
                {treeState.support_message}
              </p>
              <button
                onClick={handleResetTasks}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-medium rounded-xl transition"
              >
                Go Back / Share Something Else
              </button>
            </div>
          ) : hasTasks ? (
            /* Sequential Checklist Flow */
            <div className="space-y-4">
              <div className="bg-white/5 rounded-3xl p-6 border border-white/10 backdrop-blur-sm">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest block mb-2">Gentle Acknowledgment</span>
                <p className="text-gray-200 text-sm leading-relaxed italic">
                  "{treeState.acknowledgment}"
                </p>
              </div>

              {/* Task checklist container */}
              <div className="space-y-3">
                {treeState.tasks.map((task, index) => {
                  // Find if it is the first remaining/uncompleted task
                  const firstUncompleted = treeState.tasks.find(t => !t.completed);
                  const isCurrent = firstUncompleted && firstUncompleted.id === task.id;
                  const isCompleted = task.completed;

                  return (
                    <div
                      key={task.id}
                      className={`p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-4 ${
                        isCompleted
                          ? "bg-white/5 border-white/5 opacity-55"
                          : isCurrent
                          ? "bg-gradient-to-br from-emerald-950/40 to-teal-950/40 border-emerald-500/30 shadow-md scale-[1.01]"
                          : "bg-white/5 border-white/5 opacity-40 select-none"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            task.size === 3 
                              ? "bg-purple-500/20 text-purple-300"
                              : task.size === 2
                              ? "bg-blue-500/20 text-blue-300"
                              : "bg-emerald-500/20 text-emerald-300"
                          }`}>
                            Size {task.size}
                          </span>
                          {isCompleted && (
                            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                              <CheckCircle size={12} />
                              Completed
                            </span>
                          )}
                        </div>
                        <p className={`text-sm ${isCompleted ? "line-through text-gray-500" : "text-white"}`}>
                          {task.text}
                        </p>
                      </div>

                      {isCurrent && !isCompleted && (
                        <button
                          onClick={() => handleCompleteTask(task.id)}
                          disabled={completingTaskId === task.id}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition flex items-center gap-1.5 hover:scale-105"
                        >
                          {completingTaskId === task.id ? (
                            <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <CheckCircle size={14} />
                              Done
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Show option to clear / request new tasks once all are complete */}
              {treeState.tasks.every(t => t.completed) && (
                <div className="pt-2">
                  <button
                    onClick={handleResetTasks}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition flex items-center justify-center gap-2 hover:scale-[1.02]"
                  >
                    Share how you're doing now
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Input Form */
            <div className="space-y-4">
              <div className="bg-white/5 rounded-3xl p-6 border border-white/10 backdrop-blur-sm">
                <h2 className="text-white font-bold text-2xl mb-2">Grow with Small Steps</h2>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Every day is different. Share how you're feeling to receive a short list of micro-tasks tailored to fit your energy levels. No streaks to break, just a gentle path forward.
                </p>
              </div>

              <form onSubmit={handleSubmitStatement} className="bg-white/5 rounded-3xl p-6 border border-white/10 flex flex-col gap-4">
                <div>
                  <label className="text-sm text-gray-300 block mb-2 font-medium">What's going on today?</label>
                  <textarea
                    value={statementInput}
                    onChange={(e) => setStatementInput(e.target.value)}
                    placeholder="E.g. My dog died, I'm depressed... or I am feeling a bit tired but okay."
                    className="w-full h-32 px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition resize-none text-sm"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !statementInput.trim()}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition flex items-center justify-center gap-2 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
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
        </div>
      </div>
    </div>
  );
};

export default GrowingTreeGame;
