import { useQuery } from "@tanstack/react-query";
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
      <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
        <p className="text-sm" data-testid="text-footer">
          Paid for by concerned citizens.
        </p>
        <p className="text-xs mt-4 opacity-70" data-testid="text-version">
          {versionDisplay}
        </p>
      </div>
    </footer>
  );
}
