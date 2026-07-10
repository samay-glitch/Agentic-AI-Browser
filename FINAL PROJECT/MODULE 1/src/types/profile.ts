import { z } from "zod";

export const UserProfileSchema = z.object({
  name: z.string().optional().default(""),
  email: z.string().email("Invalid email format").optional().or(z.literal("")).default(""),
  phone: z.string().optional().default(""),
  college: z.string().optional().default(""),
  degree: z.string().optional().default(""),
  graduationYear: z.string().optional().default(""),
  skills: z.string().optional().default(""),
  github: z.string().url("Invalid URL").optional().or(z.literal("")).default(""),
  linkedin: z.string().url("Invalid URL").optional().or(z.literal("")).default(""),
  portfolio: z.string().url("Invalid URL").optional().or(z.literal("")).default(""),
  city: z.string().optional().default(""),
  bio: z.string().optional().default(""),
  experience: z.string().optional().default(""),
  resumeBase64: z.string().optional(),
  resumeFileName: z.string().optional(),
  customFields: z.record(z.string(), z.string()).optional().default({}),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

export const DEFAULT_PROFILE: UserProfile = {
  name: "",
  email: "",
  phone: "",
  college: "",
  degree: "",
  graduationYear: "",
  skills: "",
  github: "",
  linkedin: "",
  portfolio: "",
  city: "",
  bio: "",
  experience: "",
  customFields: {},
};

// Keys that are built-in (not custom)
export const BUILT_IN_KEYS: Array<keyof UserProfile> = [
  'name', 'email', 'phone', 'college', 'degree', 'graduationYear',
  'skills', 'github', 'linkedin', 'portfolio', 'city', 'bio', 'experience',
  'resumeBase64', 'resumeFileName'
];

export function calculateCompletion(profile: UserProfile | null | undefined): number {
  if (!profile) return 0;
  
  // Count built-in fields
  let total = BUILT_IN_KEYS.length;
  let filled = 0;
  for (const key of BUILT_IN_KEYS) {
    if (profile[key] && String(profile[key]).trim() !== "") {
      filled++;
    }
  }

  // Count custom fields
  const customFields = profile.customFields || {};
  const customEntries = Object.entries(customFields);
  total += customEntries.length;
  for (const [, value] of customEntries) {
    if (value && value.trim() !== "") {
      filled++;
    }
  }
  
  if (total === 0) return 0;
  return Math.round((filled / total) * 100);
}
