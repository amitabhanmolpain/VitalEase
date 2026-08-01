import { useState, useEffect } from "react";
import { ArrowLeft, Send, Sparkles, AlertCircle, CheckCircle, Leaf } from "lucide-react";
import { growingTreeAPI } from "../../services/growingTreeApi";

const GrowingTreeGame = ({ onExit }) => {
  const [treeState, setTreeState] = useState(null);
  const [moodInput, setMoodInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sharingMood, setSharingMood] = useState(false);
  const [completingTask, setCompletingTask] = useState(false);

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

  const handleShareMood = async (e) => {
    e.preventDefault();
    if (!moodInput.trim()) return;
    try {
      setSharingMood(true);
      const data = await growingTreeAPI.shareMood(moodInput);
      setTreeState(data);
      setMoodInput("");
    } catch (err) {
      console.error("Failed to share mood", err);
    } finally {
      setSharingMood(false);
    }
  };

  const handleTaskCompletion = async (outcome) => {
    try {
      setCompletingTask(true);
      const data = await growingTreeAPI.completeTask(outcome);
      setTreeState(data);
    } catch (err) {
      console.error("Failed to update task outcome", err);
    } finally {
      setCompletingTask(false);
    }
  };

  // Dynamically render a tree based on growth scale
  const renderTreeSVG = () => {
    const growth = treeState ? treeState.tree_growth : 10;
    // Calculate parameters based on growth progress (10 to 200)
    const trunkHeight = Math.min(100, 30 + growth * 0.35);
    const canopyRadiusX = Math.min(80, 20 + growth * 0.3);
    const canopyRadiusY = Math.min(70, 15 + growth * 0.25);
    const leafCount = Math.min(40, Math.floor(growth / 5) + 3);

    // Leaves array with random offsets for organic visualization
    const leaves = [];
    const seed = 42;
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
        <path 
          d={`M 144,280 Q 148,${280 - trunkHeight * 0.5} 146,${280 - trunkHeight} L 154,${280 - trunkHeight} Q 152,${280 - trunkHeight * 0.5} 156,280 Z`} 
          fill="#5d4037" 
          stroke="#4e342e" 
          strokeWidth="1.5" 
        />

        {/* Canopy backing outline (glowing aura) */}
        {growth > 25 && (
          <ellipse 
            cx="150" 
            cy={280 - trunkHeight} 
            rx={canopyRadiusX + 5} 
            ry={canopyRadiusY + 5} 
            fill="rgba(76, 175, 80, 0.15)" 
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
          Growth: {growth} XP
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
          {renderTreeSVG()}
          <p className="text-center text-sm text-gray-400 mt-4 italic max-w-xs">
            "One small step today forms a leaf. If you struggle, the tree just waits."
          </p>
        </div>

        {/* Right Side: Gameplay Loop */}
        <div className="flex flex-col gap-6">
          <div className="bg-white/5 rounded-3xl p-6 border border-white/10 backdrop-blur-sm">
            <h2 className="text-white font-bold text-2xl mb-2">Grow with Small Steps</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              Every day is different. Share how you're feeling to receive one micro-task tailored for your energy levels. No pressure, no streaks to break, just a gentle path forward.
            </p>
          </div>

          {/* Loop Card */}
          {treeState && treeState.task_status === "pending" && treeState.current_task ? (
            <div className="bg-gradient-to-br from-emerald-950/40 to-teal-950/40 rounded-3xl p-6 border border-emerald-500/20 shadow-xl animate-fade-in">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest block mb-2">Today's Gentle Task</span>
              <h3 className="text-white font-semibold text-lg mb-4 leading-relaxed">
                "{treeState.current_task}"
              </h3>
              
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleTaskCompletion("completed")}
                  disabled={completingTask}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition flex items-center justify-center gap-2 hover:scale-[1.02]"
                >
                  <CheckCircle size={18} />
                  Done in real life
                </button>
                
                <button
                  onClick={() => handleTaskCompletion("skipped")}
                  disabled={completingTask}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-medium rounded-xl transition flex items-center justify-center gap-2"
                >
                  Could not do it today
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleShareMood} className="bg-white/5 rounded-3xl p-6 border border-white/10 flex flex-col gap-4">
              <div>
                <label className="text-sm text-gray-300 block mb-2 font-medium">How is your day feeling today?</label>
                <textarea
                  value={moodInput}
                  onChange={(e) => setMoodInput(e.target.value)}
                  placeholder="E.g. My dog died, I'm feeling really depressed today... or Just feeling okay."
                  className="w-full h-32 px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition resize-none text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={sharingMood || !moodInput.trim()}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition flex items-center justify-center gap-2 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sharingMood ? (
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={16} />
                    Get My Sized Task
                  </>
                )}
              </button>
            </form>
          )}

          {/* Previous Outcome Status Alert */}
          {treeState && treeState.task_status !== "pending" && (
            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 text-gray-300 text-sm">
              <AlertCircle size={20} className="text-emerald-400 flex-shrink-0" />
              <span>
                {treeState.task_status === "completed" 
                  ? "Awesome! The tree received some nourishment and grew. Ready for another step?" 
                  : "That's okay. The tree is waiting patiently. Whenever you are ready to get a task, simply share your mood."
                }
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GrowingTreeGame;
