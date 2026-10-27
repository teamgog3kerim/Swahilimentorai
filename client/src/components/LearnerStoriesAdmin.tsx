import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, CircleAlert, Edit3, Plus, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/lib/i18n";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { AdminLearnerStory, LearnerStoryInput } from "@shared/learnerStories";

const emptyStory = (): LearnerStoryInput => ({
  learningLanguage: "swahili",
  displayNameZh: "",
  displayNameEn: "",
  quoteZh: "",
  quoteEn: "",
  contextZh: "",
  contextEn: "",
  privateContact: "",
  consentRecord: "",
  consentGranted: false,
  approved: false,
  published: false,
});

export function LearnerStoriesAdmin() {
  const { language } = useLocale();
  const en = language === "en";
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LearnerStoryInput>(emptyStory);
  const [persistedForm, setPersistedForm] = useState<AdminLearnerStory | null>(null);
  const [conflict, setConflict] = useState(false);
  const [formError, setFormError] = useState("");
  const [saved, setSaved] = useState(false);
  const label = (zh: string, english: string) => en ? english : zh;
  const requiresContentSave = !!editingId && !!persistedForm &&
    (Object.keys(form) as (keyof LearnerStoryInput)[]).some(
      key => key !== "approved" && key !== "published" && form[key] !== persistedForm[key],
    );
  const storiesQuery = useQuery<AdminLearnerStory[]>({
    queryKey: ["/api/admin/learner-stories"],
    enabled: true,
  });
  const resetForm = () => {
    setEditingId(null);
    setForm(emptyStory());
    setPersistedForm(null);
    setConflict(false);
    setFormError("");
    setSaved(false);
  };
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (![form.displayNameZh, form.displayNameEn, form.quoteZh, form.quoteEn].every((value) => value.trim())) {
        throw new Error(label("请填写中文和英文姓名及故事内容。", "Enter the name and story in both Chinese and English."));
      }
      if (form.approved && (!form.consentGranted || !form.consentRecord.trim())) {
        throw new Error(label("批准前需要已确认授权并填写授权记录。", "Approval requires confirmed permission and a consent record."));
      }
      if (form.published && !form.approved) {
        throw new Error(label("只有已批准的故事才能发布。", "Only approved stories can be published."));
      }
      const response = await apiRequest(editingId ? "PATCH" : "POST", editingId ? `/api/admin/learner-stories/${editingId}` : "/api/admin/learner-stories",
        editingId ? { ...form, updatedAt: persistedForm?.updatedAt } : form);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/learner-stories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/learner-stories"] });
      setFormError("");
      setSaved(true);
      setEditingId(null);
      setForm(emptyStory());
      setPersistedForm(null);
      setConflict(false);
    },
    onError: (error: Error) => {
      setSaved(false);
      if (error.message.startsWith("409:")) {
        setConflict(true);
        setFormError("");
        return;
      }
      setFormError(error.message || label("保存失败，请重试。", "Couldn't save this story. Try again."));
    },
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/learner-stories/${id}`);
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/learner-stories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/learner-stories"] });
      if (editingId === id) resetForm();
    },
  });

  const update = <K extends keyof LearnerStoryInput>(key: K, value: LearnerStoryInput[K]) => {
    setForm((current) => {
      const next = { ...current, [key]: value };
      const contentOrConsentChanged = key !== "approved" && key !== "published";
      if (contentOrConsentChanged) {
        next.approved = false;
        next.published = false;
      }
      if (key === "consentGranted" && value === false) {
        next.approved = false;
        next.published = false;
      }
      return next;
    });
    setSaved(false);
    setFormError("");
  };
  const startEdit = (story: AdminLearnerStory) => {
    if (conflict && !window.confirm(label(
      "载入所选故事的最新版本将替换未保存的修改。请先复制需要保留的内容。是否继续？",
      "Loading the selected story will replace your unsaved edits. Copy anything you want to keep first. Continue?",
    ))) return;
    setConflict(false);
    setEditingId(story.id);
    setPersistedForm(story);
    setForm({
      learningLanguage: story.learningLanguage,
      displayNameZh: story.displayNameZh,
      displayNameEn: story.displayNameEn,
      quoteZh: story.quoteZh,
      quoteEn: story.quoteEn,
      contextZh: story.contextZh,
      contextEn: story.contextEn,
      privateContact: story.privateContact,
      consentRecord: story.consentRecord,
      consentGranted: story.consentGranted,
      approved: story.approved,
      published: story.published,
    });
    setFormError("");
    setSaved(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const removeStory = (story: AdminLearnerStory) => {
    const confirmed = window.confirm(label(
      `确定删除「${story.displayNameZh}」的故事吗？此操作无法撤销。`,
      `Delete the story by “${story.displayNameEn}”? This cannot be undone.`,
    ));
    if (confirmed) deleteMutation.mutate(story.id);
  };
  const field = (key: keyof LearnerStoryInput, value: string) => update(key, value as never);
  const status = (story: AdminLearnerStory) => (
    <div className="flex flex-wrap gap-1.5">
      <Badge variant={story.consentGranted ? "secondary" : "outline"}>{story.consentGranted ? label("已记录授权", "Consent recorded") : label("未授权", "No consent")}</Badge>
      <Badge variant={story.approved ? "default" : "outline"}>{story.approved ? label("已审核批准", "Approved") : label("待审核", "Not approved")}</Badge>
      <Badge variant={story.published ? "default" : "secondary"}>{story.published ? label("已发布", "Published") : label("未发布", "Unpublished")}</Badge>
    </div>
  );

  return (
    <div className="space-y-5">
      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>{label("安全发布流程", "Safe publishing workflow")}</AlertTitle>
        <AlertDescription>
          {label("示例故事与真实授权故事必须区分。公开姓名、引用和背景只填写已获许可的内容；私人联系方式与授权记录仅供管理员查看。内容变更后必须重新审核。", "Keep illustrative stories distinct from real, permissioned stories. Public names, quotes and context must be approved for use; private contact and consent notes are admin-only. Any content change requires a fresh review.")}
        </AlertDescription>
      </Alert>

      {saved && <Alert className="border-emerald-600/30 text-emerald-800"><CheckCircle2 className="h-4 w-4" /><AlertDescription>{label("故事已保存。", "Story saved.")}</AlertDescription></Alert>}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><Plus className="h-5 w-5 text-primary" />{editingId ? label("编辑学习者故事", "Edit learner story") : label("添加学习者故事", "Add learner story")}</CardTitle>
          <CardDescription>{label("先确认故事内容与授权，再由管理员明确批准并发布。", "Review the story and permission first, then explicitly approve and publish it.")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={(event) => { event.preventDefault(); saveMutation.mutate(); }}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="story-language">{label("学习语言", "Learning language")}</Label>
                <select id="story-language" value={form.learningLanguage} onChange={(event) => update("learningLanguage", event.target.value as LearnerStoryInput["learningLanguage"])} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="swahili">{label("斯瓦希里语", "Swahili")}</option>
                  <option value="amharic">{label("阿姆哈拉语", "Amharic")}</option>
                </select>
              </div>
              <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                {label("双语字段需要同时完整填写。公开字段不能包含私人联系方式或未经许可的信息。", "Complete both language versions. Never place private contact details or unapproved information in public fields.")}
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <section className="space-y-4 rounded-lg border p-4">
                <h3 className="font-semibold">{label("公开内容 · 中文", "Public content · Chinese")}</h3>
                <div className="space-y-2"><Label htmlFor="name-zh">{label("公开署名（中文）*", "Public attribution (Chinese)*")}</Label><Input id="name-zh" maxLength={100} required value={form.displayNameZh} onChange={(e) => field("displayNameZh", e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="quote-zh">{label("故事引用（中文）*", "Story quote (Chinese)*")}</Label><Textarea id="quote-zh" maxLength={3000} required rows={5} value={form.quoteZh} onChange={(e) => field("quoteZh", e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="context-zh">{label("背景说明（可选，最多200字）", "Context (optional, max 200 characters)")}</Label><Input id="context-zh" maxLength={200} value={form.contextZh} onChange={(e) => field("contextZh", e.target.value)} /></div>
              </section>
              <section className="space-y-4 rounded-lg border p-4">
                <h3 className="font-semibold">{label("公开内容 · English", "Public content · English")}</h3>
                <div className="space-y-2"><Label htmlFor="name-en">{label("公开署名（英文）*", "Public attribution (English)*")}</Label><Input id="name-en" maxLength={100} required value={form.displayNameEn} onChange={(e) => field("displayNameEn", e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="quote-en">{label("故事引用（英文）*", "Story quote (English)*")}</Label><Textarea id="quote-en" maxLength={3000} required rows={5} value={form.quoteEn} onChange={(e) => field("quoteEn", e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="context-en">{label("背景说明（可选，最多200字）", "Context (optional, max 200 characters)")}</Label><Input id="context-en" maxLength={200} value={form.contextEn} onChange={(e) => field("contextEn", e.target.value)} /></div>
              </section>
            </div>

            <section className="space-y-4 rounded-lg border border-amber-600/30 bg-amber-500/[0.04] p-4">
              <div><h3 className="font-semibold">{label("仅管理员可见 · 私密记录", "Admin only · private records")}</h3><p className="mt-1 text-sm text-muted-foreground">{label("请勿将以下信息复制到公开署名、引用或背景字段。", "Do not copy these details into public attribution, quote or context fields.")}</p></div>
              <div className="space-y-2"><Label htmlFor="private-contact">{label("私人联系方式（可选）", "Private contact (optional)")}</Label><Textarea id="private-contact" maxLength={500} rows={2} value={form.privateContact} onChange={(e) => field("privateContact", e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="consent-record">{label("授权记录 / 核实备注（批准必填）", "Consent record / verification notes (required for approval)")}</Label><Textarea id="consent-record" maxLength={3000} rows={3} value={form.consentRecord} onChange={(e) => field("consentRecord", e.target.value)} /></div>
              <label className="flex cursor-pointer items-start gap-3 rounded-md border bg-background p-3 text-sm">
                <Checkbox checked={form.consentGranted} onCheckedChange={(checked) => update("consentGranted", checked === true)} />
                <span className="leading-relaxed">{label("我已核实这是来自真实学员账户的故事，并确认本人明确同意发布中文与英文译文及公开署名。", "I verified this story belongs to a genuine learner account and confirmed explicit permission to publish both translations and the public attribution.")}</span>
              </label>
            </section>

            {requiresContentSave && (
              <Alert>
                <AlertDescription>{label("请先保存修改，再重新打开故事进行审核和发布。修改后的故事将暂时不公开。", "Save your changes first, then reopen the story to approve and publish it. The changed story will remain private until then.")}</AlertDescription>
              </Alert>
            )}
            <section className="grid gap-3 md:grid-cols-2">
              <label className={`flex items-start gap-3 rounded-md border p-3 text-sm ${!form.consentGranted || !form.consentRecord.trim() ? "opacity-60" : ""}`}>
                <Checkbox checked={form.approved} disabled={requiresContentSave || !form.consentGranted || !form.consentRecord.trim()} onCheckedChange={(checked) => {
                  const approved = checked === true;
                  update("approved", approved);
                  if (!approved) setForm((current) => ({ ...current, published: false }));
                }} />
                <span><strong className="block">{label("管理员审核通过", "Admin reviewed and approved")}</strong><span className="text-muted-foreground">{label("仅在检查当前中英文内容、授权范围及公开署名后勾选。编辑会重置此状态。", "Check only after reviewing the current Chinese and English text, permission scope and public attribution. Edits reset approval.")}</span></span>
              </label>
              <label className={`flex items-start gap-3 rounded-md border p-3 text-sm ${!form.approved ? "opacity-60" : ""}`}>
                <Checkbox checked={form.published} disabled={!form.approved} onCheckedChange={(checked) => update("published", checked === true)} />
                <span><strong className="block">{label("发布到公开页面", "Publish on the public page")}</strong><span className="text-muted-foreground">{label("仅已审核批准的故事可以发布。", "Only approved stories can be published.")}</span></span>
              </label>
            </section>

            {conflict && <Alert variant="destructive" role="alert">
              <CircleAlert className="h-4 w-4" />
              <AlertTitle>{label("故事已被其他管理员修改", "Another administrator changed this story")}</AlertTitle>
              <AlertDescription className="space-y-3">
                <p>{label("您的未保存修改已保留，尚未覆盖最新版本。请刷新下方列表，比较最新授权与发布状态，复制需要保留的内容，再点击“编辑”载入最新版本并重新审核。", "Your unsaved edits are preserved and have not overwritten the latest version. Refresh the list below, compare the latest permission and publishing status, copy any edits you want to keep, then choose Edit to load the latest version and review it again.")}</p>
                <Button type="button" variant="outline" disabled={storiesQuery.isFetching} onClick={() => storiesQuery.refetch()}>{label("刷新列表（保留修改）", "Reload list (keep edits)")}</Button>
              </AlertDescription>
            </Alert>}
            {formError && <Alert variant="destructive"><CircleAlert className="h-4 w-4" /><AlertTitle>{label("无法保存", "Could not save")}</AlertTitle><AlertDescription>{formError}</AlertDescription></Alert>}
            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" disabled={saveMutation.isPending || conflict}>{saveMutation.isPending ? label("保存中…", "Saving…") : label("保存故事", "Save story")}</Button>
              {editingId && <Button type="button" variant="outline" onClick={resetForm}>{label("取消编辑", "Cancel edit")}</Button>}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><CardTitle>{label("已提交的故事", "Submitted stories")}</CardTitle><CardDescription>{label("检查授权、审核和发布状态。", "Review consent, approval and publishing status.")}</CardDescription></div>
            <Button variant="outline" size="sm" onClick={() => storiesQuery.refetch()} disabled={storiesQuery.isFetching}><RefreshCw className={`mr-2 h-4 w-4 ${storiesQuery.isFetching ? "animate-spin" : ""}`} />{label("刷新", "Refresh")}</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {deleteMutation.isError && (
            <Alert variant="destructive" role="alert">
              <AlertTitle>{label("删除失败", "Could not delete")}</AlertTitle>
              <AlertDescription>{label("故事未被删除，请重试。", "The story was not deleted. Please try again.")}</AlertDescription>
            </Alert>
          )}
          {storiesQuery.isLoading ? <div className="space-y-3" aria-label={label("正在加载故事", "Loading stories")}>{[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-lg bg-muted" />)}</div>
            : storiesQuery.isError ? <Alert variant="destructive"><CircleAlert className="h-4 w-4" /><AlertTitle>{label("故事加载失败", "Couldn't load stories")}</AlertTitle><AlertDescription className="flex flex-wrap items-center justify-between gap-3">{label("请检查连接后重试。", "Check your connection and try again.")}<Button variant="outline" size="sm" onClick={() => storiesQuery.refetch()}>{label("重试", "Retry")}</Button></AlertDescription></Alert>
              : (storiesQuery.data ?? []).length === 0 ? <div className="rounded-lg border border-dashed px-4 py-10 text-center"><ShieldCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="font-medium">{label("还没有学习者故事", "No learner stories yet")}</p><p className="mt-1 text-sm text-muted-foreground">{label("新增故事后，先记录授权，再逐步审核和发布。", "Add a story, record permission, then review and publish it when ready.")}</p></div>
                : (storiesQuery.data ?? []).map((story) => <article key={story.id} className="rounded-lg border p-4 transition-colors hover:bg-muted/20" data-testid={`learner-story-admin-${story.id}`}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{story.displayNameEn} <span className="font-normal text-muted-foreground">/ {story.displayNameZh}</span></h3><Badge variant="outline">{story.learningLanguage === "amharic" ? label("阿姆哈拉语", "Amharic") : label("斯瓦希里语", "Swahili")}</Badge></div>
                      {status(story)}
                      <p className="line-clamp-2 text-sm text-muted-foreground">{story.quoteEn}</p>
                      <p className="line-clamp-2 text-sm text-muted-foreground" lang="zh">{story.quoteZh}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button variant="outline" size="sm" onClick={() => startEdit(story)}><Edit3 className="mr-1.5 h-4 w-4" />{label("编辑", "Edit")}</Button>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" disabled={deleteMutation.isPending} onClick={() => removeStory(story)}><Trash2 className="mr-1.5 h-4 w-4" />{label("删除", "Delete")}</Button>
                    </div>
                  </div>
                </article>)}
        </CardContent>
      </Card>
    </div>
  );
}
