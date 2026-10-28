import { useQuery } from "@tanstack/react-query";
import type { PaymentReview } from "@shared/schema";
import { useLocale } from "@/lib/i18n";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function RetainedPaymentReviews({ isAdmin }: { isAdmin: boolean }) {
  const { language, t } = useLocale();
  const en = language === "en";
  const { data: reviews = [], isLoading, isError, refetch } = useQuery<PaymentReview[]>({
    queryKey: ["/api/admin/payment-reviews/retained"],
    enabled: isAdmin,
  });
  const date = (value: Date | string) => new Date(value).toLocaleString(en ? "en-US" : "zh-CN");

  if (!isAdmin) return null;
  return (
    <Card data-testid="retained-payment-reviews">
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <CardTitle>{en ? "Retained reviews for deleted payments" : "已删除支付的保留审核记录"}</CardTitle>
          <Button variant="outline" onClick={() => refetch()} data-testid="refresh-retained-reviews">
            {en ? "Refresh retained reviews" : "刷新保留审核记录"}
          </Button>
        </div>
        <CardDescription>
          {en
            ? "Read-only review evidence retained after account or payment deletion. Learner identity and payment details are not retained here. Rejected payment dates do not grant access."
            : "账户或支付删除后保留的只读审核凭据。此处不保留学习者身份和支付详情。被拒绝支付的日期不代表已授予访问权限。"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? <p>{t("加载中...")}</p> : isError ? (
          <div role="alert">
            <p>{en ? "Unable to load retained reviews. Please retry." : "无法加载保留审核记录，请重试。"}</p>
            <Button variant="outline" onClick={() => refetch()}>{en ? "Retry" : "重试"}</Button>
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-muted-foreground">{en ? "No retained reviews for deleted payments." : "暂无已删除支付的保留审核记录。"}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{en ? "Original payment ID" : "原支付记录ID"}</TableHead>
                  <TableHead>{en ? "Record status" : "记录状态"}</TableHead>
                  <TableHead>{t("审核记录")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow key={review.subscriptionId} data-testid={`retained-review-${review.subscriptionId}`}>
                    <TableCell><code className="text-xs break-all">{review.subscriptionId}</code></TableCell>
                    <TableCell>{en ? "Original account or payment deleted" : "原账户或支付已删除"}</TableCell>
                    <TableCell className="min-w-[240px] space-y-1">
                      <div className="font-medium">{review.outcome === "approved" ? t("已批准") : t("已拒绝")}{" · "}{review.reviewerName}</div>
                      <div className="text-xs text-muted-foreground">{en ? "Reviewer ID" : "审核员ID"}: {review.reviewerId}</div>
                      <div>{t("审核时间")}: {date(review.reviewedAt)}</div>
                      <div>{t("记录的订阅开始时间")}: {date(review.startDate)}</div>
                      <div>{t("记录的订阅结束时间")}: {date(review.endDate)}</div>
                      <div>{t("审核后的访问截止时间")}: {review.subscriptionEndsAt ? date(review.subscriptionEndsAt) : t("未设置截止时间")}</div>
                      {review.outcome === "rejected" && <div className="text-muted-foreground">{t("拒绝未授予访问权限，订阅日期保持不变。")}</div>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
