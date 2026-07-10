import { Bot, Settings } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProfileSummary } from '@/components/dashboard/ProfileSummary';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { ReviewFill, ScannedField } from '@/components/dashboard/ReviewFill';
import { useProfileStore } from '@/stores/profile-store';
import { BUILT_IN_KEYS, UserProfile } from '@/types/profile';
import { useState } from 'react';
import { motion } from 'framer-motion';

export function Popup() {
  const { profile, completionPercentage, updateProfile } = useProfileStore();
  const [isFilling, setIsFilling] = useState(false);
  const [scannedFields, setScannedFields] = useState<ScannedField[] | null>(null);
  const [isVisionScanning, setIsVisionScanning] = useState(false);
  const [isVisionMode, setIsVisionMode] = useState(false);

  /**
   * Opens the full-page options menu (Options.tsx) where the user 
   * can edit their profile and settings.
   */
  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  /**
   * Main function to trigger form filling on the active tab.
   * It injects the standalone autofill script to bypass CSP and sends
   * the user's profile data to it.
   */
  const handleFillForm = async () => {
    setIsFilling(true);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        // 1. Inject the CSP-safe standalone script into all frames
        await chrome.scripting.executeScript({
          target: { tabId: tab.id, allFrames: true },
          files: ['autofill.js']
        }).catch(() => {

        });

        // 2. Send the profile data directly to the injected script
        // We use a callback response to determine if it succeeded
        chrome.tabs.sendMessage(tab.id, { 
          type: 'SCAN_FORM_STANDALONE', 
          profile 
        }, (response) => {
          setIsFilling(false);
          // If the script wasn't injected properly (e.g. on chrome:// pages or if CSP completely blocked it)
          if (chrome.runtime.lastError) {
            alert("Could not connect to the page. Please REFRESH the page and try again!");
            return;
          }
          if (response && response.status === 'SUCCESS') {
            if (response.fields.length === 0) {
              alert("No matching fields found on this page.");
            } else {
              setScannedFields(response.fields);
            }
          }
        });
      } else {
        setIsFilling(false);
      }
    } catch (e) {
      setIsFilling(false);
    }
  };

  const handleVisionScan = async () => {
    setIsVisionScanning(true);
    setIsVisionMode(true);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) throw new Error("No active tab");

      // 0. Ensure script is injected
      await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        files: ['autofill.js']
      }).catch(() => {});

      // 1. Mark fields
      await new Promise(resolve => chrome.tabs.sendMessage(tab.id!, { type: 'MARK_FIELDS_FOR_VISION' }, resolve));
      
      // 2. Wait for paint
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 3. Capture screenshot
      const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'jpeg', quality: 60 });
      
      // 4. Unmark fields
      await new Promise(resolve => chrome.tabs.sendMessage(tab.id!, { type: 'UNMARK_FIELDS_FOR_VISION' }, resolve));

      // 5. Fetch API key
      const result = await chrome.storage.local.get('gemini_api_key');
      const apiKey = result['gemini_api_key'];
      if (!apiKey) {
        alert("Please set your Gemini API Key in the Options page first!");
        setIsVisionScanning(false);
        return;
      }

      // 6. Call Vision API
      const { analyzeFormWithVision } = await import('@/services/ai/gemini');
      const visionFields = await analyzeFormWithVision(apiKey, dataUrl, profile);
      
      // 7. Map to ScannedField format for ReviewFill
      const mappedFields: ScannedField[] = visionFields.map((f: any) => ({
        index: f.id,
        label: f.label,
        profileKey: f.label,
        value: f.value,
        isMissing: false,
        fieldType: 'text'
      }));

      if (mappedFields.length === 0) {
        alert("Vision AI couldn't find any matchable fields.");
      } else {
        setScannedFields(mappedFields);
      }
    } catch (e: any) {
      alert("Vision Scan failed: " + e.message);
    } finally {
      setIsVisionScanning(false);
    }
  };

  const handleConfirmFill = async (fieldsToFill: { index: number; value: string }[], newProfileData: Record<string, string>) => {
    // 1. Save any newly entered missing data to the user's profile
    if (Object.keys(newProfileData).length > 0) {
      const updates: Partial<UserProfile> = {};
      const customFieldsUpdate: Record<string, string> = { ...(profile.customFields || {}) };
      let hasCustomUpdates = false;

      for (const [key, value] of Object.entries(newProfileData)) {
        if (BUILT_IN_KEYS.includes(key as keyof UserProfile)) {
          // @ts-ignore
          updates[key as keyof UserProfile] = value;
        } else {
          customFieldsUpdate[key] = value;
          hasCustomUpdates = true;
        }
      }

      if (hasCustomUpdates) {
        updates.customFields = customFieldsUpdate;
      }
      
      updateProfile(updates);
    }

    // 2. Execute the fill on the page
    setIsFilling(true);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          type: isVisionMode ? 'EXECUTE_VISION_FILL' : 'EXECUTE_FILL_STANDALONE',
          fieldsToFill: isVisionMode ? fieldsToFill.map(f => ({ id: f.index, value: f.value })) : fieldsToFill,
          profile
        }, (response) => {
          setIsFilling(false);
          setScannedFields(null); // Return to standard popup view
          if (response && response.status === 'SUCCESS') {
            // Check for validation errors after a short delay to let JS validation run
            setTimeout(() => {
              if (tab.id) {
                chrome.tabs.sendMessage(tab.id, { type: 'VERIFY_FILL_STANDALONE', profile }, (verifyResponse) => {
                  if (verifyResponse && verifyResponse.status === 'SUCCESS' && verifyResponse.errors && verifyResponse.errors.length > 0) {
                    // We found errors! Re-open the Review Modal with just the erroneous fields
                    setScannedFields(verifyResponse.errors);
                  }
                });
              }
            }, 800);
          }
        });
      }
    } catch (e) {
      setIsFilling(false);
      setScannedFields(null);
    }
  };

  return (
    <div className="w-[350px] min-h-[450px] p-4 flex flex-col gap-4">
      <header className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold tracking-tight">Agentic AI</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={openOptions} className="h-8 w-8">
          <Settings className="w-4 h-4 text-text-muted" />
        </Button>
      </header>
      
      <motion.main 
        className="flex-1 flex flex-col gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {scannedFields ? (
          <ReviewFill 
            fields={scannedFields} 
            onConfirm={handleConfirmFill} 
            onCancel={() => {
              setScannedFields(null);
              setIsVisionMode(false);
            }} 
          />
        ) : (
          <>
            <ProfileSummary 
              profile={profile} 
              completionPercentage={completionPercentage} 
              onCompleteProfile={openOptions} 
            />
            <QuickActions 
              onFillForm={handleFillForm} 
              isReady={completionPercentage > 0}
              isLoading={isFilling}
            />
            {completionPercentage > 0 && (
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  className="w-full text-xs flex gap-2 items-center justify-center border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-500/10 text-purple-400"
                  onClick={handleVisionScan}
                  disabled={isVisionScanning || isFilling}
                >
                  <Bot className="w-3.5 h-3.5" />
                  {isVisionScanning ? "Analyzing with Vision..." : "Deep Vision Scan (Fallback)"}
                </Button>
              </div>
            )}
          </>
        )}
      </motion.main>
    </div>
  );
}
