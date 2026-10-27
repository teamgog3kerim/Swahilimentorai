import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mail, Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useLocale } from "@/lib/i18n";
import { LanguageToggle } from "@/components/LanguageToggle";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

type LoginFormData = { email: string; password: string; rememberMe: boolean };

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const loginSchema = z.object({
    email: z.string().email(t("请输入有效的邮箱地址")),
    password: z.string().min(1, t("请输入密码")),
    rememberMe: z.boolean().default(false),
  });

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/login", {
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: t("登录成功"),
        description: t("欢迎回来！"),
      });
      setLocation("/dashboard");
    } catch (error: any) {
      toast({
        title: t("登录失败"),
        description: error.message?.includes("请使用 Google 登录管理员账户")
          ? t("请使用 Google 登录管理员账户") : error.message || t("请检查您的邮箱和密码"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-4 right-4"><LanguageToggle /></div>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl" data-testid="text-login-title">{t("登录")}</CardTitle>
          </div>
          <CardDescription>
            {t("登录您的语言学习账户")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <GoogleSignInButton />
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("邮箱")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          className="pl-10"
                          data-testid="input-email"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("密码")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-10"
                          data-testid="input-password"
                          {...field}
                        />
                        <button
                          type="button"
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => setShowPassword(!showPassword)}
                          data-testid="button-toggle-password"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-remember-me"
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal cursor-pointer">
                      {t("保持登录状态")}
                    </FormLabel>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-login-submit"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("登录中...")}
                  </>
                ) : (
                  t("登录")
                )}
              </Button>
            </form>
          </Form>

          <div className="text-center text-sm">
            {t("还没有账户？")}{" "}
            <Button
              variant="ghost"
              className="px-0 h-auto text-primary underline-offset-4 hover:underline"
              onClick={() => setLocation("/signup")}
              data-testid="link-signup"
            >
              {t("立即注册")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
