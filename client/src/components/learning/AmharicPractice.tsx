import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale } from "@/lib/i18n";
import { useTrack } from "@/contexts/TrackContext";
import type { Lesson } from "@shared/schema";
import { PronunciationButton } from "./PronunciationButton";
import { LessonContentView } from "./LessonContentView";

type Quiz = { question?: { english?: string; chinese?: string }; options?: string[]; answer?: number; explanation?: { english?: string; chinese?: string } };
type DialogueLine = { speaker: string; term?: string; swahili?: string; transliteration?: string; english?: string; chinese?: string };
const text = (en: string | undefined, zh: string | undefined, locale: string) => locale === "en" ? en || zh || "" : zh || en || "";
const amharicCategories = ["all", "letters", "words", "numbers", "conversations"];
const swahiliCategories = ["all", "words", "numbers", "conversations"];
const matchesCategory = (item: Lesson, category: string, isAmharic: boolean) => {
  if (category === "all") return true;
  const content = item.content as any;
  if (isAmharic) return item.category === category;
  if (category === "words") return Array.isArray(content?.vocabulary) && content.vocabulary.length > 0;
  if (category === "numbers") return /number/i.test(item.category || "");
  if (category === "conversations") return Array.isArray(content?.dialogues) && content.dialogues.length > 0;
  return false;
};

export function AmharicPractice({ initialLessonId }: { initialLessonId?: string | null }) {
  const { language, t } = useLocale();
  const { track } = useTrack();
  const target = track || "amharic";
  const isAmharic = target === "amharic";
  const english = language === "en";
  const categories = isAmharic ? amharicCategories : swahiliCategories;
  const [category, setCategory] = useState("all");
  const [lessonId, setLessonId] = useState(initialLessonId || "");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [selectedRole, setSelectedRole] = useState(0);
  const [turnIndex, setTurnIndex] = useState(0);
  const [turnRevealed, setTurnRevealed] = useState(false);
  const [translationRevealed, setTranslationRevealed] = useState(false);
  const { data: lessons, isLoading, isError, refetch } = useQuery<Lesson[]>({
    queryKey: [`/api/lessons?language=${target}`],
  });

  useEffect(() => {
    setLessonId(initialLessonId || "");
    setCategory("all");
  }, [initialLessonId, target]);

  useEffect(() => {
    // Swahili answer choices are translated, so a selected option must not
    // carry over to a differently ordered localized set of meanings.
    setSelectedAnswer(null);
    setChecked(false);
    setAnswerRevealed(false);
  }, [language]);

  const categoryLessons = useMemo(() => (lessons || []).filter((item) => matchesCategory(item, category, isAmharic)), [lessons, category, isAmharic]);
  const lesson = categoryLessons.find((item) => item.id === lessonId) || categoryLessons[0];
  const lessonPosition = lesson ? categoryLessons.findIndex((item) => item.id === lesson.id) : -1;
  const content = lesson?.content as any;
  const makeVocabularyChecks = (vocabulary: any[]): Quiz[] => vocabulary
    .filter((item) => (item?.term || item?.swahili) && (item?.english || item?.chinese))
    .map((item, questionIndex, candidates) => {
      const sourceTerm = item.term || item.swahili;
      const correctMeaning = english ? item.english || item.chinese : item.chinese || item.english;
      const distractors = Array.from(new Set(candidates
        .filter((candidate) => candidate !== item)
        .map((candidate) => english ? candidate.english || candidate.chinese : candidate.chinese || candidate.english)
        .filter((meaning): meaning is string => !!meaning && meaning !== correctMeaning))).slice(0, 3);
      const choices = [...distractors];
      const answer = questionIndex % (choices.length + 1);
      choices.splice(answer, 0, correctMeaning);
      return {
        question: {
          english: `What does “${sourceTerm}” mean?`,
          chinese: `“${sourceTerm}”是什么意思？`,
        },
        options: choices,
        answer,
        explanation: {
          english: item.english || item.chinese,
          chinese: item.chinese || item.english,
        },
      };
    });
  const quizItems = (isAmharic ? content?.quizzes || [] : makeVocabularyChecks(content?.vocabulary || [])) as Quiz[];
  const quiz = quizItems[questionIndex];
  const correct = checked && selectedAnswer !== null && selectedAnswer === quiz?.answer;
  const dialogue = content?.dialogues?.[0];
  const lines = (dialogue?.lines || []) as DialogueLine[];
  const roleNames = Array.from(new Set(lines.map((line) => line.speaker))).slice(0, 2);
  const learnerTurn = lines[turnIndex]?.speaker === roleNames[selectedRole];
  const turn = lines[turnIndex];

  useEffect(() => {
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setChecked(false);
    setAnswerRevealed(false);
    setSelectedRole(0);
    setTurnIndex(0);
    setTurnRevealed(false);
    setTranslationRevealed(false);
  }, [lesson?.id]);

  const resetPractice = () => {
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setChecked(false);
    setAnswerRevealed(false);
    setSelectedRole(0);
    setTurnIndex(0);
    setTurnRevealed(false);
    setTranslationRevealed(false);
  };
  const selectLesson = (id: string) => { setLessonId(id); resetPractice(); };
  const selectCategory = (value: string) => {
    setCategory(value);
    const nextLessons = (lessons || []).filter((item) => matchesCategory(item, value, isAmharic));
    if (!nextLessons.some((item) => item.id === lessonId)) {
      setLessonId(nextLessons[0]?.id || "");
      resetPractice();
    }
  };
  const resetQuestionState = () => {
    setSelectedAnswer(null);
    setChecked(false);
    setAnswerRevealed(false);
  };
  const selectRole = (role: number) => { setSelectedRole(role); setTurnIndex(0); setTurnRevealed(false); setTranslationRevealed(false); };
  const labelCategory = (value: string) => {
    if (value === "all") return english ? "All" : "全部";
    const names: Record<string, [string, string]> = {
      letters: ["Letters", "字母"], words: ["Words", "词汇"], numbers: ["Numbers", "数字"], conversations: ["Conversations", "对话"],
    };
    return names[value]?.[english ? 0 : 1] || value;
  };
  const labelLevel = (value: string) => {
    const names: Record<string, [string, string]> = {
      beginner: ["Beginner", "初级"], intermediate: ["Intermediate", "中级"], advanced: ["Advanced", "高级"],
    };
    return names[value]?.[english ? 0 : 1] || (english ? "Other level" : "其他级别");
  };

  return <main className="mx-auto w-full max-w-6xl px-4 py-7 md:px-8" data-testid="page-practice">
    <header className="mb-8">
      <p className="text-xs font-semibold uppercase tracking-[.22em] text-primary">{isAmharic ? (english ? "AMHARIC · PRACTICE" : "አማርኛ · 阿姆哈拉语练习") : (english ? "SWAHILI · PRACTICE" : "Kiswahili · 斯瓦希里语练习")}</p>
      <h1 className="mt-2 text-3xl font-semibold md:text-4xl">{english ? "Practice, at your pace" : "按自己的节奏练习"}</h1>
      <p className="mt-2 text-muted-foreground">{english ? (isAmharic ? "Scripted conversations and self-checks work without an AI connection." : "Practise useful Swahili with vocabulary, conversations, and self-checks.") : (isAmharic ? "跟着真实场景对话、自主检测，无需连接 AI 也能练习。" : "通过词汇、对话和自主检测练习实用斯瓦希里语。")}</p>
    </header>
    {isLoading ? <div className="space-y-3"><Skeleton className="h-24"/><Skeleton className="h-56"/></div> :
      isError ? <Card><CardContent className="flex items-center justify-between p-6"><p>{english ? "Lessons could not be loaded." : "课程暂时无法加载。"}</p><Button onClick={() => refetch()}>{english ? "Retry" : "重试"}</Button></CardContent></Card> :
      !lessons?.length ? <Card><CardContent className="p-8 text-center text-muted-foreground">{english ? `No ${isAmharic ? "Amharic" : "Swahili"} lessons are available yet.` : (isAmharic ? "阿姆哈拉语课程暂时不可用。" : "斯瓦希里语课程暂时不可用。")}</CardContent></Card> :
      <div className="space-y-5">
        <Card className="rounded-2xl"><CardContent className="p-4 md:p-5">
          <div className="flex gap-2 overflow-x-auto pb-2" role="group" aria-label={english ? "Filter lessons by category" : "按课程类别筛选"}>
            {categories.map((item) => <button key={item} onClick={() => selectCategory(item)} aria-pressed={category === item}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${category === item ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}
              data-testid={`practice-category-${item}`}>{labelCategory(item)}</button>)}
          </div>
          {lesson && categoryLessons.length > 1 && <div className="mt-3 flex items-center justify-between gap-3">
            <Button variant="outline" size="sm" disabled={lessonPosition <= 0}
              onClick={() => { const previous = categoryLessons[lessonPosition - 1]; if (previous) selectLesson(previous.id); }}
              data-testid="button-previous-practice-lesson">{english ? "Previous lesson" : "上一课"}</Button>
            <span className="text-xs text-muted-foreground" data-testid="text-practice-lesson-position">
              {lessonPosition + 1} / {categoryLessons.length}
            </span>
            <Button variant="outline" size="sm" disabled={lessonPosition < 0 || lessonPosition >= categoryLessons.length - 1}
              onClick={() => { const next = categoryLessons[lessonPosition + 1]; if (next) selectLesson(next.id); }}
              data-testid="button-next-practice-lesson">{english ? "Next lesson" : "下一课"}</Button>
          </div>}
          <label className="mt-3 block text-sm font-medium" htmlFor="select-practice-lesson">{english ? "Lesson" : "课程"}</label>
          <select id="select-practice-lesson" data-testid="select-practice-lesson" value={lesson?.id || ""}
            onChange={(event) => selectLesson(event.target.value)}
            className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {categoryLessons.map((item) => <option key={item.id} value={item.id}>{english ? item.title : item.titleChinese}</option>)}
          </select>
          {lesson && <p className="mt-2 text-xs text-muted-foreground">{labelLevel(lesson.level)} · {labelCategory(lesson.category)}</p>}
        </CardContent></Card>

        {categoryLessons.length === 0 && <Card><CardContent className="p-6 text-muted-foreground">{english ? "No lessons in this category." : "该类别暂时没有课程。"}</CardContent></Card>}
        {lesson && <section className="space-y-5">
          {lines.length > 0 && <Card className="rounded-3xl"><CardContent className="p-5 md:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><p className="text-xs font-semibold uppercase tracking-widest text-primary">{english ? "Scripted role-play" : "情境角色对话"}</p>
                <h2 className="mt-2 text-xl font-semibold">{english ? lesson.title : lesson.titleChinese}</h2></div>
              <span className="rounded-full bg-muted px-3 py-1 text-xs">{turnIndex + 1} / {lines.length}</span>
            </div>
            <p className="mt-5 text-sm font-medium">{english ? "Choose your role" : "选择你的角色"}</p>
            <div className="mt-2 flex gap-2">
              {roleNames.map((name, index) => <button key={name} onClick={() => selectRole(index)} aria-pressed={selectedRole === index}
                data-testid={`practice-role-${index === 0 ? "A" : "B"}`}
                className={`rounded-xl border px-4 py-2 text-sm ${selectedRole === index ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>
                {english ? `Role ${index === 0 ? "A" : "B"}` : `角色 ${index === 0 ? "A" : "B"}`}
              </button>)}
            </div>
            {turn && <div className="mt-5 rounded-2xl bg-muted/60 p-5" aria-live="polite">
              <p className="text-xs font-semibold text-muted-foreground">{learnerTurn ? (english ? "YOUR TURN" : "轮到你") : (english ? "PARTNER SAYS" : "对方说")}</p>
              {!learnerTurn || turnRevealed ? <>
                <p className="mt-2 text-2xl font-medium">{turn.term || turn.swahili}</p>
                {turn.transliteration && <p className="mt-1 text-sm text-primary">{turn.transliteration}</p>}
                <PronunciationButton text={turn.term || turn.swahili || ""} targetLanguage={target} />
              </> : <p className="mt-3 text-muted-foreground">{english ? "Try saying the next line before revealing it." : "先试着说出下一句，再查看示范。"}</p>}
              {translationRevealed && <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">{text(turn.english, turn.chinese, language)}</p>}
            </div>}
            <div className="mt-4 flex flex-wrap gap-2">
              {learnerTurn && !turnRevealed && <Button variant="outline" data-testid="button-reveal-turn" onClick={() => setTurnRevealed(true)}>{english ? "Reveal this turn" : "查看本句示范"}</Button>}
              {!translationRevealed && <Button variant="outline" onClick={() => setTranslationRevealed(true)}>{english ? "Reveal translation" : "查看翻译"}</Button>}
              {translationRevealed && <Button variant="ghost" onClick={() => setTranslationRevealed(false)}>{english ? "Hide translation" : "隐藏翻译"}</Button>}
              <Button variant="outline" disabled={turnIndex === 0}
                onClick={() => { setTurnIndex((index) => Math.max(0, index - 1)); setTurnRevealed(false); setTranslationRevealed(false); }}
                data-testid="button-previous-turn">{english ? "Previous turn" : "上一句"}</Button>
              <Button onClick={() => { setTurnIndex((index) => index + 1 >= lines.length ? 0 : index + 1); setTurnRevealed(false); setTranslationRevealed(false); }} data-testid="button-next-turn">
                {turnIndex + 1 === lines.length ? (english ? "Restart dialogue" : "重新开始对话") : (english ? "Next turn" : "下一句")}
              </Button>
            </div>
          </CardContent></Card>}

          {lines.length === 0 && content && <Card className="rounded-3xl">
            <CardContent className="p-5 md:p-7">
              <LessonContentView content={{ ...content, quizzes: [] }} lessonTitle={lesson.title} t={t} />
            </CardContent>
          </Card>}

          {quiz ? <Card className="rounded-3xl"><CardContent className="p-5 md:p-7">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <span>{english ? "Quick check" : "随堂自测"}</span><span>{questionIndex + 1} / {quizItems.length}</span>
            </div>
            <h2 className="mt-4 text-xl font-medium">{text(quiz.question?.english, quiz.question?.chinese, language)}</h2>
            <div className="mt-5 grid gap-3">{(quiz.options || []).map((option, index) => <button key={`${questionIndex}-${index}`} data-testid={`quiz-option-${index}`}
              onClick={() => { setSelectedAnswer(index); setChecked(false); setAnswerRevealed(false); }} disabled={checked || answerRevealed}
              aria-pressed={selectedAnswer === index}
              className={`rounded-xl border p-4 text-left transition-colors ${checked && selectedAnswer === index ? (correct ? "border-emerald-600 bg-emerald-50 text-emerald-950" : "border-rose-500 bg-rose-50 text-rose-950") : "border-border hover:border-primary/50"}`}>
              <span className="mr-3 font-mono text-xs text-muted-foreground">{String.fromCharCode(65 + index)}</span>{option}
            </button>)}</div>
            {checked && selectedAnswer !== null && <div className={`mt-4 rounded-xl p-4 text-sm ${correct ? "bg-emerald-50 text-emerald-950" : "bg-amber-50 text-amber-950"}`} role="status">
              <strong>{correct ? (english ? "That’s right." : "回答正确。") : (english ? "Not quite." : "再看一看。")}</strong> {text(quiz.explanation?.english, quiz.explanation?.chinese, language)}
            </div>}
            {answerRevealed && <div className="mt-4 rounded-xl bg-sky-50 p-4 text-sm text-sky-950" role="status">
              <strong>{english ? "Answer revealed:" : "答案已揭晓："}</strong> {quiz.options?.[quiz.answer ?? 0]} · {text(quiz.explanation?.english, quiz.explanation?.chinese, language)}
            </div>}
            <div className="mt-5 flex flex-wrap gap-2">
              {!checked && !answerRevealed && <Button disabled={selectedAnswer === null} onClick={() => setChecked(true)} data-testid="button-check-answer">{english ? "Check answer" : "检查答案"}</Button>}
              {!checked && selectedAnswer === null && !answerRevealed && <Button variant="outline" onClick={() => setAnswerRevealed(true)} data-testid="button-reveal-answer">{english ? "Reveal answer" : "查看答案"}</Button>}
              {questionIndex > 0 && <Button variant="outline" onClick={() => { setQuestionIndex((index) => index - 1); resetQuestionState(); }} data-testid="button-previous-question">{english ? "Previous question" : "上一题"}</Button>}
              {(checked || answerRevealed) && questionIndex + 1 < quizItems.length && <Button onClick={() => { setQuestionIndex((index) => index + 1); resetQuestionState(); }} data-testid="button-next-question">{english ? "Next question" : "下一题"}</Button>}
          {(checked || answerRevealed) && questionIndex + 1 >= quizItems.length && <Button variant="outline" onClick={resetPractice} data-testid="button-retry-quiz"><RotateCcw className="mr-2 h-4 w-4"/>{english ? "Try again" : "再练一次"}</Button>}
            </div>
          </CardContent></Card> : <Card><CardContent className="p-6 text-muted-foreground">{english ? "This lesson has no quiz. Continue practising the lesson above." : "这节课没有测验，可以继续练习上方课程内容。"}</CardContent></Card>}
        </section>}
      </div>}
  </main>;
}
