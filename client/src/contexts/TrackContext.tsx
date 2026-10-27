import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type TrackLanguage = "amharic" | "swahili";
type TrackContextValue = {
  track: TrackLanguage | null;
  setTrack: (track: TrackLanguage) => void;
  practiceLessonId: string | null;
  setPracticeLessonId: (lessonId: string | null) => void;
};
const TrackContext = createContext<TrackContextValue | null>(null);

export function TrackProvider({ children }: { children: ReactNode }) {
  const [track, updateTrack] = useState<TrackLanguage | null>(null);
  const [practiceLessonId, setPracticeLessonId] = useState<string | null>(null);
  const setTrack = (value: TrackLanguage) => {
    updateTrack(value);
    setPracticeLessonId(null);
  };
  const value = useMemo(() => ({ track, setTrack, practiceLessonId, setPracticeLessonId }), [track, practiceLessonId]);
  return <TrackContext.Provider value={value}>{children}</TrackContext.Provider>;
}

export function useTrack() {
  const value = useContext(TrackContext);
  if (!value) throw new Error("useTrack must be used inside TrackProvider");
  return value;
}
