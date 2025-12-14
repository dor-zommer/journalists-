

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

export type TimeRange = '12h' | '24h' | '48h' | '72h' | 'week';

export type EditorialCategory = 'knesset' | 'legislation' | 'planning' | 'courts' | 'research';

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  DAILY_BRIEF = 'DAILY_BRIEF',
  EDITORIAL_MEETING = 'EDITORIAL_MEETING',
  MONITOR = 'MONITOR',
  IMAGE_EDITOR = 'IMAGE_EDITOR'
}
