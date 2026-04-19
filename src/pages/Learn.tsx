import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppNav } from "@/components/AppNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Circle, Clock, PlayCircle, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

type Lesson = { id: string; level: string; title: string; description: string; youtube_id: string; order_index: number; duration_min: number };
type Progress = { lesson_id: string; completed: boolean; position_seconds: number };

const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;

// Hardcoded fallback for known broken database dummy YouTube IDs
const FALLBACK_VIDEOS: Record<string, string> = {
  "Xn7KWR9EOGQ": "bH_EitZ0bQ0",
  "AqOyW0GFlhM": "p7HKvqRI_Bo",
  "rtHWvHbLmZk": "WEDbNihbgQ0",
  "JqXULuWZXZc": "B43YEW2FvDs",
  "WN8YM0DVybg": "Z9b0S9v5Hcw",
  "uvoiHcfp9DE": "P1u_ZlS0L4M",
  "QSAJ0qYWAac": "YQ_xWvX1n9g",
  "z3kBnB-Iw3o": "v=dQw4w9WgXcQ",
  "q9rVqOV3BSY": "p7HKvqRI_Bo",
};

const Learn = () => {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [active, setActive] = useState<Lesson | null>(null);
  
  // Custom Curriculum State
  const [showAdd, setShowAdd] = useState(false);
  const [customLessons, setCustomLessons] = useState<Lesson[]>(() => {
    const s = localStorage.getItem("custom_lessons");
    return s ? JSON.parse(s) : [];
  });
  const [hiddenIds, setHiddenIds] = useState<string[]>(() => {
    const s = localStorage.getItem("hidden_lessons");
    return s ? JSON.parse(s) : [];
  });

  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newYt, setNewYt] = useState("");
  const [newLevel, setNewLevel] = useState<typeof LEVELS[number]>("Beginner");

  const isAdmin = user?.email === "admin@learnchart.com";

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

  const removeLesson = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (id.startsWith("custom-")) {
      const nw = customLessons.filter(x => x.id !== id);
      setCustomLessons(nw);
      localStorage.setItem("custom_lessons", JSON.stringify(nw));
    } else {
      const nw = [...hiddenIds, id];
      setHiddenIds(nw);
      localStorage.setItem("hidden_lessons", JSON.stringify(nw));
    }
    toast.success("Lesson removed.");
  };

  const addCustomLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newYt) return;
    const cleanYt = newYt.includes("v=") ? newYt.split("v=")[1].split("&")[0] : newYt.split("/").pop() || newYt;
    
    const nw: Lesson = {
      id: `custom-${Date.now()}`,
      title: newTitle,
      description: newDesc,
      youtube_id: cleanYt,
      level: newLevel,
      duration_min: Math.floor(Math.random() * 10) + 5,
      order_index: 99
    };
    
    const combined = [...customLessons, nw];
    setCustomLessons(combined);
    localStorage.setItem("custom_lessons", JSON.stringify(combined));
    setShowAdd(false);
    setNewTitle(""); setNewDesc(""); setNewYt("");
    toast.success("Custom lesson added!");
  };

  const grouped = useMemo(() => {
    const g: Record<string, Lesson[]> = { Beginner: [], Intermediate: [], Advanced: [] };
    const all = [...lessons.filter(l => !hiddenIds.includes(l.id)), ...customLessons];
    for (const l of all) {
      if (g[l.level]) g[l.level].push(l);
    }
    return g;
  }, [lessons, customLessons, hiddenIds]);

  const activeCount = useMemo(() => Object.values(grouped).flat().length, [grouped]);
  const completedCount = useMemo(() => Object.keys(progress).filter(id => {
    const l = Object.values(grouped).flat().find(x => x.id === id);
    return progress[id].completed && l != null;
  }).length, [progress, grouped]);
  
  const pct = activeCount ? Math.round((completedCount / activeCount) * 100) : 0;

  const markComplete = async (lesson: Lesson) => {
    if (!user) return;
    if (lesson.id.startsWith("custom-")) {
      setProgress(p => ({ ...p, [lesson.id]: { lesson_id: lesson.id, completed: true, position_seconds: 0 } }));
      toast.success("Marked complete!");
      return;
    }
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
            {isAdmin && (
              <Button onClick={() => setShowAdd(true)} size="sm" variant="outline" className="mt-4 gap-1.5 border-border">
                <Plus className="w-3.5 h-3.5"/> Add Custom Lesson
              </Button>
            )}
          </div>
          <div className="rounded-xl bg-card-grad border border-border/60 px-5 py-3 min-w-[260px]">
            <div className="text-xs text-muted-foreground">Overall progress</div>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-gold transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="font-mono-num text-sm text-gold">{pct}%</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">{completedCount} / {activeCount} lessons</div>
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
                        <div className="flex items-center gap-2">
                          {isAdmin && (
                            <Button size="sm" variant="ghost" className="h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={(e) => removeLesson(l.id, e)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                          <Button size="sm" variant={done ? "outline" : "hero"} onClick={() => setActive(l)}>
                            <PlayCircle className="w-4 h-4" /> {done ? "Rewatch" : "Start"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>

      {/* Add Custom Lesson Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/80 grid place-items-center p-4" onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-md rounded-2xl bg-card border border-border/60 overflow-hidden shadow-elevated" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
              <h3 className="font-display font-semibold">Add Custom Lesson</h3>
              <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={addCustomLesson} className="p-5 space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Lesson Title</label>
                <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="E.g. Advanced Options Strategies" required />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                <Input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="A brief summary..." />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">YouTube URL or ID</label>
                <Input value={newYt} onChange={e => setNewYt(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." required />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Difficulty Level</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newLevel} 
                  onChange={e => setNewLevel(e.target.value as any)}
                >
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <Button type="submit" variant="hero" className="w-full">Add Lesson</Button>
            </form>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
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
                src={`https://www.youtube.com/embed/${FALLBACK_VIDEOS[active.youtube_id] || active.youtube_id}?rel=0`}
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
