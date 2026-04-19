import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppNav } from "@/components/AppNav";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Clock, PlayCircle, X } from "lucide-react";
import { toast } from "sonner";

type Lesson = { id: string; level: string; title: string; description: string; youtube_id: string; order_index: number; duration_min: number };
type Progress = { lesson_id: string; completed: boolean; position_seconds: number };

const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;

const Learn = () => {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [active, setActive] = useState<Lesson | null>(null);

  const refresh = async () => {
    const [{ data: ls }, { data: prog }] = await Promise.all([
      supabase.from("lessons").select("*").order("level").order("order_index"),
      user ? supabase.from("lesson_progress").select("*") : Promise.resolve({ data: [] as any }),
    ]);
    setLessons(ls ?? []);
    const map: Record<string, Progress> = {};
    (prog ?? []).forEach((p: any) => (map[p.lesson_id] = p));
    setProgress(map);
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [user]);

  const grouped = useMemo(() => {
    const g: Record<string, Lesson[]> = { Beginner: [], Intermediate: [], Advanced: [] };
    for (const l of lessons) (g[l.level] ?? (g[l.level] = [])).push(l);
    return g;
  }, [lessons]);

  const completedCount = Object.values(progress).filter((p) => p.completed).length;
  const pct = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0;

  const markComplete = async (lesson: Lesson) => {
    if (!user) return;
    const { error } = await supabase.from("lesson_progress").upsert(
      { user_id: user.id, lesson_id: lesson.id, completed: true, position_seconds: 0, updated_at: new Date().toISOString() },
      { onConflict: "user_id,lesson_id" },
    );
    if (error) { toast.error(error.message); return; }
    toast.success("Marked complete!");
    refresh();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppNav />
      <main className="flex-1 container py-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold">Learn to trade</h1>
            <p className="text-muted-foreground text-sm mt-1">Structured curriculum — go at your own pace.</p>
          </div>
          <div className="rounded-xl bg-card-grad border border-border/60 px-5 py-3 min-w-[260px]">
            <div className="text-xs text-muted-foreground">Overall progress</div>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-gold transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="font-mono-num text-sm text-gold">{pct}%</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">{completedCount} / {lessons.length} lessons</div>
          </div>
        </div>

        <div className="space-y-10">
          {LEVELS.map((level) => (
            <section key={level}>
              <div className="flex items-baseline gap-3 mb-4">
                <h2 className="font-display text-xl font-bold">{level}</h2>
                <span className="text-xs text-muted-foreground">{grouped[level]?.length ?? 0} lessons</span>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(grouped[level] ?? []).map((l) => {
                  const done = progress[l.id]?.completed;
                  return (
                    <div key={l.id} className="rounded-2xl bg-card-grad border border-border/60 p-5 flex flex-col shadow-elevated">
                      <div className="flex items-start gap-2">
                        {done ? <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" /> : <Circle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />}
                        <div className="flex-1">
                          <h3 className="font-display font-semibold leading-snug">{l.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">{l.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {l.duration_min} min</span>
                        <Button size="sm" variant={done ? "outline" : "hero"} onClick={() => setActive(l)}>
                          <PlayCircle className="w-4 h-4" /> {done ? "Rewatch" : "Start"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>

      {active && (
        <div className="fixed inset-0 z-50 bg-black/80 grid place-items-center p-4" onClick={() => setActive(null)}>
          <div className="w-full max-w-3xl rounded-2xl bg-card border border-border/60 overflow-hidden shadow-elevated" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
              <div>
                <div className="text-xs text-gold uppercase tracking-wider">{active.level}</div>
                <h3 className="font-display font-semibold">{active.title}</h3>
              </div>
              <button onClick={() => setActive(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="aspect-video bg-black">
              <iframe
                key={active.id}
                width="100%" height="100%"
                src={`https://www.youtube.com/embed/${active.youtube_id}?rel=0`}
                title={active.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="p-5 flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground flex-1">{active.description}</p>
              <Button variant={progress[active.id]?.completed ? "outline" : "hero"} onClick={() => markComplete(active)}>
                <CheckCircle2 className="w-4 h-4" /> {progress[active.id]?.completed ? "Completed" : "Mark complete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Learn;
