export interface Piece {
  id: string;
  title: string;
  composer?: string;
  userId?: string;
  createdAt: string;
  background?: string;
  era?: string;
  style?: string;
  difficultyAnalysis?: {
    overall: string;
    keySections: {
      measureRange: string;
      description: string;
      tips: string;
    }[];
  };
  pdfAnalysis?: {
    tempo: { zh: string; en: string };
    keyPoints: { zh: string; en: string }[];
    practiceSuggestions: { zh: string; en: string }[];
  };
}

export interface PracticeEntry {
  id: string;
  userId?: string;
  pieceId: string;
  pieceTitle: string;
  duration: number;
  notes: string;
  practiceType: "self" | "with_teacher";
  targetTempo?: string;
  listenedToPerformances?: string;
  encouragement?: string | null;
  date: string;
  createdAt: string;
}

export interface WeeklyReport {
  id: string;
  userId: string;
  content: string;
  date: string;
  createdAt: string;
}
