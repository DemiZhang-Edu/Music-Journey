# 🎵 Music Journey

**Music Journey** is a professional AI companion designed for musicians to track their practice, analyze repertoire, and visualize progress. Whether you're a student or a performer, it helps you "Record your melody, witness every step of progress."

## ✨ Key Features

- **🎼 smart Piece Library**: Upload sheet music PDFs for instant AI analysis of tempo, key points, and practice suggestions.
- **📔 Practice Diary**: Log your sessions with details on duration, tempo, and mood. Receive instant AI encouragement after every entry.
- **📊 Weekly Summaries**: Automatically generate comprehensive reports of your week's activity with AI insights and tips for the next week.
- **🏆 Competition Planner**: Search for and organize upcoming music competitions and summer schools to plan your journey.
- **📥 Professional Exports**: Export your repertoire analysis and weekly reports as high-quality PDFs or images.

## 🛠️ Built With

- **Framework**: React 18 (Vite)
- **Styling**: Tailwind CSS / Lucide Icons
- **Database & Auth**: Firebase / Firestore
- **AI Engine**: Google Gemini 1.5 Flash
- **Client Utilities**: jsPDF / html2canvas

## 🚀 Getting Started

1. **Clone the repo**:
   ```bash
   git clone https://github.com/yourusername/music-journey.git
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Set up Environment Variables**:
   Copy `.env.example` to `.env` and fill in your Firebase and Gemini API keys.
4. **Run development server**:
   ```bash
   npm run dev
   ```

---
*Created with ❤️ for musicians everywhere.*

## 🚀 部署到 Vercel (Deployment)

1. 点击 AI Studio 右侧的 **"GitHub"** 按钮进行 **"Commit & Push"**。
2. 在 Vercel 后台导入该仓库。
3. **关键：** 在 Vercel 的 Environment Variables 中配置以下变量（值可参考本地 `firebase-applet-config.json`）：
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_FIRESTORE_DATABASE_ID` (默认为 `(default)`)
   - `VITE_GEMINI_API_KEY`

