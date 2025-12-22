import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Home, MessageSquare, BarChart, CreditCard, LogOut, User as UserIcon, Trophy, Users } from "lucide-react";
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
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import Learn from "@/pages/Learn";
import Practice from "@/pages/Practice";
import Progress from "@/pages/Progress";
import Subscription from "@/pages/Subscription";
import Leaderboard from "@/pages/Leaderboard";
import StudyGroups from "@/pages/StudyGroups";
import type { User } from "@shared/schema";

type View = "learn" | "practice" | "progress" | "leaderboard" | "groups" | "subscription";

export default function Dashboard() {
  const { user } = useAuth() as { user: User | null };
  const [currentView, setCurrentView] = useState<View>("learn");

  const menuItems = [
    { id: "learn" as View, title: "学习", icon: Home },
    { id: "practice" as View, title: "练习", icon: MessageSquare },
    { id: "progress" as View, title: "进度", icon: BarChart },
    { id: "leaderboard" as View, title: "排行榜", icon: Trophy },
    { id: "groups" as View, title: "学习小组", icon: Users },
    { id: "subscription" as View, title: "订阅", icon: CreditCard },
  ];

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const renderView = () => {
    switch (currentView) {
      case "learn":
        return <Learn onNavigateToPractice={(_lessonId?: string) => setCurrentView("practice")} />;
      case "practice":
        return <Practice />;
      case "progress":
        return <Progress />;
      case "leaderboard":
        return <Leaderboard />;
      case "groups":
        return <StudyGroups />;
      case "subscription":
        return <Subscription />;
      default:
        return <Learn onNavigateToPractice={(_lessonId?: string) => setCurrentView("practice")} />;
    }
  };

  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-lg font-bold px-4 py-4">
                斯瓦希里语学习
              </SidebarGroupLabel>
              <Separator />
              <SidebarGroupContent className="mt-4">
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => setCurrentView(item.id)}
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
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="w-10 h-10">
                  <AvatarFallback>
                    <UserIcon className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" data-testid="text-username">
                    {user?.username || "用户"}
                  </p>
                  <Badge
                    variant={user?.isPremium ? "default" : "secondary"}
                    className="text-xs"
                    data-testid={`badge-${user?.isPremium ? "premium" : "free"}`}
                  >
                    {user?.isPremium ? "高级会员" : "免费用户"}
                  </Badge>
                </div>
              </div>
            </div>
          </SidebarContent>

          <SidebarFooter>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="w-5 h-5 mr-2" />
              退出登录
            </Button>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-auto bg-background">
          {renderView()}
        </main>
      </div>
    </SidebarProvider>
  );
}
