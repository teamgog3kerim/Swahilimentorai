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
    <nav className="fixed inset-x-0 top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="grid min-h-24 grid-cols-[minmax(0,1fr)_auto] grid-rows-[2.5rem_2.25rem] items-center gap-x-2 gap-y-1 py-2 sm:flex sm:h-16 sm:min-h-0 sm:justify-between sm:gap-2 sm:py-0 md:h-20">
          <Link href="/" className="col-start-1 row-start-1 flex min-w-0 items-center gap-1.5 rounded-md px-1 py-1 hover-elevate active-elevate-2 sm:gap-2 sm:px-2" data-testid="link-home">
            <PandaIcon className="h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 text-primary shrink-0" />
            <div className="flex min-w-0 flex-col">
              <span className="font-bold text-sm sm:text-base md:text-xl whitespace-nowrap">{APP_NAME}</span>
              <span className="max-w-56 text-[11px] leading-tight text-muted-foreground hidden lg:block">{APP_SLOGAN}</span>
            </div>
          </Link>

          <div className="contents sm:flex sm:shrink-0 sm:items-center sm:gap-1 md:gap-4">
            <Badge variant="secondary" className="hidden sm:inline-flex" data-testid="badge-free-trial">
              {t("88小时免费试用")}
            </Badge>
            <div className="col-start-2 row-start-1 flex items-center gap-1 sm:contents">
              <LanguageToggle className="px-2 sm:px-3" />
              <ThemeToggle />
            </div>
            <div className="col-span-2 row-start-2 grid grid-cols-2 gap-2 sm:contents">
              <Button className="w-full sm:w-auto" variant="outline" size="sm" asChild data-testid="button-login">
                <Link href="/login">{t("登录")}</Link>
              </Button>
              <Button className="w-full sm:w-auto" variant="default" size="sm" asChild data-testid="button-signup">
                <Link href="/signup">{t("免费注册")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
