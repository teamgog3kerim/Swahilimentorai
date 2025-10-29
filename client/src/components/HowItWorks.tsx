import { UserPlus, Target, MessageCircle, TrendingUp } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      number: "1",
      icon: UserPlus,
      title: "注册账号",
      titleSwahili: "Jisajili",
      description: "只需几秒钟即可创建免费账号，开始你的学习之旅"
    },
    {
      number: "2",
      icon: Target,
      title: "选择级别",
      titleSwahili: "Chagua Kiwango",
      description: "根据你的当前水平选择初级、中级或高级课程"
    },
    {
      number: "3",
      icon: MessageCircle,
      title: "与AI练习",
      titleSwahili: "Fanya Mazoezi",
      description: "通过对话练习提升语言能力，AI导师即时给予反馈"
    },
    {
      number: "4",
      icon: TrendingUp,
      title: "追踪进度",
      titleSwahili: "Fuatilia Maendeleo",
      description: "查看详细的学习数据，见证自己的成长和进步"
    }
  ];

  return (
    <section className="py-12 md:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">如何开始学习</h2>
          <p className="text-lg md:text-xl text-muted-foreground">
            四步开启你的斯瓦希里语学习之旅
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative" data-testid={`step-${index}`}>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {step.number}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground font-medium">{step.titleSwahili}</p>
                  <p className="text-base text-foreground/80">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-border -translate-x-1/2" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
