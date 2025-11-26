import { useQuery } from "@tanstack/react-query";
import { Shield } from "lucide-react";
import type { BuildInfo } from "@shared/schema";

export default function Footer() {
  const { data: buildInfo, isLoading } = useQuery<BuildInfo>({
    queryKey: ["/api/build-info"],
    staleTime: Infinity,
  });

  const versionDisplay = isLoading 
    ? "..." 
    : buildInfo 
      ? `v${buildInfo.version} (${buildInfo.gitCommit}) - ${buildInfo.buildDate}`
      : "v1.1.0";

  return (
    <footer className="bg-primary text-primary-foreground py-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm" data-testid="text-footer">
            Paid for by concerned citizens.
          </p>
        </div>
        
        <div className="mt-6 pt-6 border-t border-primary-foreground/20">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Shield className="w-4 h-4 opacity-80" />
            <span className="text-sm font-medium opacity-90">Privacy Commitment</span>
          </div>
          <p className="text-xs text-center opacity-75 max-w-2xl mx-auto" data-testid="text-privacy-notice">
            Your information will not be sold or provided to any third party. We only use your contact information to communicate annexation updates. You may unsubscribe from our communications at any time using the link in any email we send.
          </p>
        </div>
        
        <p className="text-xs mt-6 text-center opacity-60" data-testid="text-version">
          {versionDisplay}
        </p>
      </div>
    </footer>
  );
}
