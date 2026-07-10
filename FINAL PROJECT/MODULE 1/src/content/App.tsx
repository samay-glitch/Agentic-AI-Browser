import { useState, useEffect } from 'react';
import { InlineMenu } from './components/InlineMenu';
import { FieldMatcher } from '@/services/field-matching/matcher';
import { AutoFiller } from '@/services/auto-fill/filler';
import { useTemplateStore } from '@/stores/template-store';

const matcher = new FieldMatcher();
const filler = new AutoFiller();

/**
 * Main React Component for the Content Script.
 * Manages the state of the Floating Action Button and the Inline Menu.
 */
export function App() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeInput, setActiveInput] = useState<{ element: HTMLElement; top: number; left: number; question: string } | null>(null);

  useEffect(() => {
    // Listen for focus events to show the inline menu
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable
      ) {
        // Only show if it's a textual input
        const inputType = target.getAttribute('type');
        if (inputType && ['checkbox', 'radio', 'submit', 'button', 'hidden'].includes(inputType)) {
          return;
        }

        const rect = target.getBoundingClientRect();
        
        // Try to find the question/label associated with this input
        const idents = matcher['getFieldIdentifiers'](target as any); // Access private method for simplicity in MVP
        const question = idents.join(" ") || target.getAttribute('placeholder') || "Describe your experience.";

        setActiveInput({
          element: target,
          top: window.scrollY + rect.top,
          left: window.scrollX + rect.left + rect.width - 70,
          question
        });
      }
    };

    const handleFocusOut = (_e: FocusEvent) => {
      // Small delay to allow clicking the menu buttons
      setTimeout(() => {
        if (!document.activeElement || document.activeElement === document.body) {
           setActiveInput(null);
        }
      }, 200);
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);


  const handleGenerate = async () => {
    if (!activeInput?.element) return;
    
    setIsGenerating(true);
    
    // 1. Check if we have a saved template that matches the question
    const store = useTemplateStore.getState();
    const match = store.findMatchingTemplate(activeInput.question);
    
    if (match) {
      filler.fillField(activeInput.element as any, match.answer);
      highlightField(activeInput.element);
      store.incrementUsage(match.id);
      setIsGenerating(false);
      return;
    }

    // 2. Provide optimistic feedback if calling API
    filler.fillField(activeInput.element as any, "🤖 Generating intelligent response based on your profile...");

    try {
      const response = await new Promise<any>((resolve) => {
        chrome.runtime.sendMessage({ 
          type: 'AI_REQUEST', 
          question: activeInput.question 
        }, resolve);
      });

      if (response.status === 'SUCCESS') {
        filler.fillField(activeInput.element as any, response.answer);
        highlightField(activeInput.element);
        
        // Save the new answer to the templates store
        store.addTemplate(activeInput.question, response.answer);
      } else {
        filler.fillField(activeInput.element as any, `⚠️ Error: ${response.error || 'Failed to generate answer.'}`);
      }
    } catch (e) {
      filler.fillField(activeInput.element as any, "⚠️ Connection error to AI service.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <InlineMenu 
        position={activeInput ? { top: activeInput.top, left: activeInput.left } : null} 
        isVisible={!!activeInput}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
      />
    </>
  );
}

// --- Utility Functions ---

/**
 * Temporarily highlights a field with a blue border and glow effect
 * to visually indicate to the user that it was automatically filled.
 */
function highlightField(field: HTMLElement) {
  const originalBorder = field.style.border;
  const originalTransition = field.style.transition;
  
  field.style.transition = "border 0.3s ease-in-out, box-shadow 0.3s ease-in-out";
  field.style.border = "2px solid #3b82f6"; 
  field.style.boxShadow = "0 0 8px rgba(59, 130, 246, 0.5)";
  
  setTimeout(() => {
    field.style.border = originalBorder;
    field.style.boxShadow = "none";
    setTimeout(() => {
      field.style.transition = originalTransition;
    }, 300);
  }, 1500);
}
