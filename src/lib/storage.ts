import { Piece, PracticeEntry } from '../types';

const STORAGE_KEYS = {
  PIECES: 'mj_pieces',
  ENTRIES: 'mj_entries',
  REPORTS: 'mj_reports',
  COMPETITIONS: 'mj_competitions',
  API_KEY: 'mj_gemini_key'
};

export const localDB = {
  // Pieces
  getPieces: (): Piece[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PIECES);
    return data ? JSON.parse(data) : [];
  },
  savePiece: (piece: Piece) => {
    const pieces = localDB.getPieces();
    const index = pieces.findIndex(p => p.id === piece.id);
    if (index >= 0) pieces[index] = piece;
    else pieces.push(piece);
    localStorage.setItem(STORAGE_KEYS.PIECES, JSON.stringify(pieces));
  },
  deletePiece: (id: string) => {
    const pieces = localDB.getPieces().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PIECES, JSON.stringify(pieces));
    // Also cleanup entries
    const entries = localDB.getEntries().filter(e => e.pieceId !== id);
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
  },

  // Entries
  getEntries: (): PracticeEntry[] => {
    const data = localStorage.getItem(STORAGE_KEYS.ENTRIES);
    return data ? JSON.parse(data) : [];
  },
  saveEntry: (entry: PracticeEntry) => {
    const entries = localDB.getEntries();
    entries.unshift(entry);
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
  },
  deleteEntry: (id: string) => {
    const entries = localDB.getEntries().filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
  },

  // Reports
  getReports: (): any[] => {
    const data = localStorage.getItem(STORAGE_KEYS.REPORTS);
    return data ? JSON.parse(data) : [];
  },
  saveReport: (report: any) => {
    const reports = localDB.getReports();
    reports.unshift(report);
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports.slice(0, 50)));
  },

  // Competitions
  getCompetitions: (): any[] => {
    const data = localStorage.getItem(STORAGE_KEYS.COMPETITIONS);
    return data ? JSON.parse(data) : [];
  },
  saveCompetition: (comp: any) => {
    const comps = localDB.getCompetitions();
    comps.push(comp);
    localStorage.setItem(STORAGE_KEYS.COMPETITIONS, JSON.stringify(comps));
  },
  deleteCompetition: (id: string) => {
    const comps = localDB.getCompetitions().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.COMPETITIONS, JSON.stringify(comps));
  },

  // API Key
  setAIKey: (key: string) => localStorage.setItem(STORAGE_KEYS.API_KEY, key),
  getAIKey: () => localStorage.getItem(STORAGE_KEYS.API_KEY) || '',
};
