import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Send, Bot, User as UserIcon, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ChatSession, ChatMessage, User } from "@shared/schema";
import { differenceInDays } from "date-fns";
import { Link } from "wouter";

export default function Practice() {
  const { user } = useAuth() as { user: User | null };
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: session, isLoading: sessionLoading } = useQuery<ChatSession & { messages: ChatMessage[] }>({
    queryKey: ["/api/chat/session", currentSessionId],
    enabled: !!currentSessionId,
  });

  const createSessionMutation = useMutation({
    mutationFn: async (level: string) => {
      const res = await apiRequest("POST", "/api/chat/session", { level });
      return res.json();
    },
    onSuccess: (data) => {
      setCurrentSessionId(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions"] });
    },
    onError: (error: Error) => {
      toast({
        title: "错误",
        description: error.message || "创建会话失败",
        variant: "destructive",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", "/api/chat/message", {
        sessionId: currentSessionId,
        content,
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.requiresUpgrade) {
        setShowUpgradeModal(true);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/chat/session", currentSessionId] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: Error) => {
      if (error.message.includes("403")) {
        setShowUpgradeModal(true);
      } else {
        toast({
          title: "错误",
          description: error.message || "发送消息失败",
          variant: "destructive",
        });
      }
    },
  });

  useEffect(() => {
    if (!currentSessionId && !createSessionMutation.isPending) {
      createSessionMutation.mutate("beginner");
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [session?.messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMessageMutation.isPending) return;

    const messageContent = message;
    setMessage("");
    await sendMessageMutation.mutateAsync(messageContent);
  };

  const practiceCount = user?.practiceCount || 0;
  const subscriptionEndsAt = user?.subscriptionEndsAt ? new Date(user.subscriptionEndsAt) : null;
  const now = new Date();
  const isExpired = subscriptionEndsAt !== null && subscriptionEndsAt < now;
  const daysRemaining = subscriptionEndsAt 
    ? differenceInDays(subscriptionEndsAt, now)
    : null;
  const isPremium = user?.isPremium && !isExpired;
  const remainingPractices = isPremium ? "无限" : Math.max(0, 10 - practiceCount);

  return (
    <div className="h-full flex flex-col">
      <div className="border-b bg-card">
        <div className="px-4 md:px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">AI 练习</h1>
            <p className="text-sm text-muted-foreground">与AI老师练习斯瓦希里语对话</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">剩余练习次数</p>
              <p className="text-lg font-bold" data-testid="text-practice-count">
                {remainingPractices}
              </p>
            </div>
            <Badge variant={isPremium ? "default" : "secondary"} data-testid="badge-subscription-status">
              {isPremium ? "高级会员" : "免费"}
            </Badge>
          </div>
        </div>
      </div>

      {isExpired && (
        <div className="px-4 md:px-6 pt-4">
          <Alert variant="destructive" data-testid="alert-subscription-expired">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>订阅已过期</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>你的高级订阅已过期，现在使用免费版限制（10次练习）。</span>
              <Link href="/subscription">
                <Button variant="outline" size="sm" className="ml-4">
                  续费订阅
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="flex-1 overflow-hidden flex flex-col max-w-4xl mx-auto w-full">
        <ScrollArea className="flex-1 p-4 md:p-6" ref={scrollRef}>
          {sessionLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">加载中...</p>
              </div>
            </div>
          ) : session?.messages && session.messages.length > 0 ? (
            <div className="space-y-4">
              {session.messages.map((msg, idx) => (
                <div
                  key={msg.id || idx}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  data-testid={`message-${msg.role}-${idx}`}
                >
                  {msg.role === "assistant" && (
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className="bg-primary">
                        <Bot className="w-4 h-4 text-primary-foreground" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-xs md:max-w-md p-4 rounded-2xl ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                  {msg.role === "user" && (
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback>
                        <UserIcon className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {sendMessageMutation.isPending && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="bg-primary">
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="max-w-xs md:max-w-md p-4 rounded-2xl bg-muted">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <Card className="max-w-md">
                <CardContent className="pt-6 text-center">
                  <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-2">开始与AI老师对话</p>
                  <p className="text-sm text-muted-foreground">尝试用斯瓦希里语或中文打招呼</p>
                </CardContent>
              </Card>
            </div>
          )}
        </ScrollArea>

        <div className="border-t bg-card p-4 md:p-6">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="输入你的消息..."
              disabled={sendMessageMutation.isPending}
              className="flex-1"
              data-testid="input-message"
            />
            <Button
              type="submit"
              disabled={!message.trim() || sendMessageMutation.isPending}
              data-testid="button-send"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>

      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent data-testid="dialog-upgrade">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              升级到高级会员
            </DialogTitle>
            <DialogDescription>
              你已达到免费练习次数上限（10次）
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p>升级到高级会员可以获得：</p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>无限次AI对话练习</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>访问所有课程级别</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>离线模式</span>
              </li>
            </ul>
            <div className="flex gap-3 pt-4">
              <Button onClick={() => setShowUpgradeModal(false)} variant="outline" className="flex-1">
                稍后
              </Button>
              <Button onClick={() => window.location.hash = "subscription"} className="flex-1" data-testid="button-upgrade-now">
                立即升级
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
