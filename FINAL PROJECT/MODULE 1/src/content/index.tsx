import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
// Import raw CSS using Vite's ?inline query
import tailwindStyles from '@/styles/index.css?inline';


/**
 * Injects the main React UI (Floating Action Button, Inline Menus) into the webpage.
 * Uses a Shadow DOM to isolate the extension's CSS (Tailwind) from the host page's CSS.
 */
function injectUI() {
  try {
    if (document.getElementById('agentic-ai-extension-root')) return;
    
    // 1. Create a host container
    const host = document.createElement('div');
    host.id = 'agentic-ai-extension-root';
    host.style.position = 'absolute';
    host.style.zIndex = '2147483647';
    document.body.appendChild(host);

    // 2. Attach Shadow DOM
    const shadow = host.attachShadow({ mode: 'open' });

    // 3. Inject Tailwind CSS into the Shadow DOM
    const style = document.createElement('style');
    style.textContent = tailwindStyles;
    shadow.appendChild(style);

    // 4. Create React root node inside Shadow DOM
    const rootElement = document.createElement('div');
    rootElement.id = 'agentic-react-root';
    shadow.appendChild(rootElement);

    // 5. Render the App
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (e) {

  }
}

// Ensure UI is injected safely
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectUI);
} else {
  injectUI();
}

// We still need to listen to popup messages if the user clicks the Auto-Fill button in the popup
import { FormDetector } from "@/services/form-detection/detector";
import { FieldMatcher } from "@/services/field-matching/matcher";
import { AutoFiller } from "@/services/auto-fill/filler";
import { UserProfile } from "@/types/profile";

const detector = new FormDetector();
const matcher = new FieldMatcher();
const filler = new AutoFiller();

/**
 * Message listener for the extension popup.
 * Allows the popup to trigger the auto-fill process in the current tab.
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'PING') {
    sendResponse({ status: 'OK' });
    return true;
  }

  if (message.type === 'FILL_FORM') {
    handleFillFormFromPopup().then((count) => {
      sendResponse({ status: 'SUCCESS', filledCount: count });
    }).catch(err => {

      sendResponse({ status: 'ERROR', error: String(err) });
    });
    return true;
  }
});

/**
 * Handles the auto-fill logic when triggered from the extension popup.
 * Fetches the profile, scans the page for forms, matches fields, and fills them.
 * 
 * @returns The number of fields successfully filled.
 */
async function handleFillFormFromPopup(): Promise<number> {
  const profile = await getProfileFromStorage();
  if (!profile) return 0;

  const forms = detector.scan();
  if (forms.length === 0) return 0;

  let filledCount = 0;
  for (const form of forms) {
    const matches = matcher.matchFields(form.fields);
    for (const match of matches) {
      const valueToFill = profile[match.profileKey];
      if (valueToFill && String(valueToFill).trim() !== "") {
        const success = await filler.fillField(match.field, String(valueToFill));
        if (success) filledCount++;
      }
    }
  }
  return filledCount;
}

/**
 * Helper function to retrieve the user's profile from chrome.storage.local.
 * Parses the zustand store state format.
 */
async function getProfileFromStorage(): Promise<UserProfile | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['agentic-profile-storage'], (result) => {
      const stateStr = result['agentic-profile-storage'];
      if (!stateStr) return resolve(null);
      try {
        const state = JSON.parse(stateStr);
        resolve(state.state.profile || null);
      } catch (e) {
        resolve(null);
      }
    });
  });
}
