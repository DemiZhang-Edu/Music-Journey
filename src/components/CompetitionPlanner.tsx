import { useState, useEffect } from "react";
import { auth } from "@/src/lib/firebase";
import { localDB } from "@/src/lib/storage";
import { researchCompetition } from "@/src/lib/gemini";
import { Trophy, Calendar, ListChecks, Timer, Plus, Loader2, Trash2, MapPin, ExternalLink, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { format, differenceInDays, parseISO, isAfter } from "date-fns";

export default function CompetitionPlanner() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setEvents(localDB.getCompetitions());
    setLoading(false);
  };

  const handleAddCompetition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    try {
      const info = await researchCompetition(searchTerm);
      const newEvent = {
        ...info,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString()
      };
      localDB.saveCompetition(newEvent);
      loadData();
      setSearchTerm("");
      setIsAdding(false);
    } catch (error) {
      console.error("Failed to add competition", error);
      alert("AI failed to find details for this competition. Please try a more specific name.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to remove this plan?")) return;
    localDB.deleteCompetition(id);
    loadData();
  };

  const getCountdown = (dateStr: string) => {
    const targetDate = parseISO(dateStr);
    const today = new Date();
    const days = differenceInDays(targetDate, today);
    
    if (days < 0) return "Event Passed";
    if (days === 0) return "Today!";
    return `${days} Days Left`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Competition Planner</h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="p-2 bg-brand-olive text-white rounded-full shadow-md active:scale-90 transition-transform"
        >
          <Plus className={`w-6 h-6 transition-transform ${isAdding ? 'rotate-45' : ''}`} />
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleAddCompetition}
            className="card overflow-hidden space-y-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-brand-olive" />
              <p className="text-xs text-brand-olive/60 font-medium">AI will research dates and requirements for you.</p>
            </div>
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="e.g. Chopin International Piano Competition"
              className="w-full bg-brand-cream/50 rounded-xl px-4 py-3 outline-none border border-transparent focus:border-brand-olive/30"
              disabled={isSearching}
            />
            <button 
              type="submit" 
              disabled={isSearching || !searchTerm}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : "Research & Add Plan"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-brand-olive/20" /></div>
        ) : events?.length === 0 ? (
          <div className="text-center py-20 text-black/20 italic">No competitions planned. Search for one above!</div>
        ) : (
          events?.map((event) => {
            const countdown = getCountdown(event.date);
            const isPassed = countdown === "Event Passed";

            return (
              <motion.div 
                key={event.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`card group hover:shadow-lg transition-all ${isPassed ? 'opacity-60 grayscale' : ''}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Trophy className="w-5 h-5 text-brand-olive" />
                      <h3 className="font-bold text-lg">{event.eventName}</h3>
                    </div>
                    <p className="text-xs text-black/40 leading-relaxed">{event.description}</p>
                  </div>
                  <button 
                    onClick={(e) => handleDelete(event.id, e)}
                    disabled={deletingId === event.id}
                    className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                  >
                    {deletingId === event.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-brand-cream/30 p-3 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-brand-olive shadow-sm">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-black/30 tracking-widest">Date</p>
                      <p className="text-sm font-semibold">{format(parseISO(event.date), "MMM d, yyyy")}</p>
                    </div>
                  </div>
                  <div className={`p-3 rounded-2xl flex items-center gap-3 ${isPassed ? 'bg-black/5' : 'bg-brand-olive/10'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${isPassed ? 'bg-white text-black/30' : 'bg-brand-olive text-white'}`}>
                      <Timer className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-black/30 tracking-widest">Countdown</p>
                      <p className={`text-sm font-bold ${isPassed ? 'text-black/40' : 'text-brand-olive'}`}>{countdown}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-black/40 tracking-widest px-1">
                    <ListChecks className="w-3 h-3" /> Requirements
                  </div>
                  <ul className="space-y-2">
                    {event.requirements.map((req: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-sm bg-white/50 p-3 rounded-xl border border-black/5">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-olive/40 mt-1.5" />
                        <span className="text-black/70 leading-snug">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-black/5 flex items-center justify-between text-[10px] font-bold text-black/30 uppercase tracking-widest">
                  <span className="flex items-center gap-1">
                     <MapPin className="w-3 h-3" /> Information Grounded by AI
                  </span>
                  <a 
                    href={`https://www.google.com/search?q=${encodeURIComponent(event.eventName + ' competition audition requirements')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 hover:text-brand-olive transition-colors"
                  >
                    Check Official <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  );
}
