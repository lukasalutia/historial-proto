"use client";

import { useState, useMemo, useEffect } from "react";
import {
  AlertTriangle, ArrowLeft, Bell, Calendar, Check,
  ChevronRight, ClipboardList, Copy, FlaskConical, Info, Mail,
  MessageCircle, Pill, Plus, QrCode, Scan, Search, Share2,
  Stethoscope, Trash2, X, Zap,
} from "lucide-react";

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Semaphore = "normal" | "atencion" | "urgente";
type DocCategory = "laboratorio" | "imagen";
type ReminderCat = "appointment" | "study" | "medication" | "other";
type FilterChip = "todos" | DocCategory;
type ActiveTab = "documentos" | "recordatorios";

interface Finding {
  label: string;
  value: string;
  semaphore: Semaphore;
}

interface DocAnalysis {
  summary: string;
  findings: Finding[];
  recommendation: string;
}

interface Doc {
  id: string;
  date: string;
  lab: string;
  type: string;
  category: DocCategory;
  semaphore: Semaphore;
  analysis: DocAnalysis;
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
  {
    id: "1", date: "2026-03-15", lab: "Laboratorio Stamboulian",
    type: "Hemograma completo", category: "laboratorio", semaphore: "normal",
    analysis: {
      summary: "Tu hemograma muestra valores dentro del rango esperado. Los glóbulos rojos, blancos y plaquetas están en niveles normales.",
      findings: [
        { label: "Glóbulos rojos",  value: "4,8 M/μL — normal (4,2–5,4)",   semaphore: "normal" },
        { label: "Hemoglobina",     value: "14,2 g/dL — normal (13–17)",     semaphore: "normal" },
        { label: "Plaquetas",       value: "210.000/μL — normal (150–400k)", semaphore: "normal" },
      ],
      recommendation: "Resultados óptimos. Repetí este análisis en tu próximo control anual.",
    },
  },
  {
    id: "2", date: "2026-02-05", lab: "Laboratorio Stamboulian",
    type: "Análisis de orina", category: "laboratorio", semaphore: "atencion",
    analysis: {
      summary: "Se detectaron leucocitos elevados en orina, lo que puede indicar una infección urinaria subclínica. Se recomienda consultar con tu médico.",
      findings: [
        { label: "Leucocitos",  value: "25–30/campo — elevados (normal <5)", semaphore: "atencion" },
        { label: "Nitritos",    value: "Positivos — posible bacteriuria",     semaphore: "atencion" },
        { label: "Proteínas",   value: "Negativas — dentro del rango",        semaphore: "normal"   },
      ],
      recommendation: "Consultá con tu médico para descartar infección urinaria. Puede ser necesario un urocultivo.",
    },
  },
  {
    id: "3", date: "2026-01-22", lab: "Diagnos Maipú",
    type: "Glucemia en ayunas", category: "laboratorio", semaphore: "atencion",
    analysis: {
      summary: "Tu nivel de glucosa en ayunas está por encima del rango normal. Esto puede asociarse con prediabetes o resistencia a la insulina.",
      findings: [
        { label: "Glucosa en ayunas", value: "112 mg/dL — elevada (normal <100)",   semaphore: "atencion" },
        { label: "Referencia",        value: "Normal <100 · Prediabetes 100–125",    semaphore: "atencion" },
        { label: "Tendencia",         value: "En alza respecto al estudio anterior", semaphore: "atencion" },
      ],
      recommendation: "Consultá con tu médico para evaluar HbA1c y PTOG. Reducí azúcares refinados y aumentá la actividad física.",
    },
  },
  {
    id: "4", date: "2025-12-18", lab: "Hospital Italiano",
    type: "Hemoglobina glicosilada", category: "laboratorio", semaphore: "urgente",
    analysis: {
      summary: "Tu HbA1c indica un nivel de glucosa promedio elevado en los últimos 3 meses, en el rango de diabetes. Es importante actuar pronto.",
      findings: [
        { label: "HbA1c",           value: "7,2% — elevada (normal <5,7%)",         semaphore: "urgente"  },
        { label: "Glucosa promedio", value: "≈ 160 mg/dL en los últimos 90 días",    semaphore: "urgente"  },
        { label: "Rango objetivo",   value: "< 5,7% normal · 5,7–6,4% prediabetes", semaphore: "atencion" },
      ],
      recommendation: "Consultá con tu médico a la brevedad. Este valor requiere evaluación clínica y posiblemente ajuste de tratamiento.",
    },
  },
  {
    id: "5", date: "2025-11-14", lab: "CEMIC",
    type: "Función hepática", category: "laboratorio", semaphore: "normal",
    analysis: {
      summary: "Los marcadores hepáticos se encuentran dentro del rango esperado. No hay señales de daño ni inflamación hepática.",
      findings: [
        { label: "TGO (AST)",        value: "22 U/L — normal (<40)",         semaphore: "normal" },
        { label: "TGP (ALT)",        value: "18 U/L — normal (<41)",         semaphore: "normal" },
        { label: "Bilirrubina total", value: "0,8 mg/dL — normal (<1,2)",    semaphore: "normal" },
      ],
      recommendation: "Hígado saludable. Continuá con tus hábitos actuales.",
    },
  },
  {
    id: "6", date: "2025-10-08", lab: "Laboratorio Stamboulian",
    type: "Perfil lipídico", category: "laboratorio", semaphore: "atencion",
    analysis: {
      summary: "El colesterol LDL está por encima del rango recomendado. El colesterol HDL es adecuado pero el total supera el límite deseable.",
      findings: [
        { label: "Colesterol total", value: "218 mg/dL — elevado (deseable <200)", semaphore: "atencion" },
        { label: "LDL",              value: "142 mg/dL — elevado (óptimo <100)",   semaphore: "atencion" },
        { label: "HDL",              value: "52 mg/dL — normal (hombre >40)",      semaphore: "normal"   },
        { label: "Triglicéridos",    value: "120 mg/dL — normal (<150)",           semaphore: "normal"   },
      ],
      recommendation: "Reducí grasas saturadas y aumentá el consumo de omega-3. Consultá con tu médico si persiste.",
    },
  },
  {
    id: "7", date: "2025-09-02", lab: "Diagnos Maipú",
    type: "Hormonas tiroideas", category: "laboratorio", semaphore: "normal",
    analysis: {
      summary: "Los valores de hormona tiroidea son normales. No hay signos de hipotiroidismo ni hipertiroidismo.",
      findings: [
        { label: "TSH",      value: "2,1 mU/L — normal (0,4–4,0)",    semaphore: "normal" },
        { label: "T4 libre", value: "1,2 ng/dL — normal (0,8–1,8)",   semaphore: "normal" },
        { label: "T3 libre", value: "3,1 pg/mL — normal (2,3–4,2)",   semaphore: "normal" },
      ],
      recommendation: "Tiroides en perfecto funcionamiento. Repetí en tu próximo control.",
    },
  },
  {
    id: "8", date: "2025-08-11", lab: "Laboratorio Stamboulian",
    type: "Calcio + Vitamina D", category: "laboratorio", semaphore: "urgente",
    analysis: {
      summary: "Tu nivel de Vitamina D es muy bajo, lo que puede afectar la absorción de calcio, la salud ósea y el sistema inmune.",
      findings: [
        { label: "Vitamina D (25-OH)", value: "11 ng/mL — deficiencia severa (<20)",  semaphore: "urgente"  },
        { label: "Calcio sérico",      value: "8,9 mg/dL — en el límite (8,5–10,5)", semaphore: "atencion" },
        { label: "Fósforo",            value: "3,4 mg/dL — normal (2,5–4,5)",        semaphore: "normal"   },
      ],
      recommendation: "Requiere suplementación urgente de Vitamina D. Consultá con tu médico para dosis y duración del tratamiento.",
    },
  },
  /* Históricas para sparkline de tendencia */
  {
    id: "9", date: "2024-09-10", lab: "Laboratorio Stamboulian",
    type: "Hemograma completo", category: "laboratorio", semaphore: "normal",
    analysis: {
      summary: "Hemograma completo dentro del rango esperado.",
      findings: [
        { label: "Glóbulos rojos", value: "4,6 M/μL — normal",  semaphore: "normal" },
        { label: "Hemoglobina",    value: "13,9 g/dL — normal", semaphore: "normal" },
        { label: "Plaquetas",      value: "198.000/μL — normal", semaphore: "normal" },
      ],
      recommendation: "Resultados normales. Continuar con controles anuales.",
    },
  },
  {
    id: "10", date: "2024-08-20", lab: "Diagnos Maipú",
    type: "Glucemia en ayunas", category: "laboratorio", semaphore: "normal",
    analysis: {
      summary: "Glucemia en ayunas dentro del rango normal.",
      findings: [
        { label: "Glucosa en ayunas", value: "88 mg/dL — normal (normal <100)", semaphore: "normal" },
      ],
      recommendation: "Valores normales. Mantener hábitos saludables.",
    },
  },
  /* Imágenes médicas */
  {
    id: "11", date: "2026-03-20", lab: "Diagnos Maipú",
    type: "Radiografía de tórax", category: "imagen", semaphore: "normal",
    analysis: {
      summary: "La radiografía de tórax no muestra alteraciones significativas. Campos pulmonares libres, silueta cardíaca dentro de límites normales.",
      findings: [
        { label: "Campos pulmonares", value: "Libres, sin infiltrados ni opacidades", semaphore: "normal" },
        { label: "Silueta cardíaca",  value: "Índice cardiotorácico 0,45 — normal",   semaphore: "normal" },
        { label: "Trama vascular",    value: "Sin alteraciones",                        semaphore: "normal" },
      ],
      recommendation: "Sin hallazgos patológicos. Control según criterio médico.",
    },
  },
  {
    id: "12", date: "2025-07-15", lab: "Centro de Diagnóstico Belgrano",
    type: "Ecografía abdominal", category: "imagen", semaphore: "atencion",
    analysis: {
      summary: "Se observó leve esteatosis hepática grado I. El resto de los órganos abdominales sin alteraciones ecográficas significativas.",
      findings: [
        { label: "Hígado",   value: "Esteatosis grado I — consultar médico", semaphore: "atencion" },
        { label: "Vesícula", value: "Sin litiasis, pared normal",             semaphore: "normal"   },
        { label: "Riñones",  value: "Forma, tamaño y ecogenicidad normales",  semaphore: "normal"   },
      ],
      recommendation: "La esteatosis grado I puede revertirse con cambios en la dieta. Consultá con tu médico gastroenterólogo.",
    },
  },
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
const SEM_ICON:  Record<Semaphore, typeof Info> = { normal: Info, atencion: AlertTriangle, urgente: AlertTriangle };
const SEM_RING:  Record<Semaphore, string> = { normal: "ring-[#16a34a]/30", atencion: "ring-[#f59e0b]/30", urgente: "ring-[#dc2626]/40" };

const CAT_LABEL:  Record<DocCategory, string> = { laboratorio: "Laboratorio", imagen: "Imagen" };
const CAT_COLOR:  Record<DocCategory, string> = {
  laboratorio: "bg-[#e0f9ff] text-[#0369a1]",
  imagen:      "bg-[#f3e8ff] text-[#7c3aed]",
};
const CAT_ACCENT: Record<DocCategory, string> = {
  laboratorio: "bg-[#0891b2]",
  imagen:      "bg-[#7c3aed]",
};
const CAT_ICON: Record<DocCategory, typeof FlaskConical> = {
  laboratorio: FlaskConical,
  imagen:      Scan,
};

const FILTER_CHIPS: { id: FilterChip; label: string; active: string }[] = [
  { id: "todos",       label: "Todos",       active: "bg-[#28347c] text-white" },
  { id: "laboratorio", label: "Laboratorio", active: "bg-[#e0f9ff] text-[#0369a1]" },
  { id: "imagen",      label: "Imágenes",    active: "bg-[#f3e8ff] text-[#7c3aed]" },
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

// ─── MINI SPARKLINE ──────────────────────────────────────────────────────────

function MiniSparkline({ values }: { values: Semaphore[] }) {
  if (values.length < 2) return null;
  const pts = values.slice(-3);
  const yMap: Record<Semaphore, number> = { normal: 13, atencion: 7, urgente: 2 };
  const cMap: Record<Semaphore, string> = { normal: "#16a34a", atencion: "#f59e0b", urgente: "#dc2626" };
  const W = 38, H = 16, step = W / (pts.length - 1);
  const coords = pts.map((s, i) => ({ x: i * step, y: yMap[s], c: cMap[s] }));
  const path = coords.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const last = coords[coords.length - 1];

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" aria-hidden>
      <path d={path} stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={path} stroke={last.c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      <circle cx={last.x} cy={last.y} r="2.5" fill={last.c} />
    </svg>
  );
}

// ─── SALU CHARACTER ──────────────────────────────────────────────────────────

function SaluBot({ size = 28 }: { size?: number }) {
  // Full Salu character — waving pose, matches brandbook mascot
  const h = Math.round(size * 1.4);
  return (
    <svg width={size} height={h} viewBox="0 0 36 50" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="saluBody" x1="36" y1="0" x2="4" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f5924a" />
          <stop offset="100%" stopColor="#e05e1a" />
        </linearGradient>
      </defs>
      {/* Body — S/zigzag shape */}
      <path
        d="M23 2C31 1 38 7 33 14L19 25C29 25 37 32 31 39L20 48C13 50 5 46 9 39L21 29C11 29 4 22 10 15Z"
        fill="url(#saluBody)"
      />
      {/* Inner shadow on body */}
      <path
        d="M19 25L21 29C11 29 4 22 10 15L23 2C16 4 10 10 15 17Z"
        fill="#c8531a" opacity="0.22"
      />
      {/* Eyes */}
      <ellipse cx="23" cy="14" rx="3.2" ry="3.2" fill="white" />
      <ellipse cx="30" cy="11" rx="3.2" ry="3.2" fill="white" />
      <circle cx="24" cy="14.6" r="1.6" fill="#16193a" />
      <circle cx="31" cy="11.6" r="1.6" fill="#16193a" />
      <circle cx="24.7" cy="13.8" r="0.6" fill="white" />
      <circle cx="31.7" cy="10.8" r="0.6" fill="white" />
      {/* Eyebrows */}
      <path d="M21 11 Q23 10 25 11" stroke="#16193a" strokeWidth="1" strokeLinecap="round" fill="none" />
      <path d="M28 8 Q30 7 32 8" stroke="#16193a" strokeWidth="1" strokeLinecap="round" fill="none" />
      {/* Smile */}
      <path d="M21 18.5 Q25.5 22 30 19" stroke="#16193a" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      {/* Left arm — waving up */}
      <line x1="14" y1="19" x2="6" y2="10" stroke="#16193a" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="5" cy="8.5" r="2.5" fill="#16193a" />
      {/* Right arm — relaxed */}
      <line x1="25" y1="27" x2="32" y2="32" stroke="#16193a" strokeWidth="2.2" strokeLinecap="round" />
      {/* Legs */}
      <line x1="16" y1="46.5" x2="13" y2="50" stroke="#16193a" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="22" y1="47.5" x2="23" y2="50" stroke="#16193a" strokeWidth="2.5" strokeLinecap="round" />
      {/* Feet */}
      <path d="M10.5 50 L15.5 50" stroke="#16193a" strokeWidth="2" strokeLinecap="round" />
      <path d="M21 50 L26 50" stroke="#16193a" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

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

// ─── DELETE CONFIRM ──────────────────────────────────────────────────────────

function DeleteConfirm({ doc, onConfirm, onCancel }: { doc: Doc; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex items-end bg-black/40 backdrop-blur-[2px]" onClick={onCancel}>
      <div className="relative w-full rounded-t-3xl bg-white px-6 pb-8 pt-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <span aria-hidden className="mx-auto mb-5 block h-1 w-10 rounded-full bg-black/10" />
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fee2e2]">
          <Trash2 className="h-6 w-6 text-[#dc2626]" />
        </div>
        <h3 className="font-[family-name:var(--font-inter)] text-[18px] font-bold text-[#28347c]">Eliminar documento</h3>
        <p className="mt-2 text-[13.5px] leading-relaxed text-[#64748b]">
          ¿Estás seguro que querés eliminar <span className="font-semibold text-[#28347c]">{doc.type}</span>? Esta acción no se puede deshacer.
        </p>
        <div className="mt-6 flex flex-col gap-2.5">
          <button type="button" onClick={onConfirm}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#dc2626] py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-[#dc2626]/25">
            <Trash2 className="h-4 w-4" />Sí, eliminar
          </button>
          <button type="button" onClick={onCancel}
            className="w-full rounded-full bg-[#f1f5f9] py-3.5 text-[14.5px] font-semibold text-[#64748b]">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DOC DETAIL SCREEN ───────────────────────────────────────────────────────

function DocDetail({ doc, onBack, onDelete }: { doc: Doc; onBack: () => void; onDelete: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const SemIcon = SEM_ICON[doc.semaphore];

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  function handleBack() { setVisible(false); setTimeout(onBack, 280); }
  function handleDelete() { setDeleteOpen(false); setVisible(false); setTimeout(() => onDelete(doc.id), 280); }

  return (
    <div className={cn(
      "absolute inset-0 z-30 flex flex-col bg-white transition-transform duration-[280ms] ease-out",
      visible ? "translate-x-0" : "translate-x-full"
    )}>
      {/* Header — gradiente firma */}
      <div className="shrink-0 bg-gradient-to-r from-[#2b4c9c] to-[#28347c] px-4 pt-12 pb-4 shadow-[0_2px_12px_rgba(40,52,124,0.25)]">
        <div className="flex items-center gap-3">
          <button type="button" onClick={handleBack}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white active:bg-white/30 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-[family-name:var(--font-inter)] text-[16px] font-bold text-white">{doc.type}</p>
            <p className="truncate text-[12px] text-white/60">{doc.lab}</p>
          </div>
          <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider", CAT_COLOR[doc.category])}>
            {CAT_LABEL[doc.category]}
          </span>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-36">

        {/* Meta strip */}
        <div className="mb-5 flex items-center gap-2">
          <span className={cn("rounded-full px-3 py-1 text-[11.5px] font-bold", SEM_BG[doc.semaphore])}>
            {SEM_LABEL[doc.semaphore]}
          </span>
          <span className="text-[12px] text-[#94a3b8]">·</span>
          <span className="text-[12px] text-[#64748b]">{fmt(doc.date)}</span>
        </div>

        {/* Salu analysis card */}
        <div className={cn("rounded-2xl p-4 ring-2 mb-4", SEM_BG[doc.semaphore], SEM_RING[doc.semaphore])}>
          {/* Salu header */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/80 shadow-sm">
              <SaluBot size={22} />
            </div>
            <span className="font-[family-name:var(--font-inter)] text-[12.5px] font-bold text-[#28347c]">Análisis de Salu</span>
            <SemIcon className="ml-auto h-4 w-4 shrink-0 opacity-70" />
          </div>

          <p className="text-[13px] leading-relaxed text-[#28347c]/80">{doc.analysis.summary}</p>
        </div>

        {/* Findings */}
        <div className="mb-4 overflow-hidden rounded-2xl bg-white shadow-[0_2px_10px_rgba(40,52,124,0.06)] ring-1 ring-black/[0.04]">
          <p className="border-b border-black/[0.04] px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
            Valores clave
          </p>
          {doc.analysis.findings.map((f, i) => (
            <div key={i} className={cn("flex items-start gap-3 px-4 py-3", i > 0 && "border-t border-black/[0.04]")}>
              <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", SEM_DOT[f.semaphore])} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-[11.5px] font-semibold text-[#64748b]">{f.label}</p>
                <p className="mt-0.5 text-[13px] font-medium text-[#28347c]">{f.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Recommendation */}
        <div className="mb-5 flex gap-3 rounded-2xl bg-[#f8fafc] px-4 py-3.5 ring-1 ring-black/[0.04]">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#2b4c9c]" />
          <p className="text-[13px] leading-relaxed text-[#28347c]">{doc.analysis.recommendation}</p>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-[11px] leading-relaxed text-[#94a3b8]">
          Esta orientación no reemplaza la consulta médica.
        </p>
      </div>

      {/* Bottom action bar */}
      <div className="absolute bottom-0 left-0 right-0 shrink-0 bg-white/95 px-5 pb-8 pt-3 backdrop-blur-sm shadow-[0_-2px_16px_rgba(40,52,124,0.10)]">
        <div className="flex gap-2.5">
          <button type="button" onClick={() => setShareOpen(true)}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#ee742f] py-3.5 text-[14.5px] font-semibold text-white shadow-lg shadow-[#ee742f]/30">
            <Share2 className="h-4 w-4" />Compartir
          </button>
          <button type="button" onClick={() => setDeleteOpen(true)}
            className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full bg-[#fee2e2] text-[#dc2626]">
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {shareOpen && <ShareSheet docs={[doc]} onClose={() => setShareOpen(false)} />}
      {deleteOpen && <DeleteConfirm doc={doc} onConfirm={handleDelete} onCancel={() => setDeleteOpen(false)} />}
    </div>
  );
}

// ─── DOCUMENTOS TAB ──────────────────────────────────────────────────────────

function DocCard({ doc, selectMode, selected, onToggle, onOpen, sparkline }: {
  doc: Doc; selectMode: boolean; selected: boolean;
  onToggle: () => void; onOpen: () => void;
  sparkline?: Semaphore[];
}) {
  const CatIcon = CAT_ICON[doc.category];

  const inner = (
    <div className={cn(
      "flex items-stretch overflow-hidden rounded-2xl bg-white transition-all",
      "shadow-[0_1px_4px_rgba(0,0,0,0.04),0_4px_16px_rgba(43,76,156,0.07)]",
      selected ? "ring-2 ring-[#2b4c9c]/30" : "ring-1 ring-[#28347c]/[0.05]"
    )}>
      {/* Category accent bar */}
      <span className={cn("w-[3.5px] shrink-0", CAT_ACCENT[doc.category])} aria-hidden />

      <div className="flex flex-1 items-center gap-3 py-3 pl-3 pr-3.5">
        {selectMode
          ? <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 transition-all",
              selected ? "border-[#2b4c9c] bg-[#2b4c9c]" : "border-[#e2e8f0] bg-white")}>
              {selected && <Check className="h-4 w-4 text-white" strokeWidth={2.5} />}
            </span>
          : <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", CAT_COLOR[doc.category])}>
              <CatIcon className="h-4.5 w-4.5" strokeWidth={1.8} />
            </span>
        }

        <div className="min-w-0 flex-1">
          <p className="truncate font-[family-name:var(--font-inter)] text-[14px] font-bold text-[#28347c]">{doc.type}</p>
          <p className="mt-0.5 truncate text-[11px] text-[#28347c]/45">{doc.lab} · {fmt(doc.date)}</p>
        </div>

        {!selectMode && (
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <div className="flex items-center gap-1">
              <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", SEM_BG[doc.semaphore])}>
                <span className={cn("h-1.5 w-1.5 rounded-full", SEM_DOT[doc.semaphore])} />
                {SEM_LABEL[doc.semaphore]}
              </span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#28347c]/20" />
            </div>
            {sparkline && sparkline.length >= 2 && <MiniSparkline values={sparkline} />}
          </div>
        )}
      </div>
    </div>
  );

  return selectMode
    ? <button type="button" onClick={onToggle} className="w-full text-left active:scale-[0.97] transition-transform duration-150">{inner}</button>
    : <button type="button" onClick={onOpen}   className="w-full text-left active:scale-[0.97] transition-transform duration-150">{inner}</button>;
}

function DocumentosTab({ onOpenDoc }: { onOpenDoc: (doc: Doc) => void }) {
  const [query, setQuery]           = useState("");
  const [filter, setFilter]         = useState<FilterChip>("todos");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [shareOpen, setShareOpen]   = useState(false);
  const [docs, setDocs]             = useState<Doc[]>(DOCS);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return docs.filter(d =>
      (filter === "todos" || d.category === filter) &&
      (!q || d.type.toLowerCase().includes(q) || d.lab.toLowerCase().includes(q))
    );
  }, [query, filter, docs]);

  const groups = useMemo(() => groupByMonth(filtered), [filtered]);
  const selectedDocs = useMemo(() => docs.filter(d => selected.has(d.id)), [selected, docs]);

  // Compute sparkline values: last 3 semaphores of same type, sorted by date
  function getSparkline(doc: Doc): Semaphore[] {
    return docs
      .filter(d => d.type === doc.type)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => d.semaphore);
  }

  function toggle(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function cancel() { setSelectMode(false); setSelected(new Set()); }

  return (
    <>
      <div className="shrink-0 bg-white px-4 pb-3 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2 pt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
            <input type="search" placeholder="Buscar documento..." value={query} onChange={e => setQuery(e.target.value)}
              className="w-full rounded-full bg-[#f2f5fb] py-2.5 pl-10 pr-4 text-[13.5px] text-[#28347c] placeholder:text-[#94a3b8] outline-none focus:ring-2 focus:ring-[#2b4c9c]/20" />
          </div>
          {!selectMode
            ? <button type="button" onClick={() => setSelectMode(true)}
                className="shrink-0 rounded-full bg-[#f2f5fb] px-3.5 py-2.5 text-[12.5px] font-semibold text-[#28347c]/60">
                Seleccionar
              </button>
            : <button type="button" onClick={cancel}
                className="shrink-0 rounded-full bg-[#fee2e2] px-3.5 py-2.5 text-[12.5px] font-semibold text-[#b91c1c]">
                Cancelar
              </button>
          }
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden">
          {FILTER_CHIPS.map(chip => {
            const count = chip.id === "todos" ? docs.length : docs.filter(d => d.category === chip.id).length;
            return (
              <button key={chip.id} type="button" onClick={() => setFilter(chip.id)}
                className={cn("shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all",
                  filter === chip.id ? chip.active : "bg-[#f2f5fb] text-[#28347c]/50")}>
                {chip.label}{chip.id !== "todos" && count > 0 ? ` (${count})` : ""}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain bg-[#f2f5fb] px-4 pt-3 pb-6">
        {filtered.length === 0
          ? <div className="mt-16 flex flex-col items-center text-center">
              <SaluBot size={48} />
              <p className="mt-4 font-[family-name:var(--font-inter)] text-[15px] font-bold text-[#28347c]">Sin resultados</p>
              <p className="mt-1 text-[13px] text-[#28347c]/45">Probá con otro término o filtro</p>
            </div>
          : <div className="space-y-6">
              {groups.map(group => (
                <section key={group.label}>
                  {/* Sticky month header */}
                  <div className="sticky top-0 z-10 -mx-4 mb-2 bg-[#f2f5fb]/90 px-4 py-1.5 backdrop-blur-sm">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#28347c]/40">
                      {group.label} <span className="font-normal">· {group.items.length}</span>
                    </p>
                  </div>
                  <div className="space-y-2">
                    {group.items.map(doc => (
                      <DocCard key={doc.id} doc={doc} selectMode={selectMode}
                        selected={selected.has(doc.id)} onToggle={() => toggle(doc.id)}
                        onOpen={() => onOpenDoc(doc)}
                        sparkline={getSparkline(doc)} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
        }
      </div>

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

      {/* Delete callback exposed for DocDetail */}
      <span data-delete-fn={JSON.stringify(docs.map(d => d.id))} className="hidden" />
    </>
  );
}

// ─── RECORDATORIOS TAB ───────────────────────────────────────────────────────

function AnterioresScreen({ onBack }: { onBack: () => void }) {
  const [visible, setVisible] = useState(false);
  const past = REMINDERS.filter(r => r.date < TODAY).sort((a, b) => b.date.localeCompare(a.date));

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);
  function handleBack() { setVisible(false); setTimeout(onBack, 280); }

  return (
    <div className={cn(
      "absolute inset-0 z-30 flex flex-col bg-white transition-transform duration-[280ms] ease-out",
      visible ? "translate-x-0" : "translate-x-full"
    )}>
      <div className="shrink-0 bg-gradient-to-r from-[#2b4c9c] to-[#28347c] px-4 pt-12 pb-4 shadow-[0_2px_12px_rgba(40,52,124,0.25)]">
        <div className="flex items-center gap-3">
          <button type="button" onClick={handleBack}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white active:bg-white/30 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="font-[family-name:var(--font-inter)] text-[16px] font-bold text-white">Historial de recordatorios</p>
            <p className="text-[12px] text-white/60">{past.length} {past.length === 1 ? "recordatorio anterior" : "recordatorios anteriores"}</p>
          </div>
        </div>
      </div>
      {/* Stats strip */}
      <div className="shrink-0 border-b border-black/[0.04] bg-white px-5 py-3">
        <p className="text-[12px] text-[#28347c]/40">
          <span className="font-bold text-[#28347c]">{past.length}</span> recordatorio{past.length !== 1 ? "s" : ""} completado{past.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain bg-[#f2f5fb] px-4 pt-3 pb-6">
        {past.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <SaluBot size={44} />
            <p className="mt-4 text-[14px] font-medium text-[#28347c]">Sin recordatorios anteriores</p>
          </div>
        ) : (
          <div className="space-y-5">
            {(() => {
              const byMonth = new Map<string, Reminder[]>();
              for (const r of past) {
                const [y, m] = r.date.split("-");
                const key = `${y}-${m}`;
                if (!byMonth.has(key)) byMonth.set(key, []);
                byMonth.get(key)!.push(r);
              }
              return [...byMonth.entries()]
                .sort((a, b) => b[0].localeCompare(a[0]))
                .map(([key, items]) => {
                  const [y, m] = key.split("-");
                  const label = `${MONTHS[+m - 1]} ${y}`;
                  return (
                    <section key={key}>
                      <div className="sticky top-0 z-10 -mx-4 mb-2 bg-[#f2f5fb]/90 px-4 py-1.5 backdrop-blur-sm">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-[#28347c]/40">
                          {label} <span className="font-normal">· {items.length}</span>
                        </p>
                      </div>
                      <div className="space-y-2">
                        {items.map(r => <RemCard key={r.id} r={r} variant="past" />)}
                      </div>
                    </section>
                  );
                });
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

type RemVariant = "today" | "upcoming" | "past";

function RemCard({ r, variant = "upcoming" }: { r: Reminder; variant?: RemVariant }) {
  const Icon = REM_ICON[r.category];
  const accentColor = variant === "today" ? "bg-[#ee742f]" : variant === "upcoming" ? "bg-[#2b4c9c]" : "bg-[#cbd5e1]";
  const isPast = variant === "past";

  return (
    <div className={cn(
      "flex overflow-hidden rounded-2xl bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_12px_rgba(43,76,156,0.06)] ring-1 transition-all",
      isPast ? "opacity-50 ring-black/[0.03]" : "ring-black/[0.05]",
      variant === "today" && "shadow-[0_2px_8px_rgba(238,116,47,0.15),0_4px_16px_rgba(238,116,47,0.08)]"
    )}>
      {/* Accent bar */}
      <span className={cn("w-[3.5px] shrink-0 self-stretch", accentColor)} aria-hidden />

      <div className="flex flex-1 items-start gap-3 px-3 py-3.5">
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          isPast ? "bg-[#f1f5f9] text-[#94a3b8]" : REM_TINT[r.category])}>
          {isPast ? <Check className="h-4.5 w-4.5" strokeWidth={2} /> : <Icon className="h-5 w-5" strokeWidth={1.8} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#94a3b8]">{REM_LABEL[r.category]}</p>
          <p className="mt-0.5 font-[family-name:var(--font-inter)] text-[14px] font-bold leading-snug text-[#28347c]">{r.title}</p>
          <p className="mt-1 text-[12px] text-[#64748b]">{fmt(r.date)} · {r.time} hs</p>
          {r.description && <p className="mt-1 text-[12px] leading-snug text-[#94a3b8]">{r.description}</p>}
        </div>
        {variant === "today" && (
          <span className="shrink-0 self-start rounded-full bg-[#fff7ed] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#ee742f]">Hoy</span>
        )}
      </div>
    </div>
  );
}

function RecordatoriosTab({ onOpenAnteriores }: { onOpenAnteriores: () => void }) {
  const past     = REMINDERS.filter(r => r.date < TODAY).sort((a, b) => b.date.localeCompare(a.date));
  const todayRem = REMINDERS.filter(r => r.date === TODAY).sort((a, b) => a.time.localeCompare(b.time));
  const upcoming = REMINDERS.filter(r => r.date > TODAY).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  return (
    <>
      <div className="shrink-0 bg-white px-5 pt-3 pb-4 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-[#64748b]">{REMINDERS.length} recordatorios</p>
          <button type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ee742f] text-white shadow-md shadow-[#ee742f]/40">
            <Plus className="h-4 w-4" strokeWidth={2.4} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain bg-[#f2f5fb] px-5 pt-4 pb-6 space-y-5">

        {/* Hoy */}
        <section>
          <div className="mb-2.5 flex items-center gap-2">
            <span className="rounded-full bg-[#ee742f] px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-white">Hoy</span>
            <span className="text-[12px] text-[#94a3b8]">{fmt(TODAY)}</span>
          </div>
          {todayRem.length > 0
            ? <div className="space-y-2">{todayRem.map(r => <RemCard key={r.id} r={r} variant="today" />)}</div>
            : <p className="rounded-2xl bg-white px-4 py-4 text-[13px] text-[#94a3b8] shadow-[0_1px_4px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04]">Sin recordatorios para hoy</p>
          }
        </section>

        {/* Próximos */}
        {upcoming.length > 0 && (
          <section>
            <div className="mb-2.5 flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">Próximos</span>
              <span className="rounded-full bg-[#e8f4fb] px-2 py-0.5 text-[10.5px] font-bold text-[#2b4c9c]">{upcoming.length}</span>
            </div>
            <div className="space-y-2">{upcoming.map(r => <RemCard key={r.id} r={r} variant="upcoming" />)}</div>
          </section>
        )}

        {/* Anteriores — acceso a sub-pantalla */}
        {past.length > 0 && (
          <button type="button" onClick={onOpenAnteriores}
            className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3.5 shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_12px_rgba(43,76,156,0.06)] ring-1 ring-black/[0.05] active:scale-[0.98] transition-transform duration-150">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f1f5f9] text-[#64748b]">
                <Calendar className="h-4 w-4" />
              </span>
              <div className="text-left">
                <p className="font-[family-name:var(--font-inter)] text-[14px] font-semibold text-[#28347c]">Recordatorios anteriores</p>
                <p className="text-[12px] text-[#94a3b8]">{past.length} {past.length === 1 ? "anterior" : "anteriores"}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-[#94a3b8]" />
          </button>
        )}
      </div>
    </>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function Page() {
  const [activeTab, setActiveTab]           = useState<ActiveTab>("documentos");
  const [openDoc, setOpenDoc]               = useState<Doc | null>(null);
  const [docs, setDocs]                     = useState<Doc[]>(DOCS);
  const [anterioresOpen, setAnterioresOpen] = useState(false);

  function handleDelete(id: string) {
    setDocs(prev => prev.filter(d => d.id !== id));
    setOpenDoc(null);
  }

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      {/* Sticky header — blanco limpio */}
      <div className="shrink-0 bg-white px-5 pt-11 pb-4 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
        {/* Status bar */}
        <div className="mb-3 flex items-center justify-between">
          <span className="font-[family-name:var(--font-inter)] text-[12px] font-semibold text-[#94a3b8]">09:41</span>
        </div>

        {/* Title + summary */}
        <div className="flex items-center justify-between">
          <div className="flex items-end gap-2">
            <h1 className="font-[family-name:var(--font-inter)] text-[26px] font-bold tracking-tight text-[#28347c]">
              Historial
            </h1>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/salu-waving.png" alt="Salu" className="mb-0.5 h-9 w-auto object-contain drop-shadow-sm" />
          </div>
        </div>
        <p className="mt-0.5 text-[13px] text-[#94a3b8]">{docs.length} documentos</p>

        {/* Tab switcher */}
        <div className="mt-3 flex rounded-full bg-[#f1f5f9] p-1">
          {(["documentos", "recordatorios"] as const).map(tab => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)}
              className={cn("flex-1 rounded-full py-2 text-[13.5px] font-semibold transition-all duration-200",
                activeTab === tab
                  ? "bg-white text-[#28347c] shadow-sm"
                  : "text-[#64748b]")}>
              {tab === "documentos" ? "Documentos" : "Recordatorios"}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "documentos"
        ? <DocumentosTab onOpenDoc={setOpenDoc} key={docs.length} />
        : <RecordatoriosTab onOpenAnteriores={() => setAnterioresOpen(true)} />
      }

      {/* Doc detail overlay — slides in from right */}
      {openDoc && (
        <DocDetail
          doc={openDoc}
          onBack={() => setOpenDoc(null)}
          onDelete={handleDelete}
        />
      )}

      {/* Anteriores sub-screen — slides in from right */}
      {anterioresOpen && <AnterioresScreen onBack={() => setAnterioresOpen(false)} />}

      {/* Suppress unused */}
      <span className="hidden">{docs.length}<Bell /><AlertTriangle /></span>
    </div>
  );
}
