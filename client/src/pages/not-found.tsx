import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { Link } from "wouter";

export default function NotFound() {
  const { language } = useLocale();
  const en = language === "en";
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">{en ? "404 — Page not found" : "404 — 页面不存在"}</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            {en ? "This page is unavailable. Return home to continue learning." : "该页面暂不可用，请返回首页继续学习。"}
          </p>
          <Link href="/" className="inline-block mt-4 text-primary underline">{en ? "Back to home" : "返回首页"}</Link>
        </CardContent>
      </Card>
    </div>
  );
}
