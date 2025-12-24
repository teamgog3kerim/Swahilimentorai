import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Zap, Crown } from "lucide-react";
import { SiBinance } from "react-icons/si";

export function Pricing() {
  const features = [
    "无限次AI对话练习",
    "所有级别课程访问",
    "音频+文字教学材料",
    "个性化学习路径",
    "详细进度分析",
    "离线模式支持",
    "优先客户支持"
  ];

  const handleSubscribe = () => {
    window.location.href = "/api/login";
  };

  return (
    <section id="pricing" className="py-12 md:py-16 lg:py-20 bg-muted/30">
      <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">订阅计划</h2>
          <p className="text-lg md:text-xl text-muted-foreground">
            解锁无限学习机会
          </p>
          <p className="text-sm text-muted-foreground">
            7天免费试用 • 无需预付款 • 随时取消
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Monthly Plan */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between gap-2 mb-2">
                <Badge variant="secondary">推荐</Badge>
                <Badge variant="outline">7天免费试用</Badge>
              </div>
              <CardTitle className="text-xl md:text-2xl">月订阅</CardTitle>
              <div className="flex items-baseline gap-2 mt-4">
                <span className="text-4xl md:text-5xl font-bold">90</span>
                <span className="text-xl font-semibold text-muted-foreground">USDT</span>
                <span className="text-muted-foreground">/月</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">每30天续费一次</p>
            </CardHeader>
            <CardContent className="relative space-y-4">
              <div className="space-y-2">
                {features.slice(0, 4).map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
              <Button 
                size="lg" 
                className="w-full text-base font-semibold gap-2"
                data-testid="button-subscribe-monthly"
                onClick={handleSubscribe}
              >
                <SiBinance className="h-5 w-5" />
                使用Binance Pay订阅
              </Button>
            </CardContent>
          </Card>

          {/* Quarterly Plan */}
          <Card className="relative overflow-hidden border-primary/50">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-500/20 to-transparent rounded-bl-full" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between gap-2 mb-2">
                <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                  <Crown className="h-3 w-3 mr-1" />
                  省20 USDT
                </Badge>
                <Badge variant="outline">7天免费试用</Badge>
              </div>
              <CardTitle className="text-xl md:text-2xl">季度订阅</CardTitle>
              <div className="flex items-baseline gap-2 mt-4">
                <span className="text-4xl md:text-5xl font-bold">250</span>
                <span className="text-xl font-semibold text-muted-foreground">USDT</span>
                <span className="text-muted-foreground">/季</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">每90天续费一次 <span className="text-primary">(约83 USDT/月)</span></p>
            </CardHeader>
            <CardContent className="relative space-y-4">
              <div className="space-y-2">
                {features.slice(0, 4).map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
              <Button 
                size="lg" 
                className="w-full text-base font-semibold gap-2"
                data-testid="button-subscribe-quarterly"
                onClick={handleSubscribe}
              >
                <SiBinance className="h-5 w-5" />
                使用Binance Pay订阅
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8 space-y-2">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <SiBinance className="h-4 w-4" />
            <span>安全支付由Binance Pay提供 (Tron TRC20网络)</span>
          </div>
        </div>
      </div>
    </section>
  );
}
