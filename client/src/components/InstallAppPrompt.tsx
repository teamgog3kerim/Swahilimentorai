import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import "./InstallAppPrompt.css";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function InstallAppPrompt() {
  const { language, t } = useLocale();
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const checkInstalled = () => {
      const iosStandalone = "standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
      setIsInstalled(standaloneQuery.matches || iosStandalone);
    };
    const checkIos = () => setIsIos(/iPad|iPhone|iPod/.test(navigator.userAgent));
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setShowInstructions(false);
      setInstallPrompt(null);
    };
    const onScroll = () => {
      setIsExpanded(false);
      setShowInstructions(false);
    };

    checkInstalled();
    checkIos();
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  if (isInstalled) return null;

  const handleInstallClick = async () => {
    setIsExpanded(true);
    if (installPrompt) {
      try {
        await installPrompt.prompt();
        const choice = await installPrompt.userChoice;
        setInstallPrompt(null);
        if (choice.outcome === "accepted") setIsInstalled(true);
      } catch {
        setInstallPrompt(null);
        setShowInstructions(true);
      }
      return;
    }
    setShowInstructions((visible) => !visible);
  };

  return (
    <div
      className={`install-app ${isExpanded ? "install-app--expanded" : "install-app--collapsed"}`}
      data-install-available={installPrompt ? "true" : "false"}
    >
      {showInstructions && (
        <section className="install-app__instructions" data-testid="install-app-instructions" aria-live="polite">
          <div className="install-app__instructions-heading">
            <strong>{t("将 Ethiopanda 添加到主屏幕")}</strong>
            <button
              type="button"
              className="install-app__close"
              onClick={() => setShowInstructions(false)}
              aria-label={t("关闭")}
            >
              <X size={18} />
            </button>
          </div>
          {isIos ? (
            <ol>
              <li><Share size={15} aria-hidden="true" />{t("点按浏览器的分享按钮")}</li>
              <li>{t("选择“添加到主屏幕”，再点按“添加”")}</li>
            </ol>
          ) : (
            <p>{t("在浏览器菜单中选择“安装应用”或“添加到主屏幕”。")}</p>
          )}
        </section>
      )}
      <button
        type="button"
        className="install-app__button"
        onClick={handleInstallClick}
        aria-label={t("安装 Ethiopanda 应用")}
        aria-expanded={showInstructions}
        data-testid="install-app-floating-button"
      >
        <Download size={19} strokeWidth={2.3} aria-hidden="true" />
        <span className="install-app__label">{t("安装应用")}</span>
      </button>
    </div>
  );
}
