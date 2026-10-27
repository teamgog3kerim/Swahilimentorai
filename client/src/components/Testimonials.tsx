import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n";

export function Testimonials() {
  const { language, t } = useLocale();
  const testimonials = [
    {
      name: language === "en" ? "Li Ming" : "李明",
      level: t("中级学员"),
      initials: "LM",
      track: "swahili",
      quote: t("我把斯瓦希里语问候语和日常会话结合练习，再通过随堂自测检查自己掌握了多少。"),
      phrase: "Jambo! Habari yako?"
    },
    {
      name: language === "en" ? "Wang Fang" : "王芳",
      level: t("初级学员"),
      initials: "WF",
      track: "amharic",
      quote: t("阿姆哈拉语课程从菲德尔字母开始，配合词汇卡片，让我能按自己的节奏练习阅读和问候语。"),
      phrase: "ሰላም! አመሰግናለሁ።"
    },
    {
      name: language === "en" ? "Zhang Wei" : "张伟",
      level: t("高级学员"),
      initials: "ZW",
      track: "swahili",
      quote: t("斯瓦希里语课程让我能按等级选择学习内容，回看之前的课程，并追踪自己的学习进度。"),
      phrase: "Naweza kuzungumza Kiswahili vizuri"
    },
    {
      name: language === "en" ? "Chen Jing" : "陈静",
      level: t("中级学员"),
      initials: "CJ",
      track: "amharic",
      quote: t("我喜欢在手机上练习阿姆哈拉语数字和日常对话。可以来回复习课程，并单独保存学习进度。"),
      phrase: "አንድ፣ ሁለት፣ ሦስት"
    }
  ];

  return (
    <section id="learner-stories" className="scroll-mt-24 py-12 md:py-16 lg:py-20" data-testid="learner-stories">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">{t("学习者故事")}</h2>
          <p className="text-lg md:text-xl text-muted-foreground">
            {t("阿姆哈拉语与斯瓦希里语的示例学习故事。")}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 md:gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover-elevate" data-testid={`testimonial-${index}`} data-learning-language={testimonial.track}>
              <CardContent className="p-6 space-y-4">
                <Badge variant="secondary">
                  {testimonial.track === "amharic" ? t("阿姆哈拉语") : t("斯瓦希里语")}
                </Badge>
                <p className="text-base leading-relaxed text-foreground/90">"{testimonial.quote}"</p>
                <div className="pt-2 border-t space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {testimonial.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.level}</p>
                    </div>
                  </div>
                  <p className="text-sm text-primary font-medium italic" lang={testimonial.track === "amharic" ? "am" : "sw"}>"{testimonial.phrase}"</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
