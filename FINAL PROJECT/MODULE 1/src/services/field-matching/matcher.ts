import { UserProfile } from "@/types/profile";

export interface FieldMatch {
  field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  profileKey: keyof UserProfile;
  confidence: number;
}

type HeuristicKeys = Exclude<keyof UserProfile, 'customFields'>;

/**
 * Maps known profile keys (excluding custom fields) to regular expressions.
 * These regex patterns are used to identify if a field's label matches a standard profile attribute.
 */
const FIELD_HEURISTICS: Record<HeuristicKeys, RegExp[]> = {
  name: [/name/i, /first.*name/i, /last.*name/i, /full.*name/i],
  email: [/email/i, /e-mail/i, /mail/i],
  phone: [/phone/i, /tel/i, /mobile/i, /cell/i],
  college: [/college/i, /university/i, /school/i, /institution/i],
  degree: [/degree/i, /major/i, /program/i],
  graduationYear: [/grad.*year/i, /class.*of/i, /graduation/i],
  skills: [/skill/i, /technolog/i, /stack/i],
  github: [/github/i, /git/i],
  linkedin: [/linkedin/i],
  portfolio: [/portfolio/i, /website/i, /personal.*site/i],
  city: [/city/i, /location/i, /address/i],
  bio: [/bio/i, /about/i, /summary/i, /cover.*letter/i, /description/i],
  experience: [/experience/i, /work/i, /history/i],
  resumeBase64: [/resume/i, /cv/i, /curriculum vitae/i, /upload/i],
  resumeFileName: []
};

export class FieldMatcher {
  /**
   * Processes a list of raw HTML input fields and attempts to find a matching
   * key in the UserProfile for each field.
   * 
   * @param fields Array of DOM elements representing form inputs
   * @returns Array of successful matches with confidence scores
   */
  public matchFields(fields: Array<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): FieldMatch[] {
    const matches: FieldMatch[] = [];

    for (const field of fields) {
      const identifiers = this.getFieldIdentifiers(field);
      const match = this.findBestMatch(identifiers, field.type);
      
      if (match) {
        matches.push({
          field,
          profileKey: match.key,
          confidence: match.confidence
        });
      }
    }

    return matches;
  }

  /**
   * Aggregates all possible descriptive text for a given field to create a
   * comprehensive search string for heuristic matching.
   * Checks id, name, placeholder, ARIA labels, associated <label> tags, and Google Forms specific DOM structures.
   */
  private getFieldIdentifiers(field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): string[] {
    const idents: string[] = [];
    
    if (field.id) idents.push(field.id);
    if (field.name) idents.push(field.name);
    if ('placeholder' in field && field.placeholder) idents.push(field.placeholder);
    
    const ariaLabel = field.getAttribute('aria-label');
    if (ariaLabel) idents.push(ariaLabel);

    // Get associated label by 'for' attribute
    if (field.id) {
      const label = document.querySelector(`label[for="${field.id}"]`);
      if (label && label.textContent) {
        idents.push(label.textContent);
      }
    }

    // Google forms or ARIA labelled by
    const ariaLabelledBy = field.getAttribute('aria-labelledby');
    if (ariaLabelledBy) {
      // aria-labelledby can have multiple IDs separated by space
      const ids = ariaLabelledBy.split(' ');
      for (const id of ids) {
        const labelElement = document.getElementById(id);
        if (labelElement && labelElement.textContent) {
          idents.push(labelElement.textContent);
        }
      }
    }

    // If wrapped in a label
    const parentLabel = field.closest('label');
    if (parentLabel && parentLabel.textContent) {
      idents.push(parentLabel.textContent);
    }
    
    // For Google forms structure: field is often inside a role="listitem" which has a title
    const parentListItem = field.closest('[role="listitem"]');
    if (parentListItem) {
        const heading = parentListItem.querySelector('[role="heading"]');
        if (heading && heading.textContent) {
            idents.push(heading.textContent);
        }
    }

    return idents.map(s => s.trim().replace(/\n/g, ' ')).filter(Boolean);
  }

  /**
   * Evaluates the extracted text identifiers against the regular expression patterns
   * to determine the most likely profile key for the field.
   */
  private findBestMatch(identifiers: string[], inputType?: string): { key: keyof UserProfile; confidence: number } | null {
    const combinedString = identifiers.join(' ');
    
    // High confidence hardcoded checks by type
    if (inputType === 'email') return { key: 'email', confidence: 1.0 };
    if (inputType === 'tel') return { key: 'phone', confidence: 1.0 };

    for (const [key, patterns] of Object.entries(FIELD_HEURISTICS)) {
      for (const pattern of patterns) {
        if (pattern.test(combinedString)) {
          // If we found a match via regex in the labels/ids, it's a solid guess
          return { key: key as keyof UserProfile, confidence: 0.8 };
        }
      }
    }
    
    return null;
  }
}
