import { useState } from "react";
import { Code2, ChevronDown, ChevronUp, Wifi } from "lucide-react";

const METHOD_STYLES = {
  GET:    { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/40" },
  POST:   { bg: "bg-blue-500/20",    text: "text-blue-400",    border: "border-blue-500/40"    },
  PUT:    { bg: "bg-amber-500/20",   text: "text-amber-400",   border: "border-amber-500/40"   },
  PATCH:  { bg: "bg-orange-500/20",  text: "text-orange-400",  border: "border-orange-500/40"  },
  DELETE: { bg: "bg-red-500/20",     text: "text-red-400",     border: "border-red-500/40"     },
  WS:     { bg: "bg-purple-500/20",  text: "text-purple-400",  border: "border-purple-500/40"  },
};

/**
 * ApiEndpointsPanel
 * @param {string}  title     - Section label shown in the header
 * @param {Array}   endpoints - [{ method, path, description }]
 */
const ApiEndpointsPanel = ({ title = "API Endpoints", endpoints = [] }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-lg overflow-hidden">
      {/* Header / toggle */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors group"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
            <Code2 size={16} className="text-indigo-400" />
          </div>
          <span className="text-white font-semibold text-sm tracking-wide">
            {title}
          </span>
          <span className="text-gray-500 text-xs font-mono">
            {endpoints.length} endpoint{endpoints.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs hidden sm:block group-hover:text-gray-300 transition-colors">
            {open ? "Hide" : "Show"} endpoints
          </span>
          {open ? (
            <ChevronUp size={18} className="text-gray-400 group-hover:text-white transition-colors" />
          ) : (
            <ChevronDown size={18} className="text-gray-400 group-hover:text-white transition-colors" />
          )}
        </div>
      </button>

      {/* Collapsible body */}
      <div
        style={{
          maxHeight: open ? `${endpoints.length * 60 + 32}px` : "0px",
          transition: "max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          overflow: "hidden",
        }}
      >
        <div className="border-t border-white/10 px-6 py-4 space-y-2">
          {endpoints.map((ep, i) => {
            const style = METHOD_STYLES[ep.method] ?? METHOD_STYLES.GET;
            const isWS = ep.method === "WS";
            return (
              <div
                key={i}
                className="flex items-center gap-3 py-2 px-3 rounded-xl bg-white/3 hover:bg-white/5 transition-colors group/row"
              >
                {/* Method badge */}
                <span
                  className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold font-mono min-w-[64px] justify-center ${style.bg} ${style.text} ${style.border}`}
                >
                  {isWS && <Wifi size={10} />}
                  {ep.method}
                </span>

                {/* Path */}
                <code className="flex-1 text-sm text-gray-200 font-mono truncate group-hover/row:text-white transition-colors">
                  {ep.path}
                </code>

                {/* Description */}
                {ep.description && (
                  <span className="hidden md:block text-xs text-gray-500 flex-shrink-0 max-w-[220px] text-right group-hover/row:text-gray-400 transition-colors">
                    {ep.description}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ApiEndpointsPanel;
