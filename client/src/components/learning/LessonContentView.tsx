import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";
import { useTrack } from "@/contexts/TrackContext";
import { PronunciationButton } from "./PronunciationButton";

interface VocabItem {
  term?: string;
  swahili: string;
  chinese: string;
  english?: string;
  transliteration?: string;
  pronunciation?: string;
}
interface DialogueLine {
  speaker: string;
  term?: string;
  swahili: string;
  chinese: string;
  english?: string;
  transliteration?: string;
}
interface LessonContent {
  letters?: { character: string; transliteration: string }[];
  vocabulary?: VocabItem[];
  phrases?: { swahili: string; chinese: string; english?: string }[];
  dialogues?: { lines: DialogueLine[] }[];
  introduction?: { english?: string; chinese?: string };
  notes?: { english?: string; chinese?: string };
  quizzes?: { question: { english?: string; chinese?: string }; options: string[]; answer: number; explanation: { english?: string; chinese?: string } }[];
}

export function LessonContentView({ content, t }: { content: Record<string, unknown>; t: (text: string) => string }) {
  const { language } = useLocale();
  const { track } = useTrack();
  const [activeLetter, setActiveLetter] = useState(0);
  const [vocabIndex, setVocabIndex] = useState(0);
  const [meaningVisible, setMeaningVisible] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizRevealed, setQuizRevealed] = useState(false);
  const lessonContent = content as LessonContent;
  const display = (en?: string, zh?: string) => language === "en" ? en || zh || "" : zh || en || "";
  const vocab = lessonContent.vocabulary || [];
  const quiz = lessonContent.quizzes?.[quizIndex];
  const setVocabCard = (index: number) => {
    setVocabIndex(index);
    setMeaningVisible(false);
  };
  // Foundational lessons contain complete seven-order rows; labialized
  // syllables have irregular rows and must not be labelled as seven orders.
  const completeFamilies = (lessonContent.letters?.length || 0) % 7 === 0;
  const baseLetters = completeFamilies ? lessonContent.letters || [] : [];
  const extraLetters = completeFamilies ? [] : lessonContent.letters || [];

  return <div className="space-y-6 mt-4">
    {(lessonContent.introduction || lessonContent.notes) && <div className="rounded-xl border bg-primary/5 p-4">
      <p>{display(lessonContent.introduction?.english, lessonContent.introduction?.chinese)}</p>
      {lessonContent.notes && <p className="mt-2 text-sm text-muted-foreground">{display(lessonContent.notes.english, lessonContent.notes.chinese)}</p>}
    </div>}

    {!!lessonContent.letters?.length && <section>
      <h3 className="mb-3 text-lg font-semibold">{baseLetters.length ? (language === "en" ? "Ethiopic letter families · seven orders" : "埃塞俄比亚字母 · 七序排列") : (language === "en" ? "Labialized syllables" : "唇化音节")}</h3>
      {!!baseLetters.length && <div className="max-h-80 overflow-auto rounded-xl border p-2">
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {baseLetters.map((letter, idx) => <button key={`${letter.character}-${idx}`} onClick={() => setActiveLetter(idx)}
            data-testid={`letter-${idx}`} aria-pressed={activeLetter === idx}
            className={`rounded-lg border p-1 sm:p-2 text-center ${activeLetter === idx ? "border-primary bg-primary/10" : "bg-card hover:bg-muted"}`}>
            <span className="block text-xl">{letter.character}</span><span className="text-[10px] text-muted-foreground">{letter.transliteration}</span>
          </button>)}
        </div>
      </div>}
      {!!extraLetters.length && <div className="mt-4">
        <h4 className="mb-2 text-sm font-semibold">{language === "en" ? "Additional labialized forms" : "补充唇化字母"}</h4>
        <div className="grid grid-cols-7 gap-1.5">
          {extraLetters.map((letter, idx) => {
            const actualIndex = idx;
            return <button key={`${letter.character}-${actualIndex}`} onClick={() => setActiveLetter(actualIndex)}
              data-testid={`letter-${actualIndex}`} aria-pressed={activeLetter === actualIndex}
              className={`rounded-lg border p-1 sm:p-2 text-center ${activeLetter === actualIndex ? "border-primary bg-primary/10" : "bg-card hover:bg-muted"}`}>
              <span className="block text-xl">{letter.character}</span><span className="text-[10px] text-muted-foreground">{letter.transliteration}</span>
            </button>;
          })}
        </div>
      </div>}
      {lessonContent.letters[activeLetter] && <div className="mt-3 rounded-xl bg-muted/60 p-4" aria-live="polite">
        <span className="text-5xl">{lessonContent.letters[activeLetter].character}</span>
        <span className="ml-4 text-lg font-medium">{lessonContent.letters[activeLetter].transliteration}</span>
        <PronunciationButton text={lessonContent.letters[activeLetter].character} targetLanguage={track || "amharic"} />
      </div>}
    </section>}

    {!!vocab.length && <section>
      <div className="mb-3 flex items-center justify-between"><h3 className="text-lg font-semibold">{t("词汇 (Vocabulary)")}</h3><span className="text-xs text-muted-foreground">{vocabIndex + 1} / {vocab.length}</span></div>
      <div className="flex min-h-40 flex-col justify-between rounded-2xl bg-muted/60 p-5">
        <div>
          <p className="text-2xl font-semibold">{vocab[vocabIndex]?.term || vocab[vocabIndex]?.swahili}</p>
          {(vocab[vocabIndex]?.transliteration || vocab[vocabIndex]?.pronunciation) && <p className="mt-1 text-sm text-primary">{vocab[vocabIndex].transliteration || vocab[vocabIndex].pronunciation}</p>}
          <PronunciationButton text={vocab[vocabIndex]?.term || vocab[vocabIndex]?.swahili || ""} targetLanguage={track || "swahili"} />
        </div>
        {meaningVisible && <p className="mt-4 text-muted-foreground" aria-live="polite">{display(vocab[vocabIndex]?.english, vocab[vocabIndex]?.chinese)}</p>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="outline" disabled={vocabIndex === 0} onClick={() => setVocabCard(vocabIndex - 1)}>{language === "en" ? "Previous" : "上一张"}</Button>
        <Button variant="outline" data-testid="button-reveal-meaning" onClick={() => setMeaningVisible((visible) => !visible)}>
          {meaningVisible ? (language === "en" ? "Hide meaning" : "隐藏释义") : (language === "en" ? "Reveal meaning" : "查看释义")}
        </Button>
        <Button variant="outline" disabled={vocabIndex >= vocab.length - 1} onClick={() => setVocabCard(vocabIndex + 1)}>{language === "en" ? "Next card" : "下一张"}</Button>
      </div>
    </section>}

    {!!lessonContent.phrases?.length && <section>
      <h3 className="mb-3 text-lg font-semibold">{t("常用短语 (Phrases)")}</h3>
      <div className="space-y-2">{lessonContent.phrases.map((item, idx) => <div key={idx} className="rounded-md bg-muted p-3">
        <p className="text-lg font-medium">{item.swahili}</p><p className="text-muted-foreground">{display(item.english, item.chinese)}</p>
      </div>)}</div>
    </section>}

    {!!lessonContent.dialogues?.length && <section>
      <h3 className="mb-3 text-lg font-semibold">{t("对话 (Dialogues)")}</h3>
      <div className="space-y-4">{lessonContent.dialogues.map((dialogue, idx) => <div key={idx} className="space-y-2">
        {dialogue.lines.map((line, lineIdx) => <div key={lineIdx} className="rounded-md bg-muted p-3">
          <p className="mb-1 text-sm font-semibold text-primary">{line.speaker}:</p><p className="font-medium">{line.term || line.swahili}</p>
          {line.transliteration && <p className="text-sm text-primary">{line.transliteration}</p>}
          <p className="text-sm text-muted-foreground">{display(line.english, line.chinese)}</p>
        </div>)}
      </div>)}</div>
    </section>}

    {!!lessonContent.quizzes?.length && quiz && <section className="rounded-2xl border p-4">
      <div className="flex justify-between text-sm"><h3 className="font-semibold">{language === "en" ? "Quick check" : "随堂自测"}</h3><span>{quizIndex + 1} / {lessonContent.quizzes.length}</span></div>
      <p className="mt-3 font-medium">{display(quiz.question.english, quiz.question.chinese)}</p>
      <div className="mt-3 grid gap-2">{quiz.options.map((option, index) => <button key={index} data-testid={`quiz-option-${index}`} disabled={quizChecked || quizRevealed}
        aria-pressed={quizAnswer === index}
        className={`rounded-lg border p-3 text-left ${quizChecked && quizAnswer === index ? (index === quiz.answer ? "border-emerald-500 bg-emerald-50" : "border-rose-400 bg-rose-50") : ""}`}
        onClick={() => setQuizAnswer(index)}>{option}</button>)}</div>
      {quizChecked && quizAnswer !== null && <p className="mt-3 text-sm">{quizAnswer === quiz.answer ? (language === "en" ? "Correct. " : "回答正确。") : (language === "en" ? "Not quite. " : "再看一看。")}{display(quiz.explanation.english, quiz.explanation.chinese)}</p>}
      {quizRevealed && <p className="mt-3 rounded-lg bg-sky-50 p-3 text-sm text-sky-950">
        <strong>{language === "en" ? "Answer revealed:" : "答案已揭晓："}</strong> {quiz.options[quiz.answer]} · {display(quiz.explanation.english, quiz.explanation.chinese)}
      </p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {!quizChecked && !quizRevealed && <Button data-testid="button-check-answer" disabled={quizAnswer === null} onClick={() => setQuizChecked(true)}>{language === "en" ? "Check answer" : "检查答案"}</Button>}
        {!quizChecked && !quizRevealed && quizAnswer === null && <Button variant="outline" data-testid="button-reveal-answer" onClick={() => setQuizRevealed(true)}>{language === "en" ? "Reveal answer" : "查看答案"}</Button>}
        {(quizChecked || quizRevealed) && <Button data-testid={quizIndex + 1 === lessonContent.quizzes.length ? "button-retry-quiz" : "button-next-question"} variant="outline"
          onClick={() => { setQuizIndex(quizIndex + 1 === lessonContent.quizzes?.length ? 0 : quizIndex + 1); setQuizAnswer(null); setQuizChecked(false); setQuizRevealed(false); }}>
          {quizIndex + 1 === lessonContent.quizzes.length ? (language === "en" ? "Retry" : "重试") : (language === "en" ? "Next question" : "下一题")}
        </Button>}
      </div>
    </section>}
  </div>;
}
