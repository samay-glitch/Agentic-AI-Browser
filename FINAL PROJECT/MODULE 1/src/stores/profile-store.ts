import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ChromeLocalStorage } from 'zustand-chrome-storage';
import { UserProfile, DEFAULT_PROFILE, calculateCompletion } from '@/types/profile';

interface ProfileState {
  profile: UserProfile;
  completionPercentage: number;
  updateProfile: (updates: Partial<UserProfile>) => void;
  resetProfile: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: DEFAULT_PROFILE,
      completionPercentage: 0,
      
      updateProfile: (updates) => {
        const currentProfile = get().profile;
        const newProfile = { ...currentProfile, ...updates };
        set({ 
          profile: newProfile,
          completionPercentage: calculateCompletion(newProfile)
        });
      },
      
      resetProfile: () => {
        set({ 
          profile: DEFAULT_PROFILE,
          completionPercentage: 0
        });
      },
    }),
    {
      name: 'agentic-profile-storage',
      storage: createJSONStorage(() => ChromeLocalStorage),
    }
  )
);
