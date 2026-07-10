import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react';

export interface ScannedField {
  index: number;
  label: string;
  profileKey: string;
  value: string;
  isMissing: boolean;
  error?: string;
  fieldType?: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'radiogroup' | 'file';
  options?: { value: string; text: string }[];
}

interface ReviewFillProps {
  fields: ScannedField[];
  onConfirm: (fieldsToFill: { index: number; value: string }[], newProfileData: Record<string, string>) => void;
  onCancel: () => void;
}

export function ReviewFill({ fields, onConfirm, onCancel }: ReviewFillProps) {
  const [fieldValues, setFieldValues] = useState<Record<number, string>>({});

  useEffect(() => {
    const initial: Record<number, string> = {};
    fields.forEach(f => {
      initial[f.index] = f.value;
    });
    setFieldValues(initial);
  }, [fields]);

  const handleConfirm = () => {
    const fieldsToFill = fields.map(f => ({
      index: f.index,
      value: fieldValues[f.index] || ""
    }));

    // Extract any data that was originally missing but the user has now provided
    const newProfileData: Record<string, string> = {};
    fields.forEach(f => {
      const currentValue = fieldValues[f.index];
      if (f.isMissing && currentValue && currentValue.trim() !== "") {
        newProfileData[f.profileKey] = currentValue;
      }
    });

    onConfirm(fieldsToFill, newProfileData);
  };

  /** Renders the appropriate input control based on field type */
  const renderFieldInput = (field: ScannedField) => {
    const currentValue = fieldValues[field.index] || '';
    const onChange = (val: string) => setFieldValues(prev => ({ ...prev, [field.index]: val }));
    const isMissingStyle = field.isMissing && !currentValue ? "border-amber-500/50 bg-amber-500/5" : "";

    switch (field.fieldType) {
      case 'select':
      case 'radiogroup':
        // Render as a dropdown selector
        if (field.options && field.options.length > 0) {
          return (
            <div className="relative">
              <select
                value={currentValue}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-text appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary ${isMissingStyle}`}
              >
                <option value="">— Select —</option>
                {field.options.map((opt, i) => (
                  <option key={i} value={opt.value}>{opt.text}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            </div>
          );
        }
        // Fallback to text input if no options available
        return (
          <Input
            value={currentValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.isMissing ? `Enter ${field.profileKey}...` : ''}
            className={isMissingStyle}
          />
        );

      case 'radio':
        // Render as radio button group
        if (field.options && field.options.length > 0) {
          return (
            <div className="flex flex-wrap gap-2">
              {field.options.map((opt, i) => (
                <label 
                  key={i} 
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs cursor-pointer transition-colors ${
                    currentValue === opt.value 
                      ? 'border-primary bg-primary/10 text-primary' 
                      : 'border-zinc-700 bg-zinc-900 text-text-muted hover:border-zinc-500'
                  }`}
                >
                  <input
                    type="radio"
                    name={`review-radio-${field.index}`}
                    value={opt.value}
                    checked={currentValue === opt.value}
                    onChange={() => onChange(opt.value)}
                    className="sr-only"
                  />
                  {opt.text}
                </label>
              ))}
            </div>
          );
        }
        return (
          <Input
            value={currentValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.isMissing ? `Enter value...` : ''}
            className={isMissingStyle}
          />
        );

      case 'checkbox':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={currentValue === 'true' || currentValue === 'yes' || currentValue === '1'}
              onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-900 text-primary focus:ring-primary"
            />
            <span className="text-xs text-text-muted">Check this field</span>
          </label>
        );

      default:
        return (
          <Input
            value={currentValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.isMissing ? `Enter ${field.profileKey}...` : ''}
            className={isMissingStyle}
          />
        );
    }
  };

  /** Small visual badge for the field type */
  const renderFieldTypeBadge = (fieldType?: string) => {
    if (!fieldType || fieldType === 'text' || fieldType === 'textarea') return null;
    const labels: Record<string, string> = {
      select: 'Dropdown',
      radio: 'Radio',
      radiogroup: 'Radio',
      checkbox: 'Checkbox',
      file: 'File',
    };
    return (
      <span className="text-[9px] uppercase tracking-wider bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
        {labels[fieldType] || fieldType}
      </span>
    );
  };

  return (
    <Card className="flex flex-col h-[380px]">
      <CardHeader className="pb-3 border-b border-zinc-800 flex-shrink-0">
        <CardTitle className="text-sm font-medium flex justify-between items-center">
          Review & Fill
          <span className="text-xs text-text-muted font-normal bg-zinc-800 px-2 py-0.5 rounded-full">
            {fields.length} fields
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {fields.length === 0 ? (
          <div className="text-center text-sm text-text-muted mt-4">
            No recognizable fields found on this page.
          </div>
        ) : (
          fields.map((field) => (
            <div key={field.index} className="space-y-1.5">
              <label className="text-xs font-medium text-text flex items-center gap-1.5 flex-wrap">
                {field.error ? (
                  <AlertCircle className="w-3.5 h-3.5 text-danger flex-shrink-0" />
                ) : field.isMissing ? (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                )}
                <span className="truncate max-w-[140px]" title={field.label}>{field.label}</span>
                <span className="text-zinc-500 text-[10px]">({field.profileKey})</span>
                {renderFieldTypeBadge(field.fieldType)}
              </label>
              {field.error && (
                <div className="text-[10px] text-danger mt-1 mb-1">
                  {field.error}
                </div>
              )}
              {renderFieldInput(field)}
            </div>
          ))
        )}
      </CardContent>
      <div className="p-4 border-t border-zinc-800 flex gap-2 flex-shrink-0">
        <Button variant="outline" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button className="flex-1" onClick={handleConfirm} disabled={fields.length === 0}>
          Confirm & Fill
        </Button>
      </div>
    </Card>
  );
}
