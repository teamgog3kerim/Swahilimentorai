import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Check, CreditCard, Sparkles, Lock, Zap, Copy, CheckCircle2, QrCode } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Subscription, User } from "@shared/schema";
import binanceQrImage from "@assets/binance-usdt-qr.jpg";
import { BookOpen } from "lucide-react";

export default function SubscriptionPage() {
  const { user } = useAuth() as { user: User | null };
  const { toast } = useToast();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [copied, setCopied] = useState(false);

  const WALLET_ADDRESS = "TCdeZjG39zU9SjtoLwfXmcedJhnXyNd8zB";
  const NETWORK = "Tron (TRC20)";
  const AMOUNT = "90 USDT";

  const { data: subscription } = useQuery<Subscription>({
    queryKey: ["/api/subscription"],
  });

  const paymentMutation = useMutation({
    mutationFn: async (data: { transactionId: string }) => {
      const res = await apiRequest("POST", "/api/subscription/verify-payment", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "支付已提交",
        description: "我们正在验证你的支付。通常在1-2小时内完成验证。",
      });
      setShowPaymentDialog(false);
      setTransactionId("");
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
    },
    onError: () => {
      toast({
        title: "提交失败",
        description: "请检查交易ID是否正确，或稍后重试。",
        variant: "destructive",
      });
    },
  });

  const handleCopyAddress = async () => {
    await navigator.clipboard.writeText(WALLET_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "已复制",
      description: "钱包地址已复制到剪贴板",
    });
  };

  const handleOpenPayment = () => {
    setShowPaymentDialog(true);
  };

  const handleSubmitPayment = () => {
    if (!transactionId.trim()) {
      toast({
        title: "请输入交易ID",
        description: "交易ID不能为空",
        variant: "destructive",
      });
      return;
    }
    paymentMutation.mutate({ transactionId: transactionId.trim() });
  };

  const premiumFeatures = [
    { icon: Zap, title: "无限AI练习", description: "随时随地与AI老师对话练习" },
    { icon: BookOpen, title: "全部课程访问", description: "解锁所有级别的课程内容" },
    { icon: Lock, title: "离线模式", description: "下载课程离线学习" },
    { icon: Sparkles, title: "优先支持", description: "获得优先客户支持服务" },
  ];

  const isPremium = user?.isPremium || false;
  const subscriptionEndDate = subscription?.endDate
    ? new Date(subscription.endDate).toLocaleDateString("zh-CN")
    : null;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-2">订阅</h1>
        <p className="text-muted-foreground text-lg">升级到高级会员解锁全部功能</p>
      </div>

      <div className="space-y-6">
        {isPremium && subscription && (
          <Card className="border-primary" data-testid="card-current-subscription">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    当前订阅
                  </CardTitle>
                  <CardDescription className="mt-1">你是高级会员</CardDescription>
                </div>
                <Badge variant="default">活跃</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">订阅状态</span>
                  <span className="font-medium">{subscription.status === "active" ? "活跃" : "已过期"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">到期日期</span>
                  <span className="font-medium">{subscriptionEndDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">支付方式</span>
                  <span className="font-medium">{subscription.paymentMethod}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full" />
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <Badge variant="secondary">推荐</Badge>
              {!isPremium && <Badge variant="outline">7天免费试用</Badge>}
            </div>
            <CardTitle className="text-3xl">高级会员</CardTitle>
            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-5xl font-bold">90</span>
              <span className="text-2xl font-semibold text-muted-foreground">USDT</span>
              <span className="text-muted-foreground">/月</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Separator />
            <div>
              <h3 className="font-semibold mb-4">包含功能：</h3>
              <div className="space-y-3">
                {premiumFeatures.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3" data-testid={`feature-${idx}`}>
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

            {!isPremium && (
              <>
                <Separator />
                <Button
                  onClick={handleOpenPayment}
                  className="w-full"
                  size="lg"
                  data-testid="button-subscribe"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  使用 Binance Pay 订阅
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  安全的加密货币支付 · 随时取消订阅
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>免费版 vs 高级版</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-muted-foreground">免费版</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-muted-foreground" />
                      <span>10次AI练习</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-muted-foreground" />
                      <span>初级课程访问</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-muted-foreground" />
                      <span>基础进度跟踪</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-primary">高级版</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary" />
                      <span className="font-medium">无限AI练习</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary" />
                      <span className="font-medium">全部课程访问</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary" />
                      <span className="font-medium">离线模式</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary" />
                      <span className="font-medium">优先支持</span>
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
              支付订阅费用
            </DialogTitle>
            <DialogDescription>
              使用Binance扫描二维码或复制钱包地址发送USDT
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
                  <span className="text-sm text-muted-foreground">网络</span>
                  <span className="font-medium">{NETWORK}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">金额</span>
                  <span className="font-medium text-primary">{AMOUNT}</span>
                </div>
              </div>

              <div>
                <Label htmlFor="wallet-address" className="text-sm text-muted-foreground">钱包地址</Label>
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
                <Label htmlFor="transaction-id">支付后请输入交易ID</Label>
                <Input
                  id="transaction-id"
                  placeholder="例如: 0x1234abcd..."
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  data-testid="input-transaction-id"
                />
                <p className="text-xs text-muted-foreground">
                  完成支付后，在Binance钱包中查找交易ID并粘贴到这里
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSubmitPayment}
                  disabled={!transactionId.trim() || paymentMutation.isPending}
                  className="flex-1"
                  data-testid="button-submit-payment"
                >
                  {paymentMutation.isPending ? "提交中..." : "提交支付"}
                </Button>
                <Button
                  onClick={() => setShowPaymentDialog(false)}
                  variant="outline"
                  data-testid="button-cancel-payment"
                >
                  取消
                </Button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md border border-blue-200 dark:border-blue-900">
                <p className="text-xs text-blue-900 dark:text-blue-100">
                  ⓘ 提交后我们会在1-2小时内验证你的支付并激活高级会员
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
