import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Zap } from "lucide-react";
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

  return (
    <section id="pricing" className="py-12 md:py-16 lg:py-20 bg-muted/30">
      <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">订阅计划</h2>
          <p className="text-lg md:text-xl text-muted-foreground">
            解锁无限学习机会
          </p>
        </div>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-gradient-to-l from-primary/10 to-transparent w-1/2 h-full" />
          <CardHeader className="relative">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <CardTitle className="text-2xl md:text-3xl">高级会员</CardTitle>
                <p className="text-sm text-muted-foreground">Premium Membership</p>
              </div>
              <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
                <Zap className="h-5 w-5" />
                <span className="font-semibold">最受欢迎</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative space-y-6 md:space-y-8">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl md:text-5xl font-bold">90 USDT</span>
              <span className="text-lg text-muted-foreground">/月</span>
            </div>

            <div className="space-y-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-base">{feature}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-4">
              <Button 
                size="lg" 
                className="w-full text-base font-semibold gap-2"
                data-testid="button-subscribe"
                onClick={() => window.location.href = "/api/login"}
              >
                <SiBinance className="h-5 w-5" />
                开始免费试用
              </Button>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <SiBinance className="h-4 w-4" />
                <span>安全支付由Binance Pay提供</span>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                7天免费试用 • 随时取消 • 自动续订
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
