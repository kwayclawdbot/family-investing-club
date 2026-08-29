"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, cx } from "@/components/ui";
import { adminApi } from "@/lib/live/client-admin";
import type { CourseDetail, CourseRow, LessonRow, ModuleRow } from "@/lib/live/admin-crm";
import { Chip, Label, Notice, Panel, Table, Td, Th, field, textarea } from "./ui";

const TIERS = ["free", "challenge", "academy"];
const TRACKS = ["all", "kids", "teens", "adults"];
const PROVIDERS = ["", "youtube", "html", "bunny", "mux"];

type CourseForm = { title: string; slug: string; description: string; thumbnail_url: string; min_tier: string; program: string; sort_order: number; published: boolean };
const emptyCourse: CourseForm = { title: "", slug: "", description: "", thumbnail_url: "", min_tier: "challenge", program: "", sort_order: 0, published: false };

/** Create / edit a course (metadata). */
export function CourseForm({ course, onClose }: { course?: CourseRow | CourseDetail["course"]; onClose?: () => void }) {
  const router = useRouter();
  const [f, setF] = useState<CourseForm>(course ? { title: course.title, slug: course.slug, description: course.description ?? "", thumbnail_url: course.thumbnail_url ?? "", min_tier: course.min_tier ?? "challenge", program: course.program ?? "", sort_order: course.sort_order, published: course.published } : emptyCourse);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const set = <K extends keyof CourseForm>(k: K, v: CourseForm[K]) => setF((p) => ({ ...p, [k]: v }));
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr(null);
    const r = await adminApi.saveCourse({ ...(course ? { id: course.id } : {}), ...f, program: f.program || null });
    setBusy(false);
    if (!r.ok) { setErr(r.error); return; }
    if (!course) router.push(`/admin/courses/${r.id}`); else { router.refresh(); onClose?.(); }
  };
  return (
    <form onSubmit={save} className="grid grid-cols-2 gap-3">
      <div><Label>Title</Label><input required value={f.title} onChange={(e) => { set("title", e.target.value); if (!course) set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")); }} className={field} /></div>
      <div><Label>Slug</Label><input required value={f.slug} onChange={(e) => set("slug", e.target.value)} className={field} /></div>
      <div className="col-span-2"><Label>Description</Label><textarea value={f.description} onChange={(e) => set("description", e.target.value)} className={cx(textarea, "min-h-[72px]")} /></div>
      <div><Label>Thumbnail URL</Label><input value={f.thumbnail_url} onChange={(e) => set("thumbnail_url", e.target.value)} className={field} /></div>
      <div><Label>Program</Label><input value={f.program} onChange={(e) => set("program", e.target.value)} className={field} placeholder="fic / fta / challenge" /></div>
      <div><Label>Minimum tier</Label><select value={f.min_tier} onChange={(e) => set("min_tier", e.target.value)} className={field}>{TIERS.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
      <div><Label>Sort order</Label><input type="number" value={f.sort_order} onChange={(e) => set("sort_order", Number(e.target.value))} className={field} /></div>
      <label className="col-span-2 flex items-center gap-2 text-[13px] font-extrabold text-ink"><input type="checkbox" checked={f.published} onChange={(e) => set("published", e.target.checked)} /> Published (visible to members)</label>
      {err && <div className="col-span-2"><Notice tone="red">{err}</Notice></div>}
      <div className="col-span-2 flex justify-end gap-2">{onClose && <Button size="md" variant="secondary" type="button" onClick={onClose}>Cancel</Button>}<Button size="md" variant="green" type="submit" disabled={busy}>{busy ? "Saving…" : course ? "Save course" : "Create course"}</Button></div>
    </form>
  );
}

export function NewCourseButton() {
  const [open, setOpen] = useState(false);
  if (!open) return <Button size="md" onClick={() => setOpen(true)}>New course</Button>;
  return <Panel title="New course" className="w-full max-w-[720px]"><CourseForm onClose={() => setOpen(false)} /></Panel>;
}

export function CourseRowActions({ course }: { course: CourseRow }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const toggle = async () => { setBusy(true); const r = await adminApi.saveCourse({ id: course.id, published: !course.published }); setBusy(false); if (!r.ok) alert(r.error); else router.refresh(); };
  const del = async () => { if (!confirm(`Delete "${course.title}"?`)) return; setBusy(true); const r = await adminApi.deleteCourse(course.id); setBusy(false); if (!r.ok) alert(r.error); else router.refresh(); };
  return (
    <div className="flex items-center justify-end gap-1.5">
      <Button size="sm" variant={course.published ? "secondary" : "green"} onClick={toggle} disabled={busy}>{course.published ? "Unpublish" : "Publish"}</Button>
      <Link href={`/admin/courses/${course.id}`} className="h-[30px] px-3 rounded-[10px] text-[12px] font-black inline-flex items-center bg-card border border-line text-ink">Edit</Link>
      <button type="button" onClick={del} disabled={busy || course.module_count > 0} title={course.module_count > 0 ? "Remove modules first" : "Delete"} className="h-[30px] px-2.5 rounded-[10px] text-[12px] font-black text-red disabled:opacity-40">Delete</button>
    </div>
  );
}

/* ── Course detail: modules + lessons ─────────────────────────────────────── */

type ModForm = { title: string; description: string; track: string; sort_order: number };
type LessonForm = { title: string; description: string; video_provider: string; video_id: string; video_duration_sec: number; drip_week: number; has_quiz: boolean; is_free: boolean; sort_order: number; est_minutes: number; lesson_xp: number; retired: boolean };
const lessonForm = (l?: LessonRow, n = 0): LessonForm => ({ title: l?.title ?? "", description: l?.description ?? "", video_provider: l?.video_provider ?? "", video_id: l?.video_id ?? "", video_duration_sec: l?.video_duration_sec ?? 0, drip_week: l?.drip_week ?? 0, has_quiz: l?.has_quiz ?? false, is_free: l?.is_free ?? false, sort_order: l?.sort_order ?? n, est_minutes: l?.est_minutes ?? 0, lesson_xp: l?.lesson_xp ?? 0, retired: l?.retired ?? false });

export function CourseEditor({ detail }: { detail: CourseDetail }) {
  const router = useRouter();
  const [editCourse, setEditCourse] = useState(false);
  const [modEdit, setModEdit] = useState<{ id?: string; f: ModForm } | null>(null);
  const [lessonEdit, setLessonEdit] = useState<{ id?: string; module_id: string; f: LessonForm } | null>(null);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const c = detail.course;

  const saveMod = async () => {
    if (!modEdit) return; setBusy(true); setErr(null);
    const r = await adminApi.saveModule({ ...(modEdit.id ? { id: modEdit.id } : { course_id: c.id }), ...modEdit.f });
    setBusy(false); if (!r.ok) { setErr(r.error); return; } setModEdit(null); router.refresh();
  };
  const delMod = async (m: ModuleRow) => { if (!confirm(`Delete module "${m.title}"?`)) return; const r = await adminApi.deleteModule(m.id); if (!r.ok) alert(r.error); else router.refresh(); };
  const saveLesson = async () => {
    if (!lessonEdit) return; setBusy(true); setErr(null);
    const r = await adminApi.saveLesson({ ...(lessonEdit.id ? { id: lessonEdit.id } : {}), module_id: lessonEdit.module_id, ...lessonEdit.f, video_provider: lessonEdit.f.video_provider || null });
    setBusy(false); if (!r.ok) { setErr(r.error); return; } setLessonEdit(null); router.refresh();
  };
  const delLesson = async (l: LessonRow) => { if (!confirm(`Delete "${l.title}"? Lessons with member progress are retired instead of deleted.`)) return; const r = await adminApi.deleteLesson(l.id); if (!r.ok) alert(r.error); else router.refresh(); };

  return (
    <div className="space-y-4">
      <Panel title="Course" action={<Button size="sm" variant="secondary" onClick={() => setEditCourse((v) => !v)}>{editCourse ? "Close" : "Edit details"}</Button>}>
        {editCourse ? <CourseForm course={c} onClose={() => setEditCourse(false)} /> : (
          <div className="flex items-start gap-4 flex-wrap">
            <div className="flex-1 min-w-[240px]"><div className="text-[18px] font-black text-ink">{c.title}</div><div className="text-[12.5px] font-bold text-ink-3">/{c.slug}</div>{c.description && <p className="mt-2 text-[13px] font-bold text-ink-2 leading-[1.5]">{c.description}</p>}</div>
            <div className="flex items-center gap-1.5"><Chip tone={c.published ? "green" : "muted"}>{c.published ? "published" : "draft"}</Chip><Chip tone="gold">{c.min_tier ?? "—"}</Chip>{c.program && <Chip tone="purple">{c.program}</Chip>}<Chip>order {c.sort_order}</Chip></div>
          </div>
        )}
      </Panel>

      {err && <Notice tone="red">{err}</Notice>}

      {detail.modules.map((m) => (
        <Panel key={m.id} title={<span className="normal-case tracking-normal text-[14px] text-ink">{m.sort_order + 1}. {m.title} <span className="text-ink-4 font-bold">· {m.track ?? "all"} · {m.lessons.length} lesson{m.lessons.length === 1 ? "" : "s"}</span></span>}
          action={<div className="flex gap-1.5"><Button size="sm" variant="secondary" onClick={() => setLessonEdit({ module_id: m.id, f: lessonForm(undefined, m.lessons.length) })}>Add lesson</Button><Button size="sm" variant="secondary" onClick={() => setModEdit({ id: m.id, f: { title: m.title, description: m.description ?? "", track: m.track ?? "all", sort_order: m.sort_order } })}>Edit</Button><button type="button" onClick={() => delMod(m)} disabled={m.lessons.length > 0} title={m.lessons.length ? "Move or retire lessons first" : "Delete module"} className="h-[30px] px-2 text-[12px] font-black text-red disabled:opacity-40">Delete</button></div>}>
          {modEdit?.id === m.id && <ModuleFormFields f={modEdit.f} set={(f) => setModEdit({ id: m.id, f })} onSave={saveMod} onCancel={() => setModEdit(null)} busy={busy} />}
          {m.lessons.length === 0 ? <p className="text-[12.5px] font-bold text-ink-4">No lessons yet.</p> : (
            <Table minWidth={640} className="border-0">
              <thead><tr><Th>#</Th><Th>Lesson</Th><Th>Video</Th><Th>Kind</Th><Th>Flags</Th><Th right>Actions</Th></tr></thead>
              <tbody>{m.lessons.map((l) => (
                <tr key={l.id} className={cx(l.retired && "opacity-50")}>
                  <Td muted>{l.sort_order + 1}</Td>
                  <Td><span className="text-ink">{l.title}</span>{l.description && <span className="block text-[11.5px] text-ink-3 truncate max-w-[360px]">{l.description}</span>}</Td>
                  <Td muted>{l.video_provider ? `${l.video_provider} · ${l.video_id ?? "?"}` : "—"}</Td>
                  <Td>{l.has_steps ? <Chip tone="purple">steps</Chip> : <Chip>{l.node_kind ?? "video"}</Chip>}{l.has_draft && <Chip tone="orange" className="ml-1">draft</Chip>}</Td>
                  <Td muted className="text-[11px]">{[l.is_free && "free", l.has_quiz && "quiz", l.drip_week ? `wk ${l.drip_week}` : null, l.retired && "retired"].filter(Boolean).join(" · ") || "—"}</Td>
                  <Td right><Button size="sm" variant="secondary" onClick={() => setLessonEdit({ id: l.id, module_id: m.id, f: lessonForm(l) })}>Edit</Button><button type="button" onClick={() => delLesson(l)} className="ml-1.5 text-[12px] font-black text-red">Delete</button></Td>
                </tr>
              ))}</tbody>
            </Table>
          )}
          {lessonEdit && lessonEdit.module_id === m.id && <LessonFormFields f={lessonEdit.f} set={(f) => setLessonEdit({ ...lessonEdit, f })} onSave={saveLesson} onCancel={() => setLessonEdit(null)} busy={busy} isNew={!lessonEdit.id} />}
        </Panel>
      ))}

      <Panel title="Add module">
        {modEdit && !modEdit.id ? <ModuleFormFields f={modEdit.f} set={(f) => setModEdit({ f })} onSave={saveMod} onCancel={() => setModEdit(null)} busy={busy} /> : <Button size="md" variant="secondary" onClick={() => setModEdit({ f: { title: "", description: "", track: "all", sort_order: detail.modules.length } })}>New module</Button>}
      </Panel>
    </div>
  );
}

function ModuleFormFields({ f, set, onSave, onCancel, busy }: { f: ModForm; set: (f: ModForm) => void; onSave: () => void; onCancel: () => void; busy: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-3 mb-4 rounded-[12px] bg-paper-2 p-3">
      <div className="col-span-2"><Label>Title</Label><input value={f.title} onChange={(e) => set({ ...f, title: e.target.value })} className={field} /></div>
      <div><Label>Track</Label><select value={f.track} onChange={(e) => set({ ...f, track: e.target.value })} className={field}>{TRACKS.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
      <div className="col-span-2"><Label>Description</Label><input value={f.description} onChange={(e) => set({ ...f, description: e.target.value })} className={field} /></div>
      <div><Label>Sort order</Label><input type="number" value={f.sort_order} onChange={(e) => set({ ...f, sort_order: Number(e.target.value) })} className={field} /></div>
      <div className="col-span-3 flex justify-end gap-2"><Button size="sm" variant="secondary" onClick={onCancel}>Cancel</Button><Button size="sm" variant="green" onClick={onSave} disabled={busy || !f.title.trim()}>{busy ? "Saving…" : "Save module"}</Button></div>
    </div>
  );
}

function LessonFormFields({ f, set, onSave, onCancel, busy, isNew }: { f: LessonForm; set: (f: LessonForm) => void; onSave: () => void; onCancel: () => void; busy: boolean; isNew: boolean }) {
  const num = (k: keyof LessonForm) => (e: React.ChangeEvent<HTMLInputElement>) => set({ ...f, [k]: Number(e.target.value) });
  return (
    <div className="grid grid-cols-4 gap-3 mt-4 rounded-[12px] bg-paper-2 p-3">
      <div className="col-span-3"><Label>Title</Label><input value={f.title} onChange={(e) => set({ ...f, title: e.target.value })} className={field} /></div>
      <div><Label>Sort order</Label><input type="number" value={f.sort_order} onChange={num("sort_order")} className={field} /></div>
      <div className="col-span-4"><Label>Description</Label><input value={f.description} onChange={(e) => set({ ...f, description: e.target.value })} className={field} /></div>
      <div><Label>Video provider</Label><select value={f.video_provider} onChange={(e) => set({ ...f, video_provider: e.target.value })} className={field}>{PROVIDERS.map((p) => <option key={p} value={p}>{p || "— none —"}</option>)}</select></div>
      <div className="col-span-2"><Label>Video id / URL</Label><input value={f.video_id} onChange={(e) => set({ ...f, video_id: e.target.value })} className={field} /></div>
      <div><Label>Duration (sec)</Label><input type="number" value={f.video_duration_sec} onChange={num("video_duration_sec")} className={field} /></div>
      <div><Label>Drip week</Label><input type="number" value={f.drip_week} onChange={num("drip_week")} className={field} /></div>
      <div><Label>Est. minutes</Label><input type="number" value={f.est_minutes} onChange={num("est_minutes")} className={field} /></div>
      <div><Label>Lesson XP</Label><input type="number" value={f.lesson_xp} onChange={num("lesson_xp")} className={field} /></div>
      <div className="flex flex-col justify-end gap-1 text-[12.5px] font-extrabold text-ink">
        <label className="flex items-center gap-2"><input type="checkbox" checked={f.has_quiz} onChange={(e) => set({ ...f, has_quiz: e.target.checked })} /> Has quiz</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={f.is_free} onChange={(e) => set({ ...f, is_free: e.target.checked })} /> Free preview</label>
        {!isNew && <label className="flex items-center gap-2"><input type="checkbox" checked={f.retired} onChange={(e) => set({ ...f, retired: e.target.checked })} /> Retired</label>}
      </div>
      <p className="col-span-4 text-[11px] font-bold text-ink-4">Interactive `steps` are edited in the lesson builder and go live from Lesson drafts — this form covers metadata and legacy video lessons.</p>
      <div className="col-span-4 flex justify-end gap-2"><Button size="sm" variant="secondary" onClick={onCancel}>Cancel</Button><Button size="sm" variant="green" onClick={onSave} disabled={busy || !f.title.trim()}>{busy ? "Saving…" : isNew ? "Add lesson" : "Save lesson"}</Button></div>
    </div>
  );
}
