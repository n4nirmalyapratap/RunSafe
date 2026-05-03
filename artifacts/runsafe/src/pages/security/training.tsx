import { AppLayout } from "@/components/layout";
import {
  useGetTrainingLessons,
  getGetTrainingLessonsQueryKey,
  useGetTrainingLesson,
  getGetTrainingLessonQueryKey,
  useCompleteTrainingLesson,
  getGetSecuritySummaryQueryKey,
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, GraduationCap, CheckCircle2, Clock, ChevronRight } from "lucide-react";

function LessonRunner({
  lessonId,
  onClose,
}: {
  lessonId: number;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: lesson } = useGetTrainingLesson(lessonId, {
    query: { queryKey: getGetTrainingLessonQueryKey(lessonId) },
  });
  const complete = useCompleteTrainingLesson();
  const [phase, setPhase] = useState<"learn" | "quiz" | "done">("learn");
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useState<number | null>(null);

  if (!lesson) return <Skeleton className="h-64" />;

  if (phase === "learn") {
    const step = lesson.steps[stepIdx];
    if (!step) return null;
    const isLast = stepIdx === lesson.steps.length - 1;
    return (
      <div>
        <div className="text-xs text-muted-foreground mb-2">
          Step {stepIdx + 1} of {lesson.steps.length}
        </div>
        <Progress value={((stepIdx + 1) / lesson.steps.length) * 100} className="mb-4" />
        <h3 className="text-xl font-bold mb-3">{step.title}</h3>
        <p className="text-base leading-relaxed mb-6 whitespace-pre-line">{step.body}</p>
        <div className="flex justify-between">
          <Button variant="outline" disabled={stepIdx === 0} onClick={() => setStepIdx(stepIdx - 1)}>
            Previous
          </Button>
          {!isLast ? (
            <Button onClick={() => setStepIdx(stepIdx + 1)}>Next</Button>
          ) : lesson.quiz.length > 0 ? (
            <Button onClick={() => { setPhase("quiz"); setStepIdx(0); }}>Start quiz</Button>
          ) : (
            <Button onClick={async () => {
              await complete.mutateAsync({ lessonId, data: { score: 100 } });
              qc.invalidateQueries({ queryKey: getGetTrainingLessonsQueryKey() });
              qc.invalidateQueries({ queryKey: getGetSecuritySummaryQueryKey() });
              setScore(100);
              setPhase("done");
            }}>
              Mark complete
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (phase === "quiz") {
    return (
      <div>
        <div className="text-xs text-muted-foreground mb-3">
          Quick check ({lesson.quiz.length} question{lesson.quiz.length === 1 ? "" : "s"})
        </div>
        <div className="space-y-5">
          {lesson.quiz.map((q, qi) => (
            <div key={qi}>
              <div className="font-medium mb-2">
                {qi + 1}. {q.q}
              </div>
              <div className="space-y-2">
                {q.choices.map((c, ci) => (
                  <button
                    key={ci}
                    onClick={() => setAnswers({ ...answers, [qi]: ci })}
                    className={`w-full text-left p-3 rounded border text-sm transition-colors ${
                      answers[qi] === ci
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <Button
            disabled={Object.keys(answers).length !== lesson.quiz.length || complete.isPending}
            onClick={async () => {
              const correct = lesson.quiz.filter((q, i) => answers[i] === q.answerIdx).length;
              const final = Math.round((correct / lesson.quiz.length) * 100);
              try {
                await complete.mutateAsync({ lessonId, data: { score: final } });
                qc.invalidateQueries({ queryKey: getGetTrainingLessonsQueryKey() });
                qc.invalidateQueries({ queryKey: getGetSecuritySummaryQueryKey() });
                setScore(final);
                setPhase("done");
              } catch {
                toast({ title: "Could not save", variant: "destructive" });
              }
            }}
          >
            Submit answers
          </Button>
        </div>
      </div>
    );
  }

  // done
  return (
    <div className="text-center py-6">
      <div className="h-16 w-16 mx-auto rounded-full bg-green-500/15 flex items-center justify-center mb-4">
        <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
      </div>
      <h3 className="text-xl font-bold mb-2">Lesson complete</h3>
      <p className="text-muted-foreground mb-2">
        You scored <span className="font-semibold text-foreground">{score}%</span>
      </p>
      <p className="text-sm text-muted-foreground mb-6">
        {(score ?? 0) >= 80 ? "Great work — that one stuck." : "Worth a re-read. The steps are still here whenever you want to brush up."}
      </p>
      <Button onClick={onClose}>Done</Button>
    </div>
  );
}

export function SecurityTraining() {
  const { data: lessons, isLoading } = useGetTrainingLessons({
    query: { queryKey: getGetTrainingLessonsQueryKey() },
  });
  const [openLesson, setOpenLesson] = useState<number | null>(null);

  return (
    <AppLayout>
      <Link href="/security" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-3">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Security
      </Link>
      <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
        <GraduationCap className="h-6 w-6 text-primary" />
        Security Awareness Training
      </h1>
      <p className="text-muted-foreground mb-6">
        Short, plain-English lessons everyone on your team should take once. Auto-tracked.
      </p>

      {isLoading && <Skeleton className="h-64" />}
      {!isLoading && lessons && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lessons.map((l) => (
            <Card
              key={l.id}
              className="p-5 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setOpenLesson(l.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <Badge variant="outline" className="capitalize">{l.category}</Badge>
                {l.completedByMe && (
                  <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30 gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Done
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold mb-2">{l.title}</h3>
              {l.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{l.description}</p>
              )}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {l.durationMinutes} min
                </span>
                <span>
                  {l.completionCount} / {l.totalMembers} on team
                </span>
              </div>
              <div className="mt-3 flex items-center text-sm text-primary font-medium">
                {l.completedByMe ? "Review" : "Start"} <ChevronRight className="h-4 w-4 ml-1" />
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={openLesson !== null} onOpenChange={(o) => !o && setOpenLesson(null)}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lesson</DialogTitle>
          </DialogHeader>
          {openLesson !== null && (
            <LessonRunner lessonId={openLesson} onClose={() => setOpenLesson(null)} />
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
