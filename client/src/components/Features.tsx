import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Volume2, BarChart3 } from "lucide-react";
import aiChatImage from "@assets/generated_images/AI_chat_conversation_illustration_78dac1fe.png";
import audioImage from "@assets/generated_images/Audio_waveform_with_text_0eb0f4a7.png";
import progressImage from "@assets/generated_images/Progress_dashboard_illustration_8eda0ee7.png";
import { useLocale } from "@/lib/i18n";

export function Features() {
  const { t } = useLocale();
  const features = [
    {
      icon: MessageSquare,
      image: aiChatImage,
      title: t("AI会话练习"),
      titleSwahili: "Mazoezi ya Mazungumzo",
      description: t("与AI导师进行真实对话，即时获得反馈和纠正，提升口语能力"),
      color: "text-primary"
    },
    {
      icon: Volume2,
      image: audioImage,
      title: t("音频+文字学习"),
      titleSwahili: "Sauti na Maandishi",
      description: t("每节课都包含标准发音音频和文字对照，同时提升听力和阅读能力"),
      color: "text-chart-2"
    },
    {
      icon: BarChart3,
      image: progressImage,
      title: t("学习进度追踪"),
      titleSwahili: "Ufuatiliaji wa Maendeleo",
      description: t("详细的学习数据分析，帮助你了解自己的进步和需要改进的地方"),
      color: "text-chart-3"
    }
  ];

  return (
    <section className="py-12 md:py-16 lg:py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">{t("为什么选择我们")}</h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("结合AI技术和语言教学的最佳实践，打造高效的学习体验")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="hover-elevate overflow-visible" data-testid={`card-feature-${index}`}>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-center h-32 md:h-40 rounded-xl overflow-hidden bg-muted/50">
                  <img 
                    src={feature.image} 
                    alt={feature.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">{feature.titleSwahili}</p>
                  <p className="text-base text-foreground/80 leading-relaxed">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
