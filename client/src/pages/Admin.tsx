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
  Copy
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, Subscription } from "@shared/schema";

type SubscriptionWithUser = Subscription & { user: User };

export default function AdminPage() {
  const { user } = useAuth() as { user: User | null };
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: isAdminCheck } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
    retry: false,
  });

  const { data: pendingSubscriptions = [], isLoading: pendingLoading, refetch: refetchPending } = useQuery<SubscriptionWithUser[]>({
    queryKey: ["/api/admin/pending"],
    enabled: isAdminCheck?.isAdmin === true,
  });

  const { data: allSubscriptions = [], isLoading: subscriptionsLoading, refetch: refetchSubscriptions } = useQuery<SubscriptionWithUser[]>({
    queryKey: ["/api/admin/subscriptions"],
    enabled: isAdminCheck?.isAdmin === true,
  });

  const { data: allUsers = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAdminCheck?.isAdmin === true,
  });

  const actionMutation = useMutation({
    mutationFn: async (data: { subscriptionId: string; action: 'approve' | 'reject' }) => {
      const res = await apiRequest("POST", "/api/admin/subscription/action", data);
      return await res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: data.action === 'approve' ? "订阅已批准" : "订阅已拒绝",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "操作失败",
        description: error.message || "请稍后重试",
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
      title: "已复制",
      description: "交易ID已复制到剪贴板",
    });
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" data-testid="badge-status-active">活跃</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600" data-testid="badge-status-pending">待验证</Badge>;
      case 'rejected':
        return <Badge variant="destructive" data-testid="badge-status-rejected">已拒绝</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPlanBadge = (planType: string) => {
    return planType === 'quarterly' 
      ? <Badge variant="secondary">季度</Badge>
      : <Badge variant="outline">月订阅</Badge>;
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
          <AlertTitle>无权访问</AlertTitle>
          <AlertDescription>
            你没有管理员权限访问此页面。
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold" data-testid="text-admin-title">管理后台</h1>
            <p className="text-muted-foreground">管理用户支付和订阅</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card data-testid="card-pending-count">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">待验证支付</CardTitle>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">活跃订阅</CardTitle>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">总用户数</CardTitle>
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" data-testid="tab-pending">
            待验证 ({pendingSubscriptions.length})
          </TabsTrigger>
          <TabsTrigger value="subscriptions" data-testid="tab-subscriptions">
            所有订阅
          </TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">
            用户管理
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    待验证支付
                  </CardTitle>
                  <CardDescription>验证用户提交的交易ID并激活订阅</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => refetchPending()}
                  data-testid="button-refresh-pending"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  刷新
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {pendingLoading ? (
                <p className="text-muted-foreground py-4">加载中...</p>
              ) : pendingSubscriptions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>暂无待验证的支付</p>
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
                              {sub.user.email || "无邮箱"}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">交易ID:</span>
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
                              金额: <span className="font-medium">{sub.amount} {sub.currency}</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              提交时间: {formatDate(sub.createdAt)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => handleApprove(sub.id)}
                              disabled={actionMutation.isPending}
                              data-testid={`button-approve-${sub.id}`}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              批准
                            </Button>
                            <Button 
                              variant="destructive"
                              onClick={() => handleReject(sub.id)}
                              disabled={actionMutation.isPending}
                              data-testid={`button-reject-${sub.id}`}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              拒绝
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
                  <CardTitle>所有订阅记录</CardTitle>
                  <CardDescription>查看所有用户的订阅历史</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="搜索用户或交易ID..." 
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
                <p className="text-muted-foreground py-4">加载中...</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>用户</TableHead>
                        <TableHead>邮箱</TableHead>
                        <TableHead>计划</TableHead>
                        <TableHead>金额</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>交易ID</TableHead>
                        <TableHead>到期时间</TableHead>
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle>用户管理</CardTitle>
                  <CardDescription>查看和管理所有用户</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="搜索用户名或邮箱..." 
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
                <p className="text-muted-foreground py-4">加载中...</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>用户名</TableHead>
                        <TableHead>邮箱</TableHead>
                        <TableHead>会员状态</TableHead>
                        <TableHead>练习次数</TableHead>
                        <TableHead>到期时间</TableHead>
                        <TableHead>注册时间</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((u) => {
                        const isExpired = u.subscriptionEndsAt && new Date(u.subscriptionEndsAt) < new Date();
                        return (
                          <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                            <TableCell className="font-medium">
                              {u.username}
                              {u.isAdmin && <Badge variant="secondary" className="ml-2">管理员</Badge>}
                            </TableCell>
                            <TableCell>{u.email || "-"}</TableCell>
                            <TableCell>
                              {u.isPremium ? (
                                isExpired ? (
                                  <Badge variant="destructive">已过期</Badge>
                                ) : (
                                  <Badge variant="default">高级会员</Badge>
                                )
                              ) : (
                                <Badge variant="secondary">免费用户</Badge>
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
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
