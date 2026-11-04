import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n";
import { PandaIcon } from "./PandaIcon";

export function PandaWelcome() {
  const { t } = useLocale();
  const welcomeRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = welcomeRef.current;
    if (!element || visible) return;

    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div
      ref={welcomeRef}
      className="panda-welcome"
      data-testid="panda-welcome"
      data-visible={visible ? "true" : "false"}
    >
      <div className={`panda-welcome__art${visible ? " is-visible" : ""}`} aria-hidden="true">
        <PandaIcon className="panda-welcome__panda" welcomeArtwork />
      </div>
      <p className={`panda-welcome__greeting${visible ? " is-visible" : ""}`} data-testid="panda-greeting" data-visible={visible ? "true" : "false"} aria-live="polite">
        {t("你好，欢迎来到 Ethiopanda！")}
      </p>
    </div>
  );
}
