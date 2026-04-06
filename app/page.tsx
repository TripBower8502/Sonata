'use client';

import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { preloadedFlashcards, caseStudies, ECHO_TOPICS, type Flashcard, type CaseStudy } from '@/lib/data';

// ─── Theme ────────────────────────────────────────────────────────────────────
const LIGHT_TOKENS = { P: '#e07a8f', PD: '#c9546b', PL: '#fdf0f3', PS: '#fff5f7', PB: '#f5c2cb', PT: '#1a0a10', PM: '#6b3040', PX: '#9b5a6a', isDark: false };
const DARK_TOKENS  = { P: '#e07a8f', PD: '#f08a9a', PL: '#100708', PS: '#1e0e14', PB: '#3a1820', PT: '#f5e8ec', PM: '#d4939f', PX: '#a06870', isDark: true  };
type Theme = typeof LIGHT_TOKENS;
const ThemeCtx = createContext<Theme>(LIGHT_TOKENS);
const useT = () => useContext(ThemeCtx);

// ─── Markdown renderer ───────────────────────────────────────────────────────
function renderText(text: string) {
  return (
    <>
      {text.split('\n').map((line, i) => {
        if (line === '') return <div key={i} style={{ height: 5 }} />;
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <div key={i}>
            {parts.map((part, j) =>
              part.startsWith('**') && part.endsWith('**')
                ? <strong key={j}>{part.slice(2, -2)}</strong>
                : part || null
            )}
          </div>
        );
      })}
    </>
  );
}

// ─── Storage ──────────────────────────────────────────────────────────────────
const PIN_CODE = '7985';
const UNLOCK_KEY = 'sonata-unlocked';
const STUDIED_KEY = 'sonata-studied-cards';
const STATS_KEY = 'sonata-stats';
const GEN_KEY = 'sonata-generated-cards';
const BOOKMARKS_KEY = 'sonata-bookmarks';

function getBookmarked(): Set<string> {
  try { return new Set(JSON.parse(stor(BOOKMARKS_KEY) || '[]')); } catch { return new Set(); }
}
function toggleBookmark(id: string): Set<string> {
  const s = getBookmarked();
  if (s.has(id)) s.delete(id); else s.add(id);
  stor(BOOKMARKS_KEY, JSON.stringify(Array.from(s)));
  return s;
}

function stor(key: string, val?: string) {
  if (typeof window === 'undefined') return null;
  if (val !== undefined) { localStorage.setItem(key, val); return val; }
  return localStorage.getItem(key);
}

function sess(key: string, val?: string) {
  if (typeof window === 'undefined') return null;
  if (val !== undefined) { sessionStorage.setItem(key, val); return val; }
  return sessionStorage.getItem(key);
}

function getStats() {
  try { return JSON.parse(stor(STATS_KEY) || '{}'); } catch { return {}; }
}

function saveStats(s: Record<string, unknown>) {
  stor(STATS_KEY, JSON.stringify(s));
}

function getStudiedIds(): Set<string> {
  try { return new Set(JSON.parse(stor(STUDIED_KEY) || '[]')); } catch { return new Set(); }
}

function markStudied(id: string) {
  const s = getStudiedIds(); s.add(id);
  stor(STUDIED_KEY, JSON.stringify(Array.from(s)));
  const stats = getStats();
  stats.flashcardsStudied = s.size;
  stats.lastStudied = new Date().toDateString();
  saveStats(stats);
}

function getGeneratedCards(): Flashcard[] {
  try { return JSON.parse(stor(GEN_KEY) || '[]'); } catch { return []; }
}

function saveGeneratedCards(c: Flashcard[]) {
  stor(GEN_KEY, JSON.stringify(c));
}

const GEN_CASES_KEY = 'sonata-generated-cases';
function getGeneratedCases(): CaseStudy[] {
  try { return JSON.parse(stor(GEN_CASES_KEY) || '[]'); } catch { return []; }
}
function saveGeneratedCases(c: CaseStudy[]) {
  stor(GEN_CASES_KEY, JSON.stringify(c));
}

// ─── Study Materials (uploaded content) ──────────────────────────────────────
const MATERIALS_KEY = 'sonata-study-materials';
interface StudyMaterial {
  id: string;
  title: string;
  fileName: string;
  fileType: 'image' | 'pdf' | 'text';
  uploadedAt: number;
  studyNotes: string;
  flashcards: Array<{ front: string; back: string; category: string }>;
  quizQuestions: Array<{ question: string; options: string[]; correctIndex: number; explanation: string }>;
}
function getMaterials(): StudyMaterial[] {
  try { return JSON.parse(stor(MATERIALS_KEY) || '[]'); } catch { return []; }
}
function saveMaterials(m: StudyMaterial[]) {
  stor(MATERIALS_KEY, JSON.stringify(m));
}
function deleteMaterial(id: string) {
  saveMaterials(getMaterials().filter(m => m.id !== id));
}

const CASE_TOPICS = [
  'Aortic Stenosis', 'Aortic Regurgitation', 'Mitral Stenosis', 'Mitral Regurgitation',
  'Cardiac Tamponade', 'Pulmonary Hypertension', 'Myocarditis', 'Cardiac Amyloidosis',
  'Takotsubo Cardiomyopathy', 'HFpEF', 'Atrial Septal Defect', 'Bicuspid Aortic Valve',
  'Constrictive Pericarditis', 'Athlete\'s Heart', 'Pulmonary Embolism',
  'Tricuspid Regurgitation', 'Prosthetic Valve Dysfunction', 'Pulmonary Stenosis',
];

// ─── Ally's welcome messages (all from TB) ───────────────────────────────────
const ALLY_MESSAGES = [
  "I am so proud of you. Like, genuinely so unbelievably proud. Keep going, baby! 😍",
  "Watching you work this hard makes my heart so full. I love you more than words. 💖",
  "You are going to be the most incredible cardiac sonographer and I get to say I knew you when. 🥹",
  "No matter how hard today feels — I believe in you with absolutely everything I have. 💪",
  "The echo world has no idea what's coming for it. You are going to change lives. ✨",
  "You make me so ridiculously proud every single day. I love you so much! 😍",
  "I knew from day one you were made for this. I'm never wrong about you. 🩺",
  "You are brilliant, beautiful, and absolutely going to crush this. 🌟",
  "Every hard day is just one step closer to the incredible sonographer you already are. 💪",
  "I built this whole app just for you because you deserve every bit of support. 💻💖",
  "Parasternal long axis? More like LEGENDARY long axis when YOU do it! 🌈",
  "Your future patients don't know it yet, but they are SO lucky to have you. 🏥",
  "Every flashcard, every quiz — I'm cheering for you through every single one. 📖",
  "Warning: My girlfriend is dangerously good at echo and I am SO here for it. ⚡",
  "One heartbeat at a time, one scan at a time — you've totally got this, Ally. 🫀",
  "Cheesy but true: you're the EF to my echocardiogram. Essential and perfect. 😄",
  "The cardiac world is genuinely brighter because you decided to be in it. 🌸",
  "You are the hardest working, most dedicated person I know and I am obsessed with you. 🥰",
  "I made this app just to watch you become great. It's working. You're incredible. 💻❤️",
  "Proud doesn't even cover it. I am completely amazed by you every single day. 🌟",
];

// ─── Heart + stethoscope character ───────────────────────────────────────────
function HeartDoc() {
  return (
    <svg width="96" height="96" viewBox="-6 -6 112 112" fill="none">
      {/* Heart body */}
      <path d="M50 83C27 64 7 50 7 29C7 17 16 7 29 7C37 7 44 12 50 21C56 12 63 7 71 7C84 7 93 17 93 29C93 50 73 64 50 83Z" fill="#e07a8f"/>
      {/* Inner soft highlight */}
      <path d="M50 76C30 59 12 47 12 29C12 19 20 11 29 11C37 11 44 15 50 23C56 15 63 11 71 11C80 11 88 19 88 29C88 47 70 59 50 76Z" fill="#ec8fa3" opacity="0.22"/>
      {/* Lobe shines */}
      <ellipse cx="30" cy="21" rx="9" ry="5.5" fill="rgba(255,255,255,0.28)" transform="rotate(-28 30 21)"/>
      <ellipse cx="70" cy="21" rx="9" ry="5.5" fill="rgba(255,255,255,0.18)" transform="rotate(28 70 21)"/>
      {/* Eyes */}
      <circle cx="35" cy="37" r="5.5" fill="#1a0a10"/>
      <circle cx="65" cy="37" r="5.5" fill="#1a0a10"/>
      {/* Eye shines */}
      <circle cx="37" cy="35" r="2.2" fill="white"/>
      <circle cx="67" cy="35" r="2.2" fill="white"/>
      {/* Blush circles */}
      <ellipse cx="21" cy="48" rx="8" ry="5" fill="rgba(255,160,160,0.45)"/>
      <ellipse cx="79" cy="48" rx="8" ry="5" fill="rgba(255,160,160,0.45)"/>
      {/* Smile */}
      <path d="M37 56Q50 69 63 56" stroke="#1a0a10" strokeWidth="3" strokeLinecap="round" fill="none"/>
      {/* ECG heartbeat trace — echo school signal */}
      <path d="M33 73 H40 L42 67 L45 80 L47 73 H53 Q56 69 59 73 H67" stroke="rgba(255,255,255,0.62)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {/* Stethoscope tube */}
      <path d="M64 63C70 67 79 72 83 78" stroke="#c9546b" strokeWidth="4" strokeLinecap="round" fill="none"/>
      {/* Stethoscope chest piece */}
      <circle cx="86" cy="82" r="11" fill="#c9546b"/>
      <circle cx="86" cy="82" r="6.5" fill="#fdf0f3"/>
      <circle cx="86" cy="82" r="3" fill="#c9546b"/>
    </svg>
  );
}

// ─── Echo formula data ───────────────────────────────────────────────────────
const ECHO_FORMULAS = [
  {
    category: 'Hemodynamics',
    emoji: '🔴',
    items: [
      { name: 'Modified Bernoulli', formula: 'ΔP = 4v²', notes: 'Pressure gradient from peak velocity. Align CW beam within 20° of flow.' },
      { name: 'RVSP', formula: 'RVSP = 4(TR Vmax)² + RAP', notes: 'RAP: 3 mmHg (IVC <2.1 cm, >50% collapse), 8 (indeterminate), 15 (IVC >2.1 cm, <50%).' },
      { name: 'Cardiac Output', formula: 'CO = SV × HR', notes: 'Normal 4–8 L/min. Index to BSA for CI (normal 2.2–4.0 L/min/m²).' },
      { name: 'Stroke Volume', formula: 'SV = LVOT CSA × LVOT VTI', notes: 'LVOT CSA = π(D/2)². Normal SV 60–100 mL.' },
    ],
  },
  {
    category: 'Continuity Equation',
    emoji: '🔵',
    items: [
      { name: 'Aortic Valve Area', formula: 'AVA = (LVOT CSA × LVOT VTI) / AV VTI', notes: 'Gold standard. Normal AVA >2.0 cm². Severe AS: AVA <1.0 cm².' },
      { name: 'LVOT CSA', formula: 'π × (LVOT diameter / 2)²', notes: 'Measured inner edge–to–inner edge in PLAX, mid-systole.' },
      { name: 'Dimensionless Index', formula: 'DI = LVOT VTI / AV VTI', notes: 'DI <0.25 suggests severe AS. Use when LVOT diameter is unreliable.' },
    ],
  },
  {
    category: 'LV Function',
    emoji: '💜',
    items: [
      { name: "EF — Biplane Simpson's", formula: 'EF = (EDV − ESV) / EDV × 100', notes: 'Gold standard. Uses A4C + A2C. Normal ≥55%. Mildly reduced 41–54%.' },
      { name: 'Fractional Shortening', formula: 'FS = (LVEDD − LVESD) / LVEDD × 100', notes: 'M-mode derived. Normal 25–45%. Assumes symmetric geometry.' },
      { name: 'LV Mass (ASE)', formula: '0.8 × [1.04 × (LVEDD + IVS + PW)³ − LVEDD³] + 0.6 g', notes: 'Index to BSA. Abnormal: men >115 g/m², women >95 g/m².' },
      { name: 'MAPSE', formula: 'Lateral or septal mitral annulus excursion (M-mode)', notes: 'Normal ≥12 mm. Reduced in systolic dysfunction and subendocardial ischemia.' },
    ],
  },
  {
    category: 'Diastolic Function',
    emoji: '🟢',
    items: [
      { name: 'E/A Ratio', formula: 'E-wave velocity / A-wave velocity', notes: 'Normal 0.8–2.0. Grade I (impaired relaxation): E/A <0.8. Grade III (restrictive): E/A >2.' },
      { name: 'E/e\' Ratio', formula: 'Mitral E / Average tissue Doppler e\'', notes: 'Average = (septal e\' + lateral e\') / 2. >14 indicates elevated LV filling pressure.' },
      { name: "Septal e'", formula: 'TDI at septal mitral annulus', notes: 'Abnormal <7 cm/s. Used in E/e\' and diastolic grading.' },
      { name: "Lateral e'", formula: 'TDI at lateral mitral annulus', notes: 'Abnormal <10 cm/s. Higher than septal (annular paradox in constrictive pericarditis).' },
      { name: 'Deceleration Time (DT)', formula: 'E-wave slope extrapolated to baseline', notes: 'Normal 160–240 ms. <160 ms = elevated LVFP (Grade II/III).' },
      { name: 'IVRT', formula: 'Isovolumic relaxation time (AV closure → MV opening)', notes: 'Normal 70–100 ms. Prolonged in impaired relaxation; shortened in Grade III.' },
    ],
  },
  {
    category: 'RV Function',
    emoji: '🟠',
    items: [
      { name: 'TAPSE', formula: 'Tricuspid annular plane systolic excursion (M-mode)', notes: 'Normal ≥17 mm. <17 mm = RV systolic dysfunction.' },
      { name: "RV S'", formula: 'Peak systolic TDI at tricuspid annulus', notes: 'Normal ≥9.5 cm/s. Reduced in RV dysfunction.' },
      { name: 'RV FAC', formula: '(RVEDA − RVESA) / RVEDA × 100', notes: 'Normal ≥35%. Measured in A4C, tracing RV free wall + septum.' },
      { name: 'RIMP (RV MPI)', formula: '(IVCT + IVRT) / ET', notes: 'Normal ≤0.43 (PW Doppler) or ≤0.54 (TDI). Elevated in RV dysfunction.' },
    ],
  },
  {
    category: 'Valve Regurgitation',
    emoji: '🔶',
    items: [
      { name: 'EROA (PISA Method)', formula: 'EROA = 2πr² × (Valiasing / Vpeak regurg)', notes: 'Severe MR: EROA ≥0.4 cm². Severe AR: EROA ≥0.3 cm².' },
      { name: 'Regurgitant Volume', formula: 'RVol = EROA × VTI regurg jet', notes: 'Severe MR: ≥60 mL/beat. Severe AR: ≥60 mL/beat.' },
      { name: 'Vena Contracta', formula: 'Narrowest jet width on color Doppler', notes: 'Severe MR: ≥0.7 cm. Severe AR: ≥0.6 cm.' },
    ],
  },
  {
    category: 'Valve Stenosis',
    emoji: '🔷',
    items: [
      { name: 'Mitral Valve Area (PHT)', formula: 'MVA = 220 / PHT', notes: 'Severe MS: MVA <1.0 cm². PHT prolonged with severe stenosis.' },
      { name: 'Mitral Valve Area (Continuity)', formula: 'MVA = (LVOT CSA × LVOT VTI) / MV VTI', notes: 'More accurate if AR is present (affects PHT method).' },
      { name: 'AS Mean Gradient', formula: 'Mean ΔP = mean(4v²) across systole', notes: 'Severe AS: ≥40 mmHg. Low-flow/low-gradient: <40 mmHg with AVA <1.0 cm².' },
    ],
  },
  {
    category: 'Pericardium & IVC',
    emoji: '⚪',
    items: [
      { name: 'IVC Collapsibility Index', formula: '(IVCmax − IVCmin) / IVCmax × 100', notes: '>50% collapse → RAP ~3 mmHg. <50% + IVC >2.1 cm → RAP ~15 mmHg.' },
      { name: 'RAP Estimation', formula: 'IVC diameter + % inspiratory collapse', notes: 'Plethoric IVC (>2.1 cm, <50%) = RAP 15 mmHg. Used in RVSP calculation.' },
    ],
  },
];

// ─── Types ───────────────────────────────────────────────────────────────────
type Tab = 'home' | 'cards' | 'quiz' | 'cases' | 'guide' | 'progress';
type HeartSoundId = 'normal' | 'as' | 'mr' | 'ms' | 'ar' | 'vsd' | 'hocm' | 's3' | 'ps';

interface QuizQ {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface AnswerRecord {
  question: QuizQ;
  selectedIndex: number;
  correct: boolean;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ─── Heart Sounds ────────────────────────────────────────────────────────────
// Generates heart sounds as a WAV Blob — plays via HTMLAudioElement which
// iOS treats identically to regular audio (no AudioContext lifecycle issues).
const HEART_SOUNDS_QUIZ: {
  id: HeartSoundId; name: string; question: string;
  options: string[]; correct: number; explanation: string; echoKey: string;
}[] = [
  {
    id: 'normal', name: 'Normal Heart Sounds',
    question: 'You hear regular S1 and S2 with a quiet gap in between. No extra sounds or murmurs.',
    options: ['Normal Heart Sounds', 'Aortic Stenosis', 'Mitral Regurgitation', 'Mitral Stenosis'],
    correct: 0,
    explanation: '**Normal S1–S2:** S1 ("lub") marks MV + TV closure at the start of systole. S2 ("dub") marks AV + PV closure at the end of systole. Diastole is silent. Rate ~72 bpm.',
    echoKey: 'Normal valve morphology, no turbulent color Doppler jets, EF ≥55%, no elevated gradients.',
  },
  {
    id: 'as', name: 'Aortic Stenosis',
    question: 'After S1 you hear a harsh, rough murmur that crescendos then decrescendos before a soft or absent S2.',
    options: ['Normal Heart Sounds', 'Aortic Stenosis', 'Mitral Regurgitation', 'Aortic Regurgitation'],
    correct: 1,
    explanation: '**Aortic Stenosis:** Harsh crescendo-decrescendo (diamond-shaped) systolic ejection murmur. Turbulent flow through a narrowed AV causes the rough character. Loudest at 2nd right ICS; radiates to carotids. A2 softens or disappears as the valve calcifies.',
    echoKey: 'AVA <1.0 cm² (severe), mean gradient ≥40 mmHg, Vmax ≥4 m/s, calcified/restricted AV leaflets on 2D.',
  },
  {
    id: 'mr', name: 'Mitral Regurgitation',
    question: 'From S1 all the way through to S2 you hear a uniform, blowing, high-pitched murmur throughout systole.',
    options: ['Normal Heart Sounds', 'Aortic Stenosis', 'Mitral Regurgitation', 'Mitral Stenosis'],
    correct: 2,
    explanation: '**Mitral Regurgitation:** Holosystolic (pansystolic) blowing murmur — the pressure difference between LV and LA exists throughout systole, so regurgitant flow is constant. Loudest at the apex, radiates to the axilla. S1 may be soft.',
    echoKey: 'Color Doppler MR jet into LA. Severe: EROA ≥0.4 cm², RVol ≥60 mL, vena contracta ≥0.7 cm, dilated LA.',
  },
  {
    id: 'ms', name: 'Mitral Stenosis',
    question: 'You hear a loud S1, then S2, then a sharp opening snap, followed by a low rumbling murmur in diastole.',
    options: ['Normal Heart Sounds', 'Aortic Regurgitation', 'Aortic Stenosis', 'Mitral Stenosis'],
    correct: 3,
    explanation: '**Mitral Stenosis:** Loud S1 (forceful valve closure), high-pitched opening snap (OS) ~60–100 ms after S2 as the stiff valve pops open, then a low-frequency diastolic rumble as blood squeezes through the narrowed MV. Shorter S2–OS interval = more severe stenosis.',
    echoKey: 'MVA <1.0 cm² (severe), PHT method: MVA = 220/PHT, mean gradient ≥10 mmHg, hockey-stick MV in PLAX, dilated LA.',
  },
  {
    id: 'ar', name: 'Aortic Regurgitation',
    question: 'Immediately after S2 you hear a high-pitched blowing murmur that begins loudly then fades through diastole.',
    options: ['Normal Heart Sounds', 'Aortic Regurgitation', 'Mitral Stenosis', 'Aortic Stenosis'],
    correct: 1,
    explanation: '**Aortic Regurgitation:** Early diastolic, high-pitched decrescendo blowing murmur beginning right after S2. Blood leaks back through an incompetent AV during diastole. Best heard at left sternal border with patient leaning forward, breath held in expiration.',
    echoKey: 'Diastolic flow reversal in descending aorta (severe), vena contracta ≥0.6 cm, PHT <200 ms, dilated LV.',
  },
  {
    id: 'vsd', name: 'Ventricular Septal Defect',
    question: 'A harsh, loud holosystolic murmur is loudest at the left lower sternal border and radiates across the precordium.',
    options: ['Mitral Regurgitation', 'Ventricular Septal Defect', 'Tricuspid Regurgitation', 'Aortic Stenosis'],
    correct: 1,
    explanation: '**VSD:** LV-to-RV shunting creates a harsh holosystolic murmur at the 4th ICS left sternal border. Unlike MR (loudest at apex), VSD is loudest at LLSB and radiates broadly. Smaller VSDs ("Maladie de Roger") are actually louder despite being less hemodynamically significant.',
    echoKey: 'Color Doppler: turbulent LV→RV jet. Measure Qp:Qs for shunt quantification. Significant VSD: dilated LV, volume overload. 2D shows defect location (perimembranous, muscular, etc.).',
  },
  {
    id: 'hocm', name: 'Hypertrophic Obstructive Cardiomyopathy',
    question: 'A harsh systolic murmur at the left lower sternal border gets louder when the patient stands up and softer when they squat. What does this represent?',
    options: ['Aortic Stenosis', 'Mitral Regurgitation', 'Hypertrophic Obstructive Cardiomyopathy', 'Pulmonary Stenosis'],
    correct: 2,
    explanation: '**HOCM:** The dynamic LVOT obstruction murmur increases with anything reducing preload (standing, Valsalva) and decreases with increased preload (squatting, passive leg raise). This distinguishes it from AS (fixed) and MR (unaffected by posture).',
    echoKey: 'IVS ≥15 mm (asymmetric septal hypertrophy), LVOT gradient ≥30 mmHg rest or ≥50 mmHg with provocation, systolic anterior motion (SAM) of MV anterior leaflet, MR.',
  },
  {
    id: 's3', name: 'S3 Gallop',
    question: 'After S1 and S2, a low-pitched extra sound in early diastole creates a "ken-TUCK-y" three-beat rhythm. What is this?',
    options: ['Opening Snap', 'S4 Gallop', 'Pericardial Knock', 'S3 Gallop'],
    correct: 3,
    explanation: '**S3 Gallop:** Occurs 120–200 ms after S2 as rapid early filling decelerates against a volume-overloaded or non-compliant LV. Pathologic in adults >40 — classic sign of HFrEF. Physiologic in young athletes and pregnancy. Best heard at apex, left lateral decubitus, with bell of stethoscope.',
    echoKey: 'Dilated LV, reduced EF, elevated filling pressures. E/e\' ≥15, E-wave decel time <150 ms (restrictive pattern), elevated LVEDP. Clinical: JVD, crackles, edema.',
  },
  {
    id: 'ps', name: 'Pulmonary Stenosis',
    question: 'At the upper left sternal border you hear a sharp ejection click then a crescendo-decrescendo murmur. The click disappears with inspiration. What is this?',
    options: ['Aortic Stenosis', 'Mitral Stenosis', 'Pulmonary Stenosis', 'Hypertrophic Obstructive Cardiomyopathy'],
    correct: 2,
    explanation: '**Pulmonary Stenosis:** Ejection click + systolic ejection murmur at 2nd LICS. Unique feature: the ejection click softens or disappears with inspiration — opposite of most right-sided sounds. Pulmonic ejection click arises from a doming PV abruptly snapping open.',
    echoKey: 'CW Doppler across PV: Vmax, gradient. Severe PS: Vmax >4 m/s, peak gradient >64 mmHg. Doming pulmonic valve, post-stenotic MPA dilation, RV hypertrophy if chronic.',
  },
];

function buildWav(samples: Float32Array, sampleRate: number): string {
  // Normalize
  let peak = 0;
  for (let i = 0; i < samples.length; i++) if (Math.abs(samples[i]) > peak) peak = Math.abs(samples[i]);
  const scale = peak > 0.001 ? 0.92 / peak : 1;
  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) pcm[i] = Math.max(-32768, Math.min(32767, Math.round(samples[i] * scale * 32767)));
  // WAV header
  const ab = new ArrayBuffer(44 + pcm.byteLength);
  const v = new DataView(ab);
  const ws = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, 'RIFF'); v.setUint32(4, 36 + pcm.byteLength, true); ws(8, 'WAVE');
  ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  ws(36, 'data'); v.setUint32(40, pcm.byteLength, true);
  new Uint8Array(ab, 44).set(new Uint8Array(pcm.buffer));
  return URL.createObjectURL(new Blob([ab], { type: 'audio/wav' }));
}

function generateHeartSoundUrl(id: HeartSoundId): string {
  const SR = 44100;
  const totalDur = 2.1;
  const N = Math.ceil(SR * totalDur);
  const buf = new Float32Array(N);

  // Harmonically-rich thump (150 Hz fundamental — audible on any speaker)
  function thump(t: number, amp: number) {
    const s0 = Math.round(t * SR);
    for (let h = 1; h <= 4; h++) {
      const freq = 150 * h;
      const hAmp = amp / h;
      for (let i = 0; i < Math.round(0.10 * SR) && s0 + i < N; i++) {
        const p = i / SR;
        buf[s0 + i] += hAmp * Math.exp(-p * 28) * Math.sin(2 * Math.PI * freq * p);
      }
    }
  }

  // Murmur — IIR-filtered noise for bandpass effect
  function murmur(t0: number, t1: number, shape: 'diamond' | 'plateau' | 'decres', amp: number) {
    const s0 = Math.round(t0 * SR), s1 = Math.min(N, Math.round(t1 * SR));
    let lp = 0;
    for (let i = s0; i < s1; i++) {
      const prog = (i - s0) / (s1 - s0);
      const env = shape === 'diamond' ? Math.sin(Math.PI * prog)
                : shape === 'plateau' ? 1
                : (1 - prog * 0.9);
      lp = 0.08 * (Math.random() * 2 - 1) + 0.92 * lp; // ~350 Hz low-pass
      buf[i] += amp * env * lp * 10;
    }
  }

  for (let cycle = 0; cycle < 2; cycle++) {
    const o = 0.1 + cycle * 0.88;
    const S1 = o, S2 = o + 0.32;
    if (id === 'normal') {
      thump(S1, 1.0); thump(S2, 0.75);
    } else if (id === 'as') {
      thump(S1, 1.0); murmur(S1 + 0.07, S2 - 0.03, 'diamond', 0.55); thump(S2, 0.3);
    } else if (id === 'mr') {
      thump(S1, 0.55); murmur(S1 + 0.01, S2, 'plateau', 0.55); thump(S2, 0.95);
    } else if (id === 'ms') {
      thump(S1, 1.3); thump(S2, 0.85);
      // Opening snap (sharp high-pitched click)
      thump(S2 + 0.08, 0.5); murmur(S2 + 0.11, S1 + 0.88 - 0.12, 'decres', 0.4);
    } else if (id === 'ar') {
      thump(S1, 1.0); thump(S2, 0.85); murmur(S2 + 0.02, S1 + 0.88 - 0.08, 'decres', 0.5);
    } else if (id === 'vsd') {
      // Harsh holosystolic — like MR but slightly harder/noisier
      thump(S1, 0.5); murmur(S1 + 0.01, S2 + 0.01, 'plateau', 0.65); thump(S2, 0.9);
    } else if (id === 'hocm') {
      // Diamond systolic at LLSB
      thump(S1, 1.0); murmur(S1 + 0.06, S2 - 0.04, 'diamond', 0.62); thump(S2, 0.9);
    } else if (id === 's3') {
      // S1 + S2 + soft early diastolic S3 thump
      thump(S1, 1.0); thump(S2, 0.8); thump(S2 + 0.14, 0.3);
    } else if (id === 'ps') {
      // Ejection click (extra sharp thump) then diamond murmur
      thump(S1, 1.0); thump(S1 + 0.05, 0.55); murmur(S1 + 0.09, S2 - 0.04, 'diamond', 0.50); thump(S2, 0.8);
    }
  }
  return buildWav(buf, SR);
}

function HeartSoundPCG({ id }: { id: HeartSoundId }) {
  // Phonocardiogram timing diagram — S1 at x=22, S2 at x=108, S1' at x=254
  const murmurColor = '#f59e0b';
  const baseColor = '#d1d5db';
  return (
    <svg viewBox="0 0 280 56" style={{ width: '100%', display: 'block' }}>
      {/* Systole zone */}
      <rect x="22" y="4" width="86" height="48" rx="4" fill="rgba(224,122,143,0.08)"/>
      {/* Diastole zone */}
      <rect x="108" y="4" width="146" height="48" rx="4" fill="rgba(147,197,253,0.08)"/>
      {/* Zone labels */}
      <text x="65" y="52" fill="#9b5a6a" fontSize="8" textAnchor="middle" fontFamily="sans-serif">SYSTOLE</text>
      <text x="181" y="52" fill="#6b7280" fontSize="8" textAnchor="middle" fontFamily="sans-serif">DIASTOLE</text>
      {/* Baseline */}
      <line x1="10" y1="28" x2="270" y2="28" stroke={baseColor} strokeWidth="1.5"/>
      {/* S1 */}
      <rect x="17" y="10" width="10" height="36" rx="2" fill="#e07a8f"/>
      <text x="22" y="8" fill="#e07a8f" fontSize="8" textAnchor="middle" fontFamily="sans-serif" fontWeight="700">S1</text>
      {/* S2 */}
      <rect x="103" y="14" width="8" height="28" rx="2" fill="#e07a8f"/>
      <text x="107" y="8" fill="#e07a8f" fontSize="8" textAnchor="middle" fontFamily="sans-serif" fontWeight="700">S2</text>
      {/* Next S1 (ghost) */}
      <rect x="249" y="10" width="10" height="36" rx="2" fill="#e07a8f" opacity="0.3"/>
      {/* Murmurs */}
      {id === 'as' && (
        <path d="M30 28 L65 10 L100 28" stroke={murmurColor} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      )}
      {id === 'mr' && (
        <rect x="30" y="17" width="80" height="22" rx="3" fill={murmurColor} opacity="0.55"/>
      )}
      {id === 'ms' && <>
        {/* Opening snap */}
        <rect x="118" y="18" width="5" height="20" rx="1" fill={murmurColor}/>
        <text x="121" y="48" fill={murmurColor} fontSize="7" textAnchor="middle" fontFamily="sans-serif">OS</text>
        {/* Diastolic rumble */}
        <path d="M125 28 L155 18 L200 24 L230 16 L247 28" stroke={murmurColor} strokeWidth="2" fill="none" strokeLinecap="round"/>
      </>}
      {id === 'ar' && (
        <path d="M114 12 Q160 26 246 28" stroke={murmurColor} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      )}
      {/* VSD — harsh holosystolic like MR */}
      {id === 'vsd' && (
        <rect x="30" y="14" width="80" height="28" rx="3" fill={murmurColor} opacity="0.60"/>
      )}
      {/* HOCM — diamond systolic */}
      {id === 'hocm' && (
        <path d="M32 28 L65 12 L98 28" stroke={murmurColor} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      )}
      {/* S3 Gallop — extra soft sound in early diastole */}
      {id === 's3' && <>
        <rect x="120" y="22" width="8" height="12" rx="2" fill={murmurColor} opacity="0.6"/>
        <text x="124" y="48" fill={murmurColor} fontSize="7" textAnchor="middle" fontFamily="sans-serif">S3</text>
      </>}
      {/* PS — ejection click + diamond murmur */}
      {id === 'ps' && <>
        <rect x="30" y="18" width="5" height="20" rx="1" fill={murmurColor} opacity="0.8"/>
        <text x="33" y="48" fill={murmurColor} fontSize="7" textAnchor="middle" fontFamily="sans-serif">EC</text>
        <path d="M38 28 L65 12 L96 28" stroke={murmurColor} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </>}
    </svg>
  );
}

// ─── Confetti ─────────────────────────────────────────────────────────────────
const PERFECT_MESSAGES = [
  "PERFECT SCORE!! I am so unbelievably proud of you right now! 🎉",
  "100%!! That is ALL YOU, baby. You worked so hard for this! 🥹",
  "FLAWLESS!! The echo world better watch out — you are UNSTOPPABLE! 🌟",
  "Perfect score!! I knew you could do it. I always know. 💖",
  "100%!! You make everything look so easy and it is NOT easy. You are incredible! ⚡",
  "PERFECT!! Go ahead and screenshot that — you earned every single point! 📸",
  "You got every single one right. I am the luckiest person alive to know you. 🥰",
];

// Shuffle helpers
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function shuffleOptions<T extends { options: string[]; correct: number }>(q: T): T {
  const order = shuffleArray([0, 1, 2, 3]);
  return { ...q, options: order.map(i => q.options[i]), correct: order.indexOf(q.correct) };
}

function ConfettiCelebration({ onDone }: { onDone: () => void }) {
  const { P, PD } = useT();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [msg] = useState(() => PERFECT_MESSAGES[Math.floor(Math.random() * PERFECT_MESSAGES.length)]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const COLORS = [P, PD, '#f9a8d4', '#fbbf24', '#a78bfa', '#34d399', '#fb923c', '#fff'];
    type Particle = { x: number; y: number; vx: number; vy: number; color: string; w: number; h: number; rot: number; rv: number; alpha: number };
    const particles: Particle[] = Array.from({ length: 160 }, () => ({
      x: Math.random() * canvas.width,
      y: -10 - Math.random() * 300,
      vx: (Math.random() - 0.5) * 5,
      vy: Math.random() * 3 + 1.5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      w: Math.random() * 10 + 5,
      h: Math.random() * 5 + 3,
      rot: Math.random() * Math.PI * 2,
      rv: (Math.random() - 0.5) * 0.18,
      alpha: 1,
    }));

    let frame = 0;
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.04; p.rot += p.rv;
        if (frame > 100) p.alpha = Math.max(0, p.alpha - 0.012);
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (frame < 200) { raf = requestAnimationFrame(draw); } else { onDone(); }
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [P, PD, onDone]);

  return (
    <>
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 999, pointerEvents: 'none', width: '100%', height: '100%' }} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none', padding: 32,
      }}>
        <div style={{
          background: 'rgba(255,245,247,0.97)', borderRadius: 28, padding: '28px 24px',
          textAlign: 'center', boxShadow: '0 12px 48px rgba(224,122,143,0.35)',
          maxWidth: 340, pointerEvents: 'auto',
        }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
          <div style={{ fontWeight: 900, fontSize: 28, color: P, marginBottom: 10, letterSpacing: '-0.5px' }}>100%!</div>
          <div style={{ fontSize: 14, color: '#1a0a10', lineHeight: 1.65, marginBottom: 20 }}>{msg}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: P, marginBottom: 20 }}>— TB ❤️🐢</div>
          <button
            onClick={onDone}
            style={{ background: P, color: 'white', border: 'none', borderRadius: 16, padding: '12px 32px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sora), sans-serif' }}
          >
            Thank you! 💖
          </button>
        </div>
      </div>
    </>
  );
}

// ─── PIN Screen ──────────────────────────────────────────────────────────────
function PinScreen({ onUnlock }: { onUnlock: () => void }) {
  const { P, PD, PL, PS, PB, PT, PM, PX } = useT();
  const [pin, setPin] = useState('');
  const [shaking, setShaking] = useState(false);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState(ALLY_MESSAGES[0]);

  useEffect(() => {
    setMessage(ALLY_MESSAGES[Math.floor(Math.random() * ALLY_MESSAGES.length)]);
  }, []);

  const press = (d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError(false);
    if (next.length === 4) {
      if (next === PIN_CODE) {
        sess(UNLOCK_KEY, 'true');
        setTimeout(onUnlock, 200);
      } else {
        setShaking(true);
        setError(true);
        setTimeout(() => { setPin(''); setShaking(false); }, 600);
      }
    }
  };

  const del = () => { setPin(p => p.slice(0, -1)); setError(false); };

  const dots = Array.from({ length: 4 }, (_, i) => (
    <div
      key={i}
      style={{
        width: 14, height: 14, borderRadius: '50%',
        background: i < pin.length ? P : 'transparent',
        border: `2px solid ${i < pin.length ? P : PB}`,
        transition: 'all 0.15s',
      }}
    />
  ));

  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: PL, paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      <div style={{ marginBottom: 28, textAlign: 'center', padding: '0 24px' }}>
        <div className="heartbeat" style={{ marginBottom: 14, display: 'flex', justifyContent: 'center' }}>
          <HeartDoc />
        </div>
        <div style={{ fontWeight: 800, fontSize: 24, color: PT, letterSpacing: '-0.5px', marginBottom: 8 }}>
          Welcome back, Ally! 💖
        </div>
        <div style={{
          fontSize: 13, lineHeight: 1.6, fontWeight: 500,
          background: `linear-gradient(135deg, ${PS} 0%, #fce8ed 100%)`,
          border: `1.5px solid ${PD}55`,
          borderRadius: 18, padding: '12px 16px 10px', marginBottom: 10,
          boxShadow: '0 2px 12px rgba(224,122,143,0.15)',
        }}>
          <div style={{ color: PT }}>{message}</div>
          <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: P, textAlign: 'right', letterSpacing: '0.01em' }}>
            — TB ❤️🐢
          </div>
        </div>
        <div style={{ fontSize: 11, color: PX }}>Enter your PIN to continue</div>
      </div>

      <div
        className={shaking ? 'pin-shake' : ''}
        style={{ display: 'flex', gap: 16, marginBottom: 40 }}
      >
        {dots}
      </div>

      {error && (
        <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 16, marginTop: -24 }}>
          Incorrect PIN. Try again.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 72px)', gap: 12 }}>
        {keys.map((k, i) => {
          if (k === '') return <div key={i} />;
          const isDel = k === '⌫';
          return (
            <button
              key={i}
              onClick={() => isDel ? del() : press(k)}
              style={{
                width: 72, height: 72, borderRadius: 20,
                background: isDel ? 'transparent' : PS,
                border: isDel ? 'none' : `1.5px solid ${PB}`,
                fontSize: isDel ? 22 : 24,
                fontWeight: 600,
                color: isDel ? PX : PT,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-sora), sans-serif',
                WebkitTapHighlightColor: 'transparent',
                transition: 'transform 0.1s',
              }}
              onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.93)')}
              onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {k}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── A2HS Banner ─────────────────────────────────────────────────────────────
function A2HSBanner() {
  const { PS, PB, PT, PX } = useT();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const dismissed = sessionStorage.getItem('sonata-a2hs-dismissed');
    if (isIOS && !isStandalone && !dismissed) setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 'calc(16px + env(safe-area-inset-bottom))',
      left: 16, right: 16, zIndex: 100,
      background: PS, border: `1.5px solid ${PB}`,
      borderRadius: 18, padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 8px 32px rgba(224,122,143,0.18)',
    }}>
      <div style={{ fontSize: 24, flexShrink: 0 }}>📱</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: PT }}>Add to Home Screen</div>
        <div style={{ fontSize: 11, color: PX, marginTop: 2 }}>
          Tap <span style={{ fontWeight: 700 }}>Share</span> then &quot;Add to Home Screen&quot; for the full app experience
        </div>
      </div>
      <button
        onClick={() => { sessionStorage.setItem('sonata-a2hs-dismissed', 'true'); setShow(false); }}
        style={{ background: 'none', border: 'none', fontSize: 18, color: PX, cursor: 'pointer', padding: 4 }}
      >
        ✕
      </button>
    </div>
  );
}

// ─── Top Nav ─────────────────────────────────────────────────────────────────
const NAV_ITEMS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'home',     label: 'Home',     emoji: '🏠' },
  { id: 'cards',    label: 'Cards',    emoji: '🃏' },
  { id: 'quiz',     label: 'Quiz',     emoji: '🎯' },
  { id: 'cases',    label: 'Cases',    emoji: '🫀' },
  { id: 'guide',    label: 'Guide',    emoji: '📖' },
  { id: 'progress', label: 'Progress', emoji: '📈' },
];

function TopNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const { P, PB, PX, isDark } = useT();
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      background: isDark ? 'rgba(16,7,8,0.95)' : 'rgba(253,240,243,0.92)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${PB}`,
      paddingTop: 'env(safe-area-inset-top)',
    }}>
      <div style={{ display: 'flex' }}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            style={{
              flex: 1,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 2, padding: '10px 0',
              border: 'none', background: 'none', cursor: 'pointer',
              borderBottom: active === item.id ? `2px solid ${P}` : '2px solid transparent',
              transition: 'all 0.15s',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <span style={{ fontSize: 18 }}>{item.emoji}</span>
            <span style={{
              fontSize: 11, fontWeight: active === item.id ? 700 : 500,
              color: active === item.id ? P : PX,
              fontFamily: 'var(--font-sora), sans-serif',
            }}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}

// ─── Home Section ─────────────────────────────────────────────────────────────
const DAILY_TIPS = [
  'The modified Bernoulli equation (ΔP = 4v²) is essential for gradient calculations. Always align your CW Doppler beam within 20° of flow direction for accurate measurements.',
  "Remember the four parameters for diastolic dysfunction grading: E/A ratio, e' velocity, E/e' ratio, and TR velocity. You need ≥3 abnormal to diagnose elevated LV filling pressures.",
  'Normal IVC diameter is <2.1 cm with >50% inspiratory collapse — this correlates with RAP of 3 mmHg. Plethoric IVC (>2.1 cm, <50% collapse) = RAP ≥15 mmHg.',
  "TAPSE <17mm and RV S' <9.5 cm/s both indicate RV systolic dysfunction. TAPSE is the most widely used bedside RV function parameter.",
  "Simpson's biplane method is the gold standard for EF calculation — it uses two orthogonal apical views (A4C and A2C) and doesn't assume LV geometry.",
];

function HomeSection({ onNav }: { onNav: (t: Tab) => void }) {
  const { P, PD, PL, PS, PB, PT, PM, PX } = useT();
  const [stats, setStats] = useState({ streak: 0, flashcardsStudied: 0, bestScore: 0, casesReviewed: [] as string[] });
  const [tip, setTip] = useState('');

  useEffect(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    setTip(DAILY_TIPS[dayOfYear % DAILY_TIPS.length]);

    const s = getStats();
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    let streak = s.streak || 0;
    if (s.lastStudied !== today && s.lastStudied !== yesterday) streak = 0;
    let bestScore = s.bestScore || 0;
    try {
      const bs = localStorage.getItem('sonata-best-overall');
      if (bs) bestScore = Math.max(bestScore, parseInt(bs, 10));
    } catch {}
    setStats({ streak, flashcardsStudied: s.flashcardsStudied || 0, bestScore, casesReviewed: s.casesReviewed || [] });
  }, []);

  const modules = [
    { tab: 'cards' as Tab, label: 'Flashcards', desc: `${preloadedFlashcards.length}+ cards — tap to flip`, emoji: '🃏', sub: 'LV Function · Doppler · Valves · Views' },
    { tab: 'quiz' as Tab, label: 'Quiz Mode', desc: 'AI-generated quizzes on any topic', emoji: '🎯', sub: '10 topics · instant feedback · AI explanations' },
    { tab: 'cases' as Tab, label: 'Case Studies', desc: `${caseStudies.length} clinical cases with AI tutor`, emoji: '🫀', sub: 'DCM · HOCM · Endocarditis' },
    { tab: 'progress' as Tab, label: 'My Progress', desc: 'Streaks, scores, and achievements', emoji: '📈', sub: 'Streak · Accuracy · Badges' },
  ];

  return (
    <div style={{ padding: '16px 20px 100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 30, height: 30, borderRadius: 10, background: P, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M2 12 Q5 4 8 12 Q11 20 14 12 Q17 4 20 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: 22, color: PT, letterSpacing: '-0.5px' }}>Sonata</span>
          </div>
          <div style={{ fontSize: 13, color: PX }}>Echocardiography Study App</div>
        </div>
        <div style={{ background: PS, border: `1.5px solid ${PB}`, borderRadius: 16, padding: '10px 16px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 20 }}>🔥</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: PT }}>{stats.streak}</span>
          </div>
          <div style={{ fontSize: 10, color: PX, fontWeight: 600, marginTop: 2 }}>day streak</div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
        {[
          { val: stats.flashcardsStudied, label: 'Cards Studied' },
          { val: stats.bestScore > 0 ? `${stats.bestScore}%` : '—', label: 'Best Score' },
          { val: stats.casesReviewed.length, label: 'Cases Done' },
        ].map((item, i) => (
          <div key={i} style={{ background: PS, border: `1.5px solid ${PB}`, borderRadius: 16, padding: '12px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: P, fontFamily: 'var(--font-space-mono), monospace' }}>{item.val}</div>
            <div style={{ fontSize: 10, color: PX, fontWeight: 600, marginTop: 2 }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Modules */}
      <div style={{ fontSize: 11, fontWeight: 700, color: PX, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
        Study Modules
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {modules.map(m => (
          <button
            key={m.tab}
            onClick={() => onNav(m.tab)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: PS, border: `1.5px solid ${PB}`, borderRadius: 20,
              padding: '14px 16px', cursor: 'pointer', textAlign: 'left',
              WebkitTapHighlightColor: 'transparent',
              transition: 'transform 0.1s',
              width: '100%',
            }}
            onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.98)')}
            onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <div style={{ width: 46, height: 46, borderRadius: 14, background: PL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
              {m.emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: PT }}>{m.label}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PX} strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
              <div style={{ fontSize: 12, color: PM, marginTop: 2 }}>{m.desc}</div>
              <div style={{ fontSize: 10, color: PX, marginTop: 3 }}>{m.sub}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Upload Study Material */}
      <UploadWidget onNav={onNav} />

      {/* Daily tip */}
      <div style={{ background: PL, border: `1.5px solid ${PB}`, borderRadius: 20, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: PS, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: P, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Daily Tip</div>
            <div style={{ fontSize: 12, color: PM, lineHeight: 1.6 }}>{tip}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Flashcards Section ───────────────────────────────────────────────────────
function FlashcardsSection() {
  const { P, PD, PL, PS, PB, PT, PM, PX } = useT();
  const [genCards, setGenCards] = useState<Flashcard[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [filterCat, setFilterCat] = useState('All');
  const [studiedIds, setStudiedIds] = useState<Set<string>>(new Set());
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [modalTopic, setModalTopic] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [genAllProgress, setGenAllProgress] = useState<{ current: number; total: number; topic: string } | null>(null);
  const [aiExplain, setAiExplain] = useState('');
  const [aiExplainLoading, setAiExplainLoading] = useState(false);

  useEffect(() => {
    setGenCards(getGeneratedCards());
    setStudiedIds(getStudiedIds());
    setBookmarked(getBookmarked());
  }, []);

  // Include cards from uploaded study materials
  const matCards: Flashcard[] = getMaterials().flatMap(m =>
    m.flashcards.map((c, i) => ({ id: `mat-${m.id}-${i}`, front: c.front, back: c.back, category: `📖 ${m.title}` }))
  );
  const allCards = [...preloadedFlashcards, ...genCards, ...matCards];
  const categories = ['All', '★ Bookmarked', ...Array.from(new Set(allCards.map(c => c.category)))];
  const filtered = filterCat === 'All' ? allCards
    : filterCat === '★ Bookmarked' ? allCards.filter(c => bookmarked.has(c.id))
    : allCards.filter(c => c.category === filterCat);
  const safeIdx = Math.min(idx, Math.max(0, filtered.length - 1));
  const card = filtered[safeIdx];

  const goNext = useCallback(() => {
    if (card) markStudied(card.id);
    setStudiedIds(getStudiedIds());
    setIdx(i => (i + 1) % filtered.length);
    setFlipped(false); setAiExplain(''); setAiExplainLoading(false);
  }, [card, filtered.length]);

  const goPrev = useCallback(() => {
    setIdx(i => (i - 1 + filtered.length) % filtered.length);
    setFlipped(false); setAiExplain(''); setAiExplainLoading(false);
  }, [filtered.length]);

  const askAI = async () => {
    if (!card || aiExplainLoading) return;
    if (aiExplain) { setAiExplain(''); return; }
    setAiExplainLoading(true);
    try {
      const prompt = `I'm studying echocardiography. Explain this flashcard in depth using ONLY bullet points — no paragraphs.\n\nQuestion: ${card.front}\nAnswer: ${card.back}${card.normalValues ? `\nNormal Values: ${card.normalValues}` : ''}\n\nStructure your response with these sections (each as bullets):\n• **Why it matters:** — clinical significance at the bedside\n• **Key details:** — mechanisms, formulas, and specifics\n• **Normal values:** — exact thresholds (if applicable)\n• **Common pitfalls:** — ⚠️ exam traps and misconceptions\n• **Remember:** — one-line mnemonic or bottom line\n\nKeep every bullet to 1–2 lines. Be precise and scannable.`;
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const d = line.slice(6).trim();
          if (d === '[DONE]') continue;
          try { acc += JSON.parse(d).choices?.[0]?.delta?.content || ''; } catch {}
        }
        setAiExplain(acc);
      }
    } catch (err) {
      setAiExplain('Error: ' + (err instanceof Error ? err.message : 'Something went wrong'));
    } finally {
      setAiExplainLoading(false);
    }
  };

  const generateForTopic = async (topic: string, existing: Flashcard[]): Promise<Flashcard[]> => {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'flashcards', topic }),
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || 'Failed to generate cards');
    return (data.cards as Array<{ front: string; back: string; category: string; normalValues?: string }>).map((c, i) => ({
      id: `gen-${Date.now()}-${topic}-${i}`, front: c.front, back: c.back,
      category: c.category || topic, normalValues: c.normalValues,
    }));
  };

  const handleGenerate = async () => {
    if (!modalTopic) return;
    setGenerating(true); setGenError('');
    try {
      const newCards = await generateForTopic(modalTopic, genCards);
      const updated = [...genCards, ...newCards];
      setGenCards(updated); saveGeneratedCards(updated);
      setIdx(allCards.length); setFilterCat('All'); setFlipped(false);
      setShowModal(false); setModalTopic('');
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateAll = async () => {
    setShowModal(false);
    setGenAllProgress({ current: 0, total: ECHO_TOPICS.length, topic: ECHO_TOPICS[0] });
    let current = [...genCards];
    for (let i = 0; i < ECHO_TOPICS.length; i++) {
      const topic = ECHO_TOPICS[i];
      setGenAllProgress({ current: i + 1, total: ECHO_TOPICS.length, topic });
      try {
        const newCards = await generateForTopic(topic, current);
        current = [...current, ...newCards];
        saveGeneratedCards(current);
        setGenCards([...current]);
      } catch {
        // skip failed topics, continue with others
      }
    }
    setGenAllProgress(null);
    setFilterCat('All'); setFlipped(false);
  };

  return (
    <div style={{ padding: '16px 0 100px' }}>
      {/* Header */}
      <div style={{ padding: '0 20px', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20, color: PT }}>Flashcards</div>
            <div style={{ fontSize: 12, color: PX, marginTop: 2 }}>{studiedIds.size} of {allCards.length} studied</div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: P, color: 'white', border: 'none', borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sora), sans-serif' }}
          >
            ✨ Generate
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }} className="scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => { setFilterCat(cat); setIdx(0); setFlipped(false); }}
              style={{
                flexShrink: 0, padding: '6px 14px', borderRadius: 20,
                background: filterCat === cat ? P : PS,
                color: filterCat === cat ? 'white' : PM,
                border: `1.5px solid ${filterCat === cat ? P : PB}`,
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'var(--font-sora), sans-serif',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Card */}
      {card ? (
        <>
          <div style={{ padding: '0 20px' }}>
            <div
              className="card-flip-container"
              style={{ height: 260, cursor: 'pointer' }}
              onClick={() => setFlipped(f => !f)}
            >
              <div className={`card-flip-inner${flipped ? ' flipped' : ''}`} style={{ position: 'relative', width: '100%', height: '100%' }}>
                {/* Front */}
                <div className="card-face" style={{
                  position: 'absolute', inset: 0,
                  background: PS, border: `1.5px solid ${PB}`,
                  borderRadius: 24, padding: 24,
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  boxShadow: '0 4px 20px rgba(224,122,143,0.12)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: P, textTransform: 'uppercase', letterSpacing: '0.06em', background: PL, padding: '4px 10px', borderRadius: 10 }}>{card.category}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        onClick={e => { e.stopPropagation(); setBookmarked(toggleBookmark(card.id)); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, lineHeight: 1, fontSize: 20 }}
                        title={bookmarked.has(card.id) ? 'Remove bookmark' : 'Bookmark this card'}
                      >
                        {bookmarked.has(card.id) ? '★' : '☆'}
                      </button>
                      <span style={{ fontSize: 11, color: PX }}>{safeIdx + 1} / {filtered.length}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 18, color: PT, lineHeight: 1.3 }}>{card.front}</div>
                  </div>
                  <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PX} strokeWidth="2"><path d="M7 10l5 5 5-5"/></svg>
                    <span style={{ fontSize: 11, color: PX }}>Tap to reveal</span>
                  </div>
                </div>
                {/* Back */}
                <div className="card-face card-face-back" style={{
                  position: 'absolute', inset: 0,
                  background: PS, border: `1.5px solid ${PB}`,
                  borderRadius: 24, padding: 24, overflowY: 'auto',
                  display: 'flex', flexDirection: 'column', gap: 12,
                  boxShadow: '0 4px 20px rgba(224,122,143,0.12)',
                }}>
                  <div style={{ fontSize: 12, color: PM, lineHeight: 1.6 }}>{card.back}</div>
                  {card.normalValues && (
                    <div style={{ background: PL, borderRadius: 12, padding: '10px 12px' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: P, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Normal Values</div>
                      <div style={{ fontSize: 11, color: PM, fontFamily: 'var(--font-space-mono), monospace', lineHeight: 1.5 }}>{card.normalValues}</div>
                    </div>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); askAI(); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: `1.5px solid ${PB}`, borderRadius: 10, padding: '7px 12px', fontSize: 11, fontWeight: 700, color: P, cursor: 'pointer', fontFamily: 'var(--font-sora), sans-serif', marginTop: 4 }}
                  >
                    {aiExplainLoading ? (
                      <><svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="3"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Thinking...</>
                    ) : aiExplain ? '✕ Hide AI explanation' : '✨ Ask AI to explain this'}
                  </button>
                </div>
              </div>
            </div>

            {/* AI Explanation Panel */}
            {(aiExplain || aiExplainLoading) && (
              <div style={{ background: PL, border: `1.5px solid ${PB}`, borderRadius: 20, padding: 16, marginTop: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: P, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>✨</span> AI Explanation
                </div>
                {aiExplainLoading && !aiExplain ? (
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {[0,1,2].map(i => <div key={i} className="animate-bounce" style={{ width: 6, height: 6, borderRadius: '50%', background: PB, animationDelay: `${i*0.15}s` }}/>)}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: PM, lineHeight: 1.7 }}>{renderText(aiExplain)}</div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 16 }}>
              <button
                onClick={goPrev}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: PS, border: `1.5px solid ${PB}`, borderRadius: 16, fontSize: 13, fontWeight: 600, color: PT, cursor: 'pointer', fontFamily: 'var(--font-sora), sans-serif' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                Prev
              </button>

              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                {filtered.slice(Math.max(0, safeIdx - 2), safeIdx + 3).map((c, i) => {
                  const abs = Math.max(0, safeIdx - 2) + i;
                  return (
                    <div key={abs} style={{
                      borderRadius: 4,
                      width: abs === safeIdx ? 18 : 7,
                      height: 7,
                      background: abs === safeIdx ? P : studiedIds.has(c.id) ? PB : '#e5e7eb',
                      transition: 'all 0.2s',
                    }}/>
                  );
                })}
              </div>

              <button
                onClick={goNext}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: P, border: 'none', borderRadius: 16, fontSize: 13, fontWeight: 700, color: 'white', cursor: 'pointer', fontFamily: 'var(--font-sora), sans-serif' }}
              >
                Next
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>

            {/* Progress bar */}
            <div style={{ background: PS, border: `1.5px solid ${PB}`, borderRadius: 16, padding: '12px 14px', marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: PX }}>Overall Progress</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: P, fontFamily: 'var(--font-space-mono), monospace' }}>
                  {Math.round((studiedIds.size / allCards.length) * 100)}%
                </span>
              </div>
              <div style={{ height: 6, background: PL, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: P, borderRadius: 4, width: `${(studiedIds.size / allCards.length) * 100}%`, transition: 'width 0.5s' }}/>
              </div>
              <div style={{ fontSize: 10, color: PX, marginTop: 6 }}>
                {studiedIds.size} studied · {allCards.length - studiedIds.size} remaining
              </div>
            </div>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: PX, fontSize: 14 }}>No cards in this category.</div>
      )}

      {/* Generate All Progress */}
      {genAllProgress && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(26,10,16,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: PS, borderRadius: 24, padding: 28, width: '100%', maxWidth: 340, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 14 }}>✨</div>
            <div style={{ fontWeight: 800, fontSize: 17, color: PT, marginBottom: 6 }}>Generating All Topics</div>
            <div style={{ fontSize: 12, color: PX, marginBottom: 18 }}>Topic {genAllProgress.current} of {genAllProgress.total}: {genAllProgress.topic}</div>
            <div style={{ height: 8, background: PL, borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ height: '100%', background: P, borderRadius: 4, width: `${(genAllProgress.current / genAllProgress.total) * 100}%`, transition: 'width 0.4s' }}/>
            </div>
            <div style={{ fontSize: 11, color: PX }}>{genAllProgress.current * 5} cards generated so far...</div>
          </div>
        </div>
      )}

      {/* Generate Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,10,16,0.3)' }} onClick={() => setShowModal(false)}/>
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: PS, borderRadius: '28px 28px 0 0', padding: 24,
            paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
          }}>
            <div style={{ width: 36, height: 4, background: PB, borderRadius: 2, margin: '0 auto 20px' }}/>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 800, fontSize: 17, color: PT }}>Generate Cards</span>
              <button onClick={() => setShowModal(false)} style={{ background: PL, border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: 14, color: PX }}>✕</button>
            </div>
            <div style={{ fontSize: 12, color: PX, marginBottom: 16 }}>Pick a topic to generate 5 new AI flashcards.</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {ECHO_TOPICS.map(t => (
                <button key={t} onClick={() => setModalTopic(t)} style={{
                  padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: modalTopic === t ? P : PS,
                  color: modalTopic === t ? 'white' : PM,
                  border: `1.5px solid ${modalTopic === t ? P : PB}`,
                  fontFamily: 'var(--font-sora), sans-serif',
                }}>{t}</button>
              ))}
            </div>
            {genError && <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 12, background: '#fef2f2', padding: '10px 14px', borderRadius: 12 }}>{genError}</div>}
            <button
              onClick={handleGenerate}
              disabled={!modalTopic || generating}
              style={{
                width: '100%', padding: '14px', borderRadius: 18, background: P,
                color: 'white', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                opacity: !modalTopic || generating ? 0.5 : 1, fontFamily: 'var(--font-sora), sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                marginBottom: 10,
              }}
            >
              {generating ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  Generating...
                </>
              ) : `✨ Generate 5 Cards${modalTopic ? ` · ${modalTopic}` : ''}`}
            </button>
            <button
              onClick={handleGenerateAll}
              disabled={generating}
              style={{
                width: '100%', padding: '13px', borderRadius: 18,
                background: 'transparent', color: P,
                border: `1.5px solid ${PB}`, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                opacity: generating ? 0.5 : 1, fontFamily: 'var(--font-sora), sans-serif',
              }}
            >
              🌟 Generate All 10 Topics (50 cards)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Quiz Section ─────────────────────────────────────────────────────────────
type QuizPhase = 'setup' | 'loading' | 'playing' | 'results' | 'sounds' | 'images' | 'materials';

function saveQuizScore(topic: string, score: number) {
  try {
    const key = `sonata-best-${topic.toLowerCase().replace(/\s+/g, '-')}`;
    const ex = parseInt(localStorage.getItem(key) || '0', 10);
    if (score > ex) localStorage.setItem(key, String(score));
    const overall = parseInt(localStorage.getItem('sonata-best-overall') || '0', 10);
    if (score > overall) localStorage.setItem('sonata-best-overall', String(score));
    const stats = getStats();
    stats.quizzesTaken = (stats.quizzesTaken || 0) + 1;
    stats.lastStudied = new Date().toDateString();
    if (score > (stats.bestScore || 0)) stats.bestScore = score;
    saveStats(stats);
  } catch {}
}

function QuizSection() {
  const { P, PD, PL, PS, PB, PT, PM, PX } = useT();
  const [phase, setPhase] = useState<QuizPhase>('setup');
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState<QuizQ[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [error, setError] = useState('');
  const [explanations, setExplanations] = useState<Record<number, string>>({});
  const [loadingExpl, setLoadingExpl] = useState<Record<number, boolean>>({});

  const score = answers.length > 0 ? Math.round((answers.filter(a => a.correct).length / answers.length) * 100) : 0;

  const generateQuiz = async (t: string = topic) => {
    if (!t) return;
    setPhase('loading'); setError('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'quiz', topic: t }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to generate quiz');
      if (!Array.isArray(data.questions) || data.questions.length === 0) throw new Error('No questions returned');
      setQuestions(data.questions); setCurrentQ(0);
      setSelectedAnswer(null); setAnswered(false); setAnswers([]); setExplanations({});
      setPhase('playing');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong'); setPhase('setup');
    }
  };

  const handleAnswer = (i: number) => {
    if (answered) return;
    setSelectedAnswer(i); setAnswered(true);
  };

  const handleNext = () => {
    if (selectedAnswer === null) return;
    const q = questions[currentQ];
    const record: AnswerRecord = { question: q, selectedIndex: selectedAnswer, correct: selectedAnswer === q.correctIndex };
    const newAnswers = [...answers, record];
    setAnswers(newAnswers);
    if (currentQ + 1 >= questions.length) {
      const finalScore = Math.round((newAnswers.filter(a => a.correct).length / newAnswers.length) * 100);
      saveQuizScore(topic, finalScore);
      if (finalScore === 100) setShowConfetti(true);
      setPhase('results');
    } else {
      setCurrentQ(currentQ + 1); setSelectedAnswer(null); setAnswered(false);
    }
  };

  const fetchExplanation = async (record: AnswerRecord, i: number) => {
    if (explanations[i] || loadingExpl[i]) return;
    setLoadingExpl(p => ({ ...p, [i]: true }));
    try {
      const res = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'explanation',
          question: record.question.question,
          correctAnswer: record.question.options[record.question.correctIndex],
          userAnswer: record.question.options[record.selectedIndex],
        }),
      });
      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let acc = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setExplanations(p => ({ ...p, [i]: acc }));
      }
    } catch {} finally {
      setLoadingExpl(p => ({ ...p, [i]: false }));
    }
  };

  const reset = () => { setPhase('setup'); setTopic(''); setQuestions([]); setCurrentQ(0); setSelectedAnswer(null); setAnswered(false); setAnswers([]); setError(''); setExplanations({}); setShowConfetti(false); };

  if (showConfetti) return <ConfettiCelebration onDone={() => setShowConfetti(false)} />;

  const backBtn = (label = 'Quiz Mode') => (
    <div style={{ padding: '14px 20px 0' }}>
      <button onClick={reset} style={{ background: 'none', border: 'none', color: PX, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-sora), sans-serif', padding: 0 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        {label}
      </button>
    </div>
  );

  if (phase === 'sounds') return <div style={{ paddingBottom: 100 }}>{backBtn()}<HeartSoundsSection /></div>;
  if (phase === 'images') return <div style={{ paddingBottom: 100 }}>{backBtn()}<EchoImageQuiz /></div>;
  if (phase === 'materials') return <div style={{ paddingBottom: 100 }}>{backBtn()}<MaterialsQuiz /></div>;

  if (phase === 'setup') return (
    <div style={{ padding: '16px 20px 100px' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 20, color: PT }}>Quiz Mode</div>
        <div style={{ fontSize: 12, color: PX, marginTop: 4 }}>Pick a topic for AI questions, or try a skills lab.</div>
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: PX, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Echo Topics</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        {ECHO_TOPICS.map(t => (
          <button key={t} onClick={() => setTopic(t)} style={{
            padding: '12px 10px', borderRadius: 16, textAlign: 'left', cursor: 'pointer',
            background: topic === t ? P : PS,
            color: topic === t ? 'white' : PT,
            border: `1.5px solid ${topic === t ? P : PB}`,
            fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-sora), sans-serif',
          }}>{t}</button>
        ))}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: PX, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Skills Labs</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
        {([
          { id: 'sounds', emoji: '🩺', label: 'Heart Sounds', sub: 'Audio identification' },
          { id: 'images', emoji: '🫀', label: 'Echo Images', sub: 'View identification' },
          ...(getMaterials().length > 0 ? [{ id: 'materials' as QuizPhase, emoji: '📖', label: 'My Materials', sub: `${getMaterials().reduce((n, m) => n + m.quizQuestions.length, 0)} questions` }] : []),
        ] as { id: QuizPhase; emoji: string; label: string; sub: string }[]).map(({ id, emoji, label, sub }) => (
          <button key={id} onClick={() => setPhase(id)} style={{
            padding: '14px 10px', borderRadius: 16, cursor: 'pointer',
            background: PS, color: PT, border: `1.5px solid ${P}`,
            fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-sora), sans-serif',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          }}>
            <span style={{ fontSize: 24 }}>{emoji}</span>
            <span style={{ fontWeight: 700 }}>{label}</span>
            <span style={{ fontSize: 10, color: PX }}>{sub}</span>
          </button>
        ))}
      </div>
      {error && <div style={{ fontSize: 12, color: '#ef4444', background: '#fef2f2', padding: '12px 14px', borderRadius: 14, marginBottom: 14 }}>{error}</div>}
      <button
        onClick={() => generateQuiz()}
        disabled={!topic}
        style={{
          width: '100%', padding: '15px', borderRadius: 20, background: P, color: 'white', border: 'none',
          fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: topic ? 1 : 0.4,
          fontFamily: 'var(--font-sora), sans-serif',
        }}
      >
        Generate Quiz{topic ? ` · ${topic}` : ''}
      </button>
    </div>
  );

  if (phase === 'loading') return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '0 20px' }}>
      <div style={{ width: 60, height: 60, borderRadius: 20, background: PL, border: `1.5px solid ${PB}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg className="animate-spin" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: PT }}>Crafting your quiz...</div>
        <div style={{ fontSize: 13, color: PX, marginTop: 4 }}>{topic}</div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[0,1,2].map(i => (
          <div key={i} className="animate-bounce" style={{ width: 8, height: 8, borderRadius: '50%', background: PB, animationDelay: `${i * 0.15}s` }}/>
        ))}
      </div>
    </div>
  );

  if (phase === 'playing' && questions.length > 0) {
    const q = questions[currentQ];
    return (
      <div style={{ padding: '0 20px 100px' }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <button onClick={reset} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', fontSize: 13, color: PX, cursor: 'pointer', fontFamily: 'var(--font-sora), sans-serif' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              Topics
            </button>
            <span style={{ fontSize: 13, fontWeight: 700, color: PM, fontFamily: 'var(--font-space-mono), monospace' }}>{currentQ + 1} / {questions.length}</span>
          </div>
          <div style={{ height: 4, background: PL, borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: P, borderRadius: 3, width: `${(currentQ / questions.length) * 100}%`, transition: 'width 0.4s' }}/>
          </div>
          <div style={{ marginTop: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: P, background: PL, padding: '4px 10px', borderRadius: 10 }}>{topic}</span>
          </div>
        </div>

        <div style={{ background: PS, border: `1.5px solid ${PB}`, borderRadius: 20, padding: '18px 16px', marginBottom: 14, boxShadow: '0 2px 12px rgba(224,122,143,0.08)' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: PT, lineHeight: 1.4 }}>{q.question}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {q.options.map((opt, i) => {
            let bg = PS, border = PB, col = PT;
            if (answered) {
              if (i === q.correctIndex) { bg = '#f0fdf4'; border = '#86efac'; col = '#166534'; }
              else if (i === selectedAnswer) { bg = '#fef2f2'; border = '#fca5a5'; col = '#991b1b'; }
              else { col = PX; }
            } else if (selectedAnswer === i) { bg = PL; border = P; }
            return (
              <button key={i} onClick={() => handleAnswer(i)} disabled={answered} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12, padding: '13px 14px',
                borderRadius: 16, border: `1.5px solid ${border}`, background: bg, textAlign: 'left',
                cursor: answered ? 'default' : 'pointer', transition: 'all 0.15s',
                fontFamily: 'var(--font-sora), sans-serif', width: '100%',
              }}>
                <span style={{
                  width: 24, height: 24, borderRadius: 8, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, marginTop: 1,
                  background: answered && i === q.correctIndex ? '#22c55e'
                    : answered && i === selectedAnswer ? '#ef4444' : PL,
                  color: answered && (i === q.correctIndex || i === selectedAnswer) ? 'white' : PX,
                }}>
                  {answered && i === q.correctIndex ? '✓' : answered && i === selectedAnswer ? '✗' : ['A','B','C','D'][i]}
                </span>
                <span style={{ fontSize: 13, color: col, lineHeight: 1.4 }}>{opt}</span>
              </button>
            );
          })}
        </div>

        {answered && (
          <div style={{ background: PL, border: `1.5px solid ${PB}`, borderRadius: 18, padding: '14px 16px', marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 14 }}>{selectedAnswer === q.correctIndex ? '✅' : '❌'}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: selectedAnswer === q.correctIndex ? '#166534' : '#991b1b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {selectedAnswer === q.correctIndex ? 'Correct!' : 'Incorrect'}
              </span>
            </div>
            <div style={{ fontSize: 13, color: PM, lineHeight: 1.65, marginBottom: 6 }}>{renderText(q.explanation)}</div>
          </div>
        )}

        {answered && (
          <button onClick={handleNext} style={{
            width: '100%', marginTop: 14, padding: '14px', borderRadius: 18,
            background: P, color: 'white', border: 'none', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'var(--font-sora), sans-serif',
          }}>
            {currentQ + 1 >= questions.length ? 'See Results' : 'Next Question →'}
          </button>
        )}
      </div>
    );
  }

  if (phase === 'results') {
    const correct = answers.filter(a => a.correct).length;
    const grade = score >= 90 ? 'Excellent! 🎉' : score >= 75 ? 'Great Job! ✨' : score >= 60 ? 'Good Effort 💪' : 'Keep Practicing 📚';
    const gradeColor = score >= 90 ? '#22c55e' : score >= 75 ? P : score >= 60 ? '#f59e0b' : PX;
    const wrong = answers.filter(a => !a.correct);
    return (
      <div style={{ padding: '16px 20px 100px' }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 20, color: PT }}>Results</div>
          <div style={{ fontSize: 12, color: PX, marginTop: 2 }}>{topic}</div>
        </div>

        <div style={{ background: PS, border: `1.5px solid ${PB}`, borderRadius: 24, padding: 20, textAlign: 'center', marginBottom: 20, boxShadow: '0 4px 20px rgba(224,122,143,0.1)' }}>
          <div style={{ fontSize: 52, fontWeight: 900, color: P, fontFamily: 'var(--font-space-mono), monospace', lineHeight: 1 }}>{score}%</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: gradeColor, marginTop: 8 }}>{grade}</div>
          <div style={{ fontSize: 12, color: PX, marginTop: 4 }}>{correct} of {answers.length} correct</div>
        </div>

        {wrong.length === 0 ? (
          <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 20, padding: 20, textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🌟</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#166534' }}>Perfect score! All correct.</div>
          </div>
        ) : (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: PX, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Review Wrong Answers ({wrong.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {wrong.map((record, i) => (
                <div key={i} style={{ background: PS, border: `1.5px solid ${PB}`, borderRadius: 18, padding: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: PT, marginBottom: 8, lineHeight: 1.4 }}>{record.question.question}</div>
                  <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 4 }}>✗ Your answer: {record.question.options[record.selectedIndex]}</div>
                  <div style={{ fontSize: 12, color: '#22c55e', marginBottom: 8 }}>✓ Correct: {record.question.options[record.question.correctIndex]}</div>
                  <button
                    onClick={() => fetchExplanation(record, i)}
                    style={{ fontSize: 12, fontWeight: 600, color: P, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-sora), sans-serif', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <span>✨</span> {explanations[i] ? 'Hide' : loadingExpl[i] ? 'Loading...' : 'Explain this'}
                  </button>
                  {explanations[i] && (
                    <div style={{ marginTop: 8, padding: '10px 12px', background: PL, borderRadius: 12, fontSize: 12, color: PM, lineHeight: 1.6 }}>
                      {renderText(explanations[i])}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => { setCurrentQ(0); setSelectedAnswer(null); setAnswered(false); setAnswers([]); setExplanations({}); generateQuiz(); }} style={{ flex: 1, padding: '13px', borderRadius: 18, background: P, color: 'white', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sora), sans-serif' }}>
            New Quiz →
          </button>
          <button onClick={reset} style={{ flex: 1, padding: '13px', borderRadius: 18, background: PS, color: P, border: `1.5px solid ${PB}`, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sora), sans-serif' }}>
            Change Topic
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Cases Section ────────────────────────────────────────────────────────────
function CasesSection() {
  const { P, PD, PL, PS, PB, PT, PM, PX } = useT();
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [chatError, setChatError] = useState('');
  const [genCases, setGenCases] = useState<CaseStudy[]>([]);
  const [showGenModal, setShowGenModal] = useState(false);
  const [genCaseTopic, setGenCaseTopic] = useState('');
  const [generatingCase, setGeneratingCase] = useState(false);
  const [genCaseError, setGenCaseError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const allCases = [...caseStudies, ...genCases];
  const activeCase = allCases.find(c => c.id === activeCaseId);

  useEffect(() => {
    setGenCases(getGeneratedCases());
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  const markReviewed = (id: string) => {
    try {
      const raw = localStorage.getItem('sonata-cases-reviewed');
      const reviewed: string[] = raw ? JSON.parse(raw) : [];
      if (!reviewed.includes(id)) {
        reviewed.push(id);
        localStorage.setItem('sonata-cases-reviewed', JSON.stringify(reviewed));
      }
      const stats = getStats();
      stats.casesReviewed = reviewed;
      stats.lastStudied = new Date().toDateString();
      saveStats(stats);
    } catch {}
  };

  const openCase = (id: string) => {
    setActiveCaseId(id);
    setMessages([]);
    setInput('');
    setChatError('');
    markReviewed(id);
  };

  const buildSystemPrompt = (c: CaseStudy) =>
    `You are an expert cardiologist teaching about a ${c.title} case: ${c.subtitle}.\n\nPatient: ${c.patient}\nHistory: ${c.history}\nKey echo findings: ${c.echoFindings.join(' | ')}\n\nFORMATTING: Always respond with bullet points only — never write paragraphs. Start sections with a bold header on its own line like **Key Point:**, **Echo Findings:**, **Management:**, **Mechanism:**. One idea per bullet, 1–2 lines max. End with a **Bottom Line:** bullet. If asked for more detail, expand with 3–5 additional focused bullets on that topic. Be educational, precise, and easy to scan on a phone.`;

  const generateCase = async () => {
    if (!genCaseTopic) return;
    setGeneratingCase(true); setGenCaseError('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'case', topic: genCaseTopic }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to generate case');
      const raw = data.case;
      const newCase: CaseStudy = {
        id: `gen-case-${Date.now()}`,
        title: raw.title,
        subtitle: raw.subtitle,
        difficulty: raw.difficulty || 'Intermediate',
        difficultyColor: '',
        icon: raw.icon || '🫀',
        patient: raw.patient,
        history: raw.history,
        echoFindings: raw.echoFindings,
        keyQuestion: raw.keyQuestion,
        diagnosis: raw.diagnosis,
        teachingPoints: raw.teachingPoints,
        systemPrompt: buildSystemPrompt(raw),
      };
      const updated = [...genCases, newCase];
      setGenCases(updated);
      saveGeneratedCases(updated);
      setShowGenModal(false);
      setGenCaseTopic('');
    } catch (err) {
      setGenCaseError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setGeneratingCase(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || streaming || !activeCase) return;
    setChatError('');
    const userMsg: ChatMessage = { role: 'user', content: content.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setStreaming(true);
    let acc = '';
    const assistantMsg: ChatMessage = { role: 'assistant', content: '' };
    setMessages([...newMessages, assistantMsg]);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, systemPrompt: activeCase.systemPrompt }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      const reader = res.body?.getReader();
      if (!reader) throw new Error('No stream');
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const d = line.slice(6);
            if (d === '[DONE]') continue;
            try { acc += JSON.parse(d).choices?.[0]?.delta?.content || ''; } catch {}
          }
        }
        setMessages([...newMessages, { role: 'assistant', content: acc }]);
      }
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Error');
      setMessages(newMessages);
    } finally {
      setStreaming(false);
    }
  };

  const quickPrompts = [
    'Explain the key echo findings',
    'What does the diagnosis mean?',
    'What is the prognosis?',
    'What treatment is indicated?',
    'What are the teaching points?',
    'What would TEE add here?',
    'What are the surgery indications?',
    'How does this compare to a normal echo?',
  ];

  if (activeCaseId && activeCase) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 62px - env(safe-area-inset-top))' }}>
        {/* Case header */}
        <div style={{ padding: '12px 20px', background: PS, borderBottom: `1px solid ${PB}`, flexShrink: 0 }}>
          <button onClick={() => setActiveCaseId(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', fontSize: 13, color: PX, cursor: 'pointer', marginBottom: 10, fontFamily: 'var(--font-sora), sans-serif' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Cases
          </button>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 28 }}>{activeCase.icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: PT }}>{activeCase.title}</div>
              <div style={{ fontSize: 12, color: PX, marginTop: 2 }}>{activeCase.subtitle}</div>
            </div>
          </div>
        </div>

        {/* Echo findings */}
        <div style={{ padding: '14px 20px', background: PL, borderBottom: `1px solid ${PB}`, flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: P, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Echo Findings</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {activeCase.echoFindings.slice(0, 4).map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ color: P, fontSize: 12, flexShrink: 0, marginTop: 1 }}>•</span>
                <span style={{ fontSize: 11, color: PM, lineHeight: 1.4, fontFamily: 'var(--font-space-mono), monospace' }}>{f}</span>
              </div>
            ))}
            {activeCase.echoFindings.length > 4 && (
              <div style={{ fontSize: 11, color: PX }}>+{activeCase.echoFindings.length - 4} more findings...</div>
            )}
          </div>
        </div>

        {/* Chat messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px 0 10px' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🩺</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: PT, marginBottom: 4 }}>AI Tutor Ready</div>
              <div style={{ fontSize: 12, color: PX }}>Tap a prompt below or type your own question</div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '88%', padding: '10px 14px',
                borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: m.role === 'user' ? P : PS,
                border: m.role === 'assistant' ? `1.5px solid ${PB}` : 'none',
                fontSize: 13, color: m.role === 'user' ? 'white' : PT, lineHeight: 1.6,
              }}>
                {m.content
                  ? (m.role === 'assistant' ? renderText(m.content) : m.content)
                  : (streaming && i === messages.length - 1 ? (
                    <span style={{ display: 'flex', gap: 4 }}>
                      {[0,1,2].map(j => (
                        <span key={j} className="animate-bounce" style={{ width: 5, height: 5, borderRadius: '50%', background: PB, display: 'inline-block', animationDelay: `${j * 0.15}s` }}/>
                      ))}
                    </span>
                  ) : null)}
              </div>
            </div>
          ))}
          {chatError && <div style={{ fontSize: 12, color: '#ef4444', textAlign: 'center', padding: '8px 0' }}>{chatError}</div>}
          <div ref={bottomRef}/>
        </div>

        {/* Quick prompts — always visible, horizontally scrollable */}
        <div style={{ background: PS, borderTop: `1px solid ${PB}`, padding: '8px 12px 6px', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }} className="scrollbar-hide">
            {quickPrompts.map(p => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                disabled={streaming}
                style={{
                  flexShrink: 0, padding: '6px 12px', borderRadius: 20,
                  background: PL, border: `1.5px solid ${PB}`,
                  fontSize: 11, fontWeight: 600, color: PM, cursor: 'pointer',
                  opacity: streaming ? 0.5 : 1,
                  fontFamily: 'var(--font-sora), sans-serif',
                  whiteSpace: 'nowrap',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div style={{ padding: '8px 16px', paddingBottom: 'calc(8px + env(safe-area-inset-bottom))', background: PS, display: 'flex', gap: 8, flexShrink: 0 }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage(input))}
            placeholder="Ask your own question..."
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 14,
              border: `1.5px solid ${PB}`, background: PL, fontSize: 13,
              color: PT, outline: 'none', fontFamily: 'var(--font-sora), sans-serif',
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || streaming}
            style={{
              width: 42, height: 42, borderRadius: 12, background: P, border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              opacity: !input.trim() || streaming ? 0.5 : 1, flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 20px 100px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 20, color: PT }}>Case Studies</div>
          <div style={{ fontSize: 12, color: PX, marginTop: 4 }}>{allCases.length} clinical cases with AI tutor</div>
        </div>
        <button
          onClick={() => { setShowGenModal(true); setGenCaseTopic(''); setGenCaseError(''); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: P, color: 'white', border: 'none', borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sora), sans-serif' }}
        >
          ✨ Generate
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {allCases.map(c => (
          <button key={c.id} onClick={() => openCase(c.id)} style={{
            background: PS, border: `1.5px solid ${PB}`, borderRadius: 22, padding: 18,
            textAlign: 'left', cursor: 'pointer', width: '100%',
            fontFamily: 'var(--font-sora), sans-serif',
            transition: 'transform 0.1s',
          }}
          onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.98)')}
          onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 30, lineHeight: 1 }}>{c.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: PT }}>{c.title}</div>
                <div style={{ fontSize: 12, color: PX, marginTop: 2 }}>{c.subtitle}</div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 8, marginTop: 6, display: 'inline-block', background: PL, color: P }}>
                  {c.difficulty}
                </span>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PX} strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: P, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Key Echo Findings</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {c.echoFindings.slice(0, 3).map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ color: P, fontSize: 11, flexShrink: 0, marginTop: 1 }}>•</span>
                  <span style={{ fontSize: 11, color: PM, lineHeight: 1.4, fontFamily: 'var(--font-space-mono), monospace' }}>{f}</span>
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* Generate Case Modal */}
      {showGenModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,10,16,0.3)' }} onClick={() => setShowGenModal(false)}/>
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: PS, borderRadius: '28px 28px 0 0', padding: 24,
            paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
            maxHeight: '80dvh', overflowY: 'auto',
          }}>
            <div style={{ width: 36, height: 4, background: PB, borderRadius: 2, margin: '0 auto 20px' }}/>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 800, fontSize: 17, color: PT }}>Generate Case Study</span>
              <button onClick={() => setShowGenModal(false)} style={{ background: PL, border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: 14, color: PX }}>✕</button>
            </div>
            <div style={{ fontSize: 12, color: PX, marginBottom: 16 }}>Pick a diagnosis — AI will create a full case with echo findings and teaching points.</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {CASE_TOPICS.map(t => (
                <button key={t} onClick={() => setGenCaseTopic(t)} style={{
                  padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: genCaseTopic === t ? P : PS,
                  color: genCaseTopic === t ? 'white' : PM,
                  border: `1.5px solid ${genCaseTopic === t ? P : PB}`,
                  fontFamily: 'var(--font-sora), sans-serif',
                }}>{t}</button>
              ))}
            </div>
            {genCaseError && <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 12, background: '#fef2f2', padding: '10px 14px', borderRadius: 12 }}>{genCaseError}</div>}
            <button
              onClick={generateCase}
              disabled={!genCaseTopic || generatingCase}
              style={{
                width: '100%', padding: '14px', borderRadius: 18, background: P,
                color: 'white', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                opacity: !genCaseTopic || generatingCase ? 0.5 : 1, fontFamily: 'var(--font-sora), sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {generatingCase ? (
                <><svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Generating...</>
              ) : `✨ Generate${genCaseTopic ? ` · ${genCaseTopic}` : ''}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Upload Widget ────────────────────────────────────────────────────────────
function UploadWidget({ onNav }: { onNav: (t: Tab) => void }) {
  const { P, PL, PS, PB, PT, PM, PX } = useT();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<{ cards: number; questions: number; title: string } | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading'); setError('');
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Upload failed');
      // Save to localStorage
      const material: StudyMaterial = {
        id: `mat-${Date.now()}`,
        title: data.title,
        fileName: file.name,
        fileType: file.type.startsWith('image/') ? 'image' : file.type === 'application/pdf' ? 'pdf' : 'text',
        uploadedAt: Date.now(),
        studyNotes: data.studyNotes,
        flashcards: data.flashcards,
        quizQuestions: data.quizQuestions,
      };
      saveMaterials([...getMaterials(), material]);
      setResult({ cards: data.flashcards.length, questions: data.quizQuestions.length, title: data.title });
      setStatus('done'); setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStatus('error');
    }
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: PX, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
        Upload Study Material
      </div>
      <div style={{ background: PS, border: `1.5px solid ${PB}`, borderRadius: 20, padding: 16 }}>
        {status === 'done' && result ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: PT, marginBottom: 4 }}>"{result.title}" processed!</div>
            <div style={{ fontSize: 12, color: PM, marginBottom: 14 }}>{result.cards} flashcards · {result.questions} quiz questions · study notes</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => onNav('guide')} style={{ flex: 1, padding: '10px', borderRadius: 14, background: P, color: 'white', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sora), sans-serif' }}>
                View Study Guide →
              </button>
              <button onClick={() => setStatus('idle')} style={{ padding: '10px 14px', borderRadius: 14, background: PL, color: PT, border: `1.5px solid ${PB}`, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sora), sans-serif' }}>
                Upload More
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* File picker */}
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,image/*,.txt,.md"
              style={{ display: 'none' }}
              onChange={e => { setFile(e.target.files?.[0] || null); setStatus('idle'); setError(''); }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                width: '100%', padding: '20px', borderRadius: 16, border: `2px dashed ${file ? P : PB}`,
                background: file ? `${P}10` : PL, color: file ? P : PX, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                fontFamily: 'var(--font-sora), sans-serif', marginBottom: 12,
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: 28 }}>{file ? '📄' : '⬆️'}</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                {file ? file.name : 'Tap to select a file'}
              </span>
              <span style={{ fontSize: 11, color: PX }}>PDF, images, or text files</span>
            </button>
            {error && <div style={{ fontSize: 12, color: '#ef4444', background: '#fef2f2', padding: '10px 12px', borderRadius: 12, marginBottom: 10 }}>{error}</div>}
            <button
              onClick={handleUpload}
              disabled={!file || status === 'uploading'}
              style={{
                width: '100%', padding: '14px', borderRadius: 16, background: P, color: 'white',
                border: 'none', fontSize: 14, fontWeight: 700, cursor: (!file || status === 'uploading') ? 'default' : 'pointer',
                opacity: (!file || status === 'uploading') ? 0.5 : 1, fontFamily: 'var(--font-sora), sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {status === 'uploading' ? (
                <><svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Analyzing & Generating...</>
              ) : 'Generate Flashcards, Quiz & Notes ✨'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Study Guide Section ──────────────────────────────────────────────────────
function StudyGuideSection() {
  const { P, PL, PS, PB, PT, PM, PX } = useT();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { setMaterials(getMaterials()); }, []);

  const handleDelete = (id: string) => {
    deleteMaterial(id);
    setMaterials(getMaterials());
  };

  const fileIcon = (t: StudyMaterial['fileType']) => t === 'image' ? '🖼️' : t === 'pdf' ? '📄' : '📝';

  if (materials.length === 0) {
    return (
      <div style={{ padding: '16px 20px 100px' }}>
        <div style={{ fontWeight: 800, fontSize: 20, color: PT, marginBottom: 4 }}>Study Guide</div>
        <div style={{ fontSize: 12, color: PX, marginBottom: 30 }}>Upload materials from the Home screen to get started.</div>
        <div style={{ background: PS, border: `1.5px solid ${PB}`, borderRadius: 24, padding: '32px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📖</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: PT, marginBottom: 8 }}>No materials yet</div>
          <div style={{ fontSize: 13, color: PM, lineHeight: 1.6 }}>Upload a lecture, PowerPoint (as PDF), or photo of your notes. Sonata will create flashcards, quiz questions, and a study guide automatically.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 20px 100px' }}>
      <div style={{ fontWeight: 800, fontSize: 20, color: PT, marginBottom: 4 }}>Study Guide</div>
      <div style={{ fontSize: 12, color: PX, marginBottom: 20 }}>{materials.length} {materials.length === 1 ? 'material' : 'materials'} uploaded</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[...materials].reverse().map(mat => {
          const isExpanded = expanded === mat.id;
          return (
            <div key={mat.id} style={{ background: PS, border: `1.5px solid ${PB}`, borderRadius: 20, overflow: 'hidden' }}>
              {/* Header — tap to expand/collapse */}
              <button
                onClick={() => setExpanded(isExpanded ? null : mat.id)}
                style={{ width: '100%', background: 'none', border: 'none', padding: '14px 16px', cursor: 'pointer', textAlign: 'left' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{fileIcon(mat.fileType)}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: PT, lineHeight: 1.3 }}>{mat.title}</div>
                      <div style={{ fontSize: 11, color: PX, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mat.fileName}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 14, color: PX }}>{isExpanded ? '▲' : '▼'}</span>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(mat.id); }}
                      style={{ background: 'none', border: 'none', color: PX, cursor: 'pointer', fontSize: 16, padding: 4 }}
                      title="Delete"
                    >✕</button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: PX, background: `${PX}18`, border: `1px solid ${PX}40`, borderRadius: 8, padding: '3px 8px' }}>
                    {new Date(mat.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
              </button>

              {/* Study notes content */}
              {isExpanded && (
                <div style={{ padding: '14px 16px', borderTop: `1px solid ${PB}`, background: PL }}>
                  <div style={{ fontSize: 12, color: PM, lineHeight: 1.7 }}>{renderText(mat.studyNotes)}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Formulas Section ─────────────────────────────────────────────────────────
function FormulasSection() {
  const { P, PL, PS, PB, PT, PM, PX } = useT();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const searchLower = search.toLowerCase();
  const filtered = ECHO_FORMULAS.map(group => ({
    ...group,
    items: group.items.filter(
      item =>
        item.name.toLowerCase().includes(searchLower) ||
        item.formula.toLowerCase().includes(searchLower) ||
        item.notes.toLowerCase().includes(searchLower),
    ),
  })).filter(group => group.items.length > 0);

  return (
    <div style={{ padding: '16px 20px 100px' }}>
      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontWeight: 800, fontSize: 20, color: PT }}>Formula Cheat Sheet</div>
        <div style={{ fontSize: 12, color: PX, marginTop: 3 }}>All key echo equations in one place</div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PX} strokeWidth="2.5" strokeLinecap="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search formulas..."
          style={{
            width: '100%', padding: '10px 12px 10px 34px', borderRadius: 14,
            border: `1.5px solid ${PB}`, background: PS, fontSize: 13,
            color: PT, outline: 'none', fontFamily: 'var(--font-sora), sans-serif',
            boxSizing: 'border-box',
          }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: PX, cursor: 'pointer', fontSize: 14, padding: 4 }}>✕</button>
        )}
      </div>

      {/* Category chips */}
      {!search && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 14 }} className="scrollbar-hide">
          <button
            onClick={() => setActiveCategory(null)}
            style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: activeCategory === null ? P : PS, color: activeCategory === null ? 'white' : PM, border: `1.5px solid ${activeCategory === null ? P : PB}`, fontFamily: 'var(--font-sora), sans-serif' }}
          >
            All
          </button>
          {ECHO_FORMULAS.map(g => (
            <button
              key={g.category}
              onClick={() => setActiveCategory(activeCategory === g.category ? null : g.category)}
              style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: activeCategory === g.category ? P : PS, color: activeCategory === g.category ? 'white' : PM, border: `1.5px solid ${activeCategory === g.category ? P : PB}`, fontFamily: 'var(--font-sora), sans-serif' }}
            >
              {g.emoji} {g.category}
            </button>
          ))}
        </div>
      )}

      {/* Formula cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {(search ? filtered : (activeCategory ? ECHO_FORMULAS.filter(g => g.category === activeCategory) : ECHO_FORMULAS)).map(group => (
          <div key={group.category}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 16 }}>{group.emoji}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: PX, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{group.category}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {group.items.map((item, i) => (
                <div key={i} style={{ background: PS, border: `1.5px solid ${PB}`, borderRadius: 18, padding: '14px 16px', boxShadow: '0 2px 8px rgba(224,122,143,0.06)' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: PT, marginBottom: 8 }}>{item.name}</div>
                  <div style={{
                    background: PL, borderRadius: 10, padding: '10px 12px', marginBottom: 8,
                    fontFamily: 'var(--font-space-mono), monospace', fontSize: 13,
                    color: P, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.5,
                  }}>
                    {item.formula}
                  </div>
                  <div style={{ fontSize: 11, color: PM, lineHeight: 1.6 }}>{item.notes}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && search && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: PX, fontSize: 14 }}>
            No formulas matched &quot;{search}&quot;
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Echo Image Quiz ──────────────────────────────────────────────────────────
type EchoImageId = 'plax' | 'a4c' | 'psax' | 'plax-dilated' | 'effusion' | 'hocm-plax' | 'd-lv' | 'dilated-rv' | 'subcostal';

// ─── Local Echo Images & Cine Loops ──────────────────────────────────────────
// Static PNGs: Unity Imaging Collaborative (CC BY-NC-SA 4.0)
// Animated MP4s: Wikimedia Commons (CC BY-SA 3.0 / CC BY 2.0–2.5 / Public Domain)
const LOCAL_ECHO_IMAGES: Record<string, string[]> = {
  a4c: Array.from({ length: 40 }, (_, i) => `/echo-images/a4c/a4c-${i + 1}.png`),
  effusion: Array.from({ length: 20 }, (_, i) => `/echo-images/effusion/eff-${i + 1}.png`),
  // Cine loops — looping MP4 videos (converted from GIF/OGV, Wikimedia Commons)
  a4c_cine: ['/echo-images/gif/a4c-cine.mp4'],
  effusion_cine: ['/echo-images/gif/effusion-cine.mp4'],
  valves_cine: ['/echo-images/gif/valves-cine.mp4'],
  mvp_cine: ['/echo-images/gif/mitral-prolapse.mp4'],
  mvp_2d_cine: ['/echo-images/gif/mvp-2d.mp4'],
  mr_cine: ['/echo-images/gif/mr-echo.mp4'],
  tamponade_cine: ['/echo-images/gif/tamponade.mp4'],
  hcm_cine: ['/echo-images/gif/hcm.mp4'],
  hcm_a4c_cine: ['/echo-images/gif/hcm-a4c.mp4'],
  stress_cine: ['/echo-images/gif/stress-echo.mp4'],
  resp_cine: ['/echo-images/gif/resp-variation.mp4'],
};

const CINE_CATEGORIES = new Set(['a4c_cine', 'effusion_cine', 'valves_cine', 'mvp_cine', 'mvp_2d_cine', 'mr_cine', 'tamponade_cine', 'hcm_cine', 'hcm_a4c_cine', 'stress_cine', 'resp_cine']);

function getRandomEchoImage(category: string): string {
  const pool = LOCAL_ECHO_IMAGES[category] ?? LOCAL_ECHO_IMAGES.a4c;
  return pool[Math.floor(Math.random() * pool.length)];
}

function EchoClipDisplay({ src, category }: { src: string; category?: string }) {
  const { PB, PX } = useT();
  const isVideo = category ? CINE_CATEGORIES.has(category) : src.endsWith('.mp4');
  const attribution = isVideo ? 'Wikimedia Commons · CC BY-SA' : 'Unity Imaging Collaborative · CC BY-NC-SA 4.0';
  return (
    <div>
      {isVideo ? (
        <video
          src={src}
          autoPlay
          muted
          loop
          playsInline
          style={{ width: '100%', borderRadius: 10, display: 'block', background: '#000' }}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="Echocardiogram" style={{ width: '100%', borderRadius: 10, display: 'block', background: '#000' }} />
      )}
      <div style={{ fontSize: 9, color: PX, marginTop: 4, textAlign: 'right', borderTop: `1px solid ${PB}`, paddingTop: 4 }}>
        {attribution}
      </div>
    </div>
  );
}

// Each question uses a local image category — random image picked per quiz round
const ECHO_IMAGE_QUIZ: {
  imageCategory: string; question: string;
  options: string[]; correct: number; explanation: string; echoKey: string;
}[] = [
  // ─── A4C: view & structure identification (all visible in the image) ───
  { imageCategory: 'a4c', question: 'Identify the echocardiographic view shown in this image.', options: ['Apical 4-Chamber (A4C)', 'Parasternal Long Axis (PLAX)', 'Parasternal Short Axis (PSAX)', 'Subcostal 4-Chamber'], correct: 0, explanation: '**Apical 4-Chamber (A4C):** Probe at the apex, marker toward patient\'s left. All 4 chambers are visible with the apex at the top of the screen.', echoKey: 'A4C assesses LV/RV size, MV/TV function, atrial sizes, and global systolic function.' },
  { imageCategory: 'a4c', question: 'How many cardiac chambers can you see in this image?', options: ['4', '2', '3', '1'], correct: 0, explanation: '**4 chambers:** The A4C view displays the left ventricle, right ventricle, left atrium, and right atrium — all four chambers of the heart.', echoKey: 'The A4C is the only standard apical view that shows all 4 chambers simultaneously.' },
  { imageCategory: 'a4c', question: 'In this image, the left ventricle is on which side of the screen?', options: ['Right side (viewer\'s right)', 'Left side (viewer\'s left)', 'Top of screen', 'Bottom of screen'], correct: 0, explanation: '**Right side of screen:** By convention, A4C displays the LV on the viewer\'s right and the RV on the viewer\'s left. The apex is at the top.', echoKey: 'Verify orientation using the apical offset of the TV (more apical than MV).' },
  { imageCategory: 'a4c', question: 'Looking at this image, which valve sits closer to the apex (higher on screen)?', options: ['Tricuspid valve', 'Mitral valve', 'Aortic valve', 'Both are at the same level'], correct: 0, explanation: '**Tricuspid valve:** The TV inserts ~1 cm more apically than the MV. This apical offset is visible in the A4C and helps distinguish the right side from the left.', echoKey: 'Apical offset also identifies Ebstein anomaly (TV displacement ≥8 mm/m² from MV).' },
  { imageCategory: 'a4c', question: 'In this A4C image, what separates the left atrium from the left ventricle?', options: ['Mitral valve', 'Tricuspid valve', 'Aortic valve', 'Pulmonic valve'], correct: 0, explanation: '**Mitral valve (MV):** Visible between the LA and LV in this view. It has anterior and posterior leaflets and sits slightly more basal than the tricuspid valve.', echoKey: 'MV assessment in A4C: leaflet morphology, coaptation, regurgitation jet direction, and annular dimensions.' },
  { imageCategory: 'a4c', question: 'The bright line running vertically between the two ventricles in this image is the:', options: ['Interventricular septum (IVS)', 'Interatrial septum', 'Pericardium', 'Moderator band'], correct: 0, explanation: '**Interventricular septum (IVS):** This muscular wall separates the LV from the RV and is clearly visible in the A4C view. Normal thickness is 0.6–1.1 cm.', echoKey: 'IVSd >1.1 cm = LVH. IVSd ≥1.5 cm = possible HCM. Measure in PLAX at end-diastole.' },
  { imageCategory: 'a4c', question: 'Where is the ultrasound probe positioned to obtain this view?', options: ['Cardiac apex (point of maximal impulse)', 'Left parasternal border', 'Subxiphoid/subcostal area', 'Suprasternal notch'], correct: 0, explanation: '**Cardiac apex:** The A4C view is obtained by placing the probe at the point of maximal impulse with the marker toward the patient\'s left side.', echoKey: 'The apex position gives the best alignment for Doppler assessment of mitral and tricuspid inflow.' },
  { imageCategory: 'a4c', question: 'Looking at the two ventricles in this image, what is the normal RV-to-LV size ratio?', options: ['RV is about ⅔ the size of LV (ratio <0.6)', 'RV and LV are equal size (ratio 1:1)', 'RV is larger than LV (ratio >1.0)', 'RV is about ½ the size of LV (ratio 0.5)'], correct: 0, explanation: '**RV:LV <0.6:** The RV should appear noticeably smaller than the LV. RV:LV >1.0 = significant RV dilation, seen in PE, pulmonary HTN, or ARVC.', echoKey: 'RV basal diameter >4.2 cm = dilated. Always compare to LV in the A4C view.' },
  { imageCategory: 'a4c', question: 'The two smaller chambers at the bottom of this image are the:', options: ['Left atrium and right atrium', 'Left ventricle and right ventricle', 'LVOT and aortic root', 'Pericardial spaces'], correct: 0, explanation: '**Left atrium (LA) and right atrium (RA):** In the standard A4C orientation, the atria appear at the bottom and the ventricles at the top (near the apex).', echoKey: 'LA volume index >34 mL/m² = dilated. Measured by biplane area-length from A4C + A2C.' },
  { imageCategory: 'a4c', question: 'In this A4C view, what structure separates the two atria at the bottom of the image?', options: ['Interatrial septum', 'Interventricular septum', 'Mitral valve', 'Pericardium'], correct: 0, explanation: '**Interatrial septum (IAS):** This thin membrane separates LA from RA. Best visualized in the A4C view. Defects here = atrial septal defect (ASD).', echoKey: 'The IAS is best seen in A4C and subcostal views. Bubble study can confirm PFO/ASD if dropout is seen.' },
  { imageCategory: 'a4c', question: 'This A4C view is obtained from which apical window. Tilting the probe anteriorly from here would show which additional structure?', options: ['LVOT and aortic valve (creating an A5C view)', 'Descending aorta', 'IVC', 'Pulmonary veins'], correct: 0, explanation: '**LVOT and aortic valve (A5C):** Anterior tilt from the A4C brings the LVOT into view, creating the "5th chamber." Used for LVOT VTI and aortic valve assessment.', echoKey: 'A5C is essential for cardiac output: CO = LVOT VTI × LVOT area × HR.' },
  { imageCategory: 'a4c', question: 'From this A4C probe position, rotating 60° counterclockwise would produce which view?', options: ['Apical 2-Chamber (A2C)', 'Parasternal Long Axis', 'Subcostal view', 'Suprasternal view'], correct: 0, explanation: '**Apical 2-Chamber (A2C):** Shows only LA and LV with anterior and inferior walls. No RV or RA visible. Used with A4C for biplane Simpson EF.', echoKey: 'A2C + A4C biplane Simpson method is the gold standard for 2D EF measurement.' },
  { imageCategory: 'a4c', question: 'Which RV function measurement is performed from this exact view by placing M-mode at the lateral tricuspid annulus?', options: ['TAPSE', 'LVOT VTI', 'E-point septal separation', 'Fractional shortening'], correct: 0, explanation: '**TAPSE (Tricuspid Annular Plane Systolic Excursion):** M-mode cursor placed at the lateral TV annulus in A4C measures RV longitudinal function.', echoKey: 'TAPSE <17 mm = RV systolic dysfunction. Quick, reproducible, and angle-dependent.' },
  { imageCategory: 'a4c', question: 'To measure LV ejection fraction from this view, which method traces the LV endocardial border?', options: ['Simpson biplane method of disks', 'Visual estimation', 'Teichholz formula', 'Pressure half-time'], correct: 0, explanation: '**Simpson biplane method of disks:** Trace the LV endocardium at end-diastole and end-systole in A4C (and A2C). The LV is divided into disks and volumes are summed.', echoKey: 'Normal EF: 52–72% (men), 54–74% (women). This is the gold standard 2D echo EF method.' },
  { imageCategory: 'a4c', question: 'The muscular walls of the ventricles visible in this image should be assessed for:', options: ['Wall motion abnormalities (hypokinesis, akinesis)', 'Valve stenosis severity', 'Pericardial thickness', 'Aortic root diameter'], correct: 0, explanation: '**Wall motion abnormalities:** In the A4C, you can assess the septal, lateral, apical septal, and apical lateral LV wall segments for regional dysfunction suggesting ischemia or infarction.', echoKey: 'A4C shows 7 of the 17 LV segments. Hypokinesis = reduced motion. Akinesis = no motion. Dyskinesis = paradoxical motion.' },
  // ─── Pericardial effusion: identifying and assessing the visible fluid ───
  { imageCategory: 'effusion', question: 'What does the dark (anechoic) space surrounding the heart in this image represent?', options: ['Pericardial effusion', 'Pleural effusion', 'Normal pericardial fat pad', 'Myocardial edema'], correct: 0, explanation: '**Pericardial effusion:** Fluid in the pericardial space appears as a dark, anechoic stripe surrounding the heart. It tracks within the pericardial sac.', echoKey: 'Trivial <0.5 cm, small 0.5–1 cm, moderate 1–2 cm, large >2 cm. Always assess for tamponade physiology.' },
  { imageCategory: 'effusion', question: 'The fluid collection visible in this image is located between which two structures?', options: ['Visceral and parietal pericardium', 'Pericardium and pleura', 'Myocardium and endocardium', 'Epicardium and myocardium'], correct: 0, explanation: '**Visceral and parietal pericardium:** Pericardial effusion accumulates between the two pericardial layers. Normally, only 15–50 mL of fluid exists in this space.', echoKey: 'The pericardial sac is a double-layered membrane. Fluid here is pericardial; fluid outside the parietal layer is pleural.' },
  { imageCategory: 'effusion', question: 'Looking at the fluid visible in this image, how do you differentiate pericardial from pleural effusion?', options: ['Pericardial fluid tracks anterior to the descending aorta', 'Pericardial fluid is always larger', 'Pleural fluid is always bilateral', 'They cannot be distinguished on echo'], correct: 0, explanation: '**Anterior to descending aorta:** In PLAX, pericardial fluid tracks between the heart and descending aorta. Pleural fluid tracks posterior to the aorta.', echoKey: 'In A4C: pericardial = circumferential. Pleural = posterior/lateral only, doesn\'t cross midline posteriorly.' },
  { imageCategory: 'effusion', question: 'What is the most dangerous complication of the finding shown in this image?', options: ['Cardiac tamponade', 'Myocardial infarction', 'Aortic dissection', 'Pulmonary embolism'], correct: 0, explanation: '**Cardiac tamponade:** Large or rapidly accumulating pericardial effusions can compress the heart, impairing filling and causing hemodynamic collapse.', echoKey: 'Tamponade signs: RV diastolic collapse, RA systolic collapse >⅓ cycle, plethoric IVC, respiratory variation >25%.' },
  { imageCategory: 'effusion', question: 'Given the pericardial effusion visible in this image, what additional echo assessment is most critical to perform next?', options: ['IVC size and respiratory variation', 'Aortic valve gradient', 'LV mass calculation', 'Pulmonary vein flow'], correct: 0, explanation: '**IVC size and respiratory variation:** A plethoric IVC (>2.1 cm, <50% collapse) in the setting of pericardial effusion suggests elevated RA pressure and possible tamponade.', echoKey: 'IVC plethora has 97% sensitivity for elevated RAP. Always correlate with clinical picture.' },
  { imageCategory: 'effusion', question: 'The pericardial fluid in this image appears dark/anechoic. What does this suggest about the fluid?', options: ['Simple, serous (transudative) fluid', 'Hemorrhagic fluid with clot', 'Purulent/infected fluid', 'Air in the pericardium'], correct: 0, explanation: '**Simple, serous fluid:** Anechoic (completely dark) pericardial fluid is typically transudative. Echogenic or complex fluid suggests hemorrhage, infection, or malignancy.', echoKey: 'Exudative effusions may show fibrin strands, septations, or echogenic debris. Hemorrhagic effusions appear echogenic.' },
  { imageCategory: 'effusion', question: 'In this image, where does pericardial fluid typically accumulate first?', options: ['Posterior/dependent space', 'Anterior to the RV', 'Around the apex', 'Superior to the atria'], correct: 0, explanation: '**Posterior/dependent space:** In a supine patient, gravity causes fluid to collect posteriorly first. Small effusions are best seen posterior to the LV in PLAX.', echoKey: 'As effusion grows: posterior → circumferential → anterior. Circumferential effusion ≥2 cm = large.' },
  { imageCategory: 'effusion', question: 'Which clinical finding would you expect in a patient with a large effusion like the one shown?', options: ['Muffled/distant heart sounds', 'Loud systolic murmur', 'Wide pulse pressure', 'Bounding peripheral pulses'], correct: 0, explanation: '**Muffled heart sounds:** Fluid around the heart dampens sound transmission. Part of Beck\'s triad for tamponade: muffled sounds, hypotension, JVD.', echoKey: 'Beck\'s triad is only present in ~10–40% of tamponade cases. Echo is far more sensitive than clinical exam.' },
  { imageCategory: 'effusion', question: 'If this pericardial effusion is causing hemodynamic compromise, which chamber collapses first?', options: ['Right atrium (during systole)', 'Left ventricle (during diastole)', 'Left atrium (during systole)', 'Right ventricle (during systole)'], correct: 0, explanation: '**Right atrium during systole:** RA systolic collapse is the most sensitive sign of tamponade because the RA has the lowest intracardiac pressure and thinnest wall.', echoKey: 'RA collapse >⅓ of cardiac cycle = highly specific. RV diastolic collapse is more specific but less sensitive.' },
  { imageCategory: 'effusion', question: 'In a trauma patient, which echo view would you use first to look for a finding like the one shown in this image?', options: ['Subcostal 4-chamber (FAST exam)', 'Parasternal long axis', 'Apical 4-chamber', 'Suprasternal notch'], correct: 0, explanation: '**Subcostal 4-chamber:** Part of the FAST exam. Most sensitive view for detecting pericardial effusion in supine trauma patients because the liver provides an acoustic window.', echoKey: 'FAST cardiac view: probe nearly flat on abdomen at subxiphoid, marker to patient\'s right.' },
  // ─── Animated cine loops (looping MP4 clips from Wikimedia Commons) ───
  // A4C cine — clearly shows 4 chambers beating
  { imageCategory: 'a4c_cine', question: 'Watch this beating heart. How many chambers can you count in this clip?', options: ['4 (two ventricles, two atria)', '2 (one ventricle, one atrium)', '3 (two ventricles, one atrium)', '1 (left ventricle only)'], correct: 0, explanation: '**4 chambers:** This is an apical 4-chamber (A4C) view showing both ventricles (top) and both atria (bottom) contracting rhythmically.', echoKey: 'The A4C is the most commonly used view for assessing global cardiac function and chamber sizes.' },
  { imageCategory: 'a4c_cine', question: 'In this clip, when the ventricles squeeze to their smallest size, what phase of the cardiac cycle is that?', options: ['End-systole', 'End-diastole', 'Atrial systole', 'Isovolumetric relaxation'], correct: 0, explanation: '**End-systole:** Maximum ventricular contraction = smallest cavity size. The difference between the largest (end-diastole) and smallest (end-systole) is used to calculate ejection fraction.', echoKey: 'EF = (EDV - ESV) / EDV × 100. Watch for symmetric wall thickening — asymmetry suggests ischemia.' },
  { imageCategory: 'a4c_cine', question: 'Watch the ventricular walls contract in this clip. If all segments move inward symmetrically, this suggests:', options: ['Normal global systolic function', 'Acute myocardial infarction', 'Pericardial constriction', 'Severe aortic stenosis'], correct: 0, explanation: '**Normal global systolic function:** Symmetric inward wall motion and thickening during systole indicates all myocardial segments are receiving adequate blood supply.', echoKey: 'Asymmetric motion (hypokinesis/akinesis of specific segments) suggests coronary artery disease affecting that territory.' },
  // Effusion cine — animated pericardial fluid surrounding heart
  { imageCategory: 'effusion_cine', question: 'In this clip, the dark space surrounding the beating heart is:', options: ['Pericardial effusion (fluid around the heart)', 'Normal pericardial fat', 'Pleural effusion', 'An imaging artifact'], correct: 0, explanation: '**Pericardial effusion:** The dark (anechoic) space surrounding the heart is fluid within the pericardial sac. In this animated clip you can see the heart beating within the fluid.', echoKey: 'Grading: trivial <0.5 cm, small 0.5–1 cm, moderate 1–2 cm, large >2 cm. Always assess for tamponade.' },
  { imageCategory: 'effusion_cine', question: 'Watch the heart motion in this clip. The heart is surrounded by fluid — what life-threatening condition can this cause?', options: ['Cardiac tamponade', 'Aortic dissection', 'Pulmonary embolism', 'Endocarditis'], correct: 0, explanation: '**Cardiac tamponade:** When pericardial fluid accumulates faster than the sac can stretch, intrapericardial pressure rises and compresses the heart chambers, impeding filling.', echoKey: 'Look for: RA systolic collapse, RV diastolic collapse, IVC plethora, and respiratory variation in Doppler flows.' },
  { imageCategory: 'effusion_cine', question: 'In this clip showing pericardial fluid, what is the next critical step in the echo assessment?', options: ['Check IVC size and collapsibility', 'Measure aortic root diameter', 'Calculate LV mass', 'Assess pulmonary vein flow'], correct: 0, explanation: '**Check IVC size and collapsibility:** A plethoric IVC (>2.1 cm, <50% collapse with sniff) in the setting of pericardial effusion strongly suggests elevated right atrial pressure and possible tamponade.', echoKey: 'IVC plethora has 97% sensitivity for elevated RAP. Combine with clinical assessment for tamponade diagnosis.' },
  // Valves cine — valves opening and closing
  { imageCategory: 'valves_cine', question: 'Watch the valves opening and closing in this clip. During which phase do the mitral and tricuspid valves open?', options: ['Diastole (ventricular filling)', 'Systole (ventricular ejection)', 'Isovolumetric contraction', 'They stay open continuously'], correct: 0, explanation: '**Diastole:** The AV valves (mitral and tricuspid) open when ventricular pressure drops below atrial pressure, allowing blood to flow from atria into ventricles.', echoKey: 'E-wave = passive filling. A-wave = atrial contraction. E/A ratio and deceleration time help grade diastolic function.' },
  { imageCategory: 'valves_cine', question: 'In this clip, when the ventricles contract, which valves open to eject blood?', options: ['Aortic and pulmonic (semilunar) valves', 'Mitral and tricuspid (AV) valves', 'All four valves simultaneously', 'No valves open during contraction'], correct: 0, explanation: '**Aortic and pulmonic valves:** During systole, rising ventricular pressure opens the semilunar valves, ejecting blood into the aorta and pulmonary artery. The AV valves are closed.', echoKey: 'Systole: semilunar open, AV closed. Diastole: AV open, semilunar closed. This reciprocal pattern prevents backflow.' },
  { imageCategory: 'valves_cine', question: 'If a valve in this clip fails to open fully, restricting flow through it, this is called:', options: ['Stenosis', 'Regurgitation', 'Prolapse', 'Vegetation'], correct: 0, explanation: '**Stenosis:** Incomplete valve opening restricts forward flow and creates a pressure gradient across the valve. The heart must work harder to push blood through the narrowed opening.', echoKey: 'Stenosis severity: mild, moderate, severe. Assessed by peak velocity, mean gradient, and valve area (continuity equation).' },
  // MVP cine — visible leaflet bowing past annular plane
  { imageCategory: 'mvp_cine', question: 'Watch the mitral valve in this clip. A leaflet is bowing backward past the annular plane during systole. This is:', options: ['Mitral valve prolapse (MVP)', 'Normal mitral valve closure', 'Mitral stenosis', 'Aortic regurgitation'], correct: 0, explanation: '**Mitral valve prolapse:** One or both MV leaflets displace ≥2 mm above the annular plane during systole. You can see the leaflet billowing backward into the LA in this clip.', echoKey: 'MVP affects 2–3% of the population. Best diagnosed in PLAX view (A4C can overdiagnose due to saddle shape of the annulus).' },
  { imageCategory: 'mvp_cine', question: 'The leaflet abnormality visible in this clip can cause blood to leak backward. What is this complication called?', options: ['Mitral regurgitation', 'Mitral stenosis', 'Aortic stenosis', 'Tricuspid stenosis'], correct: 0, explanation: '**Mitral regurgitation (MR):** When the prolapsing leaflet fails to coapt properly, blood regurgitates from LV back into the LA during systole.', echoKey: 'MR severity: vena contracta width (≥7 mm = severe), PISA radius, jet area, pulmonary vein systolic flow reversal.' },
  // MVP 2D cine — 2D transthoracic assessment of mitral prolapse
  { imageCategory: 'mvp_2d_cine', question: 'This clip shows a 2D assessment of the mitral valve. What are you looking for to diagnose prolapse?', options: ['Leaflet displacement ≥2 mm above the annular plane', 'Leaflet thickening >5 mm', 'Valve area <1.0 cm²', 'Leaflet calcification'], correct: 0, explanation: '**Leaflet displacement ≥2 mm above the annular plane:** This is the diagnostic criterion for MVP. The leaflet billows back into the LA during systole.', echoKey: 'Measure in PLAX in systole. Classic MVP = thick, redundant leaflets with myxomatous degeneration. Non-classic = thin leaflets.' },
  // MR cine — mitral regurgitation visible on echo
  { imageCategory: 'mr_cine', question: 'This clip shows a mitral valve with abnormal morphology and motion. What hemodynamic consequence should you assess for?', options: ['Mitral regurgitation (backward leak into LA)', 'Aortic stenosis', 'Pulmonic regurgitation', 'Tricuspid stenosis'], correct: 0, explanation: '**Mitral regurgitation:** Abnormal MV morphology (prolapse, flail, restriction) causes incomplete coaptation, allowing blood to regurgitate into the LA during systole.', echoKey: 'Assess MR severity with color Doppler jet area, vena contracta, PISA, and pulmonary vein flow pattern.' },
  { imageCategory: 'mr_cine', question: 'In this clip, the mitral valve leaflets appear abnormal. Which of these MV morphologies most commonly causes severe MR?', options: ['Flail leaflet (ruptured chordae)', 'Mildly thickened leaflets', 'Annular calcification', 'Small vegetations'], correct: 0, explanation: '**Flail leaflet:** Chordal rupture causes the leaflet tip to flip into the LA during systole, creating severe eccentric MR. This is a surgical emergency if acute.', echoKey: 'Flail leaflet: coaptation point lost, leaflet tip in LA during systole. Eccentric MR jet directed away from the flail leaflet.' },
  // Tamponade cine — pericardial effusion with chamber compression
  { imageCategory: 'tamponade_cine', question: 'This clip shows a heart surrounded by pericardial fluid. Watch carefully — if you see a chamber wall buckling inward, which chamber is most vulnerable?', options: ['Right atrium (thinnest wall, lowest pressure)', 'Left ventricle', 'Left atrium', 'Aortic root'], correct: 0, explanation: '**Right atrium:** The RA has the thinnest wall and lowest intracardiac pressure, making it the first chamber to collapse when intrapericardial pressure rises (tamponade).', echoKey: 'RA systolic collapse = most sensitive. RV diastolic collapse = most specific. Both together = high specificity for tamponade.' },
  { imageCategory: 'tamponade_cine', question: 'In this clip, the heart moves freely within the surrounding fluid. On an ECG, this "swinging" motion produces:', options: ['Electrical alternans (alternating QRS amplitude)', 'ST elevation', 'Heart block', 'Normal sinus rhythm'], correct: 0, explanation: '**Electrical alternans:** The heart swinging within a large effusion causes the cardiac axis to alternate beat-to-beat, producing alternating QRS amplitudes on ECG.', echoKey: 'Swinging heart + electrical alternans + pulsus paradoxus = classic tamponade triad. Urgent pericardiocentesis may be needed.' },
  // HCM cine — thick septum visible, small LV cavity
  { imageCategory: 'hcm_cine', question: 'In this clip, the interventricular septum appears abnormally thick compared to the other walls. What condition does this suggest?', options: ['Hypertrophic cardiomyopathy (HCM)', 'Dilated cardiomyopathy (DCM)', 'Pericardial effusion', 'Normal heart'], correct: 0, explanation: '**Hypertrophic cardiomyopathy (HCM):** Asymmetric septal hypertrophy (≥15 mm) with a small LV cavity is the hallmark of HCM. You can see the disproportionately thick septum in this clip.', echoKey: 'HCM: IVS ≥15 mm (or ≥13 mm with family history), SAM of MV, small LV cavity, dynamic LVOT obstruction.' },
  { imageCategory: 'hcm_cine', question: 'Given the thick septum visible in this clip, what complication can occur if the MV leaflet is pulled toward the septum during systole?', options: ['Dynamic LVOT obstruction (obstructive HCM)', 'Aortic root dissection', 'Pericardial tamponade', 'Complete heart block'], correct: 0, explanation: '**Dynamic LVOT obstruction:** The thickened septum narrows the LVOT, and the Venturi effect pulls the anterior MV leaflet toward it (SAM), creating outflow obstruction that worsens with Valsalva.', echoKey: 'LVOT gradient >30 mmHg at rest = obstructive HCM. Provocable with Valsalva, standing, or exercise.' },
  // HCM A4C cine — A4C view showing hypertrophic cardiomyopathy
  { imageCategory: 'hcm_a4c_cine', question: 'This clip shows an A4C view with an abnormally thick septum and small LV cavity. What is the most likely diagnosis?', options: ['Hypertrophic cardiomyopathy', 'Dilated cardiomyopathy', 'Restrictive cardiomyopathy', 'Takotsubo cardiomyopathy'], correct: 0, explanation: '**Hypertrophic cardiomyopathy:** The combination of disproportionately thick septum, small LV cavity, and hyperdynamic function visible in this clip is classic for HCM.', echoKey: 'HCM is autosomal dominant (sarcomere gene mutations). Screen all first-degree relatives. SCD risk stratification is critical.' },
  { imageCategory: 'hcm_a4c_cine', question: 'In this HCM clip, the LV cavity appears small and contracts vigorously. What does this hyperdynamic function reflect?', options: ['Small cavity with preserved or supranormal EF', 'Severe systolic dysfunction', 'Diastolic heart failure with reduced EF', 'Volume overload'], correct: 0, explanation: '**Small cavity with preserved/supranormal EF:** In HCM, the hypertrophied walls contract around a small cavity, producing a high EF (often >70%). However, diastolic function is impaired.', echoKey: 'HCM patients often have diastolic dysfunction despite supranormal EF. Assess E/e\', LA size, and pulmonary vein flow.' },
  // Stress echo cine — echo during stress testing
  { imageCategory: 'stress_cine', question: 'This clip shows a heart during stress echocardiography. What is the primary purpose of stress echo?', options: ['Detect wall motion abnormalities that appear with exercise or pharmacologic stress', 'Measure resting heart rate', 'Assess valve anatomy at rest', 'Calculate LV mass'], correct: 0, explanation: '**Detect inducible wall motion abnormalities:** Stress echo compares wall motion at rest vs. peak stress. New hypokinesis/akinesis during stress indicates myocardial ischemia from coronary artery disease.', echoKey: 'Stress echo: exercise (treadmill/bike) or pharmacologic (dobutamine). Sensitivity 80–85%, specificity 85–90% for CAD.' },
  { imageCategory: 'stress_cine', question: 'In this stress echo clip, if a wall segment that moved normally at rest becomes hypokinetic at peak stress, this suggests:', options: ['Inducible ischemia in that coronary territory', 'Normal stress response', 'Pericardial disease', 'Valve stenosis'], correct: 0, explanation: '**Inducible ischemia:** A wall segment that worsens from rest to stress indicates inadequate blood supply under demand — the hallmark of significant coronary artery disease.', echoKey: 'Fixed defect (abnormal at rest + stress) = prior infarction/scar. New defect (normal rest, abnormal stress) = ischemia.' },
  // Respiratory variation cine — echo showing respiratory changes
  { imageCategory: 'resp_cine', question: 'This clip shows the heart during different phases of respiration. Exaggerated changes in chamber size with breathing can indicate:', options: ['Pericardial tamponade or constriction (ventricular interdependence)', 'Normal physiology', 'Aortic stenosis', 'Mitral valve prolapse'], correct: 0, explanation: '**Ventricular interdependence:** In tamponade and constrictive pericarditis, the rigid pericardium causes exaggerated respiratory variation — inspiration increases RV filling at the expense of LV filling.', echoKey: '>25% mitral inflow variation or >40% tricuspid inflow variation suggests hemodynamically significant tamponade or constriction.' },
  { imageCategory: 'resp_cine', question: 'In this clip, observe how the septum shifts with respiration. This septal "bounce" or "shift" is most characteristic of:', options: ['Constrictive pericarditis', 'Dilated cardiomyopathy', 'Aortic regurgitation', 'Normal cardiac motion'], correct: 0, explanation: '**Constrictive pericarditis:** The thickened, non-compliant pericardium causes ventricular interdependence. During inspiration, the septum bounces toward the LV as RV fills; during expiration, it shifts back.', echoKey: 'Septal bounce + respiratory variation + plethoric IVC + preserved EF = constrictive pericarditis. Differentiate from restrictive CMP.' },
];

function EchoViewSVG({ id }: { id: EchoImageId }) {
  const bg = '#080810', lv = '#8fbccc', rv = '#5a9a8a', la = '#7a9ab8', ao = '#d4a870', mv = '#d4939f', label = 'rgba(255,255,255,0.88)', dim = 'rgba(255,255,255,0.38)';
  const style: React.CSSProperties = { width: '100%', borderRadius: 10, display: 'block' };

  if (id === 'plax') return (
    <svg viewBox="0 0 220 150" style={style}>
      <rect width="220" height="150" fill={bg}/>
      <path d="M110,2 L2,148 L218,148 Z" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      {/* RV - thin anterior band */}
      <path d="M110,2 L52,46 L168,46 Z" fill={rv} opacity="0.65"/>
      <text x="110" y="34" fill={label} fontSize="9" textAnchor="middle" fontWeight="700">RV</text>
      {/* LV - large central oval */}
      <ellipse cx="92" cy="97" rx="54" ry="44" fill={lv} opacity="0.72"/>
      <text x="88" y="100" fill={label} fontSize="11" textAnchor="middle" fontWeight="800">LV</text>
      {/* LVOT / Ao */}
      <path d="M132,46 L160,8 L190,8 L168,50 Z" fill={ao} opacity="0.82"/>
      <text x="178" y="24" fill={label} fontSize="8" textAnchor="middle" fontWeight="700">Ao</text>
      {/* LA */}
      <ellipse cx="170" cy="116" rx="36" ry="27" fill={la} opacity="0.68"/>
      <text x="170" y="119" fill={label} fontSize="10" textAnchor="middle" fontWeight="800">LA</text>
      {/* MV leaflets */}
      <path d="M130,84 Q141,100 130,116" stroke={mv} strokeWidth="2.5" fill="none"/>
      <path d="M142,84 Q131,100 142,116" stroke={mv} strokeWidth="2.5" fill="none"/>
      <text x="152" y="103" fill={mv} fontSize="8" fontWeight="700">MV</text>
      <circle cx="110" cy="2" r="3" fill="rgba(255,255,255,0.45)"/>
    </svg>
  );

  if (id === 'a4c') return (
    <svg viewBox="0 0 220 155" style={style}>
      <rect width="220" height="155" fill={bg}/>
      <path d="M110,2 L2,150 L218,150 Z" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      <circle cx="110" cy="2" r="3" fill="rgba(255,255,255,0.45)"/>
      {/* LV - left side */}
      <path d="M110,4 L28,118 L110,118 Z" fill={lv} opacity="0.72"/>
      <text x="66" y="75" fill={label} fontSize="11" textAnchor="middle" fontWeight="800">LV</text>
      {/* RV - right side */}
      <path d="M110,4 L110,118 L192,118 Z" fill={rv} opacity="0.62"/>
      <text x="154" y="75" fill={label} fontSize="11" textAnchor="middle" fontWeight="800">RV</text>
      {/* IVS */}
      <line x1="110" y1="4" x2="110" y2="150" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5"/>
      {/* LA */}
      <path d="M28,118 L110,118 L110,150 L28,150 Z" fill={la} opacity="0.62"/>
      <text x="66" y="138" fill={label} fontSize="9" textAnchor="middle" fontWeight="700">LA</text>
      {/* RA */}
      <path d="M110,118 L192,118 L192,150 L110,150 Z" fill={la} opacity="0.48"/>
      <text x="154" y="138" fill={label} fontSize="9" textAnchor="middle" fontWeight="700">RA</text>
      {/* MV (asked about) - left valve with arrow */}
      <path d="M60,118 Q72,130 60,142" stroke={mv} strokeWidth="2.5" fill="none"/>
      <path d="M74,118 Q62,130 74,142" stroke={mv} strokeWidth="2.5" fill="none"/>
      <text x="38" y="115" fill={mv} fontSize="11" fontWeight="900">▲</text>
      {/* TV - right valve */}
      <path d="M144,121 Q156,132 144,143" stroke="rgba(255,255,255,0.35)" strokeWidth="2" fill="none"/>
      <path d="M156,121 Q144,132 156,143" stroke="rgba(255,255,255,0.35)" strokeWidth="2" fill="none"/>
    </svg>
  );

  if (id === 'psax') return (
    <svg viewBox="0 0 200 200" style={{ ...style }}>
      <rect width="200" height="200" fill={bg}/>
      {/* LV wall */}
      <circle cx="100" cy="95" r="74" fill={lv} opacity="0.72"/>
      {/* LV cavity */}
      <circle cx="100" cy="95" r="54" fill={bg}/>
      <text x="100" y="100" fill={dim} fontSize="10" textAnchor="middle" fontWeight="700">LV</text>
      {/* Papillary muscles */}
      <ellipse cx="72" cy="116" rx="15" ry="11" fill={lv} opacity="0.92"/>
      <text x="72" y="140" fill={dim} fontSize="7" textAnchor="middle">PM</text>
      <ellipse cx="128" cy="116" rx="15" ry="11" fill={lv} opacity="0.92"/>
      <text x="128" y="140" fill={dim} fontSize="7" textAnchor="middle">PM</text>
      {/* RV crescent - anterior */}
      <path d="M38,150 Q100,182 162,150 L155,163 Q100,196 45,163 Z" fill={rv} opacity="0.65"/>
      <text x="100" y="175" fill={label} fontSize="9" textAnchor="middle" fontWeight="700">RV</text>
    </svg>
  );

  if (id === 'plax-dilated') return (
    <svg viewBox="0 0 220 150" style={style}>
      <rect width="220" height="150" fill={bg}/>
      <path d="M110,2 L2,148 L218,148 Z" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      {/* RV - thin band */}
      <path d="M110,2 L52,40 L168,40 Z" fill={rv} opacity="0.62"/>
      <text x="110" y="28" fill={label} fontSize="9" textAnchor="middle" fontWeight="700">RV</text>
      {/* LV - noticeably enlarged */}
      <ellipse cx="95" cy="97" rx="70" ry="50" fill={lv} opacity="0.80"/>
      <text x="90" y="93" fill={label} fontSize="11" textAnchor="middle" fontWeight="800">LV</text>
      {/* Measurement line */}
      <line x1="25" y1="100" x2="162" y2="100" stroke="rgba(255,220,40,0.85)" strokeWidth="1.5" strokeDasharray="4,3"/>
      <circle cx="25" cy="100" r="3" fill="rgba(255,220,40,0.85)"/>
      <circle cx="162" cy="100" r="3" fill="rgba(255,220,40,0.85)"/>
      <text x="94" y="115" fill="rgba(255,220,40,0.9)" fontSize="8" textAnchor="middle" fontWeight="700">LVIDd = 7.4 cm</text>
      {/* Ao */}
      <path d="M148,40 L170,8 L190,8 L172,44 Z" fill={ao} opacity="0.78"/>
      <text x="182" y="24" fill={label} fontSize="8" textAnchor="middle" fontWeight="700">Ao</text>
      {/* LA - slightly enlarged */}
      <ellipse cx="172" cy="116" rx="34" ry="26" fill={la} opacity="0.65"/>
      <text x="172" y="119" fill={label} fontSize="9" textAnchor="middle" fontWeight="800">LA</text>
      {/* MV */}
      <path d="M138,85 Q148,100 138,115" stroke={mv} strokeWidth="2" fill="none"/>
      <path d="M148,85 Q138,100 148,115" stroke={mv} strokeWidth="2" fill="none"/>
      <circle cx="110" cy="2" r="3" fill="rgba(255,255,255,0.45)"/>
    </svg>
  );

  if (id === 'effusion') return (
    <svg viewBox="0 0 220 155" style={style}>
      <rect width="220" height="155" fill={bg}/>
      {/* Pericardial effusion ring (anechoic = very dark, slightly blue-tinted) */}
      <path d="M110,2 L2,150 L218,150 Z" fill="#020814" stroke="rgba(100,180,255,0.15)" strokeWidth="1"/>
      <circle cx="110" cy="2" r="3" fill="rgba(255,255,255,0.45)"/>
      {/* Effusion label with star */}
      <text x="16" y="88" fill="rgba(100,190,255,0.9)" fontSize="13" fontWeight="900">☆</text>
      <text x="10" y="100" fill="rgba(100,190,255,0.65)" fontSize="7">effusion</text>
      {/* Heart structures inset (smaller than usual = surrounded by effusion) */}
      {/* LV */}
      <path d="M110,22 L50,114 L110,114 Z" fill={lv} opacity="0.74"/>
      <text x="74" y="78" fill={label} fontSize="10" textAnchor="middle" fontWeight="800">LV</text>
      {/* RV */}
      <path d="M110,22 L110,114 L170,114 Z" fill={rv} opacity="0.64"/>
      <text x="146" y="78" fill={label} fontSize="10" textAnchor="middle" fontWeight="800">RV</text>
      {/* IVS */}
      <line x1="110" y1="22" x2="110" y2="150" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5"/>
      {/* LA */}
      <path d="M50,114 L110,114 L110,142 L50,142 Z" fill={la} opacity="0.64"/>
      <text x="74" y="132" fill={label} fontSize="9" textAnchor="middle" fontWeight="700">LA</text>
      {/* RA */}
      <path d="M110,114 L170,114 L170,142 L110,142 Z" fill={la} opacity="0.50"/>
      <text x="146" y="132" fill={label} fontSize="9" textAnchor="middle" fontWeight="700">RA</text>
    </svg>
  );

  if (id === 'hocm-plax') return (
    <svg viewBox="0 0 220 150" style={style}>
      <rect width="220" height="150" fill={bg}/>
      <path d="M110,2 L2,148 L218,148 Z" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      {/* RV */}
      <path d="M110,2 L52,46 L168,46 Z" fill={rv} opacity="0.65"/>
      <text x="110" y="34" fill={label} fontSize="9" textAnchor="middle" fontWeight="700">RV</text>
      {/* THICK IVS — the key finding */}
      <path d="M52,46 L168,46 L168,68 L52,68 Z" fill={lv} opacity="0.95"/>
      <text x="110" y="61" fill="rgba(255,220,50,0.95)" fontSize="8" textAnchor="middle" fontWeight="800">IVS = 22 mm</text>
      {/* LV cavity (smaller due to hypertrophy) */}
      <ellipse cx="90" cy="102" rx="40" ry="34" fill={lv} opacity="0.70"/>
      <text x="88" y="105" fill={label} fontSize="10" textAnchor="middle" fontWeight="800">LV</text>
      {/* Ao */}
      <path d="M140,46 L165,10 L185,10 L162,50 Z" fill={ao} opacity="0.82"/>
      <text x="178" y="26" fill={label} fontSize="8" textAnchor="middle" fontWeight="700">Ao</text>
      {/* LA */}
      <ellipse cx="170" cy="116" rx="34" ry="26" fill={la} opacity="0.66"/>
      <text x="170" y="119" fill={label} fontSize="10" textAnchor="middle" fontWeight="800">LA</text>
      {/* MV */}
      <path d="M128,86 Q138,100 128,114" stroke={mv} strokeWidth="2.5" fill="none"/>
      <path d="M138,86 Q128,100 138,114" stroke={mv} strokeWidth="2.5" fill="none"/>
      <circle cx="110" cy="2" r="3" fill="rgba(255,255,255,0.45)"/>
    </svg>
  );

  if (id === 'd-lv') return (
    <svg viewBox="0 0 200 200" style={style}>
      <rect width="200" height="200" fill={bg}/>
      {/* RV — enlarged (pressure overload) */}
      <ellipse cx="100" cy="95" rx="74" ry="65" fill={rv} opacity="0.65"/>
      <text x="100" y="58" fill={label} fontSize="10" textAnchor="middle" fontWeight="800">RV</text>
      {/* D-shaped LV — flattened on IVS side */}
      <path d="M100,28 Q165,50 165,95 Q165,140 100,162 Q75,140 75,95 Q75,50 100,28 Z" fill={lv} opacity="0.80"/>
      <text x="130" y="100" fill={label} fontSize="10" textAnchor="middle" fontWeight="800">LV</text>
      {/* Flat IVS — bowing toward LV */}
      <path d="M100,28 L100,162" stroke="rgba(255,220,50,0.85)" strokeWidth="2.5" strokeDasharray="5,3"/>
      <text x="100" y="180" fill="rgba(255,220,50,0.9)" fontSize="8" textAnchor="middle" fontWeight="700">D-shaped LV</text>
    </svg>
  );

  if (id === 'dilated-rv') return (
    <svg viewBox="0 0 220 155" style={style}>
      <rect width="220" height="155" fill={bg}/>
      <path d="M110,2 L2,150 L218,150 Z" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      <circle cx="110" cy="2" r="3" fill="rgba(255,255,255,0.45)"/>
      {/* LV — smaller than normal */}
      <path d="M110,4 L50,118 L110,118 Z" fill={lv} opacity="0.72"/>
      <text x="72" y="78" fill={label} fontSize="10" textAnchor="middle" fontWeight="700">LV</text>
      {/* RV — LARGER than LV */}
      <path d="M110,4 L110,118 L200,118 Z" fill={rv} opacity="0.80"/>
      <text x="162" y="65" fill={label} fontSize="12" textAnchor="middle" fontWeight="800">RV</text>
      <text x="162" y="80" fill="rgba(255,120,120,0.9)" fontSize="8" textAnchor="middle" fontWeight="700">▲ enlarged</text>
      {/* IVS */}
      <line x1="110" y1="4" x2="110" y2="150" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5"/>
      {/* LA */}
      <path d="M50,118 L110,118 L110,150 L50,150 Z" fill={la} opacity="0.60"/>
      <text x="74" y="138" fill={label} fontSize="9" textAnchor="middle" fontWeight="700">LA</text>
      {/* RA — enlarged */}
      <path d="M110,118 L200,118 L200,150 L110,150 Z" fill={la} opacity="0.70"/>
      <text x="160" y="138" fill={label} fontSize="9" textAnchor="middle" fontWeight="700">RA ▲</text>
    </svg>
  );

  if (id === 'subcostal') return (
    <svg viewBox="0 0 220 155" style={style}>
      <rect width="220" height="155" fill={bg}/>
      {/* Liver — top of subcostal image */}
      <rect x="0" y="0" width="220" height="40" rx="0" fill="rgba(120,80,40,0.5)"/>
      <text x="110" y="25" fill="rgba(255,200,150,0.8)" fontSize="9" textAnchor="middle" fontWeight="700">LIVER</text>
      {/* IVC — tube entering RA */}
      <rect x="70" y="38" width="24" height="70" rx="6" fill={la} opacity="0.70"/>
      <text x="82" y="88" fill={label} fontSize="8" textAnchor="middle" fontWeight="700">IVC</text>
      {/* IVC measurement */}
      <line x1="68" y1="50" x2="68" y2="110" stroke="rgba(255,220,50,0.85)" strokeWidth="1.5" strokeDasharray="3,2"/>
      <line x1="62" y1="50" x2="74" y2="50" stroke="rgba(255,220,50,0.85)" strokeWidth="1.5"/>
      <line x1="62" y1="110" x2="74" y2="110" stroke="rgba(255,220,50,0.85)" strokeWidth="1.5"/>
      <text x="52" y="83" fill="rgba(255,220,50,0.9)" fontSize="7" textAnchor="middle" fontWeight="700">2.5 cm</text>
      {/* RA */}
      <ellipse cx="130" cy="105" rx="52" ry="40" fill={la} opacity="0.58"/>
      <text x="130" y="108" fill={label} fontSize="11" textAnchor="middle" fontWeight="800">RA</text>
      {/* Probe indicator at bottom */}
      <circle cx="110" cy="152" r="3" fill="rgba(255,255,255,0.45)"/>
    </svg>
  );

  return null;
}

function EchoImageQuiz() {
  const { P, PL, PS, PB, PT, PM, PX } = useT();
  const [questions, setQuestions] = useState<typeof ECHO_IMAGE_QUIZ[number][]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<'quiz' | 'results'>('quiz');
  const [showConfetti, setShowConfetti] = useState(false);

  // Pick random questions and assign a random image from each question's category
  const buildQuiz = () => {
    const picked = shuffleArray(ECHO_IMAGE_QUIZ).slice(0, 5).map(shuffleOptions);
    const imgs: Record<number, string> = {};
    picked.forEach((q, i) => { imgs[i] = getRandomEchoImage(q.imageCategory); });
    return { picked, imgs };
  };

  const [imageMap, setImageMap] = useState<Record<number, string>>({});

  const loadQuiz = () => {
    const { picked, imgs } = buildQuiz();
    setQuestions(picked);
    setImageMap(imgs);
    setIdx(0); setSelected(null); setAnswered(false); setScore(0); setShowConfetti(false);
    setPhase('quiz');
  };

  useEffect(() => { loadQuiz(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const current = questions[idx];

  const handleAnswer = (i: number) => {
    if (answered) return;
    setSelected(i); setAnswered(true);
    if (i === current.correct) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (idx + 1 >= questions.length) {
      if (score === questions.length) setShowConfetti(true);
      else setPhase('results');
    } else { setIdx(i => i + 1); setSelected(null); setAnswered(false); }
  };

  const newQuiz = () => { loadQuiz(); };

  if (showConfetti) return <ConfettiCelebration onDone={() => { setShowConfetti(false); setPhase('results'); }} />;

  if (!current) return null;

  if (phase === 'results') {
    const pct = Math.round((score / questions.length) * 100);
    const grade = pct === 100 ? 'Perfect Vision! 🎉' : pct >= 80 ? 'Sharp Eyes! ✨' : pct >= 60 ? 'Good Effort 💪' : 'Keep Practicing 📚';
    return (
      <div style={{ padding: '16px 20px' }}>
        <div style={{ fontWeight: 800, fontSize: 20, color: PT, marginBottom: 4 }}>Echo Images Results</div>
        <div style={{ fontSize: 12, color: PX, marginBottom: 20 }}>{questions.length} clips · new set each round</div>
        <div style={{ background: PS, border: `1.5px solid ${PB}`, borderRadius: 24, padding: 20, textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 52, fontWeight: 900, color: P, fontFamily: 'var(--font-space-mono), monospace', lineHeight: 1 }}>{pct}%</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: P, marginTop: 8 }}>{grade}</div>
          <div style={{ fontSize: 12, color: PX, marginTop: 4 }}>{score} of {questions.length} correct</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={newQuiz} style={{ width: '100%', padding: '14px', borderRadius: 18, background: P, color: 'white', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sora), sans-serif' }}>
            New Quiz →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontWeight: 800, fontSize: 20, color: PT }}>Echo Images</div>
        <span style={{ fontSize: 13, fontWeight: 700, color: PM, fontFamily: 'var(--font-space-mono), monospace' }}>{idx + 1} / {questions.length}</span>
      </div>
      <div style={{ height: 4, background: PL, borderRadius: 3, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ height: '100%', background: P, borderRadius: 3, width: `${(idx / questions.length) * 100}%`, transition: 'width 0.4s' }}/>
      </div>
      <div style={{ background: PS, border: `1.5px solid ${PB}`, borderRadius: 20, padding: '14px 14px 10px', marginBottom: 12, boxShadow: '0 2px 12px rgba(224,122,143,0.08)' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: PT, lineHeight: 1.5, marginBottom: 12 }}>{current.question}</div>
        <EchoClipDisplay src={imageMap[idx] ?? ''} category={current.imageCategory} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {current.options.map((opt, i) => {
          let bg = PS, border = PB, col = PT;
          if (answered) {
            if (i === current.correct) { bg = '#f0fdf4'; border = '#86efac'; col = '#166534'; }
            else if (i === selected) { bg = '#fef2f2'; border = '#fca5a5'; col = '#991b1b'; }
            else col = PX;
          }
          return (
            <button key={i} onClick={() => handleAnswer(i)} disabled={answered} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
              borderRadius: 16, border: `1.5px solid ${border}`, background: bg,
              textAlign: 'left', cursor: answered ? 'default' : 'pointer',
              transition: 'all 0.15s', fontFamily: 'var(--font-sora), sans-serif', width: '100%',
            }}>
              <span style={{ width: 24, height: 24, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, background: answered && i === current.correct ? '#22c55e' : answered && i === selected ? '#ef4444' : PL, color: answered && (i === current.correct || i === selected) ? 'white' : PX }}>
                {answered && i === current.correct ? '✓' : answered && i === selected ? '✗' : ['A','B','C','D'][i]}
              </span>
              <span style={{ fontSize: 13, color: col, lineHeight: 1.4 }}>{opt}</span>
            </button>
          );
        })}
      </div>
      {answered && (
        <div style={{ background: PL, border: `1.5px solid ${PB}`, borderRadius: 18, padding: '14px 16px', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 14 }}>{selected === current.correct ? '✅' : '❌'}</span>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: selected === current.correct ? '#166534' : '#991b1b' }}>
              {selected === current.correct ? 'Correct!' : `Incorrect — ${current.options[current.correct]}`}
            </span>
          </div>
          <div style={{ fontSize: 12, color: PM, lineHeight: 1.65, marginBottom: 10 }}>{renderText(current.explanation)}</div>
          <div style={{ background: PS, border: `1.5px solid ${PB}`, borderRadius: 12, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: P, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Echo Measurements</div>
            <div style={{ fontSize: 11, color: PM, lineHeight: 1.5 }}>{current.echoKey}</div>
          </div>
        </div>
      )}
      {answered && (
        <button onClick={handleNext} style={{ width: '100%', padding: '14px', borderRadius: 18, background: P, color: 'white', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sora), sans-serif' }}>
          {idx + 1 >= questions.length ? 'See Results' : 'Next Image →'}
        </button>
      )}
    </div>
  );
}

// ─── Materials Quiz ───────────────────────────────────────────────────────────
function MaterialsQuiz() {
  const { P, PL, PS, PB, PT, PM, PX } = useT();
  const mats = getMaterials();
  const [selectedMatId, setSelectedMatId] = useState<string>('all');
  const [quizStarted, setQuizStarted] = useState(false);

  const buildQ = (matId: string) => {
    const pool = matId === 'all'
      ? mats.flatMap(m => m.quizQuestions.map(q => ({ question: q.question, options: q.options, correct: q.correctIndex, explanation: q.explanation, source: m.title })))
      : (mats.find(m => m.id === matId)?.quizQuestions ?? []).map(q => ({ question: q.question, options: q.options, correct: q.correctIndex, explanation: q.explanation, source: mats.find(m => m.id === matId)!.title }));
    return shuffleArray(pool).slice(0, 5).map(q => ({ ...shuffleOptions(q), source: q.source }));
  };

  const [questions, setQuestions] = useState<ReturnType<typeof buildQ>>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<'setup' | 'quiz' | 'results'>('setup');
  const [showConfetti, setShowConfetti] = useState(false);

  if (mats.length === 0) {
    return (
      <div style={{ padding: '16px 20px' }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: PT, marginBottom: 8 }}>My Materials Quiz</div>
        <div style={{ fontSize: 13, color: PX }}>Upload study materials from the Home screen to generate quiz questions.</div>
      </div>
    );
  }

  if (phase === 'setup') {
    return (
      <div style={{ padding: '16px 20px' }}>
        <div style={{ fontWeight: 800, fontSize: 20, color: PT, marginBottom: 4 }}>My Materials</div>
        <div style={{ fontSize: 12, color: PX, marginBottom: 20 }}>Choose which upload to quiz on:</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          <button
            onClick={() => setSelectedMatId('all')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 16, border: `2px solid ${selectedMatId === 'all' ? P : PB}`, background: selectedMatId === 'all' ? `${P}12` : PS, cursor: 'pointer', fontFamily: 'var(--font-sora), sans-serif', textAlign: 'left' }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: PT }}>All Uploads</div>
              <div style={{ fontSize: 11, color: PX, marginTop: 2 }}>{mats.reduce((n, m) => n + m.quizQuestions.length, 0)} questions total</div>
            </div>
            {selectedMatId === 'all' && <span style={{ color: P, fontSize: 18 }}>✓</span>}
          </button>
          {mats.map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedMatId(m.id)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 16, border: `2px solid ${selectedMatId === m.id ? P : PB}`, background: selectedMatId === m.id ? `${P}12` : PS, cursor: 'pointer', fontFamily: 'var(--font-sora), sans-serif', textAlign: 'left' }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: PT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</div>
                <div style={{ fontSize: 11, color: PX, marginTop: 2 }}>{m.quizQuestions.length} questions · {new Date(m.uploadedAt).toLocaleDateString()}</div>
              </div>
              {selectedMatId === m.id && <span style={{ color: P, fontSize: 18, flexShrink: 0, marginLeft: 8 }}>✓</span>}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setQuestions(buildQ(selectedMatId)); setIdx(0); setSelected(null); setAnswered(false); setScore(0); setPhase('quiz'); }}
          style={{ width: '100%', padding: '14px', borderRadius: 18, background: P, color: 'white', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sora), sans-serif' }}
        >
          Start Quiz →
        </button>
      </div>
    );
  }

  const current = questions[idx];
  const handleAnswer = (i: number) => {
    if (answered) return;
    setSelected(i); setAnswered(true);
    if (i === current.correct) setScore(s => s + 1);
  };
  const handleNext = () => {
    if (idx + 1 >= questions.length) {
      if (score === questions.length) setShowConfetti(true); else setPhase('results');
    } else { setIdx(i => i + 1); setSelected(null); setAnswered(false); }
  };
  const reset = () => { setIdx(0); setSelected(null); setAnswered(false); setScore(0); setPhase('setup'); setShowConfetti(false); };

  if (showConfetti) return <ConfettiCelebration onDone={() => { setShowConfetti(false); setPhase('results'); }} />;

  if (!current) return null;

  if (phase === 'results') {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div style={{ padding: '16px 20px' }}>
        <div style={{ fontWeight: 800, fontSize: 20, color: PT, marginBottom: 4 }}>My Materials Results</div>
        <div style={{ background: PS, border: `1.5px solid ${PB}`, borderRadius: 24, padding: 20, textAlign: 'center', marginBottom: 20, marginTop: 16 }}>
          <div style={{ fontSize: 52, fontWeight: 900, color: P, fontFamily: 'var(--font-space-mono), monospace', lineHeight: 1 }}>{pct}%</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: pct >= 80 ? '#22c55e' : P, marginTop: 8 }}>{pct === 100 ? 'Perfect! 🎉' : pct >= 80 ? 'Great work! ✨' : pct >= 60 ? 'Good effort 💪' : 'Keep studying 📚'}</div>
          <div style={{ fontSize: 12, color: PX, marginTop: 4 }}>{score} of {questions.length} correct</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={() => { setQuestions(buildQ(selectedMatId)); setIdx(0); setSelected(null); setAnswered(false); setScore(0); setPhase('quiz'); setShowConfetti(false); }} style={{ width: '100%', padding: '14px', borderRadius: 18, background: P, color: 'white', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sora), sans-serif' }}>
            New Quiz →
          </button>
          <button onClick={reset} style={{ width: '100%', padding: '14px', borderRadius: 18, background: 'transparent', color: PM, border: `1.5px solid ${PB}`, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sora), sans-serif' }}>
            Change Topic
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ fontWeight: 800, fontSize: 20, color: PT }}>My Materials</div>
        <span style={{ fontSize: 13, fontWeight: 700, color: PM, fontFamily: 'var(--font-space-mono), monospace' }}>{idx + 1} / {questions.length}</span>
      </div>
      <div style={{ fontSize: 10, color: PX, marginBottom: 10 }}>from: {current.source}</div>
      <div style={{ height: 4, background: PL, borderRadius: 3, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ height: '100%', background: P, borderRadius: 3, width: `${(idx / questions.length) * 100}%`, transition: 'width 0.4s' }}/>
      </div>
      <div style={{ background: PS, border: `1.5px solid ${PB}`, borderRadius: 20, padding: '14px 16px', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: PT, lineHeight: 1.5 }}>{current.question}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {current.options.map((opt, i) => {
          let bg = PS, border = PB, col = PT;
          if (answered) {
            if (i === current.correct) { bg = '#f0fdf4'; border = '#86efac'; col = '#166534'; }
            else if (i === selected) { bg = '#fef2f2'; border = '#fca5a5'; col = '#991b1b'; }
            else col = PX;
          }
          return (
            <button key={i} onClick={() => handleAnswer(i)} disabled={answered} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 16, border: `1.5px solid ${border}`, background: bg, textAlign: 'left', cursor: answered ? 'default' : 'pointer', transition: 'all 0.15s', fontFamily: 'var(--font-sora), sans-serif', width: '100%' }}>
              <span style={{ width: 24, height: 24, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, background: answered && i === current.correct ? '#22c55e' : answered && i === selected ? '#ef4444' : PL, color: answered && (i === current.correct || i === selected) ? 'white' : PX }}>
                {answered && i === current.correct ? '✓' : answered && i === selected ? '✗' : ['A','B','C','D'][i]}
              </span>
              <span style={{ fontSize: 13, color: col, lineHeight: 1.4 }}>{opt}</span>
            </button>
          );
        })}
      </div>
      {answered && (
        <div style={{ background: PL, border: `1.5px solid ${PB}`, borderRadius: 18, padding: '12px 14px', marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: PM, lineHeight: 1.6 }}>{renderText(current.explanation)}</div>
        </div>
      )}
      {answered && (
        <button onClick={handleNext} style={{ width: '100%', padding: '14px', borderRadius: 18, background: P, color: 'white', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sora), sans-serif' }}>
          {idx + 1 >= questions.length ? 'See Results' : 'Next →'}
        </button>
      )}
    </div>
  );
}

// ─── Heart Sounds Section ─────────────────────────────────────────────────────
function HeartSoundsSection() {
  const { P, PL, PS, PB, PT, PM, PX } = useT();
  const [questions, setQuestions] = useState(() => shuffleArray(HEART_SOUNDS_QUIZ).slice(0, 5).map(shuffleOptions));
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<'quiz' | 'results'>('quiz');
  const [played, setPlayed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  const current = questions[idx];

  const handlePlay = () => {
    if (playing) return;
    setPlaying(true); setPlayed(true);
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null; }
    const url = generateHeartSoundUrl(current.id);
    blobUrlRef.current = url;
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => setPlaying(false);
    audio.onerror = () => setPlaying(false);
    audio.play().catch(() => setPlaying(false));
  };

  const handleAnswer = (i: number) => {
    if (answered || !played) return;
    setSelected(i); setAnswered(true);
    if (i === current.correct) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (idx + 1 >= questions.length) {
      if (score === questions.length) setShowConfetti(true);
      else setPhase('results');
    } else {
      setIdx(i => i + 1);
      setSelected(null); setAnswered(false); setPlayed(false); setPlaying(false);
    }
  };

  const newQuiz = () => {
    setQuestions(shuffleArray(HEART_SOUNDS_QUIZ).slice(0, 5).map(shuffleOptions));
    setIdx(0); setSelected(null); setAnswered(false);
    setScore(0); setPhase('quiz'); setPlayed(false); setPlaying(false); setShowConfetti(false);
  };

  if (showConfetti) return <ConfettiCelebration onDone={() => { setShowConfetti(false); setPhase('results'); }} />;

  if (phase === 'results') {
    const pct = Math.round((score / questions.length) * 100);
    const grade = pct === 100 ? 'Perfect Ear! 🎉' : pct >= 80 ? 'Great Listening! ✨' : pct >= 60 ? 'Good Effort 💪' : 'Keep Practicing 📚';
    const gradeColor = pct === 100 ? '#22c55e' : pct >= 80 ? P : pct >= 60 ? '#f59e0b' : PX;
    return (
      <div style={{ padding: '16px 20px 100px' }}>
        <div style={{ fontWeight: 800, fontSize: 20, color: PT, marginBottom: 4 }}>Heart Sounds Results</div>
        <div style={{ fontSize: 12, color: PX, marginBottom: 20 }}>{questions.length} sounds · new set each round</div>
        <div style={{ background: PS, border: `1.5px solid ${PB}`, borderRadius: 24, padding: 20, textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 52, fontWeight: 900, color: P, fontFamily: 'var(--font-space-mono), monospace', lineHeight: 1 }}>{pct}%</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: gradeColor, marginTop: 8 }}>{grade}</div>
          <div style={{ fontSize: 12, color: PX, marginTop: 4 }}>{score} of {questions.length} identified correctly</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={newQuiz} style={{ width: '100%', padding: '14px', borderRadius: 18, background: P, color: 'white', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sora), sans-serif' }}>
            New Quiz →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 20px 100px' }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontWeight: 800, fontSize: 20, color: PT }}>Heart Sounds</div>
          <span style={{ fontSize: 13, fontWeight: 700, color: PM, fontFamily: 'var(--font-space-mono), monospace' }}>{idx + 1} / {questions.length}</span>
        </div>
        <div style={{ height: 4, background: PL, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: P, borderRadius: 3, width: `${(idx / questions.length) * 100}%`, transition: 'width 0.4s' }}/>
        </div>
      </div>

      {/* Question */}
      <div style={{ background: PS, border: `1.5px solid ${PB}`, borderRadius: 20, padding: '16px', marginBottom: 14, boxShadow: '0 2px 12px rgba(224,122,143,0.08)' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: PT, lineHeight: 1.5, marginBottom: 14 }}>{current.question}</div>
        {/* Phonocardiogram */}
        <div style={{ background: PL, borderRadius: 12, padding: '10px 8px 4px', marginBottom: 14 }}>
          <HeartSoundPCG id={current.id} />
        </div>
        {/* Play button */}
        <button
          onClick={handlePlay}
          disabled={playing}
          style={{
            width: '100%', padding: '12px', borderRadius: 14,
            background: playing ? PL : P, border: `1.5px solid ${playing ? PB : P}`,
            color: playing ? PM : 'white', fontSize: 14, fontWeight: 700, cursor: playing ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: 'var(--font-sora), sans-serif', transition: 'all 0.2s',
          }}
        >
          {playing ? (
            <><span style={{ display: 'inline-block', animation: 'pulse 0.6s infinite' }}>🔊</span> Playing...</>
          ) : played ? '🔄 Replay Sound' : '▶ Play Sound'}
        </button>
        {!played && (
          <div style={{ fontSize: 11, color: PX, textAlign: 'center', marginTop: 8 }}>Listen before answering</div>
        )}
      </div>

      {/* Answer options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {current.options.map((opt, i) => {
          let bg = PS, border = PB, col = PT;
          if (answered) {
            if (i === current.correct) { bg = '#f0fdf4'; border = '#86efac'; col = '#166534'; }
            else if (i === selected) { bg = '#fef2f2'; border = '#fca5a5'; col = '#991b1b'; }
            else col = PX;
          } else if (!played) {
            bg = PL; col = PX; // greyed out until played
          }
          return (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              disabled={answered || !played}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                borderRadius: 16, border: `1.5px solid ${border}`, background: bg,
                textAlign: 'left', cursor: (answered || !played) ? 'default' : 'pointer',
                transition: 'all 0.15s', fontFamily: 'var(--font-sora), sans-serif', width: '100%',
              }}
            >
              <span style={{
                width: 24, height: 24, borderRadius: 8, flexShrink: 0, display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                background: answered && i === current.correct ? '#22c55e'
                  : answered && i === selected ? '#ef4444' : PL,
                color: answered && (i === current.correct || i === selected) ? 'white' : PX,
              }}>
                {answered && i === current.correct ? '✓' : answered && i === selected ? '✗' : ['A','B','C','D'][i]}
              </span>
              <span style={{ fontSize: 13, color: col, lineHeight: 1.4 }}>{opt}</span>
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {answered && (
        <div style={{ background: PL, border: `1.5px solid ${PB}`, borderRadius: 18, padding: '14px 16px', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 14 }}>{selected === current.correct ? '✅' : '❌'}</span>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: selected === current.correct ? '#166534' : '#991b1b' }}>
              {selected === current.correct ? 'Correct!' : `Incorrect — ${current.name}`}
            </span>
          </div>
          <div style={{ fontSize: 12, color: PM, lineHeight: 1.65, marginBottom: 10 }}>{renderText(current.explanation)}</div>
          <div style={{ background: PS, border: `1.5px solid ${PB}`, borderRadius: 12, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: P, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Echo Correlate</div>
            <div style={{ fontSize: 11, color: PM, lineHeight: 1.5 }}>{current.echoKey}</div>
          </div>
        </div>
      )}

      {answered && (
        <button onClick={handleNext} style={{ width: '100%', padding: '14px', borderRadius: 18, background: P, color: 'white', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sora), sans-serif' }}>
          {idx + 1 >= questions.length ? 'See Results' : 'Next Sound →'}
        </button>
      )}
    </div>
  );
}

// ─── Progress Section ─────────────────────────────────────────────────────────
function ProgressSection() {
  const { P, PD, PL, PS, PB, PT, PM, PX } = useT();
  const [stats, setStats] = useState({ streak: 0, flashcardsStudied: 0, quizzesTaken: 0, bestScore: 0, casesReviewed: [] as string[] });
  const [bars, setBars] = useState({ cards: 0, cases: 0, best: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const s = getStats();
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    let streak = s.streak || 0;
    if (s.lastStudied !== today && s.lastStudied !== yesterday) streak = 0;
    let bestScore = s.bestScore || 0;
    try {
      const bs = localStorage.getItem('sonata-best-overall');
      if (bs) bestScore = Math.max(bestScore, parseInt(bs, 10));
    } catch {}
    const data = { streak, flashcardsStudied: s.flashcardsStudied || 0, quizzesTaken: s.quizzesTaken || 0, bestScore, casesReviewed: s.casesReviewed || [] };
    setStats(data);
    setTimeout(() => {
      const totalCards = preloadedFlashcards.length;
      setBars({
        cards: Math.min(100, Math.round((data.flashcardsStudied / totalCards) * 100)),
        cases: Math.min(100, Math.round((data.casesReviewed.length / caseStudies.length) * 100)),
        best: data.bestScore,
      });
    }, 100);
  }, []);

  const achievements = [
    { emoji: '🌟', label: 'First Card', desc: 'Study your first flashcard', unlocked: stats.flashcardsStudied >= 1 },
    { emoji: '📚', label: 'Dedicated', desc: 'Study 10 flashcards', unlocked: stats.flashcardsStudied >= 10 },
    { emoji: '🎯', label: 'Quiz Taker', desc: 'Complete your first quiz', unlocked: stats.quizzesTaken >= 1 },
    { emoji: '🏆', label: 'High Scorer', desc: 'Score 80%+ on a quiz', unlocked: stats.bestScore >= 80 },
    { emoji: '🔥', label: 'On a Roll', desc: 'Maintain a 3-day streak', unlocked: stats.streak >= 3 },
    { emoji: '🩺', label: 'Clinician', desc: 'Review all case studies', unlocked: stats.casesReviewed.length >= caseStudies.length },
  ];

  const StatBar = ({ label, val, color = P }: { label: string; val: number; color?: string }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: PM }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 800, color, fontFamily: 'var(--font-space-mono), monospace' }}>{val}%</span>
      </div>
      <div style={{ height: 7, background: PL, borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: color, borderRadius: 4, width: `${val}%`, transition: 'width 0.7s ease-out' }}/>
      </div>
    </div>
  );

  if (!mounted) return null;

  return (
    <div style={{ padding: '16px 20px 100px' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 800, fontSize: 20, color: PT }}>My Progress</div>
        <div style={{ fontSize: 12, color: PX, marginTop: 4 }}>Your study journey so far</div>
      </div>

      {/* Big stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          { val: stats.streak, label: 'Day Streak', emoji: '🔥' },
          { val: stats.bestScore > 0 ? `${stats.bestScore}%` : '—', label: 'Best Score', emoji: '🏆' },
          { val: stats.flashcardsStudied, label: 'Cards Studied', emoji: '🃏' },
          { val: stats.quizzesTaken, label: 'Quizzes Done', emoji: '🎯' },
        ].map((item, i) => (
          <div key={i} style={{ background: PS, border: `1.5px solid ${PB}`, borderRadius: 18, padding: '14px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{item.emoji}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: P, fontFamily: 'var(--font-space-mono), monospace', lineHeight: 1 }}>{item.val}</div>
            <div style={{ fontSize: 11, color: PX, fontWeight: 600, marginTop: 4 }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Progress bars */}
      <div style={{ background: PS, border: `1.5px solid ${PB}`, borderRadius: 20, padding: 18, marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: PX, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Study Coverage</div>
        <StatBar label={`Flashcards (${stats.flashcardsStudied}/${preloadedFlashcards.length})`} val={bars.cards} />
        <StatBar label={`Cases (${stats.casesReviewed.length}/${caseStudies.length})`} val={bars.cases} />
        <StatBar label="Best Quiz Score" val={bars.best} color={PD} />
      </div>

      {/* Achievements */}
      <div style={{ fontSize: 11, fontWeight: 700, color: PX, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Achievements</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {achievements.map((a, i) => (
          <div key={i} style={{
            background: a.unlocked ? PS : PL, border: `1.5px solid ${a.unlocked ? PB : '#ead3d8'}`,
            borderRadius: 16, padding: 14, textAlign: 'center', opacity: a.unlocked ? 1 : 0.5,
          }}>
            <div style={{ fontSize: 26, marginBottom: 6, filter: a.unlocked ? 'none' : 'grayscale(1)' }}>{a.emoji}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: a.unlocked ? PT : PX, marginBottom: 2 }}>{a.label}</div>
            <div style={{ fontSize: 10, color: PX, lineHeight: 1.3 }}>{a.desc}</div>
            {a.unlocked && <div style={{ fontSize: 10, color: P, fontWeight: 700, marginTop: 4 }}>✓ Unlocked</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function SonataApp() {
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState<Tab>('home');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (sess(UNLOCK_KEY) === 'true') setUnlocked(true);
    const checkTime = () => {
      const h = new Date().getHours();
      setIsDark(h >= 21 || h < 6);
    };
    checkTime();
    const timer = setInterval(checkTime, 60_000);
    return () => clearInterval(timer);
  }, []);

  const theme = isDark ? DARK_TOKENS : LIGHT_TOKENS;

  useEffect(() => {
    document.body.style.background = theme.PL;
    document.documentElement.style.background = theme.PL;
  }, [theme]);

  const navHeight = 62;
  const safeTop = `calc(${navHeight}px + env(safe-area-inset-top))`;

  return (
    <ThemeCtx.Provider value={theme}>
      {!unlocked ? (
        <PinScreen onUnlock={() => setUnlocked(true)} />
      ) : (
        <div style={{ minHeight: '100dvh', background: theme.PL, fontFamily: 'var(--font-sora), sans-serif', transition: 'background 0.4s' }}>
          <TopNav active={tab} onChange={t => setTab(t)} />
          <div style={{ paddingTop: safeTop }}>
            {tab === 'home' && <HomeSection onNav={setTab} />}
            {tab === 'cards' && <FlashcardsSection />}
            {tab === 'quiz' && <QuizSection />}
            {tab === 'cases' && <CasesSection />}
            {tab === 'guide' && <StudyGuideSection />}
            {tab === 'progress' && <ProgressSection />}
          </div>
          <A2HSBanner />
        </div>
      )}
    </ThemeCtx.Provider>
  );
}
