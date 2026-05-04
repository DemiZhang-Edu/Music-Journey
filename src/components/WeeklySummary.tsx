import { useState } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { auth, db } from "@/src/lib/firebase";
import { generateWeeklyReport } from "@/src/lib/gemini";
import { FileText, Sparkles, Copy, Loader2, Calendar, Download, Image as ImageIcon } from "lucide-react";
import { motion } from "motion/react";
import { format, subDays } from "date-fns";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export default function WeeklySummary() {
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState(false);
  const [exportingImageId, setExportingImageId] = useState(false);

  const exportToImage = async () => {
    const elementId = "weekly-report-content";
    const element = document.getElementById(elementId);
    if (!element) return;
    
    setExportingImageId(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        ignoreElements: (el) => el.classList.contains("no-print"),
        onclone: (clonedDoc) => {
          const styles = Array.from(clonedDoc.getElementsByTagName("style"));
          styles.forEach(s => s.remove());
          const links = Array.from(clonedDoc.querySelectorAll('link[rel="stylesheet"]'));
          links.forEach(l => l.remove());
          
          const safeStyle = clonedDoc.createElement('style');
          safeStyle.innerHTML = `
            * { box-sizing: border-box; -webkit-print-color-adjust: exact; }
            body { font-family: sans-serif; color: #000; background: #fff; margin: 0; padding: 0; }
            .report-container { padding: 40px; }
            .text-brand-olive { color: #5a5a40 !important; }
            .font-bold { font-weight: 700; }
            .text-xs { font-size: 12px; }
            .tracking-widest { letter-spacing: 0.1em; }
            .uppercase { text-transform: uppercase; }
            .border-b { border-bottom: 1px solid #eee; }
            .pb-4 { padding-bottom: 16px; }
            .mb-4 { margin-bottom: 16px; }
            .text-sm { font-size: 14px; line-height: 1.8; }
            .whitespace-pre-wrap { white-space: pre-wrap; }
          `;
          clonedDoc.head.appendChild(safeStyle);
        }
      });
      
      const imgData = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `Weekly_Report_${format(new Date(), "yyyy-MM-dd")}.png`;
      link.click();
    } catch (error) {
      console.error("Image Export Error:", error);
    } finally {
      setExportingImageId(false);
    }
  };

  const exportToPDF = async () => {
    const elementId = "weekly-report-content";
    const element = document.getElementById(elementId);
    if (!element) return;
    
    setExportingId(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        ignoreElements: (el) => el.classList.contains("no-print"),
        onclone: (clonedDoc) => {
          const styles = Array.from(clonedDoc.getElementsByTagName("style"));
          styles.forEach(s => s.remove());
          const links = Array.from(clonedDoc.querySelectorAll('link[rel="stylesheet"]'));
          links.forEach(l => l.remove());
          const safeStyle = clonedDoc.createElement('style');
          safeStyle.innerHTML = `
            * { box-sizing: border-box; -webkit-print-color-adjust: exact; }
            body { font-family: sans-serif; color: #000; background: #fff; margin: 0; padding: 0; }
            .report-container { padding: 40px; }
            .text-brand-olive { color: #5a5a40 !important; }
            .font-bold { font-weight: 700; }
            .text-xs { font-size: 12px; }
            .tracking-widest { letter-spacing: 0.1em; }
            .uppercase { text-transform: uppercase; }
            .border-b { border-bottom: 1px solid #eee; }
            .pb-4 { padding-bottom: 16px; }
            .mb-4 { margin-bottom: 16px; }
            .text-sm { font-size: 14px; line-height: 1.8; }
            .whitespace-pre-wrap { white-space: pre-wrap; }
          `;
          clonedDoc.head.appendChild(safeStyle);
        }
      });
      
      const imgData = canvas.toDataURL("image/png", 0.95);
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const ratio = Math.min((pdfWidth - margin*2) / canvas.width, (pdfHeight - margin*2) / canvas.height);
      pdf.addImage(imgData, "PNG", margin, margin, canvas.width * ratio, canvas.height * ratio);
      pdf.save(`Weekly_Report_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    } catch (error) {
      console.error("PDF Export Error:", error);
    } finally {
      setExportingId(false);
    }
  };

  const handleGenerate = async () => {
    if (!auth.currentUser) return;
    setGenerating(true);
    try {
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      const q = query(
        collection(db, "practices"),
        where("userId", "==", auth.currentUser.uid),
        where("date", ">=", sevenDaysAgo),
        orderBy("date", "desc")
      );
      
      const snapshot = await getDocs(q);
      const practices = snapshot.docs.map(doc => ({
        pieceTitle: doc.data().pieceTitle,
        duration: doc.data().duration,
        practiceType: doc.data().practiceType === 'with_teacher' ? 'Teacher' : 'Independent',
        targetTempo: doc.data().targetTempo || 'N/A',
        listenedToPerformances: doc.data().listenedToPerformances || 'None',
        notes: doc.data().notes,
        date: format(new Date(doc.data().date), "yyyy-MM-dd")
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
          className="bg-white text-brand-olive px-8 py-3 rounded-full font-bold shadow-lg shadow-black/10 flex items-center justify-center gap-2 mx-auto disabled:opacity-50 transition-transform active:scale-95"
        >
          {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5" /> Generate Report</>}
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
