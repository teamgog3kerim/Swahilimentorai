import { BookOpen, CheckCircle2, CreditCard, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n";

interface CourseAccessGateProps {
  onUpgrade: () => void;
}

export function CourseAccessGate({ onUpgrade }: CourseAccessGateProps) {
  const { language } = useLocale();
  const english = language === "en";

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl items-center justify-center p-5 sm:p-8">
      <Card className="w-full overflow-hidden border-primary/20 bg-card shadow-sm">
        <div className="grid sm:grid-cols-[1fr_1.15fr]">
          <div className="relative flex min-h-52 flex-col justify-between overflow-hidden bg-primary p-7 text-primary-foreground sm:min-h-80 sm:p-9">
            <div aria-hidden="true" className="absolute -right-10 -top-10 h-48 w-48 rounded-full border border-primary-foreground/20" />
            <div aria-hidden="true" className="absolute -bottom-20 -left-14 h-56 w-56 rounded-full border border-primary-foreground/15" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-foreground/15">
              <LockKeyhole className="h-6 w-6" />
            </div>
            <div className="relative mt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">
                {english ? "ETHIO PANDA · LEARNING ACCESS" : "ETHIO PANDA · 学习权限"}
              </p>
              <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
                {english ? "Your next chapter starts here." : "下一段学习，从这里开始。"}
              </h1>
            </div>
          </div>

          <CardContent className="flex flex-col justify-center p-7 sm:p-9">
              <p className="text-sm font-semibold text-destructive">
              {english ? "Learning access has expired" : "学习访问权限已到期"}
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              {english ? "A subscription is required to continue" : "订阅后即可继续学习"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {english
                ? "Course lessons and practice are available with an active subscription. Your learning progress is kept safe, and you will not be charged automatically."
                : "课程和练习需要有效订阅才能继续访问。你的学习进度会保留；试用结束不会自动扣费。"}
            </p>
            <div className="mt-6 space-y-3 rounded-xl bg-muted/70 p-4">
              <div className="flex items-center gap-3 text-sm">
                <BookOpen className="h-4 w-4 shrink-0 text-primary" />
                <span>{english ? "Resume courses after subscribing" : "订阅后可继续课程学习"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                <span>{english ? "Progress remains saved" : "已有学习进度已妥善保存"}</span>
              </div>
            </div>
            <Button className="mt-6 w-full" onClick={onUpgrade} data-testid="button-course-access-subscribe">
              <CreditCard className="mr-2 h-4 w-4" />
              {english ? "View subscription options" : "查看订阅方案"}
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {english ? "No automatic charge. You choose whether to subscribe." : "不会自动扣费，由你决定是否订阅。"}
            </p>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
