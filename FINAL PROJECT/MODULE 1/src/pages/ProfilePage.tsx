import { ProfileForm } from "@/components/profile/ProfileForm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { useProfileStore } from "@/stores/profile-store";
import { FileText, Trash2, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

export function ProfilePage() {
  const { profile, updateProfile } = useProfileStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file?: File) => {
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert("Only PDF files are supported for resumes.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Please upload a PDF under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      updateProfile({ resumeBase64: base64, resumeFileName: file.name });
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleRemoveResume = () => {
    updateProfile({ resumeBase64: "", resumeFileName: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Resume Section */}
      <Card className="w-full border-zinc-800 bg-zinc-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Resume (PDF)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className={`p-6 border-2 border-dashed rounded-lg transition-all duration-300 flex flex-col items-center justify-center min-h-[160px] text-center cursor-pointer ${
              isDragging 
                ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.2)] scale-[1.02]' 
                : 'border-zinc-700 bg-zinc-900/80 hover:border-zinc-500 hover:bg-zinc-800/80'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !profile.resumeBase64 && fileInputRef.current?.click()}
          >
            {profile.resumeBase64 && profile.resumeFileName ? (
              <div className="flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center animate-in zoom-in duration-300">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-base font-semibold text-text-base">{profile.resumeFileName}</p>
                  <p className="text-sm text-emerald-400 mt-1">Uploaded successfully</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRemoveResume} 
                  className="text-danger hover:text-danger hover:bg-danger/10 transition-colors mt-2"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Resume
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  isDragging ? 'bg-primary/20 text-primary' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-base font-semibold text-text-base">
                    {isDragging ? 'Drop your PDF here' : 'Click or drag to upload Resume/CV'}
                  </p>
                  <p className="text-sm text-text-muted mt-1">PDF up to 5MB. We'll use this to auto-fill file inputs.</p>
                </div>
                <Button variant="outline" size="sm" className="mt-2" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                  Select File
                </Button>
                <input 
                  type="file" 
                  accept=".pdf" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Profile Form */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Text Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm />
        </CardContent>
      </Card>
    </div>
  );
}
