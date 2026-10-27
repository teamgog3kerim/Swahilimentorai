import { Link } from "wouter";
import { Coins, ArrowUpRight, GraduationCap } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { APP_NAME, APP_SLOGAN } from "@/lib/brand";
import { PandaWelcome } from "./PandaWelcome";
import "./Footer.css";

export function Footer() {
  const { language, t } = useLocale();
  const productLinks = [
    { label: "课程", text: t("课程"), href: "/signup" },
    { label: "定价", text: t("定价"), href: "/#pricing" },
    { label: "练习", text: t("练习"), href: "/signup" },
    { label: "进度追踪", text: t("进度追踪"), href: "/signup" }
  ];

  const resourceLinks = [
    { label: "免费注册", text: t("免费注册"), href: "/signup" },
    { label: "登录", text: t("登录"), href: "/login" }
  ];

  return (
    <footer className="afri-footer" data-testid="footer">
      <div className="afri-footer__inner">
        <div className="afri-footer__main">
          <section className="afri-footer__brand">
            <div className="afri-footer__brand-lockup">
              <span className="afri-footer__brand-mark" aria-hidden="true">
                <GraduationCap />
              </span>
              <div>
                <p className="afri-footer__brand-name">{APP_NAME}</p>
                <p className="afri-footer__slogan">{APP_SLOGAN}</p>
              </div>
            </div>
            <p className="afri-footer__description">
              {t("为中文和英语使用者提供阿姆哈拉语与斯瓦希里语课程，从字母和词汇到数字与真实场景对话。")}
            </p>
          </section>

          <nav className="afri-footer__link-group" aria-label={t("产品")}>
            <h2>{t("产品")}</h2>
            <ul>
              {productLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} data-testid={`link-${link.label}`}>
                    {link.text}<ArrowUpRight aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="afri-footer__link-group" aria-label={t("学习资源")}>
            <h2>{t("学习资源")}</h2>
            <ul>
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} data-testid={`link-${link.label}`}>
                    {link.text}<ArrowUpRight aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

        </div>

        <PandaWelcome />

        <div className="afri-footer__bottom">
          <div className="afri-footer__payment">
            <Coins aria-hidden="true" />
            <span>{language === "en" ? "USD checkout via Polar.sh · coming soon, not available yet" : "USD 结账将通过 Polar.sh 提供 · 即将开放，目前不可用"}</span>
          </div>
          <p className="afri-footer__copyright">
            © {new Date().getFullYear()} {APP_NAME}. {t("保留所有权利。")}
          </p>
        </div>
      </div>
    </footer>
  );
}
