import { Link } from "wouter";
import { GraduationCap, Coins } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { APP_NAME, APP_SLOGAN } from "@/lib/brand";

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
    <footer className="border-t bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 mb-8 md:mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <div className="flex flex-col">
                <span className="font-bold text-lg">{APP_NAME}</span>
                <span className="text-xs text-muted-foreground">{APP_SLOGAN}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("为中文和英语使用者提供阿姆哈拉语与斯瓦希里语课程，从字母和词汇到数字与真实场景对话。")}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">{t("产品")}</h3>
            <ul className="space-y-2">
              {productLinks.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid={`link-${link.label}`}>
                    {link.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">{t("学习资源")}</h3>
            <ul className="space-y-2">
              {resourceLinks.map((link, index) => (
                <li key={index}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid={`link-${link.label}`}>
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        <div className="border-t pt-8 space-y-4">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Coins className="h-4 w-4" />
              <span>{language === "en" ? "USDT (TRC20) · Payments reviewed manually" : "USDT（TRC20）· 付款经人工审核"}</span>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} {APP_NAME}. {t("保留所有权利。")}
          </p>
        </div>
      </div>
    </footer>
  );
}
