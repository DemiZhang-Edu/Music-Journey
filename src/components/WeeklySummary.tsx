import { useState } from "react";
import { auth } from "@/src/lib/firebase";
import { localDB } from "@/src/lib/storage";
import { generateWeeklyReport } from "@/src/lib/gemini";
import { FileText, Sparkles, Copy, Loader2, Calendar, Download, Image as ImageIcon, Lock } from "lucide-react";
import { motion } from "motion/react";
import { format, subDays, isAfter } from "date-fns";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export default function WeeklySummary() {
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState(false);
  const [exportingImageId, setExportingImageId] = useState(false);

  const exportToImage = async () => {
    const element = document.getElementById("weekly-report-content");
    if (!element) return;
    setExportingImageId(true);
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `Weekly_Report_${format(new Date(), "yyyy-MM-dd")}.png`;
      link.click();
    } catch (e) { console.error(e); }
    finally { setExportingImageId(false); }
  };

  const exportToPDF = async () => {
    const element = document.getElementById("weekly-report-content");
    if (!element) return;
    setExportingId(true);
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      pdf.addImage(imgData, "PNG", 15, 15, 180, (180 * canvas.height) / canvas.width);
      pdf.save(`Weekly_Report_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    } catch (e) { console.error(e); }
    finally { setExportingId(false); }
  };

  const handleGenerate = async () => {
    if (!auth?.currentUser) {
      alert("Please sign in to generate AI Weekly Reports.");
      return;
    }
    setGenerating(true);
    try {
      const logs = localDB.getEntries();
      const sevenDaysAgo = subDays(new Date(), 7);
      const weeklyLogs = logs.filter(log => isAfter(new Date(log.date), sevenDaysAgo));
      
      const practices = weeklyLogs.map(log => ({
        pieceTitle: log.pieceTitle,
        duration: log.duration,
        practiceType: log.practiceType === 'with_teacher' ? 'Teacher' : 'Independent',
        targetTempo: log.targetTempo || 'N/A',
        listenedToPerformances: log.listenedToPerformances || 'None',
        notes: log.notes,
        date: format(new Date(log.date), "yyyy-MM-dd")
      }));

      if (practices.length === 0) {
        setReport("No practice records found for this week. Go practice and come back!");
      } else {
        const result = await generateWeeklyReport(practices);
        setReport(result);
      }
    } catch (error) {
      console.error("Failed to generate report", error);
      setReport("Failed to generate report. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (report) {
      navigator.clipboard.writeText(report);
      alert("Summary copied to clipboard!");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Weekly Summary</h2>
        <div className="p-2 bg-brand-olive/5 rounded-full text-brand-olive">
          <Calendar className="w-5 h-5" />
        </div>
      </div>

      <div className="card bg-brand-olive text-white/90 p-8 text-center relative overflow-hidden">
        <Sparkles className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5" />
        <h3 className="text-xl font-semibold mb-2">Weekly Progress</h3>
        <p className="text-sm text-white/60 mb-8 max-w-xs mx-auto">
          We'll compile your practice logs from the past 7 days and use AI to generate a professional weekly report.
        </p>
        <button 
          disabled={generating}
          onClick={handleGenerate}
          className={`bg-white text-brand-olive px-8 py-3 rounded-full font-bold shadow-lg shadow-black/10 flex items-center justify-center gap-2 mx-auto disabled:opacity-50 transition-transform active:scale-95 ${!auth?.currentUser ? 'opacity-70' : ''}`}
        >
          {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            auth?.currentUser ? <><Sparkles className="w-5 h-5" /> Generate Report</> : <><Lock className="w-4 h-4" /> Sign in for AI Report</>
          )}
        </button>
      </div>

      {report && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="card space-y-4 relative">
            <div className="flex items-center justify-between border-b border-black/5 pb-4">
              <div className="flex items-center gap-2 text-brand-olive uppercase tracking-widest font-bold text-xs">
                <FileText className="w-4 h-4" /> Report Content
              </div>
              <div className="flex gap-2 no-print">
                <button 
                  onClick={copyToClipboard}
                  className="p-2 hover:bg-brand-cream rounded-lg transition-colors text-black/40"
                  title="Copy content"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button 
                  onClick={exportToImage}
                  disabled={exportingImageId}
                  className="p-2 hover:bg-brand-cream rounded-lg transition-colors text-brand-olive shadow-sm border border-brand-olive/10 disabled:opacity-50"
                  title="Export Image"
                >
                  {exportingImageId ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                </button>
                <button 
                  onClick={exportToPDF}
                  disabled={exportingId}
                  className="p-2 hover:bg-brand-cream rounded-lg transition-colors text-brand-olive shadow-sm border border-brand-olive/10 disabled:opacity-50"
                  title="Export PDF"
                >
                  {exportingId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div id="weekly-report-content" className="report-container">
              <div className="text-sm leading-loose whitespace-pre-wrap font-serif text-black/80 p-2">
                {report}
              </div>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={copyToClipboard}
              className="flex-1 btn-primary flex items-center justify-center gap-2 py-4 shadow-lg shadow-brand-olive/10"
            >
              <Copy className="w-5 h-5" /> Copy Summary
            </button>
            <button 
              onClick={exportToPDF}
              disabled={exportingId}
              className="w-14 h-14 bg-white rounded-full flex items-center justify-center border border-black/5 shadow-sm text-brand-olive hover:bg-brand-cream transition-colors disabled:opacity-50"
              title="Download PDF"
            >
              {exportingId ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
