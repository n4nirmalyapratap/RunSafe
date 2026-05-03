import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  RotateCcw,
} from "lucide-react";
import type { SopStep } from "@workspace/api-client-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sopTitle: string;
  sopDescription?: string | null;
  steps: SopStep[];
};

// Picks the best-sounding English voice that the browser ships for free.
// Chrome/Edge expose Google's neural voices; Safari has Siri voices.
// Falls back to whatever en-* voice is available.
function pickBestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;
  const en = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
  const pool = en.length > 0 ? en : voices;
  const preferred =
    pool.find((v) => /Google US English/i.test(v.name)) ||
    pool.find((v) => /Google.*English/i.test(v.name)) ||
    pool.find((v) => /Microsoft.*Aria|Microsoft.*Jenny|Microsoft.*Guy/i.test(v.name)) ||
    pool.find((v) => /Samantha|Karen|Daniel/i.test(v.name)) ||
    pool.find((v) => v.default) ||
    pool[0];
  return preferred ?? null;
}

export function SopVideoPlayer({
  open,
  onOpenChange,
  sopTitle,
  sopDescription,
  steps,
}: Props) {
  // Slide 0 is the title card; steps occupy 1..N.
  const slides = useMemo(
    () => [
      {
        kind: "title" as const,
        title: sopTitle,
        body: sopDescription ?? "Training walkthrough",
      },
      ...steps.map((s, i) => ({
        kind: "step" as const,
        index: i + 1,
        total: steps.length,
        title: s.title,
        body: s.description ?? "",
      })),
    ],
    [sopTitle, sopDescription, steps],
  );

  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState<string | undefined>(undefined);
  const [progress, setProgress] = useState(0); // 0..1 within current slide

  // Refs so we don't re-create timers on every state tick.
  const startedAtRef = useRef<number | null>(null);
  const elapsedBeforePauseRef = useRef(0);
  const tickRef = useRef<number | null>(null);
  const speechSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  // Fallback duration (no TTS): 6 seconds per step, 4 for title.
  const slideDuration = (i: number) => (slides[i]?.kind === "title" ? 4000 : 7000);

  // Load voices (Chrome populates them async).
  useEffect(() => {
    if (!speechSupported) return;
    const load = () => {
      const v = window.speechSynthesis.getVoices();
      setVoices(v);
      if (!voiceURI && v.length > 0) {
        const best = pickBestVoice(v);
        if (best) setVoiceURI(best.voiceURI);
      }
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null;
    };
    // We only want this on mount + when speechSupported flips.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speechSupported]);

  // Stop everything when the dialog closes.
  useEffect(() => {
    if (!open) {
      stopAll();
      setIdx(0);
      setProgress(0);
      setPlaying(false);
    }
    return () => stopAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const stopAll = () => {
    if (speechSupported) window.speechSynthesis.cancel();
    if (tickRef.current != null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    startedAtRef.current = null;
    elapsedBeforePauseRef.current = 0;
  };

  // Start (or resume) playback of the current slide.
  const playSlide = (slideIdx: number, fromStart: boolean) => {
    if (!slides[slideIdx]) return;
    stopAll();

    const slide = slides[slideIdx];
    const text =
      slide.kind === "title"
        ? `${slide.title}. ${slide.body}`
        : `Step ${slide.index} of ${slide.total}. ${slide.title}.${
            slide.body ? " " + slide.body : ""
          }`;

    const advance = () => {
      if (slideIdx + 1 < slides.length) {
        setIdx(slideIdx + 1);
        setProgress(0);
        playSlide(slideIdx + 1, true);
      } else {
        // End of video.
        setPlaying(false);
        setProgress(1);
      }
    };

    if (speechSupported && !muted) {
      // Use TTS — it drives advancement via onend.
      const u = new SpeechSynthesisUtterance(text);
      const v = voices.find((vv) => vv.voiceURI === voiceURI);
      if (v) u.voice = v;
      u.rate = 0.95;
      u.pitch = 1.0;
      u.volume = 1.0;

      // Approximate progress while speaking. Most browsers don't fire
      // boundary events reliably for all voices, so we estimate from
      // text length at ~14 chars/sec.
      const estMs = Math.max(2500, (text.length / 14) * 1000);
      startedAtRef.current = performance.now();
      elapsedBeforePauseRef.current = fromStart ? 0 : elapsedBeforePauseRef.current;
      tickRef.current = window.setInterval(() => {
        if (startedAtRef.current == null) return;
        const elapsed =
          performance.now() - startedAtRef.current + elapsedBeforePauseRef.current;
        setProgress(Math.min(1, elapsed / estMs));
      }, 100);

      u.onend = () => {
        if (tickRef.current != null) window.clearInterval(tickRef.current);
        setProgress(1);
        // Brief pause between slides for breath.
        window.setTimeout(() => {
          if (playing || fromStart) advance();
        }, 350);
      };
      u.onerror = () => {
        if (tickRef.current != null) window.clearInterval(tickRef.current);
        // If TTS fails, fall back to timed advancement.
        window.setTimeout(advance, slideDuration(slideIdx));
      };

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } else {
      // No TTS / muted — pure timed slideshow.
      const dur = slideDuration(slideIdx);
      startedAtRef.current = performance.now();
      tickRef.current = window.setInterval(() => {
        if (startedAtRef.current == null) return;
        const elapsed = performance.now() - startedAtRef.current;
        const p = Math.min(1, elapsed / dur);
        setProgress(p);
        if (p >= 1) {
          if (tickRef.current != null) window.clearInterval(tickRef.current);
          window.setTimeout(advance, 200);
        }
      }, 100);
    }
  };

  const handlePlayPause = () => {
    if (playing) {
      // Pause
      if (speechSupported) window.speechSynthesis.pause();
      if (tickRef.current != null) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
      if (startedAtRef.current != null) {
        elapsedBeforePauseRef.current += performance.now() - startedAtRef.current;
        startedAtRef.current = null;
      }
      setPlaying(false);
    } else {
      setPlaying(true);
      // If we finished, rewind to start.
      if (idx >= slides.length - 1 && progress >= 1) {
        setIdx(0);
        setProgress(0);
        playSlide(0, true);
        return;
      }
      // If TTS was paused, resume; otherwise start fresh on this slide.
      if (speechSupported && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        startedAtRef.current = performance.now();
        tickRef.current = window.setInterval(() => {
          if (startedAtRef.current == null) return;
          // re-estimate against the same text length
          const slide = slides[idx];
          const text =
            slide.kind === "title"
              ? slide.title + slide.body
              : slide.title + slide.body;
          const estMs = Math.max(2500, (text.length / 14) * 1000);
          const elapsed =
            performance.now() - startedAtRef.current + elapsedBeforePauseRef.current;
          setProgress(Math.min(1, elapsed / estMs));
        }, 100);
      } else {
        playSlide(idx, true);
      }
    }
  };

  const handleNext = () => {
    if (idx + 1 >= slides.length) return;
    const next = idx + 1;
    setIdx(next);
    setProgress(0);
    if (playing) playSlide(next, true);
    else stopAll();
  };

  const handlePrev = () => {
    if (idx <= 0) return;
    const prev = idx - 1;
    setIdx(prev);
    setProgress(0);
    if (playing) playSlide(prev, true);
    else stopAll();
  };

  const handleRestart = () => {
    setIdx(0);
    setProgress(0);
    setPlaying(true);
    playSlide(0, true);
  };

  const handleMuteToggle = () => {
    const next = !muted;
    setMuted(next);
    if (next && speechSupported) window.speechSynthesis.cancel();
    if (playing) {
      // restart current slide with new audio mode
      playSlide(idx, true);
    }
  };

  const slide = slides[idx];
  const overallPct = ((idx + progress) / slides.length) * 100;
  const noSteps = steps.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[92vh] p-0 bg-slate-950 border-slate-800 text-white overflow-hidden flex flex-col gap-0">
        <DialogTitle className="sr-only">Training video for {sopTitle}</DialogTitle>

        {/* Top bar — the Dialog provides its own close button in the top-right */}
        <div className="flex-shrink-0 flex items-center px-5 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            Training Mode
          </div>
        </div>

        {/* Slide stage */}
        <div className="relative flex-1 min-h-[260px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex items-center justify-center px-6 sm:px-12 py-8 sm:py-10 overflow-y-auto">
          {noSteps ? (
            <div className="text-center text-slate-400">
              <div className="text-lg font-semibold mb-2">No steps to play</div>
              <div className="text-sm">Add steps to this SOP first.</div>
            </div>
          ) : slide?.kind === "title" ? (
            <div className="text-center max-w-2xl">
              <div className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-blue-400 font-semibold mb-3 sm:mb-4">
                Standard Operating Procedure
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight leading-tight mb-3 sm:mb-4">
                {slide.title}
              </h2>
              {slide.body && (
                <p className="text-sm sm:text-base md:text-lg text-slate-300 leading-relaxed">
                  {slide.body}
                </p>
              )}
            </div>
          ) : (
            <div className="w-full max-w-3xl">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-base sm:text-lg">
                  {slide.index}
                </div>
                <div className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">
                  Step {slide.index} of {slide.total}
                </div>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-4xl font-bold tracking-tight leading-snug mb-3 sm:mb-4">
                {slide.title}
              </h2>
              {slide.body && (
                <p className="text-sm sm:text-base md:text-lg text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {slide.body}
                </p>
              )}
            </div>
          )}

          {/* Slide progress bar (within current slide) */}
          {!noSteps && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
              <div
                className="h-full bg-blue-500 transition-[width] duration-100 ease-linear"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Overall progress + controls */}
        <div className="flex-shrink-0 px-5 py-4 space-y-3 bg-slate-900 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400 w-16">
              {idx + 1} / {slides.length}
            </span>
            <Progress value={overallPct} className="h-1.5 flex-1 bg-slate-800" />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrev}
                disabled={idx === 0 || noSteps}
                className="text-white hover:bg-slate-800 hover:text-white"
                aria-label="Previous step"
              >
                <SkipBack className="h-5 w-5" />
              </Button>
              <Button
                onClick={handlePlayPause}
                disabled={noSteps}
                size="icon"
                className="bg-white text-slate-900 hover:bg-slate-200 h-11 w-11 rounded-full"
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                disabled={idx >= slides.length - 1 || noSteps}
                className="text-white hover:bg-slate-800 hover:text-white"
                aria-label="Next step"
              >
                <SkipForward className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRestart}
                disabled={noSteps}
                className="text-white hover:bg-slate-800 hover:text-white ml-1"
                aria-label="Restart"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleMuteToggle}
                disabled={!speechSupported}
                className="text-white hover:bg-slate-800 hover:text-white"
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted || !speechSupported ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
              {speechSupported && voices.length > 0 && (
                <Select value={voiceURI} onValueChange={setVoiceURI}>
                  <SelectTrigger className="h-9 w-[180px] bg-slate-800 border-slate-700 text-white text-xs">
                    <SelectValue placeholder="Voice" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {voices
                      .filter((v) => v.lang.toLowerCase().startsWith("en"))
                      .map((v) => (
                        <SelectItem key={v.voiceURI} value={v.voiceURI}>
                          {v.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {!speechSupported && (
            <div className="text-[11px] text-amber-400/80 text-center">
              Your browser doesn't support speech synthesis — slides will auto-advance silently.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
