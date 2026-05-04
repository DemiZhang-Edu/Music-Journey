import { useState, useEffect, useMemo } from "react";
import { useFirebase } from "@/src/lib/firebase";
import { localDB } from "@/src/lib/storage";
import { getEncouragement } from "@/src/lib/gemini";
import { Plus, History, Clock, BookOpen, Quote, Loader2, Star, CheckCircle2, Trash2, PieChart as PieIcon, Lock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { format, subDays, isAfter } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

export default function PracticeDiary() {
  const { auth } = useFirebase();
  const [isAdding, setIsAdding] = useState(false);
  const [pieceId, setPieceId] = useState("");
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState("");
  const [practiceType, setPracticeType] = useState<"self" | "with_teacher">("self");
  const [targetTempo, setTargetTempo] = useState("");
  const [listenedToPerformances, setListenedToPerformances] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastEncouragement, setLastEncouragement] = useState<string | null>(null);

  // Local data state
  const [logs, setLogs] = useState<any[]>([]);
  const [pieces, setPieces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLogs(localDB.getEntries());
    setPieces(localDB.getPieces());
    setLoading(false);
  };

  const stats = useMemo(() => {
    if (!logs || logs.length === 0) return null;
    const lastWeek = subDays(new Date(), 7);
    const weeklyLogs = logs.filter(log => isAfter(new Date(log.date), lastWeek));
    
    let selfDuration = 0;
    let teacherDuration = 0;
    
    weeklyLogs.forEach(log => {
      if (log.practiceType === "with_teacher") {
        teacherDuration += log.duration;
      } else {
        selfDuration += log.duration;
      }
    });

    if (selfDuration === 0 && teacherDuration === 0) return null;

    return [
      { name: "Independent Practice", value: selfDuration, color: "#636F5C" }, 
      { name: "Practice with Teacher", value: teacherDuration, color: "#D4C7B3" }
    ];
  }, [logs]);

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let pieceTitle = "Free Practice";
      if (pieceId) {
        const piece = pieces.find(p => p.id === pieceId);
        if (piece) pieceTitle = piece.title;
      }

      let encouragement = null;
      // AI gate: Only if authenticated
      if (auth?.currentUser) {
        try {
          encouragement = await getEncouragement(pieceTitle, duration, notes);
        } catch (aiError) {
          console.warn("AI Encouragement failed:", aiError);
        }
      }
      
      const newEntry = {
        id: crypto.randomUUID(),
        pieceId,
        pieceTitle,
        duration,
        practiceType,
        targetTempo,
        listenedToPerformances,
        notes,
        encouragement,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      localDB.saveEntry(newEntry);
      loadData(); // Refresh local state

      if (encouragement) setLastEncouragement(encouragement);
      setPieceId("");
      setDuration(30);
      setNotes("");
      setTargetTempo("");
      setListenedToPerformances("");
      setIsAdding(false);
    } catch (error) {
      console.error("Failed to add log:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteLog = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this log?")) {
      localDB.deleteEntry(id);
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Practice Diary</h2>
        <button 
          onClick={() => { setIsAdding(!isAdding); setLastEncouragement(null); }}
          className="flex items-center gap-2 btn-primary px-4 py-2 text-sm"
        >
          <Plus className="w-4 h-4" /> Log Session
        </button>
      </div>

      <AnimatePresence>
        {lastEncouragement && !isAdding && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="card bg-brand-olive text-white relative overflow-hidden"
          >
            <Quote className="absolute -right-4 -top-4 w-24 h-24 opacity-10" />
            <div className="relative z-10 flex items-start gap-4">
              <Star className="w-6 h-6 text-yellow-300 fill-yellow-300 shrink-0" />
              <div>
                <p className="text-lg italic font-serif tracking-wide">{lastEncouragement}</p>
                <button 
                  onClick={() => setLastEncouragement(null)}
                  className="mt-4 text-xs bg-white/20 px-3 py-1 rounded-full text-white/80 hover:bg-white/30 transition-colors"
                >
                  Got it
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {stats && !isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card bg-white"
          >
            <div className="flex items-center gap-2 mb-6">
              <PieIcon className="w-4 h-4 text-brand-olive" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-black/40">Past 7 Days Practice Ratio</h3>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-center">
              {stats.map((item) => (
                 <div key={item.name} className="bg-brand-cream/20 p-3 rounded-2xl">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-black/30 mb-1">{item.name}</p>
                    <p className="text-lg font-bold text-brand-olive">{item.value} <span className="text-[10px] font-normal">min</span></p>
                 </div>
              ))}
            </div>
          </motion.div>
        )}

        {isAdding && (
          <motion.form 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleAddLog}
            className="card space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-black/30 block mb-2">Piece</label>
                <select 
                  value={pieceId}
                  onChange={(e) => setPieceId(e.target.value)}
                  className="w-full bg-brand-cream/50 rounded-xl px-4 py-3 outline-none appearance-none"
                >
                  <option value="">Free Practice / Other</option>
                  {pieces?.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-black/30 block mb-2">Duration (min)</label>
                <input 
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full bg-brand-cream/50 rounded-xl px-4 py-3 outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-black/30 block mb-2">Practice Type</label>
                <div className="flex bg-brand-cream/50 rounded-xl p-1">
                  <button 
                    type="button"
                    onClick={() => setPracticeType("self")}
                    className={`flex-1 py-2 text-xs rounded-lg transition-all ${practiceType === 'self' ? 'bg-white shadow-sm text-brand-olive' : 'text-black/40'}`}
                  >
                    Independent
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPracticeType("with_teacher")}
                    className={`flex-1 py-2 text-xs rounded-lg transition-all ${practiceType === 'with_teacher' ? 'bg-white shadow-sm text-brand-olive' : 'text-black/40'}`}
                  >
                    Teacher
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-black/30 block mb-2">Tempo</label>
                <input 
                  value={targetTempo}
                  onChange={(e) => setTargetTempo(e.target.value)}
                  placeholder="e.g. 100bpm"
                  className="w-full bg-brand-cream/50 rounded-xl px-4 py-2 outline-none text-sm h-[38px]"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-black/30 block mb-2">Master Performance listened (Optional)</label>
              <input 
                value={listenedToPerformances}
                onChange={(e) => setListenedToPerformances(e.target.value)}
                placeholder="e.g. Berlin Philharmonic version"
                className="w-full bg-brand-cream/50 rounded-xl px-4 py-3 outline-none text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-black/30 block mb-2">Notes / Feelings</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What did you practice today? Any breakthroughs or struggles?"
                className="w-full bg-brand-cream/50 rounded-xl px-4 py-3 outline-none h-32 resize-none"
              />
            </div>
            <button 
              disabled={submitting}
              type="submit" 
              className="btn-primary w-full py-4 flex flex-col items-center justify-center gap-1 group"
            >
              <div className="flex items-center gap-2">
                {submitting ? <Loader2 className="animate-spin w-5 h-5" /> : <><CheckCircle2 className="w-5 h-5" /> Complete Log</>}
              </div>
              {!auth?.currentUser && !submitting && (
                <span className="text-[9px] font-bold uppercase tracking-widest text-white/50 group-hover:text-white/80 transition-colors flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Guest Mode: No AI Encouragement
                </span>
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-brand-olive/20" /></div>
        ) : logs?.length === 0 ? (
          <div className="text-center py-20 bg-white/50 rounded-3xl border-2 border-dashed border-black/5 text-black/20 italic">
            No logs yet. Start your first session above.
          </div>
        ) : (
          logs?.map((log) => (
            <div key={log.id} className="card group hover:shadow-md transition-shadow relative">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-olive/5 flex items-center justify-center text-brand-olive">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-warm-black">{log.pieceTitle}</h3>
                    <p className="text-[10px] text-black/30 font-bold uppercase tracking-widest">
                      {format(new Date(log.date), "MMMM dd, yyyy EEEE")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-brand-olive bg-brand-olive/5 px-3 py-1 rounded-full">
                    <Clock className="w-3 h-3" />
                    <span className="text-xs font-bold">{log.duration}m</span>
                  </div>
                  <button 
                    onClick={(e) => handleDeleteLog(log.id, e)}
                    disabled={deletingId === log.id}
                    className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all disabled:opacity-50"
                    title="Delete Log"
                  >
                    {deletingId === log.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <p className="text-sm text-black/60 leading-relaxed mb-4">{log.notes}</p>
              {log.encouragement && (
                <div className="bg-brand-cream/30 p-4 rounded-2xl flex gap-3 items-start">
                  <Star className="w-4 h-4 text-brand-olive shrink-0 mt-1" />
                  <p className="text-xs italic text-black/50 leading-loose">{log.encouragement}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
