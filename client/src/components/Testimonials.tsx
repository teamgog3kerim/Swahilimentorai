import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import type { PublicLearnerStory } from "@shared/learnerStories";

export function Testimonials() {
  const { language, t } = useLocale();
  const storiesQuery = useQuery<PublicLearnerStory[]>({
    queryKey: ["/api/learner-stories"],
    queryFn: async () => (await apiRequest("GET", "/api/learner-stories")).json(),
    staleTime: 30_000,
    refetchOnMount: "always",
    gcTime: 0,
  });
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

  const hasPublishedStories = (storiesQuery.data?.length ?? 0) > 0;

  return (
    <section id="learner-stories" className="scroll-mt-24 py-12 md:py-16 lg:py-20" data-testid="learner-stories">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">{t("学习者故事")}</h2>
          <p className="text-lg md:text-xl text-muted-foreground">
            {hasPublishedStories
              ? (language === "en" ? "Shared with permission by learners studying Amharic and Swahili." : "经学员授权分享的阿姆哈拉语与斯瓦希里语学习故事。")
              : t("阿姆哈拉语与斯瓦希里语的示例学习故事。")}
          </p>
        </div>

        {storiesQuery.isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2" aria-label={language === "en" ? "Loading learner stories" : "正在加载学习者故事"}>
            {[0, 1, 2, 3].map((item) => <div key={item} className="h-52 animate-pulse rounded-lg bg-muted" />)}
          </div>
        ) : storiesQuery.isError ? (
          <div role="status" className="rounded-lg border border-destructive/30 bg-destructive/5 px-5 py-4 text-center text-sm text-muted-foreground">
            {language === "en" ? "Learner stories could not be loaded. Please try again later." : "暂时无法加载学习者故事，请稍后重试。"}
          </div>
        ) : hasPublishedStories ? (
          <div className="grid gap-6 sm:grid-cols-2 md:gap-8">
            {storiesQuery.data!.map((story) => {
              const name = language === "en" ? story.displayNameEn : story.displayNameZh;
              const quote = language === "en" ? story.quoteEn : story.quoteZh;
              const context = language === "en" ? story.contextEn : story.contextZh;
              const learningLanguage = story.learningLanguage;
              return (
                <Card key={story.id} className="hover-elevate" data-testid={`testimonial-${story.id}`} data-learning-language={learningLanguage}>
                  <CardContent className="space-y-4 p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{learningLanguage === "amharic" ? t("阿姆哈拉语") : t("斯瓦希里语")}</Badge>
                      <Badge variant="outline" className="border-emerald-700/30 text-emerald-800">{language === "en" ? "Verified · shared with permission" : "已核实 · 经授权分享"}</Badge>
                    </div>
                    <p className="text-base leading-relaxed text-foreground/90">“{quote}”</p>
                    <div className="space-y-3 border-t pt-4">
                      {context && <p className="text-sm text-muted-foreground">{context}</p>}
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12"><AvatarFallback className="bg-primary/10 font-semibold text-primary">{name.trim().slice(0, 2)}</AvatarFallback></Avatar>
                        <div><p className="font-semibold">{name}</p><p className="text-sm text-muted-foreground">{language === "en" ? "Learner story" : "学习者故事"}</p></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
        <div className="grid sm:grid-cols-2 gap-6 md:gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover-elevate" data-testid={`testimonial-${index}`} data-learning-language={testimonial.track}>
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{testimonial.track === "amharic" ? t("阿姆哈拉语") : t("斯瓦希里语")}</Badge>
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
                  <p className="text-sm text-primary font-medium italic" lang={testimonial.track === "amharic" ? "am" : "sw"}>"{testimonial.phrase}"</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        )}
      </div>
    </section>
  );
}
