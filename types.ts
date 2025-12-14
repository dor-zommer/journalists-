

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface NewsUpdate {
  id: string;
  title: string;
  summary: string;
  timestamp: string;
  sources: GroundingSource[];
  category: 'knesset' | 'government' | 'general' | 'comptroller';
}

export interface MonitorTopic {
  id: string;
  keyword: string;
  isActive: boolean;
}

export interface EditorialItem {
  date: string;
  title: string;
  description: string;
  meta: string; // Extra info like Decision #, Initiator, Location
  link: string;
}

export interface SavedItem {
  id: string;
  category: string;
  categoryType: EditorialCategory; // Added for icon mapping
  content: string; // The markdown summary
  originalData?: EditorialItem[]; // The raw data to restore table
  timestamp: Date;
  sources: GroundingSource[];
}

export interface MonitorEntity {
  id: string;
  name: string;
  url?: string;
  type: 'ngo' | 'gov' | 'body' | 'other';
}

export interface MonitorResult {
  title: string;
  source: string;
  url: string;
  date: string;
  relevanceScore: number; // 1-10
  relevanceReason: string; // Why is this interesting?
  summary: string;
}

export interface MonitorResponse {
  executiveSummary: string[];
  results: MonitorResult[];
}

export interface ArchivedScan {
  id: string;
  date: Date;
  topics: string[];
  data: MonitorResponse;
}

export type TimeRange = 
  | '24h_window' 
  | 'week_window' 
  | 'month'
  | 'current_month' // Added
  | '12h'
  | '24h'
  | '48h'
  | '72h';

export type EditorialCategory = 
  | 'government_decisions' 
  | 'government_agenda'
  | 'knesset_agenda' 
  | 'legislation_tazkirim' 
  | 'legislation_knesset'
  | 'planning' 
  | 'courts' 
  | 'procurement';

export type BriefCategory = 'knesset' | 'legislation' | 'planning' | 'procurement' | 'news';

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  MEETING_DASHBOARD = 'MEETING_DASHBOARD', // New Home
  DATABASE_SCANNER = 'DATABASE_SCANNER', // Was EditorialMeeting
  MONITOR = 'MONITOR',
  AI_STUDIO = 'AI_STUDIO' // New Smart Editor View
}
