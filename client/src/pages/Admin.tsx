import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Users, 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Shield,
  RefreshCw,
  Search,
  Copy,
  BarChart3,
  Globe,
  Monitor,
  Smartphone,
  Eye,
  Bell,
  UserPlus,
  Trash2,
  CheckCheck
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/lib/i18n";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, Subscription, SubscriptionWithReview } from "@shared/schema";
import { UserManagementDialog, type ManagedUser } from "@/components/UserManagementDialog";
import { LearnerStoriesAdmin } from "@/components/LearnerStoriesAdmin";
import { RetainedPaymentReviews } from "@/components/RetainedPaymentReviews";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";

type SubscriptionWithUser = Subscription & { user: User };

type AnalyticsOverview = {
  totalVisits: number;
  uniqueSessions: number;
  todayVisits: number;
};

type CountryData = {
  countryCode: string;
  countryName: string;
  count: number;
};

type BrowserData = {
  browserName: string;
  count: number;
};

type DeviceData = {
  deviceType: string;
  count: number;
};

type VisitsByDate = {
  date: string;
  count: number;
};

type AdminNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata: Record<string, any> | null;
  isRead: boolean;
  createdAt: string;
};

const CHART_COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function AdminPage() {
  const { user } = useAuth() as { user: User | null };
  const { language, t } = useLocale();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [managedUser, setManagedUser] = useState<ManagedUser | null>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const { data: isAdminCheck } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
    retry: false,
  });

  const { data: pendingSubscriptions = [], isLoading: pendingLoading, refetch: refetchPending } = useQuery<SubscriptionWithUser[]>({
    queryKey: ["/api/admin/pending"],
    enabled: isAdminCheck?.isAdmin === true,
  });

  const { data: allSubscriptions = [], isLoading: subscriptionsLoading, refetch: refetchSubscriptions } = useQuery<(SubscriptionWithReview & { user: User })[]>({
    queryKey: ["/api/admin/subscriptions"],
    enabled: isAdminCheck?.isAdmin === true,
  });

  const { data: allUsers = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery<ManagedUser[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAdminCheck?.isAdmin === true,
  });

  const { data: analyticsOverview, isLoading: overviewLoading, refetch: refetchOverview } = useQuery<AnalyticsOverview>({
    queryKey: ["/api/admin/analytics/overview"],
    enabled: isAdminCheck?.isAdmin === true,
  });

  const { data: topCountries = [], isLoading: countriesLoading } = useQuery<CountryData[]>({
    queryKey: ["/api/admin/analytics/countries"],
    enabled: isAdminCheck?.isAdmin === true,
  });

  const { data: topBrowsers = [], isLoading: browsersLoading } = useQuery<BrowserData[]>({
    queryKey: ["/api/admin/analytics/browsers"],
    enabled: isAdminCheck?.isAdmin === true,
  });

  const { data: topDevices = [], isLoading: devicesLoading } = useQuery<DeviceData[]>({
    queryKey: ["/api/admin/analytics/devices"],
    enabled: isAdminCheck?.isAdmin === true,
  });

  const { data: visitsByDate = [], isLoading: visitsLoading } = useQuery<VisitsByDate[]>({
    queryKey: ["/api/admin/analytics/visits-by-date"],
    enabled: isAdminCheck?.isAdmin === true,
  });

  const { data: notifications = [], refetch: refetchNotifications } = useQuery<AdminNotification[]>({
    queryKey: ["/api/admin/notifications"],
    enabled: isAdminCheck?.isAdmin === true,
    refetchInterval: 30000,
  });

  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ["/api/admin/notifications/unread-count"],
    enabled: isAdminCheck?.isAdmin === true,
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/admin/notifications/${id}/read`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications/unread-count"] });
    },
    onError: () => {
      toast({
        title: t("标记失败"),
        description: t("无法标记通知为已读，请稍后再试"),
        variant: "destructive",
      });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/notifications/read-all");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications/unread-count"] });
      toast({
        title: t("已全部标记为已读"),
        description: t("所有通知已标记为已读"),
      });
    },
    onError: () => {
      toast({
        title: t("操作失败"),
        description: t("无法标记所有通知为已读，请稍后再试"),
        variant: "destructive",
      });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/notifications/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications/unread-count"] });
    },
    onError: () => {
      toast({
        title: t("删除失败"),
        description: t("无法删除通知，请稍后再试"),
        variant: "destructive",
      });
    },
  });

  const refetchAnalytics = () => {
    refetchOverview();
    queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics/countries"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics/browsers"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics/devices"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics/visits-by-date"] });
  };

  const resetAnalyticsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/admin/analytics");
      return await res.json() as { deletedVisits: number; deletedVisitorAlerts: number };
    },
    onSuccess: (result) => {
      refetchAnalytics();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications/unread-count"] });
      toast({
        title: language === "en" ? "Visit analytics cleared" : "访问统计已清除",
        description: language === "en"
          ? `Removed ${result.deletedVisits} visits and ${result.deletedVisitorAlerts} visitor alerts. New visits will continue recording.`
          : `已清除 ${result.deletedVisits} 条访问记录和 ${result.deletedVisitorAlerts} 条访客提醒。新访问将继续记录。`,
      });
    },
    onError: () => {
      toast({
        title: language === "en" ? "Reset failed" : "清除失败",
        description: language === "en" ? "Visit analytics could not be cleared." : "无法清除访问统计。",
        variant: "destructive",
      });
    },
  });

  const confirmAnalyticsReset = () => {
    const confirmation = language === "en"
      ? "This permanently deletes all visit analytics and new-visitor alerts. Accounts, course progress, payments, and other alerts are not affected. Continue?"
      : "此操作将永久删除所有访问统计和新访客提醒，不会影响账户、课程进度、付款或其他提醒。是否继续？";
    if (window.confirm(confirmation)) resetAnalyticsMutation.mutate();
  };

  const actionMutation = useMutation({
    mutationFn: async (data: { subscriptionId: string; action: 'approve' | 'reject' }) => {
      const res = await apiRequest("POST", "/api/admin/subscription/action", data);
      return await res.json();
    },
    onSuccess: (data: any, variables) => {
      toast({
        title: variables.action === 'approve' ? t("订阅已批准") : t("订阅已拒绝"),
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({
        title: t("操作失败"),
        description: error.message || t("请稍后重试"),
        variant: "destructive",
      });
    },
  });

  const handleApprove = (subscriptionId: string) => {
    actionMutation.mutate({ subscriptionId, action: 'approve' });
  };

  const handleReject = (subscriptionId: string) => {
    actionMutation.mutate({ subscriptionId, action: 'reject' });
  };

  const handleCopyTxId = async (txId: string) => {
    await navigator.clipboard.writeText(txId);
    toast({
      title: t("已复制"),
      description: t("交易ID已复制到剪贴板"),
    });
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString(language === "en" ? "en-US" : "zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatNotificationTime = (date: string) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffMs = now.getTime() - notificationDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return t("刚刚");
    if (diffMins < 60) return `${diffMins}${t("分钟前")}`;
    if (diffHours < 24) return `${diffHours}${t("小时前")}`;
    if (diffDays < 7) return `${diffDays}${t("天前")}`;
    return formatDate(date);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_user':
        return <UserPlus className="h-4 w-4 text-blue-500" />;
      case 'new_visitor':
        return <Eye className="h-4 w-4 text-teal-500" />;
      case 'new_subscription':
        return <CreditCard className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getNotificationTitle = (notification: AdminNotification) => {
    if (notification.type === "new_visitor") return t("新访客访问");
    if (notification.type === "new_user") return t("新用户注册");
    return notification.title;
  };

  const getNotificationMessage = (notification: AdminNotification) => {
    if (notification.type === "new_visitor") return t("有一位访客开始访问应用。");
    if (notification.type === "new_user") {
      const identity = [notification.metadata?.username, notification.metadata?.email]
        .filter((value) => typeof value === "string" && value.trim())
        .join(" · ");
      if (language === "en") return identity ? `${identity} just created an account.` : "A new account was created.";
      return identity ? `${identity} 刚刚注册了账户。` : "有新账户注册。";
    }
    return notification.message;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" data-testid="badge-status-active">{t("活跃")}</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600" data-testid="badge-status-pending">{t("待验证")}</Badge>;
      case 'rejected':
        return <Badge variant="destructive" data-testid="badge-status-rejected">{t("已拒绝")}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPlanBadge = (planType: string) => {
    if (planType === 'semiannual') {
      return <Badge variant="secondary">{language === "en" ? "Six months" : "六个月"}</Badge>;
    }
    return planType === 'quarterly' 
      ? <Badge variant="secondary">{t("季度")}</Badge>
      : <Badge variant="outline">{t("月订阅")}</Badge>;
  };

  const filteredUsers = allUsers.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredSubscriptions = allSubscriptions.filter(s =>
    s.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.user.email && s.user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.transactionId && s.transactionId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isAdminCheck?.isAdmin === false) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
        <Alert variant="destructive" data-testid="alert-no-access">
          <Shield className="h-4 w-4" />
          <AlertTitle>{t("无权访问")}</AlertTitle>
          <AlertDescription>
            {t("你没有管理员权限访问此页面。")}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold" data-testid="text-admin-title">{t("管理后台")}</h1>
              <p className="text-muted-foreground">{t("管理用户支付和订阅")}</p>
            </div>
          </div>
          
          <Popover open={notificationOpen} onOpenChange={(open) => {
            setNotificationOpen(open);
            if (open) {
              refetchNotifications();
              queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications/unread-count"] });
            }
          }}>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                data-testid="button-notifications"
              >
                <Bell className="h-6 w-6" />
                {(unreadCount?.count ?? 0) > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
                    data-testid="badge-unread-count"
                  >
                    {(unreadCount?.count ?? 0) > 99 ? '99+' : unreadCount?.count}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold">{t("通知")}</h3>
                <div className="flex items-center gap-2">
                  {notifications.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAllReadMutation.mutate()}
                      disabled={markAllReadMutation.isPending || (unreadCount?.count || 0) === 0}
                      data-testid="button-mark-all-read"
                    >
                      <CheckCheck className="h-4 w-4 mr-1" />
                      {t("全部已读")}
                    </Button>
                  )}
                </div>
              </div>
              <ScrollArea className="h-[300px]">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    {t("暂无通知")}
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        className={`p-3 hover-elevate cursor-pointer ${!notification.isRead ? 'bg-primary/5' : ''}`}
                        onClick={() => {
                          if (!notification.isRead) {
                            markReadMutation.mutate(notification.id);
                          }
                        }}
                        data-testid={`notification-item-${notification.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium truncate">{getNotificationTitle(notification)}</p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotificationMutation.mutate(notification.id);
                                }}
                                data-testid={`button-delete-notification-${notification.id}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">{getNotificationMessage(notification)}</p>
                            <p className="text-xs text-muted-foreground mt-1">{formatNotificationTime(notification.createdAt)}</p>
                          </div>
                          {!notification.isRead && (
                            <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card data-testid="card-pending-count">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("待验证支付")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <span className="text-3xl font-bold" data-testid="text-pending-count">{pendingSubscriptions.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-active-count">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("活跃订阅")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-3xl font-bold" data-testid="text-active-count">
                {allSubscriptions.filter(s => s.status === 'active').length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-users-count">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("总用户数")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-3xl font-bold" data-testid="text-users-count">{allUsers.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 lg:grid-cols-5">
          <TabsTrigger value="pending" data-testid="tab-pending">
            {t("待验证")} ({pendingSubscriptions.length})
          </TabsTrigger>
          <TabsTrigger value="subscriptions" data-testid="tab-subscriptions">
            {t("所有订阅")}
          </TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">
            {t("用户管理")}
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            {t("访问统计")}
          </TabsTrigger>
          {isAdminCheck?.isAdmin === true && (
            <TabsTrigger value="learner-stories" data-testid="tab-learner-stories">
              {language === "en" ? "Learner stories" : "学习者故事"}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {t("待验证支付")}
                  </CardTitle>
                  <CardDescription>{t("验证用户提交的交易ID并激活订阅")}</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => refetchPending()}
                  data-testid="button-refresh-pending"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t("刷新")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {pendingLoading ? (
                <p className="text-muted-foreground py-4">{t("加载中...")}</p>
              ) : pendingSubscriptions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t("暂无待验证的支付")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingSubscriptions.map((sub) => (
                    <Card key={sub.id} className="border-yellow-500/50" data-testid={`card-pending-${sub.id}`}>
                      <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold" data-testid={`text-username-${sub.id}`}>
                                {sub.user.username}
                              </span>
                              {getPlanBadge(sub.planType)}
                            </div>
                            <p className="text-sm text-muted-foreground" data-testid={`text-email-${sub.id}`}>
                              {sub.user.email || t("无邮箱")}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">{t("交易ID:")}</span>
                              <code className="text-xs bg-muted px-2 py-1 rounded max-w-[200px] truncate" data-testid={`text-txid-${sub.id}`}>
                                {sub.transactionId}
                              </code>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6"
                                onClick={() => handleCopyTxId(sub.transactionId || '')}
                                data-testid={`button-copy-txid-${sub.id}`}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {t("金额:")} <span className="font-medium">{sub.amount} {sub.currency}</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {t("提交时间:")} {formatDate(sub.createdAt)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => handleApprove(sub.id)}
                              disabled={actionMutation.isPending}
                              data-testid={`button-approve-${sub.id}`}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              {t("批准")}
                            </Button>
                            <Button 
                              variant="destructive"
                              onClick={() => handleReject(sub.id)}
                              disabled={actionMutation.isPending}
                              data-testid={`button-reject-${sub.id}`}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              {t("拒绝")}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle>{t("所有订阅记录")}</CardTitle>
                  <CardDescription>{t("查看所有用户的订阅历史")}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder={t("搜索用户或交易ID...")}
                      className="pl-8 w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      data-testid="input-search-subscriptions"
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => refetchSubscriptions()}
                    data-testid="button-refresh-subscriptions"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {subscriptionsLoading ? (
                <p className="text-muted-foreground py-4">{t("加载中...")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("用户")}</TableHead>
                        <TableHead>{t("邮箱")}</TableHead>
                        <TableHead>{t("计划")}</TableHead>
                        <TableHead>{t("金额")}</TableHead>
                        <TableHead>{t("状态")}</TableHead>
                        <TableHead>{t("交易ID")}</TableHead>
                        <TableHead>{t("到期时间")}</TableHead>
                        <TableHead>{t("审核记录")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubscriptions.map((sub) => (
                        <TableRow key={sub.id} data-testid={`row-subscription-${sub.id}`}>
                          <TableCell className="font-medium">{sub.user.username}</TableCell>
                          <TableCell>{sub.user.email || "-"}</TableCell>
                          <TableCell>{getPlanBadge(sub.planType)}</TableCell>
                          <TableCell>{sub.amount} {sub.currency}</TableCell>
                          <TableCell>{getStatusBadge(sub.status)}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded max-w-[120px] truncate block">
                              {sub.transactionId || "-"}
                            </code>
                          </TableCell>
                          <TableCell>{formatDate(sub.endDate)}</TableCell>
                          <TableCell className="min-w-[240px]" data-testid={`payment-review-${sub.id}`}>
                            {sub.review ? (
                              <div className="space-y-1 text-sm">
                                <div className="font-medium">
                                  {sub.review.outcome === "approved" ? t("已批准") : t("已拒绝")}
                                  {" · "}{sub.review.reviewerName}
                                </div>
                                <div className="text-muted-foreground">{t("审核时间")}: {formatDate(sub.review.reviewedAt)}</div>
                                <div>{t("记录的订阅开始时间")}: {formatDate(sub.review.startDate)}</div>
                                <div>{t("记录的订阅结束时间")}: {formatDate(sub.review.endDate)}</div>
                                <div>{t("审核后的访问截止时间")}: {sub.review.subscriptionEndsAt ? formatDate(sub.review.subscriptionEndsAt) : t("未设置截止时间")}</div>
                                {sub.review.outcome === "rejected" && <div className="text-muted-foreground">{t("拒绝未授予访问权限，订阅日期保持不变。")}</div>}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">
                                {sub.status === "pending" ? t("等待验证") : t("历史支付未记录审核详情")}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
          <RetainedPaymentReviews isAdmin={isAdminCheck?.isAdmin === true} />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle>{t("用户管理")}</CardTitle>
                  <CardDescription>{t("查看和管理所有用户")}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder={t("搜索用户名或邮箱...")}
                      className="pl-8 w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      data-testid="input-search-users"
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => refetchUsers()}
                    data-testid="button-refresh-users"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <p className="text-muted-foreground py-4">{t("加载中...")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("用户名")}</TableHead>
                        <TableHead>{t("邮箱")}</TableHead>
                        <TableHead>{t("会员状态")}</TableHead>
                        <TableHead>{t("练习次数")}</TableHead>
                        <TableHead>{t("到期时间")}</TableHead>
                        <TableHead>{t("注册时间")}</TableHead>
                        <TableHead>{language === "en" ? "Manage" : "管理"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((u) => {
                        const isExpired = u.subscriptionEndsAt && new Date(u.subscriptionEndsAt) < new Date();
                        return (
                          <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                            <TableCell className="font-medium">
                              {u.username}
                              {u.isAdmin && <Badge variant="secondary" className="ml-2">{t("管理员")}</Badge>}
                            </TableCell>
                            <TableCell>{u.email || "-"}</TableCell>
                            <TableCell>
                              {u.isPremium ? (
                                isExpired ? (
                                  <Badge variant="destructive">{t("已过期")}</Badge>
                                ) : (
                                  <Badge variant="default">{t("高级会员")}</Badge>
                                )
                              ) : (
                                <Badge variant="secondary">{t("免费用户")}</Badge>
                              )}
                            </TableCell>
                            <TableCell>{u.practiceCount}</TableCell>
                            <TableCell>
                              {u.subscriptionEndsAt ? (
                                <span className={isExpired ? "text-destructive" : ""}>
                                  {formatDate(u.subscriptionEndsAt)}
                                </span>
                              ) : "-"}
                            </TableCell>
                            <TableCell>{formatDate(u.createdAt)}</TableCell>
                             <TableCell>
                               <Button size="sm" variant="outline" onClick={() => setManagedUser(u)}>
                                 {language === "en" ? "Manage" : "管理"}
                               </Button>
                             </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
          {managedUser && <UserManagementDialog key={managedUser.id} user={managedUser} currentUserId={user?.id} onClose={() => setManagedUser(null)} />}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t("访问统计")}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={confirmAnalyticsReset}
                disabled={resetAnalyticsMutation.isPending}
                data-testid="button-clear-analytics"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {language === "en" ? "Clear visit analytics" : "清除访问统计"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={refetchAnalytics}
                data-testid="button-refresh-analytics"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {t("刷新")}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card data-testid="card-total-visits">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t("总访问次数")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  <span className="text-3xl font-bold" data-testid="text-total-visits">
                    {overviewLoading ? "..." : analyticsOverview?.totalVisits || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-unique-sessions">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t("独立会话数")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <span className="text-3xl font-bold" data-testid="text-unique-sessions">
                    {overviewLoading ? "..." : analyticsOverview?.uniqueSessions || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-today-visits">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t("今日访问")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-500" />
                  <span className="text-3xl font-bold" data-testid="text-today-visits">
                    {overviewLoading ? "..." : analyticsOverview?.todayVisits || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card data-testid="card-visits-chart">
              <CardHeader>
                <CardTitle className="text-base">{t("过去30天访问趋势")}</CardTitle>
              </CardHeader>
              <CardContent>
                {visitsLoading ? (
                  <p className="text-muted-foreground py-8 text-center">{t("加载中...")}</p>
                ) : visitsByDate.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center">{t("暂无数据")}</p>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={visitsByDate}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => {
                          const d = new Date(value);
                          return `${d.getMonth() + 1}/${d.getDate()}`;
                        }}
                        fontSize={12}
                      />
                      <YAxis fontSize={12} />
                      <Tooltip 
                        labelFormatter={(value) => `${t("日期:")} ${value}`}
                        formatter={(value: number) => [value, t("访问次数")]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#2563eb" 
                        strokeWidth={2}
                        dot={{ fill: '#2563eb', r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-countries-chart">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  {t("访问来源国家/地区")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {countriesLoading ? (
                  <p className="text-muted-foreground py-8 text-center">{t("加载中...")}</p>
                ) : topCountries.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center">{t("暂无数据")}</p>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={topCountries} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" fontSize={12} />
                      <YAxis 
                        type="category" 
                        dataKey="countryName" 
                        width={100}
                        fontSize={12}
                      />
                      <Tooltip formatter={(value: number) => [value, t("访问次数")]} />
                      <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-browsers-chart">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  {t("浏览器分布")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {browsersLoading ? (
                  <p className="text-muted-foreground py-8 text-center">{t("加载中...")}</p>
                ) : topBrowsers.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center">{t("暂无数据")}</p>
                ) : (
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="60%" height={200}>
                      <PieChart>
                        <Pie
                          data={topBrowsers}
                          dataKey="count"
                          nameKey="browserName"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          label={false}
                        >
                          {topBrowsers.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [value, t("访问次数")]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-2">
                      {topBrowsers.slice(0, 5).map((browser, index) => (
                        <div key={browser.browserName} className="flex items-center gap-2 text-sm">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                          />
                          <span className="truncate flex-1">{browser.browserName}</span>
                          <span className="text-muted-foreground">{browser.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-devices-chart">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  {t("设备类型分布")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {devicesLoading ? (
                  <p className="text-muted-foreground py-8 text-center">{t("加载中...")}</p>
                ) : topDevices.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center">{t("暂无数据")}</p>
                ) : (
                  <div className="space-y-4">
                    {topDevices.map((device, index) => {
                      const total = topDevices.reduce((acc, d) => acc + d.count, 0);
                      const percentage = total > 0 ? Math.round((device.count / total) * 100) : 0;
                      return (
                        <div key={device.deviceType} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="capitalize">{device.deviceType}</span>
                            <span className="text-muted-foreground">{device.count} ({percentage}%)</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all"
                              style={{ 
                                width: `${percentage}%`,
                                backgroundColor: CHART_COLORS[index % CHART_COLORS.length]
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {isAdminCheck?.isAdmin === true && (
          <TabsContent value="learner-stories" className="space-y-4">
            <LearnerStoriesAdmin />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
