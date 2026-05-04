/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, signInWithGoogle } from "@/src/lib/firebase";
import { Music, BookOpen, ClipboardList, LogOut, Loader2, Music2, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import PieceLibrary from "./components/PieceLibrary";
import PracticeDiary from "./components/PracticeDiary";
import WeeklySummary from "./components/WeeklySummary";
import CompetitionPlanner from "./components/CompetitionPlanner";

export default function App() {
  const [user, loading] = useAuthState(auth);
  const [activeTab, setActiveTab] = useState<"library" | "diary" | "summary" | "planner">("diary");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream">
        <Loader2 className="w-12 h-12 text-brand-olive animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-cream p-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 bg-brand-olive rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-white/5 opacity-50 blur-xl"></div>
            <Music2 className="w-12 h-12 text-white relative z-10" />
          </div>
          <h1 className="text-5xl font-semibold mb-4 text-brand-warm-black">Music Journey</h1>
          <p className="text-lg text-brand-warm-black/60 mb-10 italic">Record your melody, witness every step of progress.</p>
          <button 
            onClick={signInWithGoogle}
            className="btn-primary w-full shadow-lg shadow-brand-olive/20 py-4 text-lg"
          >
            Start Journey
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col max-w-2xl mx-auto pb-24">
      <header className="p-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-olive rounded-full flex items-center justify-center shadow-lg">
            <Music className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-brand-warm-black">Music Journey</h1>
            <p className="text-[10px] text-brand-warm-black/40 font-bold uppercase tracking-[0.2em] mb-[-2px]">Hello, {user.displayName}</p>
          </div>
        </div>
        <button 
          onClick={() => auth.signOut()}
          className="p-2 text-brand-warm-black/40 hover:text-red-500 transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 px-6">
        <AnimatePresence mode="wait">
          {activeTab === "library" && (
            <motion.div 
              key="library"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <PieceLibrary />
            </motion.div>
          )}
          {activeTab === "diary" && (
            <motion.div 
              key="diary"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <PracticeDiary />
            </motion.div>
          )}
          {activeTab === "summary" && (
            <motion.div 
              key="summary"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <WeeklySummary />
            </motion.div>
          )}
          {activeTab === "planner" && (
            <motion.div 
              key="planner"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <CompetitionPlanner />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-md bg-white/80 backdrop-blur-xl border border-black/5 rounded-full p-2 flex items-center justify-around shadow-2xl z-50">
        <NavButton 
          active={activeTab === "library"} 
          onClick={() => setActiveTab("library")}
          icon={<Music className="w-5 h-5" />}
          label="Library"
        />
        <NavButton 
          active={activeTab === "diary"} 
          onClick={() => setActiveTab("diary")}
          icon={<BookOpen className="w-5 h-5" />}
          label="Diary"
        />
        <NavButton 
          active={activeTab === "planner"} 
          onClick={() => setActiveTab("planner")}
          icon={<Trophy className="w-5 h-5" />}
          label="Planner"
        />
        <NavButton 
          active={activeTab === "summary"} 
          onClick={() => setActiveTab("summary")}
          icon={<ClipboardList className="w-5 h-5" />}
          label="Summary"
        />
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center px-6 py-2 rounded-full transition-all ${active ? 'bg-brand-olive text-white shadow-md' : 'text-brand-warm-black/40 hover:text-brand-warm-black/60'}`}
    >
      {icon}
      <span className="text-[10px] mt-1 font-medium">{label}</span>
    </button>
  );
}

