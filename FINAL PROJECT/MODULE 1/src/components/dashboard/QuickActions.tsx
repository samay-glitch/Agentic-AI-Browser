import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Wand2 } from "lucide-react";

interface QuickActionsProps {
  onFillForm: () => void;
  isReady: boolean;
  isLoading?: boolean;
}

export function QuickActions({ onFillForm, isReady, isLoading }: QuickActionsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-text-muted">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Button 
          className="w-full flex gap-2" 
          onClick={onFillForm}
          disabled={!isReady || isLoading}
          isLoading={isLoading}
        >
          {!isLoading && <Wand2 className="w-4 h-4" />}
          {isLoading ? "Filling..." : "Auto-Fill Page"}
        </Button>
      </CardContent>
    </Card>
  );
}
