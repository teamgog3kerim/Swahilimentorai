import { useEffect, useState } from "react";
import { APP_NAME } from "@/lib/brand";
import { PandaIcon } from "@/components/PandaIcon";
import "./AppLaunchSplash.css";

const SPLASH_DURATION_MS = 2300;
const EXIT_DURATION_MS = 360;

function isStandaloneApp() {
  if (typeof window === "undefined") return false;
  const iosStandalone = "standalone" in navigator
    && Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return window.matchMedia("(display-mode: standalone)").matches || iosStandalone;
}

export function AppLaunchSplash() {
  const [isVisible, setIsVisible] = useState(isStandaloneApp);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (!isVisible) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const displayDuration = reducedMotion ? 1300 : SPLASH_DURATION_MS;
    const leaveTimer = window.setTimeout(() => setIsLeaving(true), displayDuration);
    const hideTimer = window.setTimeout(
      () => setIsVisible(false),
      displayDuration + EXIT_DURATION_MS,
    );
    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(hideTimer);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      className={`app-launch-splash${isLeaving ? " app-launch-splash--leaving" : ""}`}
      data-testid="app-launch-splash"
      role="status"
      aria-live="polite"
      aria-label={`${APP_NAME} launch screen`}
    >
      <div className="app-launch-splash__content">
        <PandaIcon
          className="app-launch-splash__mascot"
          welcomeArtwork
          aria-label={`${APP_NAME} panda mascot`}
        />
        <div className="app-launch-splash__welcome">
          <h1>欢迎来到 Ethio Panda</h1>
          <p className="app-launch-splash__chinese">学习非洲语言……</p>
          <div className="app-launch-splash__divider" aria-hidden="true" />
          <h2>Welcome to Ethio Panda</h2>
          <p className="app-launch-splash__english">Learn African Languages...</p>
        </div>
        <div className="app-launch-splash__progress" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  );
}
