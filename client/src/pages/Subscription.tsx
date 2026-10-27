import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Check, CreditCard, Sparkles, Lock, Zap, Copy, CheckCircle2, QrCode, AlertCircle, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Subscription, User } from "@shared/schema";
import binanceQrImage from "@assets/binance-usdt-qr.jpg";
import { BookOpen } from "lucide-react";
import { differenceInDays } from "date-fns";
import { useLocale } from "@/lib/i18n";

export default function SubscriptionPage() {
  const { user } = useAuth() as { user: User | null };
  const { language, t } = useLocale();
  const { toast } = useToast();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [copied, setCopied] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'quarterly'>('monthly');

  const WALLET_ADDRESS = "TCdeZjG39zU9SjtoLwfXmcedJhnXyNd8zB";
  const NETWORK = "Tron (TRC20)";
  const PLAN_CONFIGS = {
    monthly: { amount: '90 USDT', days: 30, label: t('月订阅') },
    quarterly: { amount: '250 USDT', days: 90, label: t('季度订阅') }
  };
  const AMOUNT = PLAN_CONFIGS[selectedPlan].amount;

  const { data: subscription } = useQuery<Subscription>({
    queryKey: ["/api/subscription"],
  });

  const paymentMutation = useMutation({
    mutationFn: async (data: { transactionId: string; planType: 'monthly' | 'quarterly' }) => {
      const res = await apiRequest("POST", "/api/subscription/verify-payment", data);
      return await res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: t("支付已提交"),
        description: data.message || t("我们正在验证你的支付。通常在1-2小时内完成验证。"),
      });
      setShowPaymentDialog(false);
      setTransactionId("");
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      const message = error.message?.includes("already have an active subscription")
        ? t("你已经有一个活跃的订阅")
        : error.message?.includes("renew starting 4 days before")
        ? t("你的订阅还未到续费期。请在到期前4天内续费。")
        : error.message?.includes("already been submitted")
        ? t("此交易ID已提交过")
        : t("请检查交易ID是否正确，或稍后重试。");
      
      toast({
        title: t("提交失败"),
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleCopyAddress = async () => {
    await navigator.clipboard.writeText(WALLET_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: t("已复制"),
      description: t("钱包地址已复制到剪贴板"),
    });
  };

  const handleOpenPayment = (plan: 'monthly' | 'quarterly') => {
    setSelectedPlan(plan);
    setShowPaymentDialog(true);
  };

  const handleSubmitPayment = () => {
    if (!transactionId.trim()) {
      toast({
        title: t("请输入交易ID"),
        description: t("交易ID不能为空"),
        variant: "destructive",
      });
      return;
    }
    paymentMutation.mutate({ transactionId: transactionId.trim(), planType: selectedPlan });
  };

  const premiumFeatures = [
    { icon: Zap, title: t("无限AI练习"), description: t("随时随地与AI老师对话练习") },
    { icon: BookOpen, title: t("全部课程访问"), description: t("解锁所有级别的课程内容") },
    { icon: Lock, title: t("离线模式"), description: t("下载课程离线学习") },
    { icon: Sparkles, title: t("优先支持"), description: t("获得优先客户支持服务") },
  ];

  const isPremium = user?.isPremium || false;
  const subscriptionEndsAt = user?.subscriptionEndsAt ? new Date(user.subscriptionEndsAt) : null;
  const subscriptionEndDate = subscriptionEndsAt
    ? subscriptionEndsAt.toLocaleDateString(language === "en" ? "en-US" : "zh-CN")
    : null;
  
  // Calculate remaining days
  const now = new Date();
  const isExpired = subscriptionEndsAt !== null && subscriptionEndsAt <= now;
  const hoursRemaining = subscriptionEndsAt ? Math.max(0, Math.ceil((subscriptionEndsAt.getTime() - now.getTime()) / 3_600_000)) : 0;
  const isTrial = !subscription && subscriptionEndsAt !== null;
  const daysRemaining = subscriptionEndsAt 
    ? differenceInDays(subscriptionEndsAt, now)
    : null;
  
  const isExpiringSoon = !isExpired && daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 4;
  const needsRenewal = isExpired || isExpiringSoon;
  
  // Show subscribe buttons if: no paid subscription OR only on free trial
  // Free trial users have isPremium=true but no subscription record
  const hasActivePaidSubscription = subscription && subscription.status === 'active' && new Date(subscription.endDate) > now;
  const showSubscribeButtons = !hasActivePaidSubscription;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-2">{t("订阅")}</h1>
        <p className="text-muted-foreground text-lg">{t("升级到高级会员解锁全部功能")}</p>
      </div>

      <div className="space-y-6">
        {/* Expiration Warning Alert */}
        {isExpired && (
          <Alert variant="destructive" data-testid="alert-expired">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{isTrial ? (language === "en" ? "Free trial ended" : "免费试用已结束") : t("订阅已过期")}</AlertTitle>
            <AlertDescription>
              {language === "en"
                ? <>Your learning access ended on {subscriptionEndDate}. Choose a paid plan to continue courses and practice. No automatic charge was made.</>
                : <>你的学习权限已于 {subscriptionEndDate} 到期。选择付费方案即可继续课程和练习。不会自动扣费。</>}
            </AlertDescription>
          </Alert>
        )}

        {isExpiringSoon && !isExpired && (
          <Alert data-testid="alert-expiring-soon">
            <Clock className="h-4 w-4" />
            <AlertTitle>{isTrial ? t("88小时免费试用") : t("订阅即将到期")}</AlertTitle>
            <AlertDescription>
              {language === "en"
                ? <>Your learning access expires in {hoursRemaining} hours. Subscribe to keep learning afterward. No automatic charges.</>
                : <>你的学习权限将在 {hoursRemaining} 小时后到期。到期后需订阅以继续学习。不会自动扣费。</>}
            </AlertDescription>
          </Alert>
        )}

        {isPremium && subscriptionEndsAt && (
          <Card className={isExpired ? "border-destructive" : isExpiringSoon ? "border-yellow-500" : "border-primary"} data-testid="card-current-subscription">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    {isTrial ? t("88小时免费试用") : t("当前订阅")}
                  </CardTitle>
                  <CardDescription className="mt-1">
                  {isExpired ? t("已过期") : (language === "en" ? `${hoursRemaining} hours remaining` : `还剩 ${hoursRemaining} 小时`)}
                  </CardDescription>
                </div>
                <Badge variant={isExpired ? "destructive" : isExpiringSoon ? "outline" : "default"}>
                  {isExpired ? t("已过期") : isExpiringSoon ? t("即将到期") : t("活跃")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("订阅状态")}</span>
                  <span className="font-medium">{isExpired ? t("已过期") : t("活跃")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("到期日期")}</span>
                  <span className="font-medium">{subscriptionEndDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{language === "en" ? "Hours remaining" : "剩余小时"}</span>
                  <span className={`font-medium ${isExpired ? "text-destructive" : isExpiringSoon ? "text-yellow-600 dark:text-yellow-500" : ""}`}>
                    {isExpired ? t("已过期") : hoursRemaining}
                  </span>
                </div>
                {subscription && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("支付方式")}</span>
                    <span className="font-medium">{subscription.paymentMethod}</span>
                  </div>
                )}
              </div>
              {needsRenewal && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-2">
                    <Button
                      onClick={() => handleOpenPayment('monthly')}
                      className="w-full"
                      variant={isExpired ? "default" : "outline"}
                      data-testid="button-renew-monthly"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      {t("续费 - 月订阅 (90 USDT/月)")}
                    </Button>
                    <Button
                      onClick={() => handleOpenPayment('quarterly')}
                      className="w-full"
                      variant="outline"
                      data-testid="button-renew-quarterly"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      {t("续费 - 季度订阅 (250 USDT/3月)")}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Monthly Plan */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full" />
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary">{t("推荐")}</Badge>
                {showSubscribeButtons && <Badge variant="outline">{t("付费后继续学习")}</Badge>}
              </div>
              <CardTitle className="text-2xl">{t("月订阅")}</CardTitle>
              <div className="flex items-baseline gap-2 mt-4">
                <span className="text-5xl font-bold">90</span>
                <span className="text-2xl font-semibold text-muted-foreground">USDT</span>
                <span className="text-muted-foreground">{t("/月")}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{t("每30天续费一次")}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <Separator />
              <div>
                <h3 className="font-semibold mb-4">{t("包含功能：")}</h3>
                <div className="space-y-3">
                  {premiumFeatures.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
                        <feature.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{feature.title}</p>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {showSubscribeButtons && (
                <>
                  <Separator />
                  <Button
                    onClick={() => handleOpenPayment('monthly')}
                    className="w-full"
                    size="lg"
                    data-testid="button-subscribe-monthly"
                  >
                    <CreditCard className="w-5 h-5 mr-2" />
                    {t("选择月订阅")}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    {t("安全的加密货币支付")}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quarterly Plan */}
          <Card className="relative overflow-hidden border-primary/50">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/20 to-transparent rounded-bl-full" />
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge className="bg-green-600 hover:bg-green-700">{t("超值优惠")}</Badge>
                {showSubscribeButtons && <Badge variant="outline">{t("付费后继续学习")}</Badge>}
              </div>
              <CardTitle className="text-2xl">{t("季度订阅")}</CardTitle>
              <div className="flex items-baseline gap-2 mt-4">
                <span className="text-5xl font-bold">250</span>
                <span className="text-2xl font-semibold text-muted-foreground">USDT</span>
                <span className="text-muted-foreground">{t("/3月")}</span>
              </div>
              <p className="text-sm text-green-600 dark:text-green-500 font-medium mt-2">
                {t("节省 20 USDT (相当于 83 USDT/月)")}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <Separator />
              <div>
                <h3 className="font-semibold mb-4">{t("包含功能：")}</h3>
                <div className="space-y-3">
                  {premiumFeatures.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
                        <feature.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{feature.title}</p>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {showSubscribeButtons && (
                <>
                  <Separator />
                  <Button
                    onClick={() => handleOpenPayment('quarterly')}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                    data-testid="button-subscribe-quarterly"
                  >
                    <CreditCard className="w-5 h-5 mr-2" />
                    {t("选择季度订阅")}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    {t("每3个月续费，更实惠")}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("免费版 vs 高级版")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-muted-foreground">{t("免费版")}</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-muted-foreground" />
                      <span>{t("10次AI练习")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-muted-foreground" />
                      <span>{t("初级课程访问")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-muted-foreground" />
                      <span>{t("基础进度跟踪")}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-primary">{t("高级版")}</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary" />
                      <span className="font-medium">{t("无限AI练习")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary" />
                      <span className="font-medium">{t("全部课程访问")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary" />
                      <span className="font-medium">{t("离线模式")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary" />
                      <span className="font-medium">{t("优先支持")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md" data-testid="dialog-payment">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              {t("支付订阅费用")}
            </DialogTitle>
            <DialogDescription>
              {t("使用Binance扫描二维码或复制钱包地址发送USDT")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg">
                <img 
                  src={binanceQrImage} 
                  alt="Binance USDT QR Code" 
                  className="w-64 h-64 object-contain"
                  data-testid="img-qr-code"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-md space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("网络")}</span>
                  <span className="font-medium">{NETWORK}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("金额")}</span>
                  <span className="font-medium text-primary">{AMOUNT}</span>
                </div>
              </div>

              <div>
                <Label htmlFor="wallet-address" className="text-sm text-muted-foreground">{t("钱包地址")}</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="wallet-address"
                    value={WALLET_ADDRESS}
                    readOnly
                    className="font-mono text-sm"
                    data-testid="input-wallet-address"
                  />
                  <Button
                    onClick={handleCopyAddress}
                    size="icon"
                    variant="outline"
                    data-testid="button-copy-address"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="transaction-id">{t("支付后请输入交易ID")}</Label>
                <Input
                  id="transaction-id"
                  placeholder={t("例如: 0x1234abcd...")}
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  data-testid="input-transaction-id"
                />
                <p className="text-xs text-muted-foreground">
                  {t("完成支付后，在Binance钱包中查找交易ID并粘贴到这里")}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSubmitPayment}
                  disabled={!transactionId.trim() || paymentMutation.isPending}
                  className="flex-1"
                  data-testid="button-submit-payment"
                >
                  {paymentMutation.isPending ? t("提交中...") : t("提交支付")}
                </Button>
                <Button
                  onClick={() => setShowPaymentDialog(false)}
                  variant="outline"
                  data-testid="button-cancel-payment"
                >
                  {t("取消")}
                </Button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md border border-blue-200 dark:border-blue-900">
                <p className="text-xs text-blue-900 dark:text-blue-100">
              ⓘ {t("提交后我们会在1-2小时内验证你的支付并激活高级会员")}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
