import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { AppNav } from "@/components/AppNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Circle, Clock, PlayCircle, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

type Lesson = { _id: string; level: string; title: string; description: string; youtube_id: string; order_index: number; duration_min: number };
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
  
  // Custom Curriculum Management State
  const [showAddLessonModal, setShowAddLessonModal] = useState(false);
  
  // Modal form inputs
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonDescription, setNewLessonDescription] = useState("");
  const [newLessonYoutubeUrl, setNewLessonYoutubeUrl] = useState("");
  const [newLessonLevel, setNewLessonLevel] = useState<typeof LEVELS[number]>("Beginner");

  const isAdminUser = user?.role === "admin";

  const fetchData = async () => {
    if (!user) return;
    try {
      const [dbLessons, dbProgress] = await Promise.all([
        apiFetch("/learn/lessons"),
        apiFetch("/learn/progress")
      ]);
      setLessons(dbLessons);
      
      const progressMapping: Record<string, Progress> = {};
      dbProgress.forEach((progressRecord: any) => (progressMapping[progressRecord.lesson_id] = progressRecord));
      setProgress(progressMapping);
    } catch (error: unknown) {
      console.error("Error fetching learning data:", error);
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, [user]);

  /**
   * Admin function to completely remove a lesson from the DB.
   */
  const handleRemoveLesson = async (lessonId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!confirm("Are you sure you want to permanently delete this lesson?")) return;
    try {
      await apiFetch(`/learn/lessons/${lessonId}`, { method: "DELETE" });
      setLessons(prev => prev.filter(l => l._id !== lessonId));
      toast.success("Lesson successfully removed.");
    } catch (error: any) {
      toast.error(error.message || "Failed to remove lesson.");
    }
  };

  /**
   * Submits the custom lesson form to the DB.
   */
  const handleAddCustomLesson = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newLessonTitle || !newLessonYoutubeUrl) return;
    
    // Extract the YouTube Video ID
    const parsedYoutubeId = newLessonYoutubeUrl.includes("v=") 
      ? newLessonYoutubeUrl.split("v=")[1].split("&")[0] 
      : newLessonYoutubeUrl.split("/").pop() || newLessonYoutubeUrl;
    
    const payload = {
      title: newLessonTitle,
      description: newLessonDescription,
      youtube_id: parsedYoutubeId,
      level: newLessonLevel,
      duration_min: Math.floor(Math.random() * 10) + 5,
    };
    
    try {
      const newLesson = await apiFetch("/learn/lessons", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setLessons(prev => [...prev, newLesson]);
      
      setShowAddLessonModal(false);
      setNewLessonTitle(""); 
      setNewLessonDescription(""); 
      setNewLessonYoutubeUrl("");
      toast.success("Lesson added successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to add lesson.");
    }
  };

  /**
   * Separates all lessons into Beginner/Intermediate/Advanced buckets.
   */
  const categorizedLessons = useMemo(() => {
    const categories: Record<string, Lesson[]> = { Beginner: [], Intermediate: [], Advanced: [] };
    for (const lessonItem of lessons) {
      if (categories[lessonItem.level]) {
        categories[lessonItem.level].push(lessonItem);
      }
    }
    return categories;
  }, [lessons]);

  const totalActiveLessonCount = lessons.length;
  
  const completedLessonCount = useMemo(() => {
    return Object.keys(progress).filter(lessonId => {
      const lessonExistsInActive = lessons.find(lesson => lesson._id === lessonId);
      return progress[lessonId].completed && lessonExistsInActive != null;
    }).length;
  }, [progress, lessons]);
  
  const completionPercentage = totalActiveLessonCount ? Math.round((completedLessonCount / totalActiveLessonCount) * 100) : 0;

  /**
   * Tracks a lesson as 'completed' in the user's database.
   */
  const handleMarkLessonComplete = async (lesson: Lesson) => {
    if (!user) return;
    try {
      await apiFetch("/learn/progress", {
        method: "POST",
        body: JSON.stringify({ id: lesson._id, completed: true }),
      });
      setProgress(prev => ({ ...prev, [lesson._id]: { lesson_id: lesson._id, completed: true, position_seconds: 0 } }));
      toast.success("Lesson marked as complete!");
    } catch (error: unknown) {
      toast.error("Failed to mark complete: " + (error as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppNav />
      <main className="flex-1 container py-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold">Learn to trade</h1>
            <p className="text-muted-foreground text-sm mt-1">Structured curriculum — go at your own pace.</p>
            {isAdminUser && (
              <Button onClick={() => setShowAddLessonModal(true)} size="sm" variant="outline" className="mt-4 gap-1.5 border-border">
                <Plus className="w-3.5 h-3.5"/> Add Lesson
              </Button>
            )}
          </div>
          <div className="rounded-xl bg-card-grad border border-border/60 px-5 py-3 min-w-[260px]">
            <div className="text-xs text-muted-foreground">Overall progress</div>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-gold transition-all" style={{ width: `${completionPercentage}%` }} />
              </div>
              <span className="font-mono-num text-sm text-gold">{completionPercentage}%</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">{completedLessonCount} / {totalActiveLessonCount} lessons</div>
          </div>
        </div>

        <div className="space-y-10">
          {LEVELS.map((levelName) => {
            const levelLessons = categorizedLessons[levelName] ?? [];
            if (levelLessons.length === 0) return null;
            return (
              <section key={levelName}>
                <div className="flex items-baseline gap-3 mb-4">
                  <h2 className="font-display text-xl font-bold">{levelName}</h2>
                  <span className="text-xs text-muted-foreground">{levelLessons.length} lessons</span>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {levelLessons.map((lessonItem) => {
                    const isCompleted = progress[lessonItem._id]?.completed;
                    return (
                      <div key={lessonItem._id} className="rounded-2xl bg-card-grad border border-border/60 p-5 flex flex-col shadow-elevated">
                        <div className="flex items-start gap-2">
                          {isCompleted ? <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" /> : <Circle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />}
                          <div className="flex-1">
                            <h3 className="font-display font-semibold leading-snug">{lessonItem.title}</h3>
                            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">{lessonItem.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {lessonItem.duration_min} min</span>
                          <div className="flex items-center gap-2">
                            {isAdminUser && (
                              <Button size="sm" variant="ghost" className="h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={(e) => handleRemoveLesson(lessonItem._id, e)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                            <Button size="sm" variant={isCompleted ? "outline" : "hero"} onClick={() => setActive(lessonItem)}>
                              <PlayCircle className="w-4 h-4" /> {isCompleted ? "Rewatch" : "Start"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </main>

      {/* Add Custom Lesson Modal */}
      {showAddLessonModal && (
        <div className="fixed inset-0 z-50 bg-black/80 grid place-items-center p-4" onClick={() => setShowAddLessonModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-card border border-border/60 overflow-hidden shadow-elevated" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
              <h3 className="font-display font-semibold">Add Custom Lesson</h3>
              <button onClick={() => setShowAddLessonModal(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddCustomLesson} className="p-5 space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Lesson Title</label>
                <Input value={newLessonTitle} onChange={e => setNewLessonTitle(e.target.value)} placeholder="E.g. Advanced Options Strategies" required />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                <Input value={newLessonDescription} onChange={e => setNewLessonDescription(e.target.value)} placeholder="A brief summary..." />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">YouTube URL or ID</label>
                <Input value={newLessonYoutubeUrl} onChange={e => setNewLessonYoutubeUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." required />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Difficulty Level</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newLessonLevel} 
                  onChange={e => setNewLessonLevel(e.target.value as any)}
                >
                  {LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
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
                key={active._id}
                width="100%" height="100%"
                src={`https://www.youtube.com/embed/${FALLBACK_VIDEOS[active.youtube_id] || active.youtube_id}?rel=0`}
                title={active.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="p-5 flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground flex-1">{active.description}</p>
              <Button variant={progress[active._id]?.completed ? "outline" : "hero"} onClick={() => handleMarkLessonComplete(active)}>
                <CheckCircle2 className="w-4 h-4" /> {progress[active._id]?.completed ? "Completed" : "Mark complete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Learn;
