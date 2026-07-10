export interface DetectableForm {
  id: string;
  element: HTMLElement;
  fields: Array<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
  isGoogleForm: boolean;
}

export class FormDetector {
  private observers: MutationObserver[] = [];
  
  /**
   * Scans the current document for forms or form-like structures.
   * Handles standard HTML forms, pseudo-forms (like Google Forms), 
   * and falls back to scanning all inputs if no form wrapper is found.
   */
  public scan(): DetectableForm[] {
    const forms: DetectableForm[] = [];
    
    // 1. Standard Forms
    const standardForms = Array.from(document.querySelectorAll('form'));
    standardForms.forEach((form, index) => {
      forms.push(this.parseForm(form, `std-${index}`));
    });

    // 2. Pseudo forms (e.g. Google Forms)
    // Many modern forms are just divs with role="form" or specific generic wrappers
    const pseudoForms = Array.from(document.querySelectorAll('div[role="form"], div[data-form-id], .freebirdFormviewerViewFormContent'));
    pseudoForms.forEach((form, index) => {
      // Avoid duplicates if a standard form is already tracking it
      const isAlreadyTracked = standardForms.some(f => f.contains(form) || form.contains(f));
      if (!isAlreadyTracked) {
         forms.push(this.parseForm(form as HTMLElement, `pseudo-${index}`, true));
      }
    });

    // 3. Fallback: Entire document if no forms found but there are stray inputs
    if (forms.length === 0) {
      const allInputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select');
      if (allInputs.length > 0) {
        forms.push(this.parseForm(document.body, 'fallback-0'));
      }
    }

    return forms;
  }

  /**
   * Helper function to extract all valid text-based input fields from a form element.
   * Excludes buttons, hidden fields, radios, and checkboxes which require different handling.
   */
  private parseForm(element: HTMLElement, id: string, isGoogleForm = false): DetectableForm {
    const rawFields = Array.from(
      element.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="radio"]):not([type="checkbox"]), textarea, select'
      )
    );

    return {
      id,
      element,
      fields: rawFields,
      isGoogleForm
    };
  }

  /**
   * Sets up a MutationObserver to watch for dynamically added forms
   * (e.g., in Single Page Applications like React or Angular).
   * 
   * @param onFormAdded Callback executed when a new form might have appeared.
   */
  public observe(onFormAdded: (forms: DetectableForm[]) => void) {
    const observer = new MutationObserver((mutations) => {
      let shouldScan = false;
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
           // Avoid reacting to our own injected UI or simple text changes
           shouldScan = true;
           break;
        }
      }
      if (shouldScan) {
        // Debounce would be ideal here in production
        onFormAdded(this.scan());
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    this.observers.push(observer);
  }

  public disconnect() {
    this.observers.forEach(o => o.disconnect());
    this.observers = [];
  }
}
