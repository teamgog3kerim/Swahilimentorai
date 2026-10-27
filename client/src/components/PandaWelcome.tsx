import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n";

export function PandaWelcome() {
  const { t } = useLocale();
  const welcomeRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);

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
      <div className={`panda-welcome__art${visible ? " is-visible" : ""}${paused ? " is-paused" : ""}`} aria-hidden="true">
        <svg className="panda-welcome__panda" viewBox="0 0 136 122" fill="none">
          <ellipse cx="68" cy="98" rx="46" ry="8" fill="currentColor" opacity=".12" />
          <path d="M30 28c-8-15-2-25 7-25 11 0 17 12 16 25M106 28c8-15 2-25-7-25-11 0-17 12-16 25" fill="var(--panda-ink)" />
          <path d="M30 29c-3-8-2-15 2-18 5-3 11 4 13 15M106 29c3-8 2-15-2-18-5-3-11 4-13 15" fill="var(--panda-accent)" opacity=".5" />
          <path d="M33 42c0-20 15-34 35-34s35 14 35 34v27c0 23-15 34-35 34S33 92 33 69V42Z" fill="var(--panda-fur)" stroke="var(--panda-ink)" strokeWidth="3" />
          <path d="M39 42c1-11 8-17 17-15 8 2 10 12 5 20-4 7-13 13-19 11-5-2-5-9-3-16ZM97 42c-1-11-8-17-17-15-8 2-10 12-5 20 4 7 13 13 19 11 5-2 5-9 3-16Z" fill="var(--panda-ink)" />
          <ellipse cx="68" cy="58" rx="5" ry="4" fill="var(--panda-ink)" />
          <path d="M68 62v4m-7 2c1 5 4 7 7 7s6-2 7-7" stroke="var(--panda-ink)" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="48" cy="69" r="5" fill="var(--panda-accent)" opacity=".3" />
          <circle cx="88" cy="69" r="5" fill="var(--panda-accent)" opacity=".3" />
          <g className="panda-welcome__cap" data-testid="panda-cap">
            <path d="M68 2 101 14 68 26 35 14 68 2Z" fill="var(--panda-accent)" stroke="var(--panda-ink)" strokeWidth="2" strokeLinejoin="round" />
            <path d="M49 17v8c10 7 28 7 38 0v-8l-19 7-19-7Z" fill="var(--panda-accent)" stroke="var(--panda-ink)" strokeWidth="2" strokeLinejoin="round" />
            <g className="panda-welcome__tassel">
              <path d="M101 14v18" stroke="var(--panda-ink)" strokeWidth="2" strokeLinecap="round" />
              <circle cx="101" cy="34" r="2.5" fill="var(--panda-ink)" />
              <path d="m101 36-3 7m3-7v8m0-8 3 7" stroke="var(--panda-accent)" strokeWidth="2" strokeLinecap="round" />
            </g>
          </g>
          <path d="M42 90c-8 2-13 7-14 14 12 3 21 0 27-8M94 90c8 2 13 7 14 14-12 3-21 0-27-8" fill="var(--panda-fur)" stroke="var(--panda-ink)" strokeWidth="3" strokeLinejoin="round" />
          <path d="M19 45c-7-4-11-2-12 3 5 1 8 3 11 7m99-10c7-4 11-2 12 3-5 1-8 3-11 7" stroke="var(--panda-accent)" strokeWidth="2" strokeLinecap="round" />
          <path d="M16 37h9m86 0h9" stroke="var(--panda-accent)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <p className={`panda-welcome__greeting${visible ? " is-visible" : ""}`} data-testid="panda-greeting" data-visible={visible ? "true" : "false"} aria-live="polite">
        {t("你好，欢迎来到 Afri Panda！")}
      </p>
      <button
        type="button"
        className="panda-welcome__motion-toggle"
        data-testid="button-panda-motion"
        aria-pressed={paused}
        onClick={() => setPaused((current) => !current)}
      >
        {paused ? t("恢复熊猫动画") : t("暂停熊猫动画")}
      </button>
    </div>
  );
}
