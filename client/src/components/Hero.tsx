import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import heroImage from "@assets/generated_images/Chinese_learners_using_Swahili_app_148614f4.png";
import { ShareButton } from "@/components/ShareButton";
import { Link } from "wouter";

export function Hero() {
  const features = [
    "AI导师24/7随时练习",
    "初级、中级、高级课程",
    "音频+文字双重教学",
    "个性化学习进度追踪"
  ];

  return (
    <section className="relative min-h-screen flex items-center pt-16 md:pt-20">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16 lg:py-20 relative">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="space-y-6 md:space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                用AI学习
                <span className="text-primary block mt-2">斯瓦希里语</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                Jifunze Kiswahili na AI
              </p>
              <p className="text-base md:text-lg text-foreground/80">
                专为中文母语者设计的AI语言学习平台，让你轻松掌握斯瓦希里语的听说读写
              </p>
            </div>

            <div className="space-y-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-base">{feature}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="text-base font-semibold" 
                data-testid="button-start-free"
                asChild
              >
                <Link href="/signup">免费注册开始学习</Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-base font-semibold" 
                data-testid="button-view-pricing"
                onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
              >
                查看定价
              </Button>
              <ShareButton variant="ghost" size="lg" className="text-base font-semibold" />
            </div>

            <p className="text-sm text-muted-foreground">
              支持邮箱或Google账号注册 • 7天免费试用 • 无需信用卡
            </p>
          </div>

          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src={heroImage} 
                alt="Chinese learners using Swahili learning app" 
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
