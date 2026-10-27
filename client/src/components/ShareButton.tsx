import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Share2, Copy, Check, MessageCircle, Users, BookOpen, Trophy, Flame } from "lucide-react";
import { SiWechat, SiWhatsapp, SiX, SiTelegram, SiFacebook } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { useLocale } from "@/lib/i18n";
import { APP_NAME, APP_SLOGAN } from "@/lib/brand";

interface LearningProgress {
  completedLessons: number;
  totalLessons: number;
  practiceCount: number;
  learningDays?: number;
}

interface ShareButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showProgress?: boolean;
  progress?: LearningProgress;
}

export function ShareButton({ variant = "default", size = "default", className = "", showProgress = false, progress }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { language, t } = useLocale();

  const appUrl = window.location.origin;
  
  const completionRate = progress && progress.totalLessons > 0 
    ? Math.round((progress.completedLessons / progress.totalLessons) * 100) 
    : 0;

  const baseMessage = language === "en" ? `${APP_NAME} — ${APP_SLOGAN}

Learn Amharic or Swahili with me!

- Choose a Chinese or English interface
- Explore letters, vocabulary and numbers
- Practise conversations and check your understanding
- Save your progress separately for each language

Choose your learning path:
${appUrl}

#Amharic #Swahili #LanguageLearning` : `${APP_NAME} — ${APP_SLOGAN}

一起来学习阿姆哈拉语或斯瓦希里语！

- 自由选择中文或英语界面
- 学习字母、词汇和数字
- 练习情景对话，进行随堂自测
- 两种语言的学习进度分别保存

选择您的学习路径：
${appUrl}

#阿姆哈拉语 #斯瓦希里语 #语言学习`;

  const progressMessage = progress ? (language === "en" ? `${APP_NAME} — ${APP_SLOGAN}

My language learning progress

My learning progress:
- Lessons completed: ${progress.completedLessons} / ${progress.totalLessons}
- Completion: ${completionRate}%
- Practice sessions: ${progress.practiceCount}
${progress.learningDays ? `- Learning streak: ${progress.learningDays} days` : ""}

Learn Amharic or Swahili with a Chinese or English interface.

Try it free:
${appUrl}

#Amharic #Swahili #LanguageLearning #MyProgress` : `${APP_NAME} — ${APP_SLOGAN}

【分享语言学习成果】

我的学习进度：
- 已完成 ${progress.completedLessons} / ${progress.totalLessons} 节课程
- 完成率 ${completionRate}%
- 练习次数 ${progress.practiceCount} 次
${progress.learningDays ? `- 连续学习 ${progress.learningDays} 天` : ""}

用中文或英语界面学习阿姆哈拉语和斯瓦希里语。

点击链接免费试用：
${appUrl}

#阿姆哈拉语 #斯瓦希里语 #语言学习 #我的学习成果`) : baseMessage;

  const shareMessage = showProgress && progress ? progressMessage : baseMessage;

  const shareMessageEncoded = encodeURIComponent(shareMessage);
  const urlEncoded = encodeURIComponent(appUrl);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage);
      setCopied(true);
      toast({
        title: t("复制成功"),
        description: t("分享内容已复制到剪贴板，可粘贴到微信或其他平台"),
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: t("复制失败"),
        description: t("请手动复制分享内容"),
        variant: "destructive",
      });
    }
  };

  const shareLinks = [
    {
      name: "微信",
      icon: SiWechat,
      color: "bg-green-500 hover:bg-green-600",
      action: () => {
        handleCopy();
        toast({
          title: t("内容已复制"),
          description: t("请打开微信，粘贴分享给好友或朋友圈"),
        });
      },
    },
    {
      name: "WhatsApp",
      icon: SiWhatsapp,
      color: "bg-green-600 hover:bg-green-700",
      href: `https://wa.me/?text=${shareMessageEncoded}`,
    },
    {
      name: "Telegram",
      icon: SiTelegram,
      color: "bg-blue-500 hover:bg-blue-600",
      href: `https://t.me/share/url?url=${urlEncoded}&text=${shareMessageEncoded}`,
    },
    {
      name: "X",
      icon: SiX,
      color: "bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-black",
      href: `https://twitter.com/intent/tweet?text=${shareMessageEncoded}`,
    },
    {
      name: "Facebook",
      icon: SiFacebook,
      color: "bg-blue-600 hover:bg-blue-700",
      href: `https://www.facebook.com/sharer/sharer.php?u=${urlEncoded}&quote=${shareMessageEncoded}`,
    },
  ];

  const handleShare = (link: typeof shareLinks[0]) => {
    if (link.action) {
      link.action();
    } else if (link.href) {
      window.open(link.href, "_blank", "width=600,height=400");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className} data-testid="button-share">
          <Share2 className="w-4 h-4 mr-2" />
          {t("邀请好友")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" data-testid="dialog-share">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            {t("邀请好友一起学习")}
          </DialogTitle>
          <DialogDescription>
            {t("分享给朋友，一起学习斯瓦希里语！")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {showProgress && progress && (
            <div className="p-4 bg-primary/10 rounded-lg space-y-3" data-testid="section-progress-stats">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-primary" />
                <p className="text-sm font-medium">{t("我的学习成果")}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {t("课程")} <span className="font-semibold">{progress.completedLessons}/{progress.totalLessons}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {t("练习")} <span className="font-semibold">{progress.practiceCount}</span>
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t("完成进度")}</span>
                  <span>{completionRate}%</span>
                </div>
                <Progress value={completionRate} className="h-2" />
              </div>
              {progress.learningDays && (
                <div className="flex items-center gap-2 pt-1">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-sm">{t("连续学习")} <span className="font-semibold">{progress.learningDays} {t("天")}</span></span>
                </div>
              )}
            </div>
          )}

          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-start gap-3 mb-3">
              <MessageCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{t("分享内容预览：")}</p>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
              {shareMessage.slice(0, 180)}...
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">{t("选择分享平台：")}</p>
            <div className="grid grid-cols-5 gap-2">
              {shareLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleShare(link)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg text-white transition-all hover-elevate ${link.color}`}
                  data-testid={`button-share-${link.name.toLowerCase()}`}
                >
                  <link.icon className="w-6 h-6" />
                  <span className="text-xs">{t(link.name)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleCopy}
              data-testid="button-copy-share"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  {t("已复制")}
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  {t("复制分享内容")}
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            {t("邀请好友一起学习，让语言学习更有趣！")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
