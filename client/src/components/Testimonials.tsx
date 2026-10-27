import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { useLocale } from "@/lib/i18n";

export function Testimonials() {
  const { language, t } = useLocale();
  const testimonials = [
    {
      name: language === "en" ? "Li Ming" : "李明",
      level: t("中级学员"),
      initials: "LM",
      quote: t("这个平台让我在短短3个月内就能用斯瓦希里语进行基本对话。AI导师非常耐心，而且随时可用。"),
      swahili: "Jambo! Habari yako?"
    },
    {
      name: language === "en" ? "Wang Fang" : "王芳",
      level: t("初级学员"),
      initials: "WF",
      quote: t("作为完全零基础的学习者，这个平台的分级系统让我循序渐进地学习。音频发音很标准，帮助很大。"),
      swahili: "Ninajifunza Kiswahili"
    },
    {
      name: language === "en" ? "Zhang Wei" : "张伟",
      level: t("高级学员"),
      initials: "ZW",
      quote: t("高级课程内容丰富，涵盖了商务和日常交流的各个方面。进度追踪功能让我能清楚看到自己的提升。"),
      swahili: "Naweza kuzungumza Kiswahili vizuri"
    },
    {
      name: language === "en" ? "Chen Jing" : "陈静",
      level: t("中级学员"),
      initials: "CJ",
      quote: t("价格合理，内容优质。特别喜欢可以随时随地用手机学习，非常方便。强烈推荐！"),
      swahili: "Ninapenda kusoma Kiswahili"
    }
  ];

  return (
    <section className="py-12 md:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">{t("学员评价")}</h2>
          <p className="text-lg md:text-xl text-muted-foreground">
            {t("来自真实学员的学习体验分享")}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 md:gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover-elevate" data-testid={`testimonial-${index}`}>
              <CardContent className="p-6 space-y-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
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
                  <p className="text-sm text-primary font-medium italic">"{testimonial.swahili}"</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
