export class AutoFiller {
  /**
   * Intelligently fills a field and triggers necessary events so React/Angular/Vue/Closure
   * pick up the changes. Bypasses naive programmatic value setting which modern 
   * frameworks often ignore.
   */
  public async fillField(
    field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
    value: string
  ): Promise<boolean> {
    if (!field || !value) return false;

    try {
      // 1. Focus the field to simulate user interaction
      field.focus();
      (field as HTMLElement).click();
      
      // 2. Handle select elements separately
      if (field instanceof HTMLSelectElement) {
        this.fillSelect(field, value);
        field.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        field.blur();
        return true;
      }
      
      // 3. Select existing text so execCommand replaces it
      field.select();
      
      // 4. Use execCommand('insertText') — creates TRUSTED InputEvent
      //    This is the technique used by password managers (LastPass, 1Password)
      //    to fill Google Forms and other strict-CSP sites.
      const success = document.execCommand('insertText', false, value);
      
      // 5. Fallback if execCommand didn't work
      if (!success || field.value !== value) {
        if (field instanceof HTMLInputElement) {
          this.setNativeValue(field, window.HTMLInputElement.prototype, value);
        } else if (field instanceof HTMLTextAreaElement) {
          this.setNativeValue(field, window.HTMLTextAreaElement.prototype, value);
        } else {
          (field as HTMLInputElement).value = value;
        }
        field.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText', data: value }));
        field.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      }
      
      // 6. Blur to complete interaction
      field.blur();
      
      return true;
    } catch (error) {

      return false;
    }
  }

  /**
   * Helper function to bypass React's custom setter on the value property.
   * By calling the native prototype setter, we ensure the underlying DOM node is 
   * actually updated before we dispatch the synthetic event.
   */
  private setNativeValue(element: HTMLElement, prototype: any, value: string) {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(element, value);
    } else {
      (element as any).value = value;
    }
  }

  /**
   * Handles filling <select> dropdowns by matching the value against the options'
   * inner text or value attribute.
   */
  private fillSelect(select: HTMLSelectElement, value: string) {
    // Try to find exact match
    let option = Array.from(select.options).find(opt => opt.value === value || opt.text === value);
    
    // Try partial match if no exact match
    if (!option) {
      const lowerValue = value.toLowerCase();
      option = Array.from(select.options).find(opt => 
        opt.value.toLowerCase().includes(lowerValue) || 
        opt.text.toLowerCase().includes(lowerValue)
      );
    }

    if (option) {
      select.value = option.value;
    }
  }
}
