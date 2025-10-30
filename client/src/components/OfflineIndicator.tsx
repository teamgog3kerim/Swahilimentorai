import { WifiOff, Wifi } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <Alert className="mb-4 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
      <WifiOff className="h-4 w-4 text-orange-600 dark:text-orange-500" />
      <AlertDescription className="text-orange-800 dark:text-orange-200">
        当前处于离线模式。您可以访问已下载的课程。
      </AlertDescription>
    </Alert>
  );
}

export function OnlineStatusBadge() {
  const isOnline = useOnlineStatus();

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4 text-green-500" />
          <span>在线</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-orange-500" />
          <span>离线</span>
        </>
      )}
    </div>
  );
}
