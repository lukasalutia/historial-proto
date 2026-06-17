"use client";

import { useState, useMemo } from "react";
import {
  Bell, Calendar, Check, ChevronRight, ClipboardList,
  Copy, FilePlus, Mail, MessageCircle, Pill, Plus,
  QrCode, Search, Share2, Stethoscope, X,
} from "lucide-react";

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Semaphore = "normal" | "atencion" | "urgente";
type DocCategory = "estudio" | "consulta" | "medicacion" | "vacuna";
type ReminderCat = "appointment" | "study" | "medication" | "other";
type FilterChip = "todos" | DocCategory;
type ActiveTab = "documentos" | "recordatorios";

interface Doc {
  id: string;
  date: string;
  lab: string;
  type: string;
  category: DocCategory;
  semaphore: Semaphore;
}

interface Reminder {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  category: ReminderCat;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const DOCS: Doc[] = [
  { id: "1",  date: "2026-04-22", lab: "Centro de Salud Belgrano", type: "Vacuna antigripal",           category: "vacuna",     semaphore: "normal"   },
  { id: "2",  date: "2026-04-10", lab: "Dr. Martín Rodríguez",    type: "Consulta cardiológica",        category: "consulta",   semaphore: "atencion" },
  { id: "3",  date: "2026-03-15", lab: "Laboratorio Stamboulian", type: "Hemograma completo",            category: "estudio",    semaphore: "normal"   },
  { id: "4",  date: "2026-02-05", lab: "Laboratorio Stamboulian", type: "Análisis de orina",             category: "estudio",    semaphore: "atencion" },
  { id: "5",  date: "2026-01-22", lab: "Diagnos Maipú",           type: "Glucemia en ayunas",            category: "estudio",    semaphore: "atencion" },
  { id: "6",  date: "2025-12-18", lab: "Hospital Italiano",       type: "Hemoglobina glicosilada",       category: "estudio",    semaphore: "urgente"  },
  { id: "7",  date: "2025-11-14", lab: "CEMIC",                   type: "Función hepática",              category: "estudio",    semaphore: "normal"   },
  { id: "8",  date: "2025-10-08", lab: "Laboratorio Stamboulian", type: "Perfil lipídico",               category: "estudio",    semaphore: "atencion" },
  { id: "9",  date: "2025-09-02", lab: "Diagnos Maipú",           type: "Hormonas tiroideas",            category: "estudio",    semaphore: "normal"   },
  { id: "10", date: "2025-08-11", lab: "Laboratorio Stamboulian", type: "Calcio + Vitamina D",           category: "estudio",    semaphore: "urgente"  },
];

const REMINDERS: Reminder[] = [
  { id: "r1", date: "2026-05-28", time: "09:00", category: "study",       title: "Análisis de sangre — Stamboulian",   description: "Ir en ayunas. Traer orden médica." },
  { id: "r2", date: "2026-06-05", time: "11:30", category: "appointment", title: "Control HTA — Dr. Fernández",         description: "Llevar tensiómetro y registro de presiones." },
  { id: "r3", date: "2026-06-17", time: "17:00", category: "appointment", title: "Turno cardiología — Dr. Rodríguez",  description: "Traer último ECG y perfil lipídico." },
  { id: "r4", date: "2026-06-25", time: "08:30", category: "study",       title: "Hemograma y glucemia en ayunas" },
  { id: "r5", date: "2026-07-10", time: "10:00", category: "appointment", title: "Control endocrinología",              description: "Llevar registros de glucemia de los últimos 30 días." },
  { id: "r6", date: "2026-08-01", time: "09:00", category: "other",       title: "Vacuna antitetánica" },
];

const TODAY = "2026-06-17";

// ─── UTILS ───────────────────────────────────────────────────────────────────

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function fmt(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function groupByMonth(docs: Doc[]) {
  const map = new Map<string, Doc[]>();
  for (const d of docs) {
    const dt = new Date(d.date + "T00:00:00");
    const k = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(d);
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([k, items]) => {
      const [y, m] = k.split("-");
      return { label: `${MONTHS[+m - 1]} ${y}`, items };
    });
}

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// ─── COLOR MAPS ──────────────────────────────────────────────────────────────

const SEM_DOT:   Record<Semaphore, string> = { normal: "bg-[#16a34a]", atencion: "bg-[#f59e0b]", urgente: "bg-[#dc2626]" };
const SEM_BG:    Record<Semaphore, string> = { normal: "bg-[#dcfce7] text-[#15803d]", atencion: "bg-[#fef3c7] text-[#a16207]", urgente: "bg-[#fee2e2] text-[#b91c1c]" };
const SEM_LABEL: Record<Semaphore, string> = { normal: "Normal", atencion: "Atención", urgente: "Urgente" };

const FILTER_CHIPS: { id: FilterChip; label: string; active: string }[] = [
  { id: "todos",      label: "Todos",      active: "bg-[#28347c] text-white" },
  { id: "estudio",    label: "Estudios",   active: "bg-[#e8f4fb] text-[#2b4c9c]" },
  { id: "consulta",   label: "Consultas",  active: "bg-[#fff7ed] text-[#ee742f]" },
  { id: "medicacion", label: "Medicación", active: "bg-[#f3e8ff] text-[#7c3aed]" },
  { id: "vacuna",     label: "Vacunas",    active: "bg-[#dcfce7] text-[#16a34a]" },
];

const REM_ICON:  Record<ReminderCat, typeof Stethoscope> = {
  appointment: Stethoscope, study: ClipboardList, medication: Pill, other: Calendar,
};
const REM_LABEL: Record<ReminderCat, string> = {
  appointment: "Turno médico", study: "Estudio", medication: "Medicación", other: "Otro",
};
const REM_TINT: Record<ReminderCat, string> = {
  appointment: "bg-[#e8f4fb] text-[#2b4c9c]",
  study:       "bg-[#fff7ed] text-[#ee742f]",
  medication:  "bg-[#eaf6ee] text-[#2e8b57]",
  other:       "bg-[#e8f4fb] text-[#2b4c9c]",
};

// ─── SHARE SHEET ─────────────────────────────────────────────────────────────

function ShareSheet({ docs, onClose }: { docs: Doc[]; onClose: () => void }) {
  const [tab, setTab] = useState<"qr" | "email" | "whatsapp">("qr");
  const [copied, setCopied] = useState(false);

  const subject = `Mis documentos médicos — Salutia (${docs.length} ${docs.length === 1 ? "estudio" : "estudios"})`;
  const body = `Historia médica compartida desde Salutia:\n\n${docs.map(d => `• ${d.type} (${fmt(d.date)}) — ${SEM_LABEL[d.semaphore]}`).join("\n")}\n\nGenerado desde Salutia — Vida Potenciada`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=12&data=${encodeURIComponent(body)}`;

  return (
    <div className="absolute inset-0 z-50 flex items-end bg-[#28347c]/40 backdrop-blur-[2px]" onClick={onClose}>
      <div className="relative flex h-[88%] w-full flex-col rounded-t-3xl bg-white pb-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <span aria-hidden className="mx-auto mt-3 h-1 w-10 rounded-full bg-black/10" />

        <div className="flex items-center justify-between px-6 pt-3 pb-2">
          <span className="w-8" />
          <h2 className="font-[family-name:var(--font-inter)] text-base font-bold text-[#2b4c9c]">Compartir</h2>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center text-[#64748b]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="px-6 font-[family-name:var(--font-inter)] text-[17px] font-bold text-[#28347c]">
          {docs.length} {docs.length === 1 ? "documento seleccionado" : "documentos seleccionados"}
        </p>

        {/* Tab pills */}
        <div className="mx-6 mt-4 flex rounded-2xl bg-[#f1f5f9] p-1">
          {([["qr", QrCode, "QR"], ["email", Mail, "Mail"], ["whatsapp", MessageCircle, "WhatsApp"]] as const).map(([id, Icon, label]) => (
            <button key={id} type="button" onClick={() => setTab(id)}
              className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[12.5px] font-semibold transition-colors",
                tab === id ? "bg-white text-[#28347c] shadow-sm" : "text-[#64748b]")}>
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 pt-4">
          {tab === "qr" && (
            <div className="flex flex-col items-center">
              <div className="flex h-[240px] w-[240px] items-center justify-center rounded-3xl bg-white shadow-[0_8px_24px_rgba(40,52,124,0.15)] ring-1 ring-black/[0.04]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrUrl} alt="QR" width={240} height={240} className="rounded-3xl" />
              </div>
              <p className="mt-6 max-w-[260px] text-center text-[12.5px] text-[#64748b]">
                Escaneá con cualquier cámara para compartir este historial.
              </p>
            </div>
          )}
          {(tab === "email" || tab === "whatsapp") && (
            <div className="rounded-2xl bg-[#f1f5f9] px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase tracking-wider text-[#94a3b8]">Asunto</p>
                  <p className="font-[family-name:var(--font-inter)] text-[13.5px] font-bold text-[#28347c]">{subject}</p>
                </div>
                <button type="button"
                  onClick={async () => { await navigator.clipboard.writeText(body).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1600); }}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#2b4c9c] shadow-sm">
                  {copied ? <Check className="h-4 w-4" strokeWidth={3} /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-3 text-[11px] uppercase tracking-wider text-[#94a3b8]">Cuerpo</p>
              <pre className="mt-1 whitespace-pre-wrap font-sans text-[12.5px] leading-relaxed text-[#28347c]">{body}</pre>
            </div>
          )}
        </div>

        <div className="px-6 pt-3">
          {tab === "email" && (
            <a href={`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#2b4c9c] to-[#28347c] px-6 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-[#2b4c9c]/25">
              <Mail className="h-4 w-4" />Abrir mail
            </a>
          )}
          {tab === "whatsapp" && (
            <a href={`https://wa.me/?text=${encodeURIComponent(`*${subject}*\n\n${body}`)}`} target="_blank" rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#23a85a] to-[#177a40] px-6 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-[#23a85a]/25">
              <MessageCircle className="h-4 w-4" />Abrir WhatsApp
            </a>
          )}
          {tab === "qr" && (
            <button type="button" onClick={onClose}
              className="w-full rounded-full bg-[#f1f5f9] px-6 py-3.5 text-[14.5px] font-semibold text-[#2b4c9c]">
              Hecho
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── DOCUMENTOS TAB ──────────────────────────────────────────────────────────

function DocCard({ doc, selectMode, selected, onToggle }: {
  doc: Doc; selectMode: boolean; selected: boolean; onToggle: () => void;
}) {
  const inner = (
    <div className={cn("flex items-center gap-3 rounded-2xl bg-white px-3.5 py-3.5 shadow-[0_2px_10px_rgba(40,52,124,0.05)] ring-1 transition-all",
      selected ? "ring-[#2b4c9c]/40" : "ring-black/[0.04]")}>
      {selectMode
        ? <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all",
            selected ? "border-[#2b4c9c] bg-[#2b4c9c]" : "border-[#cbd5e1] bg-white")}>
            {selected && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
          </span>
        : <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", SEM_BG[doc.semaphore])}>
            <span className={cn("h-2.5 w-2.5 rounded-full", SEM_DOT[doc.semaphore])} aria-hidden />
          </span>
      }
      <div className="min-w-0 flex-1">
        <p className="truncate font-[family-name:var(--font-inter)] text-[14.5px] font-bold text-[#28347c]">{doc.type}</p>
        <p className="truncate text-[12px] text-[#64748b]">{doc.lab} · {fmt(doc.date)}</p>
      </div>
      {!selectMode && (
        <>
          <span className={cn("rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider", SEM_BG[doc.semaphore])}>
            {SEM_LABEL[doc.semaphore]}
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-[#28347c]" />
        </>
      )}
    </div>
  );

  return selectMode
    ? <button type="button" onClick={onToggle} className="w-full text-left">{inner}</button>
    : <div className="cursor-pointer active:opacity-70">{inner}</div>;
}

function DocumentosTab() {
  const [query, setQuery]         = useState("");
  const [filter, setFilter]       = useState<FilterChip>("todos");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [shareOpen, setShareOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DOCS.filter(d =>
      (filter === "todos" || d.category === filter) &&
      (!q || d.type.toLowerCase().includes(q) || d.lab.toLowerCase().includes(q))
    );
  }, [query, filter]);

  const groups = useMemo(() => groupByMonth(filtered), [filtered]);
  const selectedDocs = useMemo(() => DOCS.filter(d => selected.has(d.id)), [selected]);

  function toggle(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function cancel() { setSelectMode(false); setSelected(new Set()); }

  return (
    <>
      {/* Sub-header */}
      <div className="shrink-0 bg-white px-5 pb-3 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2 pt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
            <input type="search" placeholder="Buscar documento..." value={query} onChange={e => setQuery(e.target.value)}
              className="w-full rounded-full bg-[#f1f5f9] py-2.5 pl-10 pr-4 text-[13.5px] text-[#28347c] placeholder:text-[#94a3b8] outline-none focus:ring-2 focus:ring-[#2b4c9c]/30" />
          </div>
          {!selectMode
            ? <button type="button" onClick={() => setSelectMode(true)}
                className="shrink-0 rounded-full bg-[#f1f5f9] px-3.5 py-2.5 text-[12.5px] font-semibold text-[#2b4c9c]">
                Seleccionar
              </button>
            : <button type="button" onClick={cancel}
                className="shrink-0 rounded-full bg-[#fee2e2] px-3.5 py-2.5 text-[12.5px] font-semibold text-[#b91c1c]">
                Cancelar
              </button>
          }
        </div>
        {/* Filter chips */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden">
          {FILTER_CHIPS.map(chip => (
            <button key={chip.id} type="button" onClick={() => setFilter(chip.id)}
              className={cn("shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all",
                filter === chip.id ? chip.active : "bg-[#f1f5f9] text-[#64748b]")}>
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-6">
        {filtered.length === 0
          ? <div className="mt-16 flex flex-col items-center text-center">
              <Search className="h-10 w-10 text-[#94a3b8]" strokeWidth={1.5} />
              <p className="mt-3 text-[14px] font-medium text-[#28347c]">Sin resultados</p>
              <p className="mt-1 text-[12.5px] text-[#64748b]">Probá con otro término o filtro</p>
            </div>
          : <div className="space-y-7">
              {groups.map(group => (
                <section key={group.label}>
                  <div className="mb-3 flex items-center gap-3">
                    <div className="h-px flex-1 bg-black/[0.06]" />
                    <span className="text-[12px] font-semibold text-[#64748b]">
                      {group.label}
                      <span className="ml-1.5 font-normal text-[#94a3b8]">
                        · {group.items.length} {group.items.length === 1 ? "documento" : "documentos"}
                      </span>
                    </span>
                    <div className="h-px flex-1 bg-black/[0.06]" />
                  </div>
                  <div className="space-y-2.5">
                    {group.items.map(doc => (
                      <DocCard key={doc.id} doc={doc} selectMode={selectMode} selected={selected.has(doc.id)} onToggle={() => toggle(doc.id)} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
        }
      </div>

      {/* Multi-select bar */}
      {selectMode && (
        <div className="shrink-0 bg-white/90 px-5 py-3 backdrop-blur-sm shadow-[0_-2px_10px_rgba(40,52,124,0.08)]">
          <button type="button" disabled={selected.size === 0} onClick={() => setShareOpen(true)}
            className={cn("flex w-full items-center justify-center gap-2 rounded-full py-4 text-[15px] font-semibold text-white shadow-lg transition-all",
              selected.size > 0 ? "bg-gradient-to-r from-[#2b4c9c] to-[#28347c] shadow-[#2b4c9c]/25" : "bg-[#94a3b8]")}>
            <Share2 className="h-4 w-4" />
            {selected.size === 0
              ? "Seleccioná documentos"
              : `Compartir ${selected.size} ${selected.size === 1 ? "documento" : "documentos"}`}
          </button>
        </div>
      )}

      {shareOpen && <ShareSheet docs={selectedDocs} onClose={() => { setShareOpen(false); cancel(); }} />}
    </>
  );
}

// ─── RECORDATORIOS TAB ───────────────────────────────────────────────────────

function RemCard({ r, dimmed = false, today = false }: { r: Reminder; dimmed?: boolean; today?: boolean }) {
  const Icon = REM_ICON[r.category];
  return (
    <div className={cn("rounded-2xl bg-white px-3.5 py-3.5 shadow-[0_2px_10px_rgba(40,52,124,0.05)] ring-1 transition-all",
      dimmed ? "opacity-50 ring-black/[0.03]" : "ring-black/[0.04]",
      today && "ring-2 ring-[#2b4c9c]/20")}>
      <div className="flex items-start gap-3">
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          dimmed ? "bg-[#f1f5f9] text-[#94a3b8]" : REM_TINT[r.category])}>
          {dimmed ? <Check className="h-5 w-5" strokeWidth={2} /> : <Icon className="h-5 w-5" strokeWidth={1.8} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#94a3b8]">{REM_LABEL[r.category]}</p>
          <p className="mt-0.5 font-[family-name:var(--font-inter)] text-[14.5px] font-bold leading-snug text-[#28347c]">{r.title}</p>
          <p className="mt-1 text-[12px] text-[#64748b]">{fmt(r.date)} · {r.time} hs</p>
          {r.description && <p className="mt-1 text-[12px] leading-snug text-[#94a3b8]">{r.description}</p>}
        </div>
      </div>
    </div>
  );
}

function RecordatoriosTab() {
  const past     = REMINDERS.filter(r => r.date < TODAY).sort((a, b) => b.date.localeCompare(a.date));
  const todayRem = REMINDERS.filter(r => r.date === TODAY).sort((a, b) => a.time.localeCompare(b.time));
  const upcoming = REMINDERS.filter(r => r.date > TODAY).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  return (
    <>
      {/* Sub-header */}
      <div className="shrink-0 bg-white px-5 pt-3 pb-4 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-[#64748b]">{REMINDERS.length} recordatorios</p>
          <button type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ee742f] text-white shadow-md shadow-[#ee742f]/40">
            <Plus className="h-4 w-4" strokeWidth={2.4} />
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-6 space-y-5">
        {past.length > 0 && (
          <section>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">Anteriores</p>
            <div className="space-y-2">{past.map(r => <RemCard key={r.id} r={r} dimmed />)}</div>
          </section>
        )}

        {/* Separador HOY */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-[#e2e8f0]" />
          <span className="rounded-full bg-[#28347c] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
            Hoy · {fmt(TODAY)}
          </span>
          <div className="h-px flex-1 bg-[#e2e8f0]" />
        </div>

        {todayRem.length > 0
          ? <div className="space-y-2">{todayRem.map(r => <RemCard key={r.id} r={r} today />)}</div>
          : <p className="text-center text-[13px] text-[#94a3b8]">Sin recordatorios para hoy</p>
        }

        {upcoming.length > 0 && (
          <section>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#64748b]">Próximos</p>
            <div className="space-y-2">{upcoming.map(r => <RemCard key={r.id} r={r} />)}</div>
          </section>
        )}
      </div>
    </>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function Page() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("documentos");

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      {/* Sticky header */}
      <div className="shrink-0 bg-white shadow-[0_1px_0_rgba(0,0,0,0.06)] px-5 pt-12 pb-3">
        <h1 className="font-[family-name:var(--font-inter)] text-[24px] font-bold tracking-tight text-[#28347c]">
          Historial
        </h1>
        {/* Tab pills */}
        <div className="mt-3 flex rounded-full bg-[#f1f5f9] p-1">
          {(["documentos", "recordatorios"] as const).map(tab => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)}
              className={cn("flex-1 rounded-full py-2 text-[13.5px] font-semibold transition-all",
                activeTab === tab ? "bg-[#2b4c9c] text-white shadow-sm" : "text-[#64748b]")}>
              {tab === "documentos" ? "Documentos" : "Recordatorios"}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "documentos" ? <DocumentosTab /> : <RecordatoriosTab />}
    </div>
  );
}

// suppress unused import
void FilePlus;
void Bell;
