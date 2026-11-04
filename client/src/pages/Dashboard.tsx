import { Fragment, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Home, MessageSquare, BarChart, CreditCard, LogOut, User as UserIcon, Menu, Shield, Bell } from "lucide-react";
import { ShareButton } from "@/components/ShareButton";
import { TelegramChannelCard } from "@/components/TelegramChannelCard";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { SubscriptionReminder } from "@/components/SubscriptionReminder";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Learn from "@/pages/Learn";
import Practice from "@/pages/Practice";
import Progress from "@/pages/Progress";
import Subscription from "@/pages/Subscription";
import Admin from "@/pages/Admin";
import type { User } from "@shared/schema";
import { useLocale } from "@/lib/i18n";
import { APP_NAME, APP_SLOGAN } from "@/lib/brand";
import { LanguageToggle } from "@/components/LanguageToggle";
import { TrackProvider, useTrack } from "@/contexts/TrackContext";
import { TrackChooser } from "@/components/learning/TrackChooser";
import { CourseAccessGate } from "@/components/CourseAccessGate";
import { useCourseAccess } from "@/components/useCourseAccess";
import { PandaIcon } from "@/components/PandaIcon";
import { clearSubscriptionIntent, hasSubscriptionIntent } from "@/lib/subscriptionIntent";
import { useEffect } from "react";

type View = "learn" | "practice" | "progress" | "subscription" | "admin";

function DashboardContent() {
  const { user } = useAuth() as { user: (User & { googleConnected: boolean }) | null };
  const { language, t } = useLocale();
  const { track, setTrack, setPracticeLessonId } = useTrack();
  const [currentView, setCurrentView] = useState<View>(() => {
    const requestedTab = new URLSearchParams(window.location.search).get("tab");
    if (requestedTab === "learn") return "learn";
    return requestedTab === "subscription" || hasSubscriptionIntent() ? "subscription" : "learn";
  });
  useEffect(() => { clearSubscriptionIntent(); }, []);
  const { setOpenMobile } = useSidebar();
  const hasAccess = useCourseAccess(user);

  const { data: adminCheck } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
    retry: false,
  });

  const isAdmin = adminCheck?.isAdmin === true;

  // Fetch pending payments count for admins
  const { data: pendingPayments } = useQuery<any[]>({
    queryKey: ["/api/admin/pending"],
    enabled: isAdmin,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const pendingCount = pendingPayments?.length || 0;

  const menuItems = [
    { id: "learn" as View, title: t("学习"), icon: Home },
    { id: "practice" as View, title: t("练习"), icon: MessageSquare },
    { id: "progress" as View, title: t("进度"), icon: BarChart },
    { id: "subscription" as View, title: t("订阅"), icon: CreditCard },
    ...(isAdmin ? [{ id: "admin" as View, title: t("管理后台"), icon: Shield }] : []),
  ];

  const handleNavigation = (view: View) => {
    setCurrentView(view);
    setOpenMobile(false);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch (error) {
      console.error("Logout error:", error);
    }
    queryClient.clear();
    window.location.replace("/");
  };

  const renderView = () => {
    switch (currentView) {
      case "learn":
        if (!hasAccess) {
          return <CourseAccessGate onUpgrade={() => setCurrentView("subscription")} />;
        }
        return <Learn onNavigateToPractice={(lessonId?: string) => {
          setPracticeLessonId(lessonId || null);
          setCurrentView("practice");
        }} />;
      case "practice":
        if (!hasAccess) {
          return <CourseAccessGate onUpgrade={() => setCurrentView("subscription")} />;
        }
        return <Practice onBackToLessons={() => setCurrentView("learn")} />;
      case "progress":
        return <Progress />;
      case "subscription":
        return <Subscription />;
      case "admin":
        return <Admin />;
      default:
        if (!hasAccess) {
          return <CourseAccessGate onUpgrade={() => setCurrentView("subscription")} />;
        }
        return <Learn onNavigateToPractice={(lessonId?: string) => {
          setPracticeLessonId(lessonId || null);
          setCurrentView("practice");
        }} />;
    }
  };

  return (
    <div className="flex h-screen w-full">
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="h-auto px-4 py-4">
              <div className="flex items-center gap-3">
                <PandaIcon className="h-10 w-10 shrink-0 text-primary" />
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-lg font-bold">{APP_NAME}</span>
                  <span className="text-xs leading-relaxed text-muted-foreground">{APP_SLOGAN}</span>
                </div>
              </div>
            </SidebarGroupLabel>
            <Separator />
            <SidebarGroupContent className="mt-4">
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => handleNavigation(item.id)}
                      isActive={currentView === item.id}
                      data-testid={`button-nav-${item.id}`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <div className="mt-auto px-4 py-4">
            <Separator className="mb-4" />
            <div className="mb-4">
              <TelegramChannelCard className="mb-3" />
              <ShareButton 
                variant="outline" 
                className="w-full justify-start" 
              />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="w-10 h-10">
                <AvatarFallback>
                  <UserIcon className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" data-testid="text-username">
                  {user?.username || t("用户")}
                </p>
                <Badge
                  variant={hasAccess ? "default" : "secondary"}
                  className="text-xs"
                  data-testid={`badge-${hasAccess ? "premium" : "free"}`}
                >
                  {hasAccess ? t("高级会员") : (language === "en" ? "Access expired" : "学习权限已到期")}
                </Badge>
              </div>
            </div>
          </div>
        </SidebarContent>

        <SidebarFooter>
          {!user?.googleConnected && <GoogleSignInButton connect />}
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="w-5 h-5 mr-2" />
            {t("退出登录")}
          </Button>
        </SidebarFooter>
      </Sidebar>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center gap-3 p-3 border-b bg-background">
          <SidebarTrigger className="md:hidden" data-testid="button-sidebar-toggle">
            <Menu className="w-5 h-5" />
          </SidebarTrigger>
            <PandaIcon className="h-8 w-8 shrink-0 text-primary" />
            <span className="font-semibold text-sm sm:text-base min-w-0 flex-1 truncate">{APP_NAME}{track ? ` · ${track === "amharic" ? (language === "en" ? "Amharic" : "阿姆哈拉语") : (language === "en" ? "Swahili" : "斯瓦希里语")}` : ""}</span>
          <div className="shrink-0"><LanguageToggle /></div>
            {track && <Button variant="outline" size="sm" onClick={() => setTrack(track === "amharic" ? "swahili" : "amharic")} data-testid="button-switch-language">
              {track === "amharic" ? (language === "en" ? "Switch to Swahili" : "切换到斯瓦希里语") : (language === "en" ? "Switch to Amharic" : "切换到阿姆哈拉语")}
            </Button>}
        </header>
        <main className="flex-1 overflow-auto bg-background">
          <div className="px-4 pt-4 space-y-3">
            {isAdmin && pendingCount > 0 && currentView !== "admin" && (
              <Alert 
                className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 cursor-pointer hover-elevate"
                onClick={() => setCurrentView("admin")}
                data-testid="alert-pending-payments"
              >
                <Bell className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-amber-800 dark:text-amber-200 flex items-center justify-between">
                  <span>
                    {language === "en"
                      ? <>You have <strong>{pendingCount}</strong> payment{pendingCount === 1 ? "" : "s"} waiting for verification.</>
                      : <>您有 <strong>{pendingCount}</strong> 笔待验证的支付，请及时处理</>}
                  </span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="ml-2 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentView("admin");
                    }}
                    data-testid="button-go-to-admin"
                  >
                    {t("前往处理")}
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            {user && currentView !== "subscription" && (
              <SubscriptionReminder 
                user={user} 
                onUpgrade={() => setCurrentView("subscription")} 
              />
            )}
          </div>
          {track || currentView === "subscription" || currentView === "admin" ? (
            <Fragment key={track}>{renderView()}</Fragment>
          ) : (
            <TrackChooser onChoose={setTrack} />
          )}
        </main>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <TrackProvider>
      <SidebarProvider style={style as React.CSSProperties}>
        <DashboardContent />
      </SidebarProvider>
    </TrackProvider>
  );
}
