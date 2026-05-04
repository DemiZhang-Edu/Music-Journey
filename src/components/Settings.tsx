import { useState, useEffect } from "react";
import { localDB } from "@/src/lib/storage";
import { auth, signInWithGoogle, signOut, db } from "@/src/lib/firebase";
import { Key, LogIn, LogOut, ShieldCheck, Info, Sparkles, ExternalLink, AlertCircle, RefreshCw } from "lucide-react";
import { motion } from "motion/react";

export default function Settings() {
  const [apiKey, setApiKey] = useState(localDB.getAIKey());
  const [saved, setSaved] = useState(false);
  const [cloudActive, setCloudActive] = useState(!!auth && !!db);

  useEffect(() => {
    // Re-check cloud status after a short delay to account for async firebase init
    const timer = setInterval(() => {
      if (!!auth && !!db) {
        setCloudActive(true);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSaveKey = () => {
    localDB.setAIKey(apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="mb-2">
        <h2 className="text-3xl font-semibold text-brand-warm-black tracking-tight">Settings</h2>
        <p className="text-brand-warm-black/60 text-sm mt-1 italic">Configure your AI experience and sync preferences.</p>
      </div>

      {/* AI Key Section */}
      <section className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-olive/10 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-brand-olive" />
            </div>
            <div>
              <h3 className="font-semibold text-brand-warm-black">AI Configuration</h3>
              <p className="text-xs text-brand-warm-black/40">Unlock intelligent practice feedback</p>
            </div>
          </div>
          <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] font-bold uppercase tracking-widest text-brand-olive hover:underline flex items-center gap-1 bg-brand-olive/5 px-3 py-1.5 rounded-full"
          >
            Get API Key <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="space-y-4">
          <div className="bg-brand-cream/50 rounded-2xl p-4 border border-black/5">
            <h4 className="text-xs font-bold text-brand-warm-black/60 uppercase tracking-wider mb-2">How to get your key:</h4>
            <ol className="text-xs text-brand-warm-black/60 space-y-2 list-decimal ml-4">
              <li>Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-brand-olive font-bold hover:underline">Google AI Studio</a>.</li>
              <li>Click <strong>"Create API key"</strong>.</li>
              <li>Copy the key and paste it below.</li>
            </ol>
          </div>

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
              Your key is only stored in your browser's local storage and used for AI features.
            </p>
          </div>
        </div>
      </section>

      {/* Cloud & Auth Section */}
      <section className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-brand-olive/10 rounded-xl flex items-center justify-center">
            <LogIn className="w-5 h-5 text-brand-olive" />
          </div>
          <div>
            <h3 className="font-semibold text-brand-warm-black">Google Account</h3>
            <p className="text-xs text-brand-warm-black/40">Optional login for cloud features</p>
          </div>
        </div>

        {!cloudActive && (
          <div className="bg-amber-50 rounded-2xl p-4 flex gap-3 border border-amber-100 italic">
            <RefreshCw className="w-5 h-5 text-amber-600 flex-shrink-0 animate-spin-slow" />
            <div>
              <p className="text-xs font-bold text-amber-900">Waiting for Cloud Initialization...</p>
              <p className="text-[11px] text-amber-800/70 mt-0.5">
                If you are running on <strong>Vercel</strong> or <strong>GitHub Pages</strong>, ensure you have set the <code>VITE_FIREBASE_*</code> environment variables in your deployment dashboard.
              </p>
            </div>
          </div>
        )}

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
          <div className="space-y-4">
            <button 
              disabled={!cloudActive}
              onClick={() => signInWithGoogle().catch(err => alert(err.message))}
              className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-semibold transition-all border border-black/5 ${
                cloudActive 
                ? 'bg-brand-cream hover:bg-brand-olive/5 text-brand-warm-black cursor-pointer' 
                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
              }`}
            >
              <LogIn className="w-5 h-5" />
              {cloudActive ? "Sign in with Google" : "Cloud Login Unavailable"}
            </button>
            <p className="text-[10px] text-brand-warm-black/40 text-center px-4 leading-relaxed">
              If popups are being blocked, please ensure you have opened this app in a <strong>new browser tab</strong>.
            </p>
          </div>
        )}
        
        <div className="bg-brand-olive/5 rounded-2xl p-4 flex gap-3">
          <ShieldCheck className="w-5 h-5 text-brand-olive flex-shrink-0" />
          <p className="text-xs text-brand-warm-black/60 leading-relaxed italic">
            Privacy First: Your logs and music library always remain stored <span className="font-bold">locally</span> on this device using Browser LocalStorage. Login is optional and used for AI verification.
          </p>
        </div>
      </section>
    </div>
  );
}

