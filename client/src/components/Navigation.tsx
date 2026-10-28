import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLocale } from "@/lib/i18n";
import { APP_NAME, APP_SLOGAN } from "@/lib/brand";
import { PandaIcon } from "./PandaIcon";

export function Navigation() {
  const { t } = useLocale();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-1 h-16 md:h-20">
          <Link href="/" className="flex min-w-0 items-center gap-1.5 sm:gap-2 hover-elevate active-elevate-2 rounded-md px-1 sm:px-2 py-1" data-testid="link-home">
            <PandaIcon className="h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 text-primary shrink-0" />
            <div className="flex min-w-0 flex-col">
              <span className="font-bold text-sm sm:text-base md:text-xl whitespace-nowrap">{APP_NAME}</span>
              <span className="max-w-56 text-[11px] leading-tight text-muted-foreground hidden lg:block">{APP_SLOGAN}</span>
            </div>
          </Link>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2 md:gap-4">
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
