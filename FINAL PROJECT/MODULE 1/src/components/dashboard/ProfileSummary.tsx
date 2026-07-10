import { UserProfile } from "@/types/profile";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface ProfileSummaryProps {
  profile: UserProfile | null;
  completionPercentage: number;
  onCompleteProfile: () => void;
}

export function ProfileSummary({ profile, completionPercentage, onCompleteProfile }: ProfileSummaryProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-text-muted">Profile Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between mb-2">
          <div className="text-2xl font-bold">{completionPercentage}%</div>
          {profile?.name && (
            <div className="text-sm text-text-muted mb-1 truncate max-w-[120px]">
              {profile.name}
            </div>
          )}
        </div>
        <div className="w-full bg-zinc-800 h-2 rounded-full mb-4">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-500" 
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
        <Button variant="outline" className="w-full" onClick={onCompleteProfile}>
          {completionPercentage === 100 ? "Edit Profile" : "Complete Profile"}
        </Button>
      </CardContent>
    </Card>
  );
}
