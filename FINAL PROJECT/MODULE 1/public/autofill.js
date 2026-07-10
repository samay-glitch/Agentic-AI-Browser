/**
 * Standalone Auto-Filler Script
 * 
 * This script is injected directly into the webpage (e.g., via chrome.scripting.executeScript)
 * rather than running as a standard content script. This approach bypasses strict Content 
 * Security Policies (CSPs) on sites like Google Forms.
 * 
 * Supports: text inputs, emails, textareas, checkboxes, radio buttons, 
 * select dropdowns, Google Forms custom dropdowns, and file uploads.
 */

(function() {
  if (window.__AGENTIC_AUTOFILL_INJECTED) return;
  window.__AGENTIC_AUTOFILL_INJECTED = true;

  // ========================================================================
  // SECTION 1: Field Discovery
  // Finds ALL fillable elements on the page, including checkboxes, radios,
  // selects, file inputs, and Google Forms custom widgets.
  // ========================================================================

  function getInputs() {
    const selectors = [
      'input[type="text"]',
      'input[type="email"]',
      'input[type="tel"]',
      'input[type="url"]',
      'input[type="number"]',
      'input[type="date"]',
      'input[type="password"]',
      'input[type="search"]',
      'input:not([type])',           // Inputs with no type default to text
      'textarea',
      'select',
      'input[type="checkbox"]',
      'input[type="radio"]',
      'input[type="file"]',
      'div[role="listbox"]',         // Google Forms custom dropdowns
      'div[role="radiogroup"]',      // Google Forms custom radio groups
      '[role="checkbox"]',           // Google Forms custom checkboxes
    ];
    
    const elements = Array.from(document.querySelectorAll(selectors.join(', ')));
    
    // Deduplicate: for radio buttons, group by name and only keep the group container
    // We'll handle individual radio options in fillField instead
    return elements.filter(el => {
      // Skip hidden or zero-dimension elements
      if (el.offsetParent === null && el.type !== 'hidden') return false;
      // Skip submit/reset buttons that might sneak in
      if (el.type === 'submit' || el.type === 'reset' || el.type === 'button' || el.type === 'hidden') return false;
      return true;
    });
  }

  // ========================================================================
  // SECTION 2: Label Extraction
  // Extracts a human-readable label for any field by combining ARIA attributes,
  // associated <label> elements, placeholders, Google Forms titles, and 
  // nearby text content for checkboxes/radios.
  // ========================================================================

  function getFieldLabel(field) {
    let label = field.getAttribute('aria-label') || '';
    
    // ARIA labelledby
    const ariaLabelledBy = field.getAttribute('aria-labelledby');
    if (ariaLabelledBy) {
      const ids = ariaLabelledBy.split(' ');
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.textContent) {
          label += ' ' + el.textContent;
        }
      }
    }

    // HTML <label> associated by 'for' attribute
    if (field.id) {
      const labelEl = document.querySelector('label[for="' + field.id + '"]');
      if (labelEl && labelEl.textContent) {
        label += ' ' + labelEl.textContent;
      }
    }

    // Parent <label> wrapper
    const parentLabel = field.closest('label');
    if (parentLabel && parentLabel.textContent) {
      label += ' ' + parentLabel.textContent;
    }

    // Google Forms specific title extraction
    const formGroup = field.closest('.rFrNMe') || field.closest('.geS5n') || field.closest('[role="listitem"]');
    if (formGroup) {
      const titleEl = formGroup.querySelector('.M7eMe') || formGroup.querySelector('div[role="heading"]');
      if (titleEl && titleEl.textContent) {
        label += ' ' + titleEl.textContent;
      }
    }

    // For checkboxes/radios: also grab text of adjacent sibling or parent span
    const isCheckboxOrRadio = field.type === 'checkbox' || field.type === 'radio' || field.getAttribute('role') === 'checkbox' || field.getAttribute('role') === 'radio';
    if (isCheckboxOrRadio) {
      const nextSibling = field.nextElementSibling;
      if (nextSibling && nextSibling.textContent) {
        label += ' ' + nextSibling.textContent;
      }
      // Check parent container for group label
      const groupContainer = field.closest('fieldset') || field.closest('[role="group"]') || field.closest('[role="radiogroup"]');
      if (groupContainer) {
        const legend = groupContainer.querySelector('legend');
        if (legend && legend.textContent) {
          label += ' ' + legend.textContent;
        }
      }
      
      // Look inside the element for text, some custom checkboxes have text inside
      if (field.textContent && field.textContent.trim() !== '') {
        label += ' ' + field.textContent;
      }
      
      const dataVal = field.getAttribute('data-value');
      if (dataVal) {
        label += ' ' + dataVal;
      }
    }
    
    return (label + ' ' + (field.placeholder || '') + ' ' + (field.name || '') + ' ' + (field.id || '')).toLowerCase().trim();
  }

  /**
   * Determines the type category of a field for the Review Modal.
   */
  function getFieldType(field) {
    const tag = field.tagName;
    if (tag === 'SELECT' || field.getAttribute('role') === 'listbox') return 'select';
    if (tag === 'INPUT' && field.type === 'checkbox') return 'checkbox';
    if (tag === 'INPUT' && field.type === 'radio') return 'radio';
    if (tag === 'INPUT' && field.type === 'file') return 'file';
    if (field.getAttribute('role') === 'radiogroup') return 'radiogroup';
    if (field.getAttribute('role') === 'checkbox') return 'checkbox';
    if (tag === 'TEXTAREA') return 'textarea';
    return 'text';
  }

  /**
   * Gets available options for select, radio, or checkbox fields.
   */
  function getFieldOptions(field) {
    const type = getFieldType(field);
    
    if (type === 'select') {
      if (field.tagName === 'SELECT') {
        return Array.from(field.options).map(opt => ({ value: opt.value, text: opt.text }));
      }
      // Google Forms custom listbox
      const options = field.querySelectorAll('[role="option"], [data-value]');
      return Array.from(options).map(opt => ({
        value: opt.getAttribute('data-value') || opt.textContent.trim(),
        text: opt.textContent.trim()
      }));
    }
    
    if (type === 'radio') {
      // Find all radios with the same name
      const name = field.name;
      if (name) {
        const radios = Array.from(document.querySelectorAll('input[type="radio"][name="' + name + '"]'));
        return radios.map(r => {
          const lbl = r.nextElementSibling?.textContent || 
                      document.querySelector('label[for="' + r.id + '"]')?.textContent ||
                      r.value;
          return { value: r.value, text: (lbl || r.value).trim() };
        });
      }
    }

    if (type === 'radiogroup') {
      // Google Forms custom radio group
      const options = field.querySelectorAll('[role="radio"]');
      return Array.from(options).map(opt => {
        const dataVal = opt.getAttribute('data-value');
        const ariaLabel = opt.getAttribute('aria-label');
        const textContent = opt.textContent.trim();
        const finalVal = dataVal || ariaLabel || textContent || 'Unknown';
        const finalText = ariaLabel || textContent || dataVal || 'Unknown';
        return {
          value: finalVal,
          text: finalText
        };
      });
    }
    
    return [];
  }

  // ========================================================================
  // SECTION 3: Field Matching (Heuristics)
  // Maps a field label to a known profile key using regex patterns.
  // Returns { key, value } or null if no match.
  // ========================================================================

  function matchField(field, profile) {
    const text = getFieldLabel(field);
    
    const patterns = {
      name: /name|first.*name|last.*name|full.*name/i,
      email: /email|e-mail|mail/i,
      phone: /phone|tel|mobile|cell/i,
      city: /city|location|address/i,
      college: /college|university|school|institution/i,
      degree: /degree|major|course/i,
      gradYear: /grad.*year|graduation|class of/i,
      linkedin: /linkedin/i,
      github: /github/i,
      portfolio: /portfolio|website|personal site/i,
      skills: /skills|technologies/i,
      bio: /bio|about|summary|description|introduce|tell.*us/i,
      experience: /experience|work.*history/i,
      resumeBase64: /resume|cv|curriculum vitae|upload/i,
    };

    for (const [key, regex] of Object.entries(patterns)) {
      if (regex.test(text)) {
        return { key, value: profile[key] };
      }
    }

    // Check custom fields
    const customFields = profile.customFields || {};
    for (const [customKey, customValue] of Object.entries(customFields)) {
      if (text.includes(customKey.toLowerCase())) {
        return { key: customKey, value: customValue };
      }
    }

    return null;
  }

  // ========================================================================
  // SECTION 4: Field Filling
  // Fills a field with a value using techniques that work with React, Angular,
  // Vue, and Google's Closure Library. Handles text, select, checkbox, radio, file.
  // ========================================================================

  function fillField(field, value, profile = {}) {
    if (!value && value !== false && value !== 0) return;
    
    const type = getFieldType(field);
    
    switch (type) {
      case 'checkbox':
        fillCheckbox(field, value);
        break;
      case 'radio':
        fillRadio(field, value);
        break;
      case 'select':
        fillSelect(field, value);
        break;
      case 'radiogroup':
        fillGoogleFormsRadioGroup(field, value);
        break;
      case 'file':
        // File uploads are handled separately via the popup, but executed here
        fillFile(field, value, profile);
        break;
      default:
        fillTextField(field, String(value));
        break;
    }
  }

  /**
   * Fills a text input or textarea using execCommand('insertText') for trusted events.
   */
  function fillTextField(field, value) {
    field.focus();
    field.click();
    
    if (field.tagName === 'INPUT' || field.tagName === 'TEXTAREA') {
      field.select();
    } else {
      // For contenteditable elements
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(field);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    const success = document.execCommand('insertText', false, value);
    
    if (!success || (field.value !== undefined && field.value !== value)) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
      
      if (field.tagName === 'INPUT' && nativeInputValueSetter) {
        nativeInputValueSetter.call(field, value);
      } else if (field.tagName === 'TEXTAREA' && nativeTextAreaValueSetter) {
        nativeTextAreaValueSetter.call(field, value);
      } else {
        field.value = value;
      }
      
      // Extremely aggressive event dispatching for strict frameworks like Google Forms
      field.dispatchEvent(new Event('focus', { bubbles: true, composed: true }));
      field.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true, composed: true }));
      field.dispatchEvent(new KeyboardEvent('keypress', { key: 'a', bubbles: true, composed: true }));
      field.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText', data: value }));
      field.dispatchEvent(new KeyboardEvent('keyup', { key: 'a', bubbles: true, composed: true }));
      field.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      field.dispatchEvent(new Event('blur', { bubbles: true, composed: true }));
      
      // Google Forms specific: updating parent data-initial-value
      let parent = field.parentElement;
      for (let i = 0; i < 5; i++) {
        if (parent && parent.hasAttribute('data-initial-value')) {
          parent.setAttribute('data-initial-value', value);
          // Also set the class to is-focused or has-value to force visual update
          parent.classList.add('has-value');
          break;
        }
        if (parent) parent = parent.parentElement;
      }
    }

    field.blur();
    highlightField(field);
  }

  /**
   * Checks or unchecks a checkbox based on the value.
   * Accepts: true/false, "true"/"false", "yes"/"no", or the checkbox's own value attribute.
   */
  function fillCheckbox(field, value) {
    const shouldCheck = (
      value === true || value === 'true' || value === 'yes' || value === '1' ||
      (typeof value === 'string' && field.value && value.toLowerCase() === field.value.toLowerCase()) ||
      (typeof value === 'string' && field.getAttribute('data-value') && value.toLowerCase() === field.getAttribute('data-value').toLowerCase())
    );
    
    // Check if it's a Google Forms custom checkbox
    if (field.tagName !== 'INPUT' && field.getAttribute('role') === 'checkbox') {
      const isChecked = field.getAttribute('aria-checked') === 'true';
      if (isChecked !== shouldCheck) {
        field.click();
      }
    } else {
      // Native input checkbox
      if (field.checked !== shouldCheck) {
        field.click(); // Use click() to trigger proper event chain
      }
    }
    highlightField(field);
  }

  /**
   * Selects a radio button by finding the one whose value or label matches.
   */
  function fillRadio(field, value) {
    const name = field.name;
    if (!name) return;
    
    const radios = Array.from(document.querySelectorAll('input[type="radio"][name="' + name + '"]'));
    const lowerValue = String(value).toLowerCase();
    
    for (const radio of radios) {
      const radioLabel = (
        radio.value || 
        radio.nextElementSibling?.textContent || 
        document.querySelector('label[for="' + radio.id + '"]')?.textContent || 
        ''
      ).toLowerCase().trim();
      
      if (radio.value.toLowerCase() === lowerValue || radioLabel.includes(lowerValue) || lowerValue.includes(radioLabel)) {
        radio.click();
        highlightField(radio);
        return;
      }
    }
    // Fallback: select first radio if no match
  }

  /**
   * Selects an option in a <select> dropdown or Google Forms custom dropdown.
   */
  function fillSelect(field, value) {
    if (field.tagName === 'SELECT') {
      const lowerValue = String(value).toLowerCase();
      let matched = Array.from(field.options).find(opt => 
        opt.value.toLowerCase() === lowerValue || opt.text.toLowerCase() === lowerValue
      );
      if (!matched) {
        matched = Array.from(field.options).find(opt =>
          opt.value.toLowerCase().includes(lowerValue) || opt.text.toLowerCase().includes(lowerValue)
        );
      }
      if (matched) {
        field.value = matched.value;
        field.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        highlightField(field);
      }
    } else if (field.getAttribute('role') === 'listbox') {
      // Google Forms custom dropdown — click to open, then click the matching option
      field.click();
      setTimeout(() => {
        const options = document.querySelectorAll('[role="option"], [data-value]');
        const lowerValue = String(value).toLowerCase();
        for (const opt of options) {
          if (opt.textContent.toLowerCase().includes(lowerValue)) {
            opt.click();
            break;
          }
        }
      }, 300);
    }
  }

  /**
   * Fills a Google Forms custom radio group (div[role="radiogroup"]).
   */
  function fillGoogleFormsRadioGroup(field, value) {
    const options = field.querySelectorAll('[role="radio"]');
    const lowerValue = String(value).toLowerCase();
    
    for (const opt of options) {
      if (opt.textContent.toLowerCase().includes(lowerValue) || 
          (opt.getAttribute('data-value') || '').toLowerCase().includes(lowerValue)) {
        opt.click();
        highlightField(field);
        return;
      }
    }
  }

  /**
   * Helper to convert a Base64 Data URL to a File object.
   */
  function dataURLtoFile(dataurl, filename) {
    try {
      var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
          bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
      while(n--){
          u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], filename, {type:mime});
    } catch(e) {
      return null;
    }
  }

  /**
   * Uploads a file from a Data URL to an <input type="file">.
   */
  function fillFile(field, value, profile) {
    if (field.tagName !== 'INPUT' || field.type !== 'file') return;
    
    // value is expected to be the base64 data URL
    const filename = profile.resumeFileName || "resume.pdf";
    const file = dataURLtoFile(value, filename);
    
    if (file) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      field.files = dataTransfer.files;
      field.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      highlightField(field);
    }
  }

  /**
   * Briefly highlights a filled field with a blue border.
   */
  function highlightField(field) {
    const originalBorder = field.style.border;
    field.style.border = "2px solid #3b82f6";
    field.style.boxShadow = "0 0 6px rgba(59, 130, 246, 0.4)";
    setTimeout(() => { 
      field.style.border = originalBorder; 
      field.style.boxShadow = "none";
    }, 1500);
  }

  // ========================================================================
  // SECTION 5: Message Handlers
  // Listens for messages from the extension popup to scan, review, and fill.
  // ========================================================================

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    // --- SCAN: Return all fields with their metadata for the Review Modal ---
    if (message.type === 'SCAN_FORM_STANDALONE') {
      const profile = message.profile || {};
      const inputs = getInputs();
      const results = [];
      const seenRadioNames = new Set();
      
      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        const fieldType = getFieldType(input);

        // Deduplicate radio buttons: only report once per name group
        if (fieldType === 'radio') {
          if (seenRadioNames.has(input.name)) continue;
          seenRadioNames.add(input.name);
        }
        
        // Skip file inputs from review (handled separately)
        if (fieldType === 'file') continue;

        const label = getFieldLabel(input) || 'Unknown Field';
        const match = matchField(input, profile);
        const options = getFieldOptions(input);
        
        if (match) {
          const hasValue = match.value && String(match.value).trim() !== '';
          results.push({
            index: i,
            label: label,
            profileKey: match.key,
            value: match.value || '',
            isMissing: !hasValue,
            fieldType: fieldType,
            options: options
          });
        } else {
          const cleanLabel = label.length > 50 ? label.substring(0, 50).trim() + '...' : label.trim();
          results.push({
            index: i,
            label: label,
            profileKey: cleanLabel || 'Unknown Field',
            value: '',
            isMissing: true,
            fieldType: fieldType,
            options: options
          });
        }
      }
      
      sendResponse({ status: 'SUCCESS', fields: results });
      return true;
    }

    // --- EXECUTE: Fill specific fields with finalized values ---
    if (message.type === 'EXECUTE_FILL_STANDALONE') {
      const fieldsToFill = message.fieldsToFill;
      if (!fieldsToFill || !Array.isArray(fieldsToFill)) {
        sendResponse({ status: 'ERROR', error: 'Invalid fields payload' });
        return;
      }

      const inputs = getInputs();
      let filledCount = 0;

      for (const item of fieldsToFill) {
        if (item.value && item.value.trim() !== '' && item.index >= 0 && item.index < inputs.length) {
          // We pass profile (second arg is usually value, so we need to fetch profile from message if we want to pass it)
          // Wait, we need to pass profile to fillFile to get resumeFileName.
          // Let's pass the profile in the EXECUTE_FILL_STANDALONE message
          const profile = message.profile || {};
          fillField(inputs[item.index], item.value, profile);
          filledCount++;
        }
      }

      sendResponse({ status: 'SUCCESS', filledCount });
      return true;
    }

    // --- LEGACY: Fill everything immediately (fallback) ---
    if (message.type === 'FILL_FORM_STANDALONE') {
      const profile = message.profile;
      if (!profile) {
        sendResponse({ status: 'ERROR', error: 'No profile data' });
        return;
      }

      const inputs = getInputs();
      let filledCount = 0;

      for (const input of inputs) {
        const match = matchField(input, profile);
        if (match && match.value) {
          fillField(input, match.value, profile);
          filledCount++;
        }
      }
      sendResponse({ status: 'SUCCESS', filledCount });
      return true;
    }

    // --- VERIFY: Checks for validation errors after filling ---
    if (message.type === 'VERIFY_FILL_STANDALONE') {
      const profile = message.profile || {};
      const inputs = getInputs();
      const errors = [];
      
      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        
        // Google Forms specific error check
        const formGroup = input.closest('.rFrNMe') || input.closest('.geS5n') || input.closest('[role="listitem"]');
        let errorMsg = null;
        
        if (formGroup) {
          const errorEl = formGroup.querySelector('.Rgh0G, [role="alert"]');
          if (errorEl && errorEl.textContent && errorEl.getBoundingClientRect().height > 0) {
            errorMsg = errorEl.textContent;
          }
        }
        
        // Generic fallback: look for red text nearby or aria-invalid
        if (!errorMsg && input.getAttribute('aria-invalid') === 'true') {
          // Try to find the associated error message
          const describedBy = input.getAttribute('aria-describedby');
          if (describedBy) {
            const descEl = document.getElementById(describedBy);
            if (descEl) errorMsg = descEl.textContent;
          }
          if (!errorMsg) errorMsg = "Invalid input detected";
        }
        
        if (errorMsg) {
          const match = matchField(input, profile || {});
          errors.push({
            index: i,
            label: getFieldLabel(input) || 'Unknown Field',
            error: errorMsg,
            profileKey: match ? match.key : (getFieldLabel(input) || 'Unknown Field'),
            value: input.value || '',
            isMissing: true, // Treat as missing so the UI shows an alert
            fieldType: getFieldType(input),
            options: getFieldOptions(input)
          });
          
          // Highlight error
          input.style.border = "2px solid #ef4444";
          input.style.backgroundColor = "rgba(239, 68, 68, 0.05)";
        }
      }
      
      sendResponse({ status: 'SUCCESS', errors });
      return true;
    }

    // --- VISION: Mark fields with visual badges for screenshot ---
    if (message.type === 'MARK_FIELDS_FOR_VISION') {
      const inputs = getInputs();
      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        input.setAttribute('data-vision-id', i);
        
        // Create badge
        const badge = document.createElement('div');
        badge.className = 'agentic-vision-badge';
        badge.textContent = `[${i}]`;
        Object.assign(badge.style, {
          position: 'absolute',
          background: 'red',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '14px',
          padding: '2px 6px',
          borderRadius: '4px',
          zIndex: '999999',
          pointerEvents: 'none',
          boxShadow: '0 0 4px rgba(0,0,0,0.5)'
        });
        
        const rect = input.getBoundingClientRect();
        badge.style.top = (window.scrollY + rect.top - 10) + 'px';
        badge.style.left = (window.scrollX + rect.left - 10) + 'px';
        
        document.body.appendChild(badge);
      }
      sendResponse({ status: 'SUCCESS', count: inputs.length });
      return true;
    }

    // --- VISION: Unmark fields after screenshot ---
    if (message.type === 'UNMARK_FIELDS_FOR_VISION') {
      const badges = document.querySelectorAll('.agentic-vision-badge');
      badges.forEach(b => b.remove());
      sendResponse({ status: 'SUCCESS' });
      return true;
    }

    // --- VISION: Execute fill based on returned Vision IDs ---
    if (message.type === 'EXECUTE_VISION_FILL') {
      const fieldsToFill = message.fieldsToFill; // Array of { id: number, value: string }
      const profile = message.profile || {};
      const inputs = getInputs();
      let filledCount = 0;

      for (const item of fieldsToFill) {
        if (item.value && item.value.trim() !== '') {
          try {
            // Find the input that was marked with this ID
            // Fallback to array index if data-vision-id is lost
            let input = document.querySelector(`[data-vision-id="${item.id}"]`);
            if (!input && !isNaN(parseInt(item.id))) {
              input = inputs[parseInt(item.id)];
            }
            if (input) {
              fillField(input, item.value, profile);
              filledCount++;
            }
          } catch (err) {
            // Silently ignore
          }
        }
      }
      sendResponse({ status: 'SUCCESS', filledCount });
      return true;
    }
  });
})();
