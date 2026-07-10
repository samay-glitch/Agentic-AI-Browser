import { useState } from "react";
import { useProfileStore } from "@/stores/profile-store";
import { UserProfileSchema, UserProfile } from "@/types/profile";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Plus, Trash2 } from "lucide-react";

export function ProfileForm() {
  const { profile, updateProfile } = useProfileStore();
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [errors, setErrors] = useState<Partial<Record<keyof UserProfile, string>>>({});
  const [isSaved, setIsSaved] = useState(false);

  // State for adding a new custom field
  const [newFieldName, setNewFieldName] = useState("");

  const handleChange = (field: keyof UserProfile, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    setIsSaved(false);
  };

  const handleCustomFieldChange = (fieldName: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      customFields: {
        ...(prev.customFields || {}),
        [fieldName]: value,
      },
    }));
    setIsSaved(false);
  };

  const handleAddCustomField = () => {
    const trimmed = newFieldName.trim();
    if (!trimmed) return;

    // Check for duplicates (case-insensitive)
    const existingKeys = Object.keys(formData.customFields || {}).map(k => k.toLowerCase());
    if (existingKeys.includes(trimmed.toLowerCase())) return;

    setFormData((prev) => ({
      ...prev,
      customFields: {
        ...(prev.customFields || {}),
        [trimmed]: "",
      },
    }));
    setNewFieldName("");
    setIsSaved(false);
  };

  const handleRemoveCustomField = (fieldName: string) => {
    setFormData((prev) => {
      const updated = { ...(prev.customFields || {}) };
      delete updated[fieldName];
      return { ...prev, customFields: updated };
    });
    setIsSaved(false);
  };

  const handleSave = () => {
    const result = UserProfileSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof UserProfile, string>> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof UserProfile] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    updateProfile(result.data);
    setErrors({});
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const customFieldEntries = Object.entries(formData.customFields || {});

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-muted">Full Name</label>
          <Input 
            value={formData.name} 
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="John Doe"
          />
        </div>
        
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-muted">Email</label>
          <Input 
            value={formData.email} 
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="john@example.com"
            error={!!errors.email}
          />
          {errors.email && <span className="text-xs text-danger">{errors.email}</span>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-muted">Phone Number</label>
          <Input 
            value={formData.phone} 
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="+1 234 567 8900"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-muted">City</label>
          <Input 
            value={formData.city} 
            onChange={(e) => handleChange("city", e.target.value)}
            placeholder="San Francisco, CA"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-muted">College / University</label>
          <Input 
            value={formData.college} 
            onChange={(e) => handleChange("college", e.target.value)}
            placeholder="Stanford University"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-muted">Degree</label>
          <Input 
            value={formData.degree} 
            onChange={(e) => handleChange("degree", e.target.value)}
            placeholder="B.S. Computer Science"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-muted">Graduation Year</label>
          <Input 
            value={formData.graduationYear} 
            onChange={(e) => handleChange("graduationYear", e.target.value)}
            placeholder="2025"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-muted">LinkedIn URL</label>
          <Input 
            value={formData.linkedin} 
            onChange={(e) => handleChange("linkedin", e.target.value)}
            placeholder="https://linkedin.com/in/johndoe"
            error={!!errors.linkedin}
          />
          {errors.linkedin && <span className="text-xs text-danger">{errors.linkedin}</span>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-muted">GitHub URL</label>
          <Input 
            value={formData.github} 
            onChange={(e) => handleChange("github", e.target.value)}
            placeholder="https://github.com/johndoe"
            error={!!errors.github}
          />
          {errors.github && <span className="text-xs text-danger">{errors.github}</span>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-muted">Portfolio URL</label>
          <Input 
            value={formData.portfolio} 
            onChange={(e) => handleChange("portfolio", e.target.value)}
            placeholder="https://johndoe.com"
            error={!!errors.portfolio}
          />
          {errors.portfolio && <span className="text-xs text-danger">{errors.portfolio}</span>}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text-muted">Skills (comma separated)</label>
        <Input 
          value={formData.skills} 
          onChange={(e) => handleChange("skills", e.target.value)}
          placeholder="React, TypeScript, Node.js"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text-muted">Bio / Summary</label>
        <Textarea 
          value={formData.bio} 
          onChange={(e) => handleChange("bio", e.target.value)}
          placeholder="A brief summary about yourself..."
          className="min-h-[100px]"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text-muted">Experience Details</label>
        <Textarea 
          value={formData.experience} 
          onChange={(e) => handleChange("experience", e.target.value)}
          placeholder="List your work experience, hackathons, projects, etc..."
          className="min-h-[150px]"
        />
      </div>

      {/* ───── Custom Fields Section ───── */}
      <div className="pt-4 border-t border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-text-base">Custom Fields</h3>
            <p className="text-xs text-text-muted mt-0.5">
              Add your own fields for form auto-filling (e.g., Company, Date of Birth, etc.)
            </p>
          </div>
        </div>

        {/* Existing custom fields */}
        {customFieldEntries.length > 0 && (
          <div className="space-y-3 mb-4">
            {customFieldEntries.map(([fieldName, fieldValue]) => (
              <div key={fieldName} className="flex items-start gap-2 group">
                <div className="flex-1 space-y-1.5">
                  <label className="text-sm font-medium text-primary">{fieldName}</label>
                  <Input
                    value={fieldValue}
                    onChange={(e) => handleCustomFieldChange(fieldName, e.target.value)}
                    placeholder={`Enter ${fieldName}...`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveCustomField(fieldName)}
                  className="mt-7 p-2 rounded-lg text-zinc-500 hover:text-danger hover:bg-danger/10 transition-all duration-200 opacity-0 group-hover:opacity-100"
                  title={`Remove ${fieldName}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add new custom field */}
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1.5">
            <label className="text-sm font-medium text-text-muted">New Field Name</label>
            <Input
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              placeholder='e.g., "Company" or "Date of Birth"'
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCustomField();
                }
              }}
            />
          </div>
          <Button
            onClick={handleAddCustomField}
            disabled={!newFieldName.trim()}
            className="flex items-center gap-1.5 h-[42px] px-4"
          >
            <Plus className="w-4 h-4" />
            Add Field
          </Button>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <Button onClick={handleSave} className="w-32">
          {isSaved ? "Saved!" : "Save Profile"}
        </Button>
      </div>
    </div>
  );
}
