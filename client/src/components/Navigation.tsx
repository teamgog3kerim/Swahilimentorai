import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/">
            <a className="flex items-center gap-2 hover-elevate active-elevate-2 rounded-md px-2 py-1 -ml-2" data-testid="link-home">
              <GraduationCap className="h-7 w-7 md:h-8 md:w-8 text-primary" />
              <div className="flex flex-col">
                <span className="font-bold text-lg md:text-xl">Swahili AI</span>
                <span className="text-xs text-muted-foreground hidden sm:block">斯瓦希里语</span>
              </div>
            </a>
          </Link>

          <div className="flex items-center gap-2 md:gap-4">
            <Badge variant="secondary" className="hidden sm:inline-flex" data-testid="badge-free-trial">
              7天免费试用
            </Badge>
            <ThemeToggle />
            <Button variant="default" size="sm" data-testid="button-sign-in">
              登录
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
