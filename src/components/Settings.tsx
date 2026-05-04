import { useState } from "react";
import { localDB } from "@/src/lib/storage";
import { auth, signInWithGoogle, signOut } from "@/src/lib/firebase";
import { Key, LogIn, LogOut, ShieldCheck, Info, Sparkles } from "lucide-react";
import { motion } from "motion/react";

export default function Settings() {
  const [apiKey, setApiKey] = useState(localDB.getAIKey());
  const [saved, setSaved] = useState(false);

  const handleSaveKey = () => {
    localDB.setAIKey(apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-2">
        <h2 className="text-3xl font-semibold text-brand-warm-black tracking-tight">Settings</h2>
        <p className="text-brand-warm-black/60 text-sm mt-1 italic">Configure your AI and cloud synchronization.</p>
      </div>

      <section className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-brand-olive/10 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-brand-olive" />
          </div>
          <div>
            <h3 className="font-semibold text-brand-warm-black">AI Configuration</h3>
            <p className="text-xs text-brand-warm-black/40">Unlock intelligent practice feedback</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-brand-warm-black/40 px-1">
              Gemini API Key
            </label>
            <div className="flex gap-2">
              <input 
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API Key..."
                className="flex-1 bg-brand-cream border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-olive transition-all"
              />
              <button 
                onClick={handleSaveKey}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${saved ? 'bg-green-500 text-white' : 'bg-brand-olive text-white shadow-md active:scale-95'}`}
              >
                {saved ? "Saved!" : "Save"}
              </button>
            </div>
            <p className="text-[10px] text-brand-warm-black/40 px-1 flex items-start gap-1">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
              Your key is stored locally in your browser. If you set a VITE_GEMINI_API_KEY environment variable in Vercel, it will be used as a fallback if this is empty.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-brand-olive/10 rounded-xl flex items-center justify-center">
            <LogIn className="w-5 h-5 text-brand-olive" />
          </div>
          <div>
            <h3 className="font-semibold text-brand-warm-black">Google Account</h3>
            <p className="text-xs text-brand-warm-black/40">Optional login for AI convenience</p>
          </div>
        </div>

        {auth?.currentUser ? (
          <div className="flex items-center justify-between bg-brand-cream p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              {auth.currentUser.photoURL && (
                <img src={auth.currentUser.photoURL} alt="" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
              )}
              <div>
                <p className="text-sm font-semibold text-brand-warm-black">{auth.currentUser.displayName}</p>
                <p className="text-xs text-brand-warm-black/40">{auth.currentUser.email}</p>
              </div>
            </div>
            <button 
              onClick={() => signOut()}
              className="p-2 text-brand-warm-black/40 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => signInWithGoogle().catch(err => alert(err.message))}
            className="w-full flex items-center justify-center gap-2 bg-brand-cream hover:bg-brand-olive/5 py-4 rounded-2xl text-brand-warm-black font-semibold transition-all border border-black/5"
          >
            <LogIn className="w-5 h-5" />
            Sign in with Google
          </button>
        )}
        
        <div className="bg-brand-olive/5 rounded-2xl p-4 flex gap-3">
          <ShieldCheck className="w-5 h-5 text-brand-olive flex-shrink-0" />
          <p className="text-xs text-brand-warm-black/60 leading-relaxed">
            Your logs and library data always remain stored <span className="font-bold">locally</span> on this device. Login is primarily used for identifying your Gemini API usage if configured.
          </p>
        </div>
      </section>
    </div>
  );
}
