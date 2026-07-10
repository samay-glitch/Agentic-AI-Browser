import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ChromeLocalStorage } from 'zustand-chrome-storage';

export interface SavedTemplate {
  id: string;
  question: string;
  answer: string;
  createdAt: number;
  updatedAt: number;
  usageCount: number;
}

interface TemplateState {
  templates: SavedTemplate[];
  addTemplate: (question: string, answer: string) => void;
  updateTemplate: (id: string, updates: Partial<SavedTemplate>) => void;
  deleteTemplate: (id: string) => void;
  findMatchingTemplate: (question: string) => SavedTemplate | null;
  incrementUsage: (id: string) => void;
}

function getWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function calculateWordOverlap(a: string, b: string): number {
  const wordsA = getWords(a);
  const wordsB = getWords(b);

  if (wordsA.length === 0 || wordsB.length === 0) return 0;

  const setB = new Set(wordsB);
  const matchCount = wordsA.filter((w) => setB.has(w)).length;

  return matchCount / Math.max(wordsA.length, wordsB.length);
}

export const useTemplateStore = create<TemplateState>()(
  persist(
    (set, get) => ({
      templates: [],

      addTemplate: (question: string, answer: string) => {
        const now = Date.now();
        const newTemplate: SavedTemplate = {
          id: crypto.randomUUID(),
          question,
          answer,
          createdAt: now,
          updatedAt: now,
          usageCount: 0,
        };
        set({ templates: [...get().templates, newTemplate] });
      },

      updateTemplate: (id: string, updates: Partial<SavedTemplate>) => {
        set({
          templates: get().templates.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t
          ),
        });
      },

      deleteTemplate: (id: string) => {
        set({ templates: get().templates.filter((t) => t.id !== id) });
      },

      findMatchingTemplate: (question: string) => {
        const templates = get().templates;
        let bestMatch: SavedTemplate | null = null;
        let bestScore = 0;

        for (const template of templates) {
          const score = calculateWordOverlap(question, template.question);
          if (score > 0.6 && score > bestScore) {
            bestScore = score;
            bestMatch = template;
          }
        }

        return bestMatch;
      },

      incrementUsage: (id: string) => {
        set({
          templates: get().templates.map((t) =>
            t.id === id
              ? { ...t, usageCount: t.usageCount + 1, updatedAt: Date.now() }
              : t
          ),
        });
      },
    }),
    {
      name: 'agentic-template-storage',
      storage: createJSONStorage(() => ChromeLocalStorage),
    }
  )
);
