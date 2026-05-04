import { useState, useRef, useEffect } from "react";
import { auth } from "@/src/lib/firebase";
import { localDB } from "@/src/lib/storage";
import { analyzeMusicPiece, analyzeSheetMusicPdf } from "@/src/lib/gemini";
import { Plus, Trash2, Sparkles, ChevronRight, Loader2, Music2, FileUp, FileText, Printer, Download, Image, Lock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export default function PieceLibrary() {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [composer, setComposer] = useState("");
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [analyzingPdf, setAnalyzingPdf] = useState<string | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Local data state
  const [pieces, setPieces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const data = localDB.getPieces();
    setPieces(data);
    setLoading(false);
  };

  const [exportingId, setExportingId] = useState<string | null>(null);
  const [exportingImageId, setExportingImageId] = useState<string | null>(null);

  const exportToImage = async (piece: any) => {
    const elementId = `analysis-content-${piece.id}`;
    const element = document.getElementById(elementId);
    if (!element) return;
    setExportingImageId(piece.id);
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `${piece.title}_Analysis.png`;
      link.click();
    } catch (e) { console.error(e); }
    finally { setExportingImageId(null); }
  };

  const exportToPDF = async (piece: any) => {
    const elementId = `analysis-content-${piece.id}`;
    const element = document.getElementById(elementId);
    if (!element) return;
    setExportingId(piece.id);
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      pdf.addImage(imgData, "PNG", 10, 10, 190, (190 * canvas.height) / canvas.width);
      pdf.save(`${piece.title}_Analysis.pdf`);
    } catch (e) { console.error(e); }
    finally { setExportingId(null); }
  };

  const handleAddPiece = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    const newPiece = {
      id: crypto.randomUUID(),
      title,
      composer,
      createdAt: new Date().toISOString(),
    };
    localDB.savePiece(newPiece);
    loadData();
    setTitle(""); setComposer(""); setIsAdding(false);
  };

  const handleFileChange = async (pieceId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== "application/pdf") return;
    if (!auth?.currentUser) {
      alert("Please sign in to use Score AI Analysis.");
      return;
    }

    setAnalyzingPdf(pieceId);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(",")[1];
      try {
        const analysis = await analyzeSheetMusicPdf(base64);
        const p = pieces.find(x => x.id === pieceId);
        if (p) {
          p.pdfAnalysis = analysis;
          localDB.savePiece(p);
          loadData();
        }
      } catch (error) { console.error(error); }
      finally { setAnalyzingPdf(null); }
    };
    reader.readAsDataURL(file);
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this piece?")) {
      localDB.deletePiece(id);
      loadData();
      if (selectedPiece?.id === id) setSelectedPiece(null);
    }
  };

  const handleAnalyze = async (piece: any) => {
    if (!auth?.currentUser) {
      alert("Please sign in to use AI Background Analysis.");
      return;
    }
    setAnalyzing(piece.id);
    try {
      const analysis = await analyzeMusicPiece(piece.title, piece.composer || "Unknown");
      const p = pieces.find(x => x.id === piece.id);
      if (p) {
        Object.assign(p, analysis);
        localDB.savePiece(p);
        loadData();
      }
    } catch (error) { console.error(error); }
    finally { setAnalyzing(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">My Library</h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="p-2 bg-brand-olive text-white rounded-full shadow-md active:scale-90 transition-transform"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleAddPiece}
            className="card overflow-hidden space-y-4"
          >
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-black/40 block mb-1">Piece Title</label>
              <input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Moonlight Sonata"
                className="w-full bg-brand-cream/50 rounded-xl px-4 py-2 outline-none border border-transparent focus:border-brand-olive/30"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-black/40 block mb-1">Composer</label>
              <input 
                value={composer}
                onChange={(e) => setComposer(e.target.value)}
                placeholder="e.g. Mozart"
                className="w-full bg-brand-cream/50 rounded-xl px-4 py-2 outline-none border border-transparent focus:border-brand-olive/30"
              />
            </div>
            <button type="submit" className="btn-primary w-full py-3">Add Piece</button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-brand-olive/20" /></div>
        ) : pieces?.length === 0 ? (
          <div className="text-center py-20 text-black/20 italic">Your library is empty. Add your first piece.</div>
        ) : (
          pieces?.map((piece) => (
            <motion.div 
              layout
              key={piece.id}
              onClick={() => setSelectedPiece(piece)}
              className={`card cursor-pointer transition-all ${selectedPiece?.id === piece.id ? 'ring-2 ring-brand-olive' : 'hover:bg-brand-cream/30'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-cream rounded-full flex items-center justify-center text-brand-olive shadow-sm border border-brand-olive/5">
                    <Music2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{piece.title}</h3>
                    <p className="text-sm text-black/40">{piece.composer || "Unknown Composer"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="file" 
                    accept="application/pdf" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={(e) => handleFileChange(piece.id, e)}
                  />
                  {!piece.pdfAnalysis && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); (e.currentTarget.previousSibling as HTMLInputElement).click(); }}
                      disabled={analyzingPdf === piece.id}
                      className="p-2 text-brand-olive hover:bg-brand-olive/10 rounded-full transition-colors relative"
                      title={auth?.currentUser ? "Upload Score for Analysis" : "Sign in to use Score AI"}
                    >
                      {analyzingPdf === piece.id ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        auth?.currentUser ? <FileUp className="w-5 h-5" /> : <div className="relative"><FileUp className="w-5 h-5 opacity-40" /><Lock className="w-3 h-3 absolute -top-1 -right-1 text-black/40" /></div>
                      )}
                    </button>
                  )}
                  {!piece.background && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleAnalyze(piece); }}
                      disabled={analyzing === piece.id}
                      className="p-2 text-brand-olive hover:bg-brand-olive/10 rounded-full transition-colors relative"
                      title={auth?.currentUser ? "AI Background Analysis" : "Sign in to use AI Analysis"}
                    >
                      {analyzing === piece.id ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        auth?.currentUser ? <Sparkles className="w-5 h-5" /> : <div className="relative"><Sparkles className="w-5 h-5 opacity-40" /><Lock className="w-3 h-3 absolute -top-1 -right-1 text-black/40" /></div>
                      )}
                    </button>
                  )}
                  <button 
                    onClick={(e) => handleDelete(piece.id, e)}
                    disabled={deletingId === piece.id}
                    className="p-2 text-red-400 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                  >
                    {deletingId === piece.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {selectedPiece?.id === piece.id && (piece.background || piece.difficultyAnalysis || piece.pdfAnalysis) && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="mt-6 pt-6 border-t border-black/5 space-y-6 text-sm relative"
                    id={`analysis-content-${piece.id}`}
                  >
                    {/* Floating Export Buttons */}
                    <div className="flex justify-end items-center gap-2 sticky top-0 z-20 no-print pb-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); exportToImage(piece); }}
                        disabled={exportingImageId === piece.id}
                        className="flex items-center gap-2 bg-white text-brand-olive border border-brand-olive/20 px-3 py-2 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50"
                        title="Save as Image"
                      >
                        {exportingImageId === piece.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Image className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline font-semibold text-xs tracking-wide uppercase">Image</span>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); exportToPDF(piece); }}
                        disabled={exportingId === piece.id}
                        className="flex items-center gap-2 bg-brand-olive text-white px-3 py-2 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50 disabled:translate-y-0"
                      >
                        {exportingId === piece.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="font-semibold text-xs tracking-wide">GENERATING...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            <span className="font-semibold text-xs tracking-wide">PDF EXPORT</span>
                          </>
                        )}
                      </button>
                    </div>

                    {piece.pdfAnalysis && (
                      <div className="bg-brand-olive/5 rounded-2xl p-5 space-y-4 border border-brand-olive/10">
                        <div className="border-b border-brand-olive/10 pb-4 mb-4">
                          <h3 className="text-lg font-bold text-brand-olive">{piece.title}</h3>
                          <p className="text-xs text-black/40">{piece.composer || "Unknown Composer"}</p>
                        </div>
                        <div className="flex items-center text-brand-olive font-bold text-xs uppercase tracking-widest">
                          <div className="flex items-center gap-2">
                             <FileText className="w-4 h-4" /> Score PDF Analysis
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          <div className="bg-white/50 p-3 rounded-xl">
                            <span className="text-[10px] text-black/40 font-bold uppercase block mb-1">Recommended Tempo</span>
                            <div className="flex flex-col">
                              <p className="font-medium">{piece.pdfAnalysis.tempo?.en || piece.pdfAnalysis.tempo?.zh || piece.pdfAnalysis.tempo}</p>
                              {(piece.pdfAnalysis.tempo?.en && piece.pdfAnalysis.tempo?.zh) && <p className="text-[10px] text-black/40 italic">{piece.pdfAnalysis.tempo.zh}</p>}
                            </div>
                          </div>
                          <div className="bg-white/50 p-3 rounded-xl">
                            <span className="text-[10px] text-black/40 font-bold uppercase block mb-1">Key Points</span>
                            <ul className="space-y-3 mt-2">
                              {Array.isArray(piece.pdfAnalysis.keyPoints) ? piece.pdfAnalysis.keyPoints.map((pt: any, i: number) => (
                                <li key={i} className="text-sm flex items-start gap-2">
                                  <span className="mt-1.5 w-1 h-1 bg-brand-olive rounded-full shrink-0" />
                                  <div className="flex flex-col">
                                    <span className="font-medium text-black/80">{typeof pt === 'string' ? pt : (pt.en || pt.zh)}</span>
                                    {(pt.en && pt.zh) && <span className="text-[10px] text-black/40 italic leading-tight mt-0.5">{pt.zh}</span>}
                                  </div>
                                </li>
                              )) : <p className="text-sm">{piece.pdfAnalysis.keyPoints?.en || piece.pdfAnalysis.keyPoints?.zh || piece.pdfAnalysis.keyPoints}</p>}
                            </ul>
                          </div>
                          <div className="bg-white/50 p-3 rounded-xl">
                            <span className="text-[10px] text-black/40 font-bold uppercase block mb-1">Practice Suggestions</span>
                            <ul className="space-y-3 mt-2">
                              {Array.isArray(piece.pdfAnalysis.practiceSuggestions) ? piece.pdfAnalysis.practiceSuggestions.map((ps: any, i: number) => (
                                <li key={i} className="text-sm flex items-start gap-2">
                                  <span className="mt-1.5 w-1 h-1 bg-brand-olive rounded-full shrink-0" />
                                  <div className="flex flex-col">
                                    <span className="font-medium text-black/80">{typeof ps === 'string' ? ps : (ps.en || ps.zh)}</span>
                                    {(ps.en && ps.zh) && <span className="text-[10px] text-black/40 italic leading-tight mt-0.5">{ps.zh}</span>}
                                  </div>
                                </li>
                              )) : <p className="text-sm">{piece.pdfAnalysis.practiceSuggestions?.en || piece.pdfAnalysis.practiceSuggestions?.zh || piece.pdfAnalysis.practiceSuggestions}</p>}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {piece.background && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-brand-olive" /> Background
                        </h4>
                        <p className="text-black/60 leading-relaxed italic">{piece.background}</p>
                      </div>
                    )}

                    {piece.difficultyAnalysis && (
                      <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Plus className="w-4 h-4 text-brand-olive rotate-45" /> Analysis
                        </h4>
                        <div className="bg-brand-cream/30 rounded-2xl p-4">
                          <p className="font-medium mb-3 text-brand-olive">{piece.difficultyAnalysis.overall}</p>
                          <div className="space-y-4">
                            {piece.difficultyAnalysis.keySections?.map((section: any, idx: number) => (
                              <div key={idx} className="border-l-2 border-brand-olive/20 pl-4 py-1">
                                <span className="text-[10px] font-bold text-brand-olive/60 uppercase tracking-widest leading-none block mb-1">
                                  Section {section.measureRange}
                                </span>
                                <p className="font-semibold mb-1">{section.description}</p>
                                <p className="text-black/60 text-xs">{section.tips}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
