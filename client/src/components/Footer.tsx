import { Link } from "wouter";
import { GraduationCap, Mail } from "lucide-react";
import { SiBinance } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/i18n";

export function Footer() {
  const { language, t } = useLocale();
  const productLinks = [
    { label: "课程", href: "/signup" },
    { label: "定价", href: "/#pricing" },
    { label: "AI导师", href: "/signup" },
    { label: "进度追踪", href: "/signup" }
  ];

  const resourceLinks = [
    { label: "学习指南", href: "/guide" },
    { label: "常见问题", href: "/faq" },
    { label: "博客", href: "/blog" },
    { label: "联系我们", href: "/contact" }
  ];

  const legalLinks = [
    { label: "隐私政策", href: "/privacy" },
    { label: "服务条款", href: "/terms" },
    { label: "退款政策", href: "/refund" }
  ];

  return (
    <footer className="border-t bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 mb-8 md:mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <div className="flex flex-col">
                <span className="font-bold text-lg">{t("语言学堂")}</span>
                <span className="text-xs text-muted-foreground">{t("阿姆哈拉语与斯瓦希里语")}</span>
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
                    {t(link.label)}
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
                    {t(link.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">{t("订阅周刊")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("每周获取免费斯瓦希里语学习资料")}
            </p>
            <div className="flex gap-2">
              <Input 
                type="email" 
                disabled
                placeholder={t("你的邮箱")} 
                className="text-sm"
                data-testid="input-newsletter-email"
              />
              <Button disabled size="icon" variant="default" data-testid="button-newsletter-submit">
                <Mail className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{language === "en" ? "Newsletter subscriptions are not available yet." : "周刊订阅暂未开放。"}</p>
          </div>
        </div>

        <div className="border-t pt-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              {legalLinks.map((link, index) => (
                <Link key={index} href={link.href} className="hover:text-foreground transition-colors" data-testid={`link-${link.label}`}>
                  {t(link.label)}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <SiBinance className="h-4 w-4" />
              <span>{t("支付由Binance Pay提供")}</span>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Language Academy. {t("保留所有权利。")}
          </p>
        </div>
      </div>
    </footer>
  );
}
