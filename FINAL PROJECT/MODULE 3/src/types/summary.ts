export interface ReadingInsights {
  wordCount: number;
  charCount: number;
  readingTimeMinutes: number;
  difficulty: 'Easy' | 'Intermediate' | 'Advanced' | 'Expert';
  language: string;
}

export interface SummaryMetadata {
  title: string;
  url: string;
  category: string;
  language: string;
  readingTime: string;
  complexity: string;
  sentiment: string;
}

export interface Summary {
  id: string;
  metadata: SummaryMetadata;
  tldr: string;
  keyTakeaways: string[];
  importantFacts: string[];
  actionItems: string[];
  technologies: string[];
  tags: string[];
  usefulLinks: string[];
  aiSuggestions: string[];
  readingInsights: ReadingInsights;
  rawMarkdown: string;
  createdAt: number;
  source: 'current-page' | 'url' | 'pdf' | 'job-description';
}

export interface JobAnalysis {
  company: string;
  role: string;
  location: string;
  experience: string;
  employmentType: string;
  salary: string;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  qualifications: string[];
  technologies: string[];
  softSkills: string[];
  education: string;
  applicationDeadline: string;
  jobCategory: string;
  tldr: string;
  resumeKeywords: string[];
  resumeImprovements: string[];
  interviewTopics: string[];
  difficultyScore: number;
}

export interface HistoryEntry {
  id: string;
  title: string;
  url: string;
  summary: string;
  tags: string[];
  createdAt: number;
  source: Summary['source'];
}
