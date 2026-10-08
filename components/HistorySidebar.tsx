"use client";

import { useState } from "react";
import { MessageSquare, Plus, Trash2, Search, Clock, Command } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Session = {
  id: string;
  title: string;
  timestamp: number;
  messages: Array<{ role: "user" | "assistant" | "tool"; content: string; tool?: string }>;
};

type HistorySidebarProps = {
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateChat: () => void;
  onDeleteSession: (id: string) => void;
};

export default function HistorySidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateChat,
  onDeleteSession,
}: HistorySidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSessions = sessions
    .filter((s) => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => b.timestamp - a.timestamp);

  return (
    <aside className="flex h-full w-full flex-col border-r border-white/10 bg-black/40 backdrop-blur-xl">
      <div className="p-4">
        <button
          onClick={onCreateChat}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-200/30 bg-cyan-200/10 py-3 text-xs font-medium text-cyan-100 transition hover:bg-cyan-200/20 shadow-[0_0_15px_rgba(114,227,223,0.1)]"
        >
          <Plus size={14} /> New Chat
        </button>
      </div>

      <div className="mx-4 mb-4">
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[.03] px-3 py-2">
          <Search size={14} className="text-white/30" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search archives..."
            className="w-full bg-transparent text-xs text-white outline-none placeholder:text-white/20"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="mb-3 flex items-center gap-2 px-2 text-[10px] uppercase tracking-widest text-white/30">
          <Clock size={12} /> Recent Sessions
        </div>
        <div className="space-y-1">
          <AnimatePresence initial={false}>
            {filteredSessions.map((session) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`group relative flex items-center gap-3 rounded-lg px-3 py-3 transition cursor-pointer ${
                  activeSessionId === session.id
                    ? "bg-cyan-200/10 text-cyan-100 border-l-2 border-cyan-200"
                    : "text-white/50 hover:bg-white/5 hover:text-white"
                }`}
                onClick={() => onSelectSession(session.id)}
              >
                <MessageSquare size={14} className={activeSessionId === session.id ? "text-cyan-200" : "text-white/30"} />
                <span className="flex-1 truncate text-xs font-medium">{session.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-white/20 hover:text-rose-300 transition"
                >
                  <Trash2 size={13} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredSessions.length === 0 && (
            <div className="text-center py-10">
              <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/20">
                <Command size={14} />
              </div>
              <p className="text-[10px] text-white/20">No archives found</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
