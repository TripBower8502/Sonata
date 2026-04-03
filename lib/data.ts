export interface Flashcard {
  id: string;
  front: string;
  back: string;
  category: string;
  normalValues?: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  subtitle: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  difficultyColor: string;
  icon: string;
  patient: string;
  history: string;
  echoFindings: string[];
  keyQuestion: string;
  diagnosis: string;
  teachingPoints: string[];
  systemPrompt: string;
}

export const ECHO_TOPICS = [
  'Cardiac Anatomy',
  '2D Echo Views',
  'M-Mode Echocardiography',
  'Doppler Techniques',
  'Valvular Disease',
  'Cardiomyopathies',
  'Pericardial Disease',
  'Congenital Heart Disease',
  'LV Function & EF',
  'RV Assessment',
];

export const preloadedFlashcards: Flashcard[] = [
  {
    id: 'ef-1',
    front: 'Ejection Fraction (EF)',
    back: "The percentage of blood pumped out of the left ventricle with each heartbeat. Calculated using Simpson's biplane method: EF = (EDV - ESV) / EDV × 100%. The gold standard for LV systolic function assessment.",
    category: 'LV Function',
    normalValues: 'Normal ≥55% | Mildly reduced 45–54% | Moderately reduced 30–44% | Severely reduced <30%',
  },
  {
    id: 'doppler-1',
    front: 'E/A Ratio',
    back: 'The ratio of early (E) to late (A) mitral valve inflow velocities measured by pulsed-wave Doppler. E = passive early filling, A = atrial contraction. Reflects diastolic function and left atrial pressure.',
    category: 'Doppler',
    normalValues: 'Normal: E/A 1–2 | Grade I DD: E/A <1 (reversal) | Grade III DD: E/A >2 (restrictive)',
  },
  {
    id: 'tamponade-1',
    front: 'Cardiac Tamponade Echo Signs',
    back: 'Pericardial effusion with: (1) RV diastolic collapse — most sensitive sign. (2) RA systolic collapse >1/3 of cardiac cycle. (3) IVC plethora (>2.1cm, <50% respiratory collapse). (4) Respiratory variation >25% in MV E wave, >40% in TV.',
    category: 'Pericardial Disease',
    normalValues: 'IVC normal: <2.1 cm with >50% inspiratory collapse (RAP 3 mmHg)',
  },
  {
    id: 'plax-1',
    front: 'Parasternal Long Axis (PLAX) View',
    back: 'Standard 2D view from left parasternal window, transducer at 3rd–4th intercostal space. Shows: LV (long axis), RV outflow, mitral valve, aortic valve, aortic root, and LA. Primary view for LV dimensions and M-mode measurements.',
    category: '2D Views',
    normalValues: 'LVEDD: 3.9–5.9 cm | IVS/LVPW: 0.6–1.0 cm | Ao root: <3.7 cm',
  },
  {
    id: 'rvsp-1',
    front: 'RVSP Calculation',
    back: 'Right ventricular systolic pressure estimated from tricuspid regurgitation jet velocity using the modified Bernoulli equation plus right atrial pressure (RAP). RVSP ≈ PASP in the absence of RVOT obstruction.',
    category: 'RV Assessment',
    normalValues: 'RVSP = 4(TRv)² + RAP | Normal RVSP <35 mmHg | RAP: IVC <2.1cm + >50% collapse = 3 mmHg',
  },
  {
    id: 'as-1',
    front: 'Severe Aortic Stenosis Criteria',
    back: 'Severe AS is defined by: Peak aortic jet velocity >4 m/s, Mean gradient >40 mmHg, AVA <1.0 cm², AVA index <0.6 cm²/m². Calculated by continuity equation: AVA = (LVOT area × LVOT VTI) / AV VTI.',
    category: 'Valvular Disease',
    normalValues: 'Normal AV peak velocity <2 m/s | Mild AS: 2–3 m/s | Moderate: 3–4 m/s | Severe: >4 m/s',
  },
  {
    id: 'hcm-1',
    front: 'Hypertrophic Cardiomyopathy (HCM)',
    back: 'Asymmetric septal hypertrophy (IVS >15mm or IVS/LVPW ratio >1.3). Key features: dynamic LVOT obstruction, systolic anterior motion (SAM) of mitral valve, dagger-shaped CW Doppler profile (late-peaking), preserved or hyperdynamic EF.',
    category: 'Cardiomyopathies',
    normalValues:
      'IVS normal ≤10mm | HCM diagnosis: IVS ≥15mm (or ≥13mm with family history) | Significant LVOTO: gradient ≥30 mmHg at rest or ≥50 mmHg provoked',
  },
  {
    id: 'tdi-1',
    front: 'Tissue Doppler Imaging (TDI)',
    back: "Measures myocardial velocities (cm/s) at the mitral annulus. e' (early diastolic velocity) reflects myocardial relaxation. E/e' ratio estimates LV filling pressures. S' wave reflects systolic function. Obtained at septal and lateral annulus.",
    category: 'Doppler',
    normalValues:
      "Septal e' ≥8 cm/s | Lateral e' ≥10 cm/s | E/e' average <14 (elevated >14) | Lateral S' ≥9 cm/s",
  },
];

export const caseStudies: CaseStudy[] = [
  {
    id: 'dcm',
    title: 'Dilated Cardiomyopathy',
    subtitle: '58-year-old male, progressive dyspnea',
    difficulty: 'Intermediate',
    difficultyColor: 'text-amber-500 bg-amber-50 border-amber-200',
    icon: '🫀',
    patient:
      '58-year-old male presenting with 3-month history of progressive dyspnea on exertion, orthopnea, and bilateral leg swelling. Past medical history: hypertension, type 2 diabetes. No prior cardiac history.',
    history:
      'NYHA Class III heart failure symptoms. BNP elevated at 1,240 pg/mL. CXR shows cardiomegaly and pulmonary vascular congestion.',
    echoFindings: [
      'LVEDD 7.2 cm (severely dilated)',
      'LVESD 6.1 cm',
      "EF 20% by Simpson's biplane",
      'Global hypokinesis — all walls affected',
      'Functional mitral regurgitation (moderate) — annular dilation',
      'LA severely dilated (volume index 48 mL/m²)',
      'E/A ratio 2.4 with DT 140 ms — restrictive filling pattern',
      "E/e' = 22 — elevated filling pressures",
      'RVSP 52 mmHg — moderate pulmonary hypertension',
      'TAPSE 14 mm — mildly reduced RV function',
    ],
    keyQuestion:
      'What is the most likely diagnosis and what echo finding best predicts prognosis in this patient?',
    diagnosis:
      'Non-ischemic dilated cardiomyopathy with severely reduced EF (20%) and restrictive filling pattern.',
    teachingPoints: [
      'Restrictive filling pattern (Grade III diastolic dysfunction) carries the worst prognosis in DCM',
      'Functional MR in DCM is due to annular dilation and papillary muscle displacement — not primary valve disease',
      'RVSP elevation and RV dysfunction indicate advanced disease and poor prognosis',
      'EF <35% with LBBB morphology: consider CRT (cardiac resynchronization therapy)',
      'Serial echo every 3–6 months to monitor response to GDMT (guideline-directed medical therapy)',
    ],
    systemPrompt:
      "You are an expert cardiologist and echocardiographer teaching a student about a case of dilated cardiomyopathy. The case: 58yo male, EF 20%, LVEDD 7.2cm, global hypokinesis, functional MR, restrictive filling (E/A 2.4, DT 140ms, E/e' 22), RVSP 52 mmHg, TAPSE 14mm. Answer questions clearly and educationally. Relate answers back to the specific echo findings in this case. Keep responses concise but thorough.",
  },
  {
    id: 'hocm',
    title: 'Hypertrophic Obstructive CM',
    subtitle: '34-year-old female, exertional syncope',
    difficulty: 'Advanced',
    difficultyColor: 'text-red-500 bg-red-50 border-red-200',
    icon: '⚡',
    patient:
      '34-year-old female athlete with exertional syncope and a harsh systolic murmur that increases with Valsalva. Family history: brother died suddenly at age 28.',
    history: 'No prior cardiac workup. ECG shows LVH with deep septal Q waves. Referred for echocardiogram.',
    echoFindings: [
      'IVS 22mm — severe asymmetric septal hypertrophy',
      'LVPW 11mm — posterior wall relatively spared',
      'IVS/LVPW ratio 2.0 — asymmetric pattern',
      'EF 75% — hyperdynamic',
      'Systolic anterior motion (SAM) of anterior MV leaflet',
      'LVOT gradient 85 mmHg at rest — severe obstruction',
      'Dagger-shaped CW Doppler LVOT profile (late peaking)',
      'Moderate mitral regurgitation — posteriorly directed (from SAM)',
      'LA moderately dilated',
      'No pericardial effusion',
    ],
    keyQuestion:
      'What is the mechanism of LVOT obstruction in this patient, and what maneuvers would increase vs. decrease the gradient?',
    diagnosis:
      'Hypertrophic obstructive cardiomyopathy (HOCM) with severe resting LVOT obstruction (85 mmHg) and SAM-related MR.',
    teachingPoints: [
      'SAM of the mitral valve causes dynamic LVOT obstruction — the anterior MV leaflet is pulled into the LVOT during systole by Venturi forces and flow drag',
      'Gradient INCREASES with: Valsalva, standing, dehydration, tachycardia, vasodilators',
      'Gradient DECREASES with: squatting, leg raise, beta-blockers, phenylephrine, increased preload',
      'Dagger-shaped (late-peaking) CW profile distinguishes HOCM from fixed LVOT obstruction',
      'MR in HOCM is posteriorly directed (opposite to typical degenerative MR) due to SAM mechanism',
      'Sudden cardiac death risk: consider ICD if prior cardiac arrest, family history SCD, massive hypertrophy (≥30mm), NSVT, abnormal BP response to exercise',
    ],
    systemPrompt:
      'You are an expert cardiologist teaching about a case of hypertrophic obstructive cardiomyopathy (HOCM). The case: 34yo female athlete with exertional syncope, IVS 22mm, EF 75%, SAM of MV, LVOT gradient 85 mmHg at rest, moderate posteriorly-directed MR, family history of sudden cardiac death. Focus on the dynamic obstruction mechanism, provocative maneuvers, and management. Be educational and relate answers to the specific findings.',
  },
  {
    id: 'endocarditis',
    title: 'Infective Endocarditis',
    subtitle: '45-year-old male, fever + new murmur',
    difficulty: 'Beginner',
    difficultyColor: 'text-emerald-500 bg-emerald-50 border-emerald-200',
    icon: '🔬',
    patient:
      '45-year-old male IV drug user presenting with 2-week fever, night sweats, and a new holosystolic murmur. Blood cultures positive for Staph aureus (2 of 2 bottles).',
    history:
      'Temperature 38.9°C. WBC 18,000. CRP elevated. No prior cardiac history. Referred for urgent echocardiogram.',
    echoFindings: [
      'Tricuspid valve: large oscillating vegetation (1.8 cm) on anterior leaflet',
      'Severe tricuspid regurgitation — flail leaflet component',
      'RA and RV moderately dilated',
      'RVSP 42 mmHg — mild pulmonary hypertension',
      'Aortic and mitral valves appear normal',
      'No perivalvular abscess identified on TTE (TEE recommended)',
      'No pericardial effusion',
      'TAPSE 18mm — preserved RV function',
      'LV size and function normal (EF 60%)',
    ],
    keyQuestion:
      'Which echo modality should be performed next, and what complications are you specifically looking for?',
    diagnosis:
      'Right-sided infective endocarditis (tricuspid valve) with large vegetation, likely secondary to IV drug use.',
    teachingPoints: [
      'Right-sided endocarditis is classic in IV drug users — tricuspid valve most commonly affected',
      'TEE is more sensitive than TTE for: perivalvular abscess (80–90% vs 30–50% sensitivity), small vegetations, prosthetic valve endocarditis',
      'Duke criteria: 2 major (positive blood cultures + echo evidence) = Definite IE',
      'Large vegetations (>10mm) carry higher embolic risk — but right-sided emboli go to lungs (septic pulmonary emboli), not systemic circulation',
      'Indications for surgery: heart failure, perivalvular extension/abscess, uncontrolled infection, large mobile vegetations with recurrent emboli',
      'TEE recommended for all cases of suspected IE to rule out complications not seen on TTE',
    ],
    systemPrompt:
      'You are an expert cardiologist and infectious disease specialist teaching about a case of right-sided infective endocarditis. The case: 45yo male IVDU, Staph aureus bacteremia, large TV vegetation (1.8cm), severe TR, flail leaflet, RVSP 42 mmHg. Focus on Duke criteria, echo modality selection (TTE vs TEE), surgical indications, and complications. Be educational and approachable.',
  },
];
