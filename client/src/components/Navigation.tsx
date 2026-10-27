import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLocale } from "@/lib/i18n";
import { APP_NAME, APP_SLOGAN } from "@/lib/brand";

export function Navigation() {
  const { t } = useLocale();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center gap-2 hover-elevate active-elevate-2 rounded-md px-2 py-1 -ml-2" data-testid="link-home">
            <GraduationCap className="hidden sm:block h-7 w-7 md:h-8 md:w-8 text-primary shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold text-base md:text-xl whitespace-nowrap">{APP_NAME}</span>
              <span className="max-w-56 text-[11px] leading-tight text-muted-foreground hidden lg:block">{APP_SLOGAN}</span>
            </div>
          </Link>

          <div className="flex items-center gap-2 md:gap-4">
            <Badge variant="secondary" className="hidden sm:inline-flex" data-testid="badge-free-trial">
              {t("88小时免费试用")}
            </Badge>
            <LanguageToggle />
            <ThemeToggle />
            <Button variant="outline" size="sm" asChild data-testid="button-login">
              <Link href="/login">{t("登录")}</Link>
            </Button>
            <Button variant="default" size="sm" asChild data-testid="button-signup">
              <Link href="/signup">{t("免费注册")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
