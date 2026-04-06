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
  // ── LV FUNCTION & EF ─────────────────────────────────────────────────────────
  {
    id: 'lv-1',
    front: 'What is Ejection Fraction (EF) and how is it calculated?',
    back: "EF is the percentage of blood ejected from the left ventricle with each heartbeat. Calculated as EF = (EDV − ESV) / EDV × 100%. The gold standard method is Simpson's biplane, which traces the LV cavity in both A4C and A2C views at end-diastole and end-systole — it does NOT assume LV geometry, making it more accurate than linear methods.",
    category: 'LV Function & EF',
    normalValues: 'Normal EF ≥55% | Mildly reduced 45–54% | Moderately reduced 30–44% | Severely reduced <30%',
  },
  {
    id: 'lv-2',
    front: 'What are the four grades of diastolic dysfunction and how are they distinguished?',
    back: 'Grade I (Impaired Relaxation): E/A <1, prolonged DT >200ms, normal filling pressures. Grade II (Pseudonormal): E/A 1–2, normal-looking but filling pressures are elevated — unmask with Valsalva (E/A drops) or TDI (E/e\' >14). Grade III (Restrictive): E/A >2, short DT <160ms, severely elevated filling pressures. Grade IV: Restrictive pattern that does NOT reverse with Valsalva (irreversible).',
    category: 'LV Function & EF',
    normalValues: "Normal E/A 1–2 | Septal e' ≥8 cm/s | Lateral e' ≥10 cm/s | E/e' average <14",
  },
  {
    id: 'lv-3',
    front: "What is E/e' ratio and why does it matter clinically?",
    back: "E/e' is the ratio of mitral inflow E wave velocity (pulsed-wave Doppler) to mitral annular e' velocity (Tissue Doppler). E reflects LV filling pressure; e' reflects myocardial relaxation (relatively load-independent). An elevated E/e' ratio estimates elevated LV filling pressures (left atrial hypertension), which correlates with dyspnea and heart failure symptoms. It's a key parameter in diastolic dysfunction grading.",
    category: 'LV Function & EF',
    normalValues: "E/e' average (septal + lateral / 2) <14 = normal LV filling | >14 = elevated filling pressures",
  },
  {
    id: 'lv-4',
    front: 'How is LV mass calculated and what does it indicate?',
    back: "LV mass is calculated from linear M-mode measurements using the ASE-corrected formula: LV mass = 0.8 × [1.04 × (LVID + IVS + LVPW)³ − LVID³] + 0.6g. Indexed to BSA gives LV Mass Index (LVMI). Elevated LVMI indicates LV hypertrophy (LVH), which is a strong independent predictor of cardiovascular events. LVH can be concentric (increased wall thickness, normal/reduced cavity) or eccentric (increased cavity with proportional wall thickening).",
    category: 'LV Function & EF',
    normalValues: 'Normal LVMI: ≤95 g/m² (women), ≤115 g/m² (men) | LVH: >95 g/m² (women), >115 g/m² (men)',
  },

  // ── DOPPLER TECHNIQUES ────────────────────────────────────────────────────────
  {
    id: 'dop-1',
    front: 'What is the modified Bernoulli equation and when is it used?',
    back: 'The modified Bernoulli equation (ΔP = 4v²) estimates the pressure gradient across a stenosis or regurgitant orifice using the peak velocity measured by CW Doppler. "v" is the peak velocity in m/s; ΔP is in mmHg. The simplified version (4v²) assumes the proximal velocity is negligible (<1 m/s). Used for: calculating RVSP (from TR jet), gradients across aortic or pulmonic stenosis, VSD pressure, and LVOT gradient in HOCM.',
    category: 'Doppler Techniques',
    normalValues: 'CW beam must be within 20° of flow direction | Velocity underestimation >10% if angle >20°',
  },
  {
    id: 'dop-2',
    front: 'What is the E/A ratio and how does it reflect diastolic function?',
    back: 'The E/A ratio compares early (E) passive mitral inflow velocity to late (A) atrial contraction velocity, measured by pulsed-wave Doppler at mitral valve tips. In normal diastolic function, the LV relaxes well → E > A (E/A 1–2). With impaired relaxation (Grade I DD), the LV is stiff → A > E (E/A < 1). With restrictive physiology (Grade III DD), high LA pressure forces early filling → very high E, low A (E/A > 2). Pseudonormal (Grade II) looks normal (E/A 1–2) but filling pressures are elevated.',
    category: 'Doppler Techniques',
    normalValues: 'Normal E/A: 1–2 | Grade I: E/A <1, DT >200ms | Grade II: E/A 1–2 (pseudonormal) | Grade III: E/A >2, DT <160ms',
  },
  {
    id: 'dop-3',
    front: 'What is Tissue Doppler Imaging (TDI) and what does it measure?',
    back: "TDI measures myocardial tissue velocities (cm/s) rather than blood flow velocities. It uses a low-velocity, high-amplitude filter at the mitral annulus. Key parameters: e' (early diastolic velocity) — reflects myocardial relaxation, relatively load-independent; a' (late diastolic, atrial contraction); S' (systolic velocity) — reflects LV/RV systolic function. Obtained at both septal and lateral mitral annulus. E/e' ratio estimates LV filling pressures.",
    category: 'Doppler Techniques',
    normalValues: "Septal e' ≥8 cm/s | Lateral e' ≥10 cm/s | Lateral S' ≥9 cm/s (RV function) | TAPSE ≥17mm",
  },
  {
    id: 'dop-4',
    front: 'What is the Nyquist limit and what causes aliasing in Doppler?',
    back: 'The Nyquist limit is half the pulse repetition frequency (PRF) and defines the maximum velocity pulsed-wave Doppler can measure without aliasing. When blood flow velocity exceeds the Nyquist limit, the signal wraps around — appearing on the opposite side of the baseline (aliasing). Higher PRF allows higher velocities but limits sample depth. Solutions: increase PRF, shift baseline, use continuous-wave Doppler (no aliasing limit), or use high PRF mode.',
    category: 'Doppler Techniques',
    normalValues: 'PW Doppler max: ~1–2 m/s (depth-dependent) | CW Doppler: no velocity limit | Color Doppler Nyquist: ~50–70 cm/s typical',
  },
  {
    id: 'dop-5',
    front: 'How is RVSP estimated using CW Doppler and what does it represent?',
    back: "RVSP is estimated from the peak tricuspid regurgitation (TR) jet velocity using the modified Bernoulli equation: RVSP = 4(TRv)² + RAP. RAP is estimated from IVC size and respiratory collapse. In the absence of RVOT obstruction or pulmonic stenosis, RVSP approximates Pulmonary Artery Systolic Pressure (PASP). This is the standard non-invasive screening tool for pulmonary hypertension.",
    category: 'Doppler Techniques',
    normalValues: 'Normal RVSP <35 mmHg | Borderline 35–50 mmHg | Elevated >50 mmHg | RAP: IVC <2.1cm + >50% collapse = 3 mmHg; IVC >2.1cm + <50% collapse = 15 mmHg',
  },

  // ── 2D ECHO VIEWS ─────────────────────────────────────────────────────────────
  {
    id: 'views-1',
    front: 'What structures are visualized in the Parasternal Long Axis (PLAX) view?',
    back: 'The PLAX view is obtained from the left parasternal window (3rd–4th ICS). It shows: LV long axis, RV outflow tract, interventricular septum (IVS), LV posterior wall, anterior mitral leaflet, posterior mitral leaflet, aortic valve (right and non-coronary cusps), aortic root, and left atrium. This is the primary view for measuring LV dimensions, wall thickness, and aortic root diameter by M-mode.',
    category: '2D Echo Views',
    normalValues: 'LVEDD: 3.9–5.3 cm (women), 4.2–5.9 cm (men) | IVS/LVPW: 0.6–1.0 cm | Ao root: <3.7 cm (women), <4.0 cm (men)',
  },
  {
    id: 'views-2',
    front: 'What are the five standard transthoracic echo windows and what does each show?',
    back: '1. Parasternal (PLAX, PSAX): LV dimensions, valves, RVOT. 2. Apical (A4C, A2C, A3C/APLAX, A5C): all four chambers, EF by Simpson\'s, mitral/tricuspid flow, LV apex. 3. Subcostal: IVC size/collapse, atrial septum, pericardial effusion, RV in difficult patients. 4. Suprasternal: aortic arch, descending aorta, coarctation. 5. Right parasternal: useful for CW Doppler in aortic stenosis when flow is better aligned.',
    category: '2D Echo Views',
    normalValues: 'Standard complete echo: minimum of 2D, M-mode, PW/CW Doppler, color flow mapping in all windows',
  },
  {
    id: 'views-3',
    front: 'What is the Parasternal Short Axis (PSAX) view and what levels are imaged?',
    back: 'The PSAX view rotates the probe 90° from PLAX, giving cross-sectional circular views of the heart. Key levels: (1) Aortic valve level — shows all 3 AV cusps (Mercedes-Benz sign), pulmonic valve, RVOT, tricuspid valve, LA, interatrial septum. (2) Mitral valve level — shows "fish-mouth" MV opening, LV walls. (3) Papillary muscle level — shows anterolateral and posteromedial papillary muscles; used for segmental wall motion. (4) Apical level — thin-walled apex.',
    category: '2D Echo Views',
    normalValues: 'PSAX at PM level: 6 LV wall segments visible (anterior, anterolateral, inferolateral, inferior, inferoseptal, anteroseptal)',
  },

  // ── VALVULAR DISEASE ──────────────────────────────────────────────────────────
  {
    id: 'valve-1',
    front: 'What are the Doppler criteria for severe aortic stenosis?',
    back: 'Severe AS is defined by: Peak aortic jet velocity >4 m/s, Mean gradient >40 mmHg, Aortic Valve Area (AVA) <1.0 cm², Indexed AVA <0.6 cm²/m². The continuity equation calculates AVA: AVA = (LVOT area × LVOT VTI) / AV VTI. The dimensionless index (LVOT VTI / AV VTI) >0.25 suggests mild AS; <0.25 suggests severe. Low-flow, low-gradient severe AS can occur with reduced EF (paradoxical if EF preserved).',
    category: 'Valvular Disease',
    normalValues: 'Normal AV peak velocity <2 m/s | Mild AS: 2–3 m/s | Moderate: 3–4 m/s, gradient 20–40 mmHg | Severe: >4 m/s, >40 mmHg, AVA <1.0 cm²',
  },
  {
    id: 'valve-2',
    front: 'How is the continuity equation used to calculate Aortic Valve Area?',
    back: 'The continuity equation is based on conservation of flow: what goes in must come out. AVA = (CSA_LVOT × VTI_LVOT) / VTI_AV. Step 1: Measure LVOT diameter (parasternal view) → CSA = π(D/2)². Step 2: Record LVOT VTI with PW Doppler (apical view, sample just below AV). Step 3: Record AV VTI with CW Doppler (best aligned view — often right parasternal). This accounts for the fact that a calcified AV accelerates a low-velocity LVOT flow to a high-velocity jet.',
    category: 'Valvular Disease',
    normalValues: 'Normal AVA: 3–4 cm² | Mild AS: >1.5 cm² | Moderate: 1.0–1.5 cm² | Severe: <1.0 cm²',
  },
  {
    id: 'valve-3',
    front: 'What are the echo criteria for severe mitral regurgitation?',
    back: 'Severe MR criteria (≥3 of the following): Vena contracta width ≥0.7 cm, EROA ≥0.4 cm² (by PISA), Regurgitant volume ≥60 mL, Regurgitant fraction ≥50%, Dense CW Doppler MR jet (as dense as forward flow), Systolic flow reversal in pulmonary veins, Enlarged LA and LV (volume overload). Qualitative color jet area >40% of LA suggests severe, but is not reliable alone. Mechanism: degenerative (prolapse/flail), functional (annular dilation), rheumatic.',
    category: 'Valvular Disease',
    normalValues: 'Normal MV annulus <3.5 cm | Vena contracta <0.3 cm = mild MR | ≥0.7 cm = severe MR | EROA <0.2 cm² = mild | ≥0.4 cm² = severe',
  },
  {
    id: 'valve-4',
    front: 'What is the PISA method and how is it used to quantify regurgitation?',
    back: 'PISA (Proximal Isovelocity Surface Area) assumes that blood accelerates toward a regurgitant orifice in concentric hemispheres of increasing velocity. At the aliasing boundary (Nyquist limit), the hemisphere radius (r) can be measured. EROA = 2πr² × V_alias / V_peak. Regurgitant Volume = EROA × VTI_MR. For MR: shift baseline toward MR jet direction to increase PISA radius. Works best for central, non-eccentric jets. Less reliable for eccentric or multiple jets.',
    category: 'Valvular Disease',
    normalValues: 'PISA radius for MR: <0.4 cm = mild | 0.4–0.9 cm = moderate | >0.9 cm = severe | EROA ≥0.4 cm² = severe MR',
  },

  // ── PERICARDIAL DISEASE ───────────────────────────────────────────────────────
  {
    id: 'peri-1',
    front: 'What are the echocardiographic signs of cardiac tamponade?',
    back: 'Echo signs of tamponade (all due to elevated pericardial pressure): (1) Pericardial effusion (the cause). (2) RV diastolic collapse — most specific sign; seen when pericardial pressure > RV diastolic pressure. (3) RA systolic collapse lasting >1/3 of the cardiac cycle — most sensitive. (4) IVC plethora: dilated IVC >2.1 cm with <50% inspiratory collapse (elevated RAP). (5) Respiratory variation: >25% in MV E wave, >40% in TV E wave — reflects "pulsus paradoxus" on echo.',
    category: 'Pericardial Disease',
    normalValues: 'Small effusion: <0.5 cm | Moderate: 0.5–2 cm | Large: >2 cm | Tamponade is clinical + echo diagnosis',
  },
  {
    id: 'peri-2',
    front: 'How does constrictive pericarditis differ from restrictive cardiomyopathy on echocardiography?',
    back: 'Both show restrictive filling (E/A >2, short DT). Key differentiators: (1) Septal motion: "septal bounce" or "septal shift" on respiration = constrictive. (2) TDI e\': elevated (≥8 cm/s) in constrictive (pericardial, not myocardial disease); reduced in restrictive. (3) Respiratory variation: >25% in mitral E wave = constrictive (not seen in restrictive). (4) Hepatic veins: expiratory diastolic flow reversal = constrictive. (5) Pericardial thickening on CT/CMR: >4mm suggests constrictive. E/e\' is paradoxically low-normal in constriction.',
    category: 'Pericardial Disease',
    normalValues: 'Constrictive e\' ≥8 cm/s | Restrictive e\' <8 cm/s | Pericardial thickness >4mm on CT suggests constriction',
  },

  // ── CARDIOMYOPATHIES ──────────────────────────────────────────────────────────
  {
    id: 'cm-1',
    front: 'What are the diagnostic echocardiographic criteria for Hypertrophic Cardiomyopathy (HCM)?',
    back: 'HCM: unexplained LV wall thickness ≥15 mm (or ≥13 mm with family history of HCM) in the absence of another cause. Key features: asymmetric septal hypertrophy (ASH) most common — IVS/LVPW ratio >1.3; preserved or hyperdynamic EF (often >65%); small LV cavity; SAM of anterior MV leaflet (see next card); dynamic LVOT obstruction; dagger-shaped CW Doppler LVOT profile (late-peaking, unlike fixed obstruction). Genetic: autosomal dominant, sarcomere protein mutations (most common: MYH7, MYBPC3).',
    category: 'Cardiomyopathies',
    normalValues: 'IVS normal ≤10 mm (women) ≤11 mm (men) | HCM: ≥15 mm (or ≥13 mm + family history) | Significant LVOTO: gradient ≥30 mmHg rest or ≥50 mmHg provoked',
  },
  {
    id: 'cm-2',
    front: 'What is Systolic Anterior Motion (SAM) and how does it cause LVOT obstruction?',
    back: 'SAM is the abnormal anterior movement of the mitral valve (usually the anterior leaflet) into the LVOT during systole. Mechanism: (1) Venturi forces from high-velocity LVOT flow pull the MV anteriorly; (2) Flow drag; (3) Malposition of papillary muscles. SAM contacts the IVS → dynamic LVOT obstruction. The gradient increases with anything that reduces LV volume (Valsalva, standing, tachycardia, dehydration, vasodilators) and decreases with increased preload (squatting, leg raise, beta-blockers). MR from SAM is posteriorly directed.',
    category: 'Cardiomyopathies',
    normalValues: 'LVOT gradient: normal <30 mmHg | Significant obstruction: ≥30 mmHg at rest | Severe: ≥50 mmHg (threshold for intervention)',
  },
  {
    id: 'cm-3',
    front: 'What are the echocardiographic features of Dilated Cardiomyopathy (DCM)?',
    back: 'DCM: dilated LV (LVEDD >5.9 cm men, >5.3 cm women) with globally reduced EF (<50%). Features: spherical LV remodeling (sphericity index approaches 1); thinned LV walls despite dilation; global hypokinesis (all walls equally affected — unlike ischemic where regional abnormalities are expected); functional MR (annular dilation + papillary displacement → leaflet tethering, central jet); dilated LA (due to MR and elevated filling pressures); restricted filling pattern (Grade III DD) indicates poor prognosis; RV dilation and dysfunction in advanced disease.',
    category: 'Cardiomyopathies',
    normalValues: 'LVEDD >5.9 cm (men) or >5.3 cm (women) | EF <40% for GDMT (ICD/CRT indications) | EF <35% + LBBB = CRT indication',
  },

  // ── RV ASSESSMENT ─────────────────────────────────────────────────────────────
  {
    id: 'rv-1',
    front: 'How is RV systolic function assessed echocardiographically?',
    back: "Multiple parameters are recommended (no single gold standard): (1) TAPSE (Tricuspid Annular Plane Systolic Excursion): M-mode at lateral tricuspid annulus — measures longitudinal RV shortening. (2) RV S' by TDI: tissue Doppler velocity at RV free wall lateral tricuspid annulus. (3) FAC (Fractional Area Change): (RV end-diastolic area − RV end-systolic area) / RV end-diastolic area × 100% — from RV-focused A4C view. (4) RVEF by 3D echo (most accurate). (5) Qualitative assessment: visual estimation of RV wall motion.",
    category: 'RV Assessment',
    normalValues: 'TAPSE ≥17 mm (abnormal <17 mm) | RV S\' ≥9.5 cm/s (abnormal <9.5 cm/s) | FAC ≥35% (abnormal <35%) | RV:LV ratio <1.0 (dilatation if >1.0)',
  },
  {
    id: 'rv-2',
    front: 'What is TAPSE and what does an abnormal value indicate?',
    back: "TAPSE (Tricuspid Annular Plane Systolic Excursion) measures the excursion of the tricuspid annular plane toward the cardiac apex in systole using M-mode. Since the RV predominantly contracts longitudinally, TAPSE reflects RV longitudinal systolic function. It's simple, reproducible, and widely validated. A TAPSE <17 mm indicates RV systolic dysfunction and is associated with worse outcomes in heart failure, pulmonary hypertension, and pulmonary embolism. Limitation: it's a 1D measure and may miss focal RV dysfunction.",
    category: 'RV Assessment',
    normalValues: 'Normal TAPSE ≥17 mm | Mild dysfunction 14–16 mm | Moderate <14 mm | In PE: TAPSE <16 mm + McConnell sign suggests high-risk',
  },

  // ── CARDIAC ANATOMY ───────────────────────────────────────────────────────────
  {
    id: 'anat-1',
    front: 'What are the normal dimensions of the cardiac chambers on echocardiography?',
    back: "Key normal ranges (all from ASE guidelines): LV: LVEDD 4.2–5.9 cm (men), 3.9–5.3 cm (women); LVESD <3.9 cm; IVS and LVPW 0.6–1.0 cm. LA: LA diameter <4.0 cm; LA volume index (LAVI) <34 mL/m². RA: RA minor axis <4.4 cm. RV: RV basal diameter <4.1 cm (RV-focused A4C). Aortic root: <3.7 cm (women), <4.0 cm (men). IVC: <2.1 cm with >50% inspiratory collapse (normal RAP = 3 mmHg).",
    category: 'Cardiac Anatomy',
    normalValues: 'LVEDD: men ≤5.9 cm, women ≤5.3 cm | LAVI ≤34 mL/m² | RA minor ≤4.4 cm | RV basal ≤4.1 cm | Ao root ≤4.0 cm (men)',
  },
  {
    id: 'anat-2',
    front: 'What is Left Atrial Volume Index (LAVI) and why is it important?',
    back: "LAVI is the left atrial volume normalized to body surface area (BSA), measured by the biplane area-length or Simpson's method from A4C and A2C views at end-systole (LA maximum size). LAVI is a marker of chronic LV diastolic dysfunction — the LA enlarges over time in response to elevated filling pressures (chronic LA pressure overload). It's called the 'atrial memory' or 'HbA1c of diastolic dysfunction.' Elevated LAVI is also associated with increased AF risk and is an independent predictor of cardiovascular events.",
    category: 'Cardiac Anatomy',
    normalValues: 'Normal LAVI ≤34 mL/m² | Mildly enlarged 35–41 mL/m² | Moderately 42–48 mL/m² | Severely enlarged >48 mL/m²',
  },

  // ── M-MODE ────────────────────────────────────────────────────────────────────
  {
    id: 'mmode-1',
    front: 'What is M-mode echocardiography and what are its clinical advantages?',
    back: "M-mode (Motion-mode) records a single-beam ultrasound line over time, displayed as amplitude vs. time. Despite being 1-dimensional, it has excellent temporal resolution (1,000+ frames/sec). Clinical uses: (1) Measuring LV wall thickness and cavity dimensions (PLAX view). (2) Calculating Fractional Shortening and EF (linear method). (3) TAPSE for RV function. (4) Detecting SAM of mitral valve. (5) Measuring aortic root motion. (6) E-point septal separation (EPSS) — estimates EF: >1 cm suggests reduced EF. Limitation: assumes normal LV geometry; less accurate in regional dysfunction.",
    category: 'M-Mode Echocardiography',
    normalValues: 'Normal EPSS <7 mm | EPSS >10 mm correlates with EF <30% | M-mode EF normal ≥55% | Fractional shortening normal ≥28%',
  },
  {
    id: 'mmode-2',
    front: 'What is E-point Septal Separation (EPSS) and how does it estimate EF?',
    back: 'EPSS is the distance between the E-point (maximum anterior mitral leaflet excursion in early diastole) and the interventricular septum, measured by M-mode at the mitral valve level. In a normal heart with good EF, the mitral valve opens widely, placing the E-point close to the septum (<7 mm). When EF is reduced, the LV is dilated and the MV doesn\'t open as far (reduced filling velocity + dilated chamber) → increased EPSS. A simple formula: EF ≈ 75.5 − (2.5 × EPSS). Useful quick bedside assessment.',
    category: 'M-Mode Echocardiography',
    normalValues: 'Normal EPSS <7 mm | EPSS 7–10 mm = borderline reduced EF | EPSS >10 mm = EF likely <30%',
  },

  // ── CONGENITAL HEART DISEASE ─────────────────────────────────────────────────
  {
    id: 'chd-1',
    front: 'What are the echocardiographic features of an Atrial Septal Defect (ASD)?',
    back: "ASD: a defect in the interatrial septum allowing left-to-right shunting. Echo findings: (1) Direct visualization of the septal defect (2D and color Doppler shows left-to-right flow). (2) RV volume overload: dilated RA and RV, paradoxical septal motion (septal flattening in PSAX 'D-sign'). (3) Increased pulmonary artery flow (dilated PA). Types: Secundum (most common, 70%) — central fossa ovalis; Primum — inferior, adjacent to AV valves; Sinus venosus — posterior near SVC or IVC. PFO vs. ASD: PFO is a tunnel-like communication, not a true defect — seen only on color/bubble study with Valsalva.",
    category: 'Congenital Heart Disease',
    normalValues: 'Qp:Qs >1.5:1 indicates significant shunt | RV/RA enlargement with normal LV = suspect ASD | RVSP >40 mmHg suggests Eisenmenger physiology',
  },
  {
    id: 'chd-2',
    front: 'How is a Patent Foramen Ovale (PFO) diagnosed on echocardiography?',
    back: 'PFO is present in ~25% of adults — a remnant of the fetal foramen ovale where the septum primum does not fuse with the septum secundum. Diagnosis: (1) Bubble study (agitated saline contrast): inject IV during rest, then Valsalva release — if bubbles appear in the left heart within 3 cardiac cycles, PFO is confirmed. (2) Color Doppler may show brief right-to-left flow during Valsalva. (3) TEE is most sensitive (vs. TTE). PFO is associated with cryptogenic stroke, platypnea-orthodeoxia syndrome, and decompression illness in divers.',
    category: 'Congenital Heart Disease',
    normalValues: 'PFO present in ~25% of general population | Cryptogenic stroke workup: standard indication for bubble study | TEE sensitivity for PFO: 90–100% vs TTE 46–60%',
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
      "You are an expert cardiologist teaching about a DCM case: 58yo male, EF 20%, LVEDD 7.2cm, global hypokinesis, functional MR, restrictive filling (E/A 2.4, DT 140ms, E/e' 22), RVSP 52 mmHg, TAPSE 14mm.\n\nFORMATTING: Always respond with bullet points only — never write paragraphs. Start sections with a bold header on its own line like **Key Point:**, **Echo Findings:**, **Management:**. One idea per bullet, 1–2 lines max. End with a **Bottom Line:** bullet. If asked for more detail, expand with 3–5 additional focused bullets. Be educational, precise, and easy to scan on a phone.",
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
      'SAM of the mitral valve causes dynamic LVOT obstruction — the anterior MV leaflet is pulled into the LVOT by Venturi forces and flow drag',
      'Gradient INCREASES with: Valsalva, standing, dehydration, tachycardia, vasodilators',
      'Gradient DECREASES with: squatting, leg raise, beta-blockers, phenylephrine, increased preload',
      'Dagger-shaped (late-peaking) CW profile distinguishes HOCM from fixed LVOT obstruction',
      'MR in HOCM is posteriorly directed (opposite to typical degenerative MR) due to SAM mechanism',
      'Sudden cardiac death risk: consider ICD if prior cardiac arrest, family history SCD, massive hypertrophy (≥30mm), NSVT, abnormal BP response to exercise',
    ],
    systemPrompt:
      'You are an expert cardiologist teaching about a HOCM case: 34yo female athlete, exertional syncope, IVS 22mm, EF 75%, SAM of MV, LVOT gradient 85 mmHg at rest, posteriorly-directed MR, family history of SCD.\n\nFORMATTING: Always respond with bullet points only — never write paragraphs. Start sections with a bold header on its own line like **Mechanism:**, **Maneuvers:**, **Risk Factors:**, **Management:**. One idea per bullet, 1–2 lines max. End with a **Bottom Line:** bullet. If asked for more detail, expand with 3–5 additional focused bullets. Be educational, precise, and easy to scan on a phone.',
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
      'You are an expert cardiologist teaching about a right-sided IE case: 45yo male IVDU, Staph aureus bacteremia, large TV vegetation (1.8cm), severe TR, flail leaflet, RVSP 42 mmHg.\n\nFORMATTING: Always respond with bullet points only — never write paragraphs. Start sections with a bold header on its own line like **Duke Criteria:**, **Why TEE?:**, **Complications:**, **Surgery Indications:**. One idea per bullet, 1–2 lines max. End with a **Bottom Line:** bullet. If asked for more detail, expand with 3–5 additional focused bullets. Be educational, precise, and easy to scan on a phone.',
  },
];
