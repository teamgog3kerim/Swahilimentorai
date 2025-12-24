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
import { Share2, Copy, Check, MessageCircle, Users } from "lucide-react";
import { SiWechat, SiWhatsapp, SiX, SiTelegram, SiFacebook } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";

interface ShareButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function ShareButton({ variant = "default", size = "default", className = "" }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://swahili-ai.replit.app";
  
  const shareMessage = `【推荐】发现一个超棒的斯瓦希里语学习平台！

我正在用AI老师学习斯瓦希里语，效果真的很好！

- AI智能对话练习，24小时随时学
- 专为中文母语者设计，从零开始也能轻松上手
- 90节系统课程，9个月掌握一门新语言

一起来学习非洲最美的语言吧！
Karibu! (欢迎!)

点击链接开始7天免费试用：
${appUrl}

#斯瓦希里语 #语言学习 #AI学习`;

  const shareMessageEncoded = encodeURIComponent(shareMessage);
  const urlEncoded = encodeURIComponent(appUrl);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage);
      setCopied(true);
      toast({
        title: "复制成功",
        description: "分享内容已复制到剪贴板，可粘贴到微信或其他平台",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "复制失败",
        description: "请手动复制分享内容",
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
          title: "内容已复制",
          description: "请打开微信，粘贴分享给好友或朋友圈",
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
          邀请好友
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" data-testid="dialog-share">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            邀请好友一起学习
          </DialogTitle>
          <DialogDescription>
            分享给朋友，一起学习斯瓦希里语！
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-start gap-3 mb-3">
              <MessageCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium">分享内容预览：</p>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
              {shareMessage.slice(0, 150)}...
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">选择分享平台：</p>
            <div className="grid grid-cols-5 gap-2">
              {shareLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleShare(link)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg text-white transition-all hover-elevate ${link.color}`}
                  data-testid={`button-share-${link.name.toLowerCase()}`}
                >
                  <link.icon className="w-6 h-6" />
                  <span className="text-xs">{link.name}</span>
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
                  已复制
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  复制分享内容
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            邀请好友一起学习，让语言学习更有趣！
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
