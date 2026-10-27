import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export type ManagedUser = Omit<User, "passwordHash" | "googleId"> & { isOwner: boolean; googleConnected: boolean };

export function UserManagementDialog({ user, currentUserId, onClose }: {
  user: ManagedUser; currentUserId?: string; onClose: () => void;
}) {
  const { language } = useLocale();
  const en = language === "en";
  const { toast } = useToast();
  const [username, setUsername] = useState(user.username);
  const [admin, setAdmin] = useState(user.isAdmin);
  const [premium, setPremium] = useState(user.isPremium);
  const [expiry, setExpiry] = useState(user.subscriptionEndsAt ? new Date(user.subscriptionEndsAt).toISOString().slice(0, 10) : "");
  const [deleting, setDeleting] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const self = user.id === currentUserId;
  const mutation = useMutation({
    mutationFn: async (remove: boolean) => {
      if (remove) await apiRequest("DELETE", `/api/admin/users/${user.id}`);
      else await apiRequest("PATCH", `/api/admin/users/${user.id}`, {
        username, isAdmin: admin, isPremium: premium,
        subscriptionEndsAt: premium && expiry ? `${expiry}T23:59:59.000Z` : null,
      });
    },
    onSuccess: () => {
      for (const key of ["/api/admin/users", "/api/auth/user", "/api/admin/subscriptions", "/api/admin/pending"]) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
      toast({ title: en ? "User records updated" : "用户记录已更新" });
      onClose();
    },
    onError: () => toast({
      title: en ? "Unable to save changes" : "无法保存更改",
      description: en ? "Check the details and your permissions, then try again." : "请检查账户信息与权限，然后重试。",
      variant: "destructive",
    }),
  });
  return (
    <Dialog open onOpenChange={(open) => { if (!open && !mutation.isPending) onClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{en ? "Manage user" : "管理用户"}</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); mutation.mutate(false); }}>
          <div className="space-y-2">
            <Label htmlFor="managed-username">{en ? "Name" : "用户名"}</Label>
            <Input id="managed-username" minLength={2} maxLength={100} required value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="managed-admin" checked={admin} onCheckedChange={(v) => setAdmin(v === true)} disabled={self || user.isOwner} />
            <Label htmlFor="managed-admin">{en ? "Full administrator access" : "完整管理员权限"}</Label>
          </div>
          <p className="text-xs text-muted-foreground">{en ? "Administrators can manage users, subscriptions, and app records." : "管理员可管理用户、订阅与应用记录。"}</p>
          <div className="flex items-center gap-2">
            <Checkbox id="managed-premium" checked={premium} onCheckedChange={(v) => setPremium(v === true)} disabled={user.isOwner} />
            <Label htmlFor="managed-premium">{en ? "Premium access" : "高级会员权限"}</Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="managed-expiry">{en ? "Premium expiry (UTC; blank for unlimited)" : "会员到期日期（UTC；留空为永久）"}</Label>
            <Input id="managed-expiry" type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} disabled={!premium || user.isOwner} />
          </div>
          {user.isOwner && <p className="text-sm text-muted-foreground">{en ? "The application owner's access is protected." : "应用所有者的权限受到保护。"}</p>}
          <Button className="w-full" disabled={mutation.isPending} type="submit">{en ? "Save changes" : "保存更改"}</Button>
        </form>
        {!self && !user.isOwner && (
          <div className="border-t pt-4 space-y-3">
            {!deleting ? <Button variant="destructive" onClick={() => setDeleting(true)}>{en ? "Delete user…" : "删除用户…"}</Button> : <>
              <p role="alert" className="text-sm text-destructive">{en
                ? "This permanently deletes the account, lesson progress, conversations, and payment records. This cannot be undone. Type the user's email to confirm."
                : "此操作将永久删除该账户、学习进度、对话和付款记录，无法撤销。请输入用户邮箱确认。"}</p>
              <Input aria-label={en ? "Email confirmation" : "邮箱确认"} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
              <div className="flex gap-2">
                <Button variant="destructive" disabled={confirmation !== user.email || mutation.isPending} onClick={() => mutation.mutate(true)}>{en ? "Permanently delete" : "永久删除"}</Button>
                <Button variant="outline" disabled={mutation.isPending} onClick={() => { setDeleting(false); setConfirmation(""); }}>{en ? "Cancel" : "取消"}</Button>
              </div>
            </>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
