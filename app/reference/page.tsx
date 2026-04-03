'use client';

import { useState } from 'react';

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

function AccordionSection({ section, isOpen, onToggle }: { section: Section; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-pink-100 rounded-2xl overflow-hidden mb-3 shadow-sm">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-4 bg-white text-left active:bg-pink-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-pink-50 flex items-center justify-center flex-shrink-0">
            {section.icon}
          </div>
          <span className="font-semibold text-sm text-gray-900">{section.title}</span>
        </div>
        <svg
          width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-4 py-4 bg-pink-50/50 border-t border-pink-100">
          {section.content}
        </div>
      )}
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            {headers.map(h => (
              <th key={h} className="text-left px-3 py-2 bg-pink-100 text-pink-600 font-semibold border border-pink-200 first:rounded-tl-lg last:rounded-tr-lg">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-pink-50/50'}>
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-gray-600 border border-pink-100 leading-relaxed">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FormulaCard({ name, formula, notes }: { name: string; formula: string; notes?: string }) {
  return (
    <div className="mb-3 p-3 bg-white border border-pink-100 rounded-xl shadow-sm">
      <p className="text-xs font-semibold text-pink-500 mb-1">{name}</p>
      <p className="text-sm font-mono text-gray-900 bg-pink-50 px-3 py-2 rounded-lg border border-pink-100 mb-1">{formula}</p>
      {notes && <p className="text-xs text-gray-500 leading-relaxed">{notes}</p>}
    </div>
  );
}

export default function ReferencePage() {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['normal-values']));
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSection = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const sections: Section[] = [
    {
      id: 'normal-values',
      title: 'Normal Reference Values',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>,
      content: (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">LV Dimensions</p>
            <Table
              headers={['Parameter', 'Women', 'Men']}
              rows={[
                ['LVEDD', '3.9–5.3 cm', '4.2–5.9 cm'],
                ['LVESD', '2.1–3.5 cm', '2.5–3.9 cm'],
                ['IVS', '0.6–1.0 cm', '0.6–1.0 cm'],
                ['LVPW', '0.6–1.0 cm', '0.6–1.0 cm'],
                ['EF (Simpson\'s)', '≥55%', '≥55%'],
                ['FS', '25–43%', '25–43%'],
                ['RWT', '≤0.42 (eccentric)', '≤0.42'],
              ]}
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Chambers & Great Vessels</p>
            <Table
              headers={['Parameter', 'Normal Value']}
              rows={[
                ['LA diameter', '<4.0 cm'],
                ['LA volume index', '<34 mL/m²'],
                ['Ao root (sinuses)', '<3.7 cm'],
                ['Ao ascending', '<3.7 cm'],
                ['LVOT diameter', '1.8–2.2 cm'],
                ['RV basal diameter', '<4.2 cm'],
                ['RV mid diameter', '<3.5 cm'],
                ['RA area', '<18 cm²'],
                ['PA main trunk', '<2.5 cm'],
                ['IVC', '<2.1 cm'],
              ]}
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Doppler Parameters</p>
            <Table
              headers={['Parameter', 'Normal Value']}
              rows={[
                ['MV E wave', '0.6–1.2 m/s'],
                ['MV A wave', '0.4–0.8 m/s'],
                ['E/A ratio', '1.0–2.0'],
                ['DT (E wave)', '150–240 ms'],
                ['IVRT', '60–100 ms'],
                ['Septal e\'', '≥8 cm/s'],
                ['Lateral e\'', '≥10 cm/s'],
                ['E/e\' average', '<14'],
                ['LVOT VTI', '18–25 cm'],
                ['AV peak velocity', '<2.0 m/s'],
                ['RVSP', '<35 mmHg'],
                ['TAPSE', '≥17 mm'],
                ['RV S\'', '≥9.5 cm/s'],
                ['PV S wave', 'S ≥ D'],
                ['PV Ar wave', '<35 cm/s'],
              ]}
            />
          </div>
        </div>
      ),
    },
    {
      id: 'as-grading',
      title: 'Aortic Stenosis Severity',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>,
      content: (
        <div>
          <Table
            headers={['Severity', 'Vmax (m/s)', 'Mean Gradient', 'AVA (cm²)', 'AVAi (cm²/m²)']}
            rows={[
              ['Mild', '2.0–3.0', '<20 mmHg', '>1.5', '>0.85'],
              ['Moderate', '3.0–4.0', '20–40 mmHg', '1.0–1.5', '0.6–0.85'],
              ['Severe', '>4.0', '>40 mmHg', '<1.0', '<0.6'],
              ['Very Severe', '>5.0', '>60 mmHg', '<0.6', '<0.4'],
            ]}
          />
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-xs font-semibold text-amber-600 mb-1">Low-Flow Low-Gradient AS</p>
            <p className="text-xs text-gray-600 leading-relaxed">
              May have AVA &lt;1.0 cm² but low gradient if EF reduced or low stroke volume. Use dobutamine stress echo or CT calcium score for clarification. Low-flow = SVI &lt;35 mL/m².
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'ar-grading',
      title: 'Aortic Regurgitation Severity',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>,
      content: (
        <div className="space-y-3">
          <Table
            headers={['Severity', 'Vena Contracta', 'PHT', 'Jet/LVOT Ratio', 'Regurgitant Fraction']}
            rows={[
              ['Mild', '<0.3 cm', '>500 ms', '<25%', '<30%'],
              ['Moderate', '0.3–0.6 cm', '200–500 ms', '25–64%', '30–49%'],
              ['Severe', '≥0.6 cm', '<200 ms', '≥65%', '≥50%'],
            ]}
          />
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2">Supportive Signs of Severe AR</p>
            <ul className="text-xs text-gray-600 space-y-1.5">
              <li className="flex items-start gap-2"><span className="text-pink-400 mt-0.5">•</span> Holodiastolic flow reversal in descending Ao (suprasternal)</li>
              <li className="flex items-start gap-2"><span className="text-pink-400 mt-0.5">•</span> Premature MV closure on M-mode (acute severe AR)</li>
              <li className="flex items-start gap-2"><span className="text-pink-400 mt-0.5">•</span> LV dilation (eccentric LVH in chronic AR)</li>
              <li className="flex items-start gap-2"><span className="text-pink-400 mt-0.5">•</span> Dense, complete AR CW signal with steep deceleration slope</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'mr-grading',
      title: 'Mitral Regurgitation Severity',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>,
      content: (
        <div className="space-y-3">
          <Table
            headers={['Severity', 'Vena Contracta', 'EROA', 'R Volume', 'RF']}
            rows={[
              ['Mild', '<0.3 cm', '<0.20 cm²', '<30 mL', '<30%'],
              ['Moderate', '0.3–0.69 cm', '0.20–0.39 cm²', '30–59 mL', '30–49%'],
              ['Severe', '≥0.7 cm', '≥0.40 cm²', '≥60 mL', '≥50%'],
            ]}
          />
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2">PISA Method Summary</p>
            <div className="bg-pink-50 border border-pink-200 rounded-xl p-3 font-mono text-xs text-gray-800">
              <p>EROA = 2πr² × Va / Vmax(MR)</p>
              <p className="text-gray-500 mt-1">R Vol = EROA × MR VTI</p>
            </div>
            <p className="text-xs text-gray-400 mt-2">Va = aliasing velocity (set to ~40 cm/s), r = PISA radius, Vmax = peak MR velocity</p>
          </div>
        </div>
      ),
    },
    {
      id: 'ms-grading',
      title: 'Mitral Stenosis Severity',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>,
      content: (
        <div className="space-y-3">
          <Table
            headers={['Severity', 'MVA (cm²)', 'Mean Gradient', 'PHT (ms)', 'PASP']}
            rows={[
              ['Mild', '>1.5', '<5 mmHg', '<150 ms', 'Normal'],
              ['Moderate', '1.0–1.5', '5–10 mmHg', '150–220 ms', '30–50 mmHg'],
              ['Severe', '<1.0', '>10 mmHg', '>220 ms', '>50 mmHg'],
            ]}
          />
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
            <p className="text-xs font-semibold text-purple-600 mb-1">PHT Method</p>
            <p className="text-xs font-mono text-gray-800">MVA = 220 / PHT</p>
            <p className="text-xs text-gray-500 mt-1">Limitation: unreliable immediately after valvuloplasty, with elevated LA compliance, or significant AR.</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2">Wilkins Score (for valvuloplasty candidacy)</p>
            <p className="text-xs text-gray-600">Score each 1–4: leaflet mobility, thickness, calcification, subvalvular apparatus. Total ≤8 = good candidate for PMC.</p>
          </div>
        </div>
      ),
    },
    {
      id: 'diastolic',
      title: 'Diastolic Dysfunction Grading',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
      content: (
        <div className="space-y-3">
          <Table
            headers={['Grade', 'Pattern', 'E/A', 'DT', 'e\'', 'E/e\'', 'Filling Pressure']}
            rows={[
              ['Normal', 'Normal relaxation', '1–2', '150–240 ms', '≥8 cm/s', '<14', 'Normal'],
              ['Grade I', 'Impaired relaxation', '<1 (E/A reversal)', '>240 ms', '<8 cm/s', '<14', 'Normal/low'],
              ['Grade II', 'Pseudonormal', '1–2', '150–240 ms', '<8 cm/s', '9–14', 'Elevated'],
              ['Grade III', 'Restrictive', '>2', '<150 ms', '<8 cm/s', '>14', 'Markedly elevated'],
            ]}
          />
          <div className="p-3 bg-pink-50 border border-pink-200 rounded-xl">
            <p className="text-xs font-semibold text-pink-500 mb-2">2016 ASE Algorithm (simplified)</p>
            <p className="text-xs text-gray-600 leading-relaxed">
              Use 4 parameters: (1) septal e&apos; &lt;7 cm/s, (2) E/e&apos; average &gt;14, (3) LA volume index &gt;34 mL/m², (4) TR velocity &gt;2.8 m/s. Normal: &lt;2 abnormal. Diastolic dysfunction: ≥2 abnormal. Indeterminate: 2 present, 2 absent.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'formulas',
      title: 'Key Formulas',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>,
      content: (
        <div>
          <FormulaCard name="Modified Bernoulli Equation" formula="ΔP = 4 × v²" notes="Where v = peak velocity in m/s. Use when proximal velocity <1 m/s. Full Bernoulli: ΔP = 4(v2² - v1²)." />
          <FormulaCard name="RVSP / PASP" formula="RVSP = 4(TR velocity)² + RAP" notes="RAP from IVC: <2.1 cm + >50% collapse = 3 mmHg; >2.1 cm + <50% collapse = 15 mmHg; intermediate = 8 mmHg." />
          <FormulaCard name="Ejection Fraction (Simpson's)" formula="EF = (EDV - ESV) / EDV × 100%" notes="Biplane method using A4C and A2C traces at end-diastole and end-systole." />
          <FormulaCard name="Fractional Shortening" formula="FS = (LVEDD - LVESD) / LVEDD × 100%" notes="Normal 25–43%. Uses M-mode linear dimensions from PLAX." />
          <FormulaCard name="AVA (Continuity Equation)" formula="AVA = (π × r²) × LVOT VTI / AV VTI" notes="Or simplified: AVA = LVOT area × LVOT VTI / AV VTI. LVOT area = π × (d/2)²." />
          <FormulaCard name="MVA (Pressure Half-Time)" formula="MVA = 220 / PHT" notes="PHT = time for peak E velocity to fall to E/√2. Limitations apply after intervention or with AR." />
          <FormulaCard name="Stroke Volume" formula="SV = LVOT area × LVOT VTI" notes="LVOT area = π × (d/2)². Normal SV = 60–100 mL." />
          <FormulaCard name="Cardiac Output" formula="CO = SV × HR" notes="Normal CO = 4–8 L/min. Cardiac Index = CO / BSA (normal 2.5–4.0 L/min/m²)." />
          <FormulaCard name="EROA (PISA Method)" formula="EROA = 2πr² × Va / Vmax(MR)" notes="R Vol = EROA × MR VTI. Set aliasing velocity ~40 cm/s. Severe MR: EROA ≥0.4 cm²." />
          <FormulaCard name="LV Mass (ASE Method)" formula="LVM = 0.8 × 1.04 × [(IVS + LVEDD + LVPW)³ - LVEDD³] + 0.6 g" notes="Index to BSA. Normal: Men <95 g/m², Women <95 g/m² (ASE 2015 revised thresholds)." />
        </div>
      ),
    },
    {
      id: 'rvsp-pa',
      title: 'Pulmonary Hypertension',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2"><path d="M8 6l4-4 4 4M8 18l4 4 4-4M4 12h16"/></svg>,
      content: (
        <div className="space-y-3">
          <Table
            headers={['Classification', 'PASP', 'RVSP']}
            rows={[
              ['Normal', '<25 mmHg', '<35 mmHg'],
              ['Borderline', '25–35 mmHg', '35–45 mmHg'],
              ['Mild PH', '36–50 mmHg', '36–50 mmHg'],
              ['Moderate PH', '51–70 mmHg', '51–70 mmHg'],
              ['Severe PH', '>70 mmHg', '>70 mmHg'],
            ]}
          />
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2">Additional RV Assessment Parameters</p>
            <Table
              headers={['Parameter', 'Normal', 'Abnormal']}
              rows={[
                ['TAPSE', '≥17 mm', '<17 mm'],
                ['RV S\'', '≥9.5 cm/s', '<9.5 cm/s'],
                ['RV FAC', '≥35%', '<35%'],
                ['RVOT AccT', '>100 ms', '<60 ms'],
                ['PA diastolic pressure', '<15 mmHg', '—'],
                ['RV:LV ratio', '<0.6', '>1.0 = dilated'],
              ]}
            />
          </div>
        </div>
      ),
    },
    {
      id: 'echo-views',
      title: 'Echo View Summary',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>,
      content: (
        <div className="space-y-2">
          {[
            { view: 'PLAX', window: 'Parasternal', structures: 'LV (long), RV, MV, AV, Ao root, LA', uses: 'LV dimensions, Ao root, LVOT, M-mode' },
            { view: 'PSAX-AV', window: 'Parasternal', structures: 'AV (Mercedes sign), RVOT, PA, RA, LA, ASD', uses: 'AV area planimetry, ASD, RVOT Doppler' },
            { view: 'PSAX-MV', window: 'Parasternal', structures: 'MV (fish-mouth), RV', uses: 'MVA planimetry (MS), wall motion' },
            { view: 'PSAX-PM', window: 'Parasternal', structures: 'Papillary muscles, LV', uses: 'Wall motion (16-seg), D-sign (PE/PH), RWT' },
            { view: 'A4C', window: 'Apical', structures: 'All 4 chambers, MV, TV', uses: 'Biplane EF, volumes, RV, TDI, Doppler' },
            { view: 'A2C', window: 'Apical', structures: 'LV, LA (ant & inf walls)', uses: 'Biplane EF, anterior/inferior WMA' },
            { view: 'A3C (ALAX)', window: 'Apical', structures: 'LV, LA, LVOT, AV', uses: 'LVOT, AS/AR Doppler, triplane EF' },
            { view: 'A5C', window: 'Apical', structures: 'A4C + LVOT/AV', uses: 'LVOT PW VTI, SV, AS/AR CW Doppler' },
            { view: 'Subcostal', window: 'Subcostal', structures: 'All chambers, IAS, IVC, pericardium', uses: 'ASD, tamponade, IVC, poor acoustic window' },
            { view: 'Suprasternal', window: 'Suprasternal notch', structures: 'Aortic arch, descending Ao, PA', uses: 'Coarctation, AR severity, PDA' },
          ].map(row => (
            <div key={row.view} className="p-3 bg-white border border-pink-100 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-pink-500">{row.view}</span>
                <span className="text-[10px] text-gray-400">{row.window}</span>
              </div>
              <p className="text-xs text-gray-600 mb-0.5"><span className="text-gray-400">Shows: </span>{row.structures}</p>
              <p className="text-xs text-gray-500"><span className="text-gray-400">Used for: </span>{row.uses}</p>
            </div>
          ))}
        </div>
      ),
    },
  ];

  const filtered = searchQuery.trim()
    ? sections.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : sections;

  return (
    <div className="page-enter min-h-screen bg-navy-900">
      {/* Header */}
      <div
        className="px-5 pt-4 pb-4 border-b border-pink-100 bg-white"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      >
        <h1 className="text-xl font-bold text-gray-900 mb-3">Reference Guide</h1>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2"
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search sections..."
            className="w-full bg-pink-50 border border-pink-200 rounded-2xl pl-10 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-pink-400 transition-colors"
          />
        </div>
      </div>

      {/* Quick links */}
      {!searchQuery && (
        <div className="px-5 py-3 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => {
                setOpenSections(prev => new Set([...prev, s.id]));
                setTimeout(() => {
                  document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
              }}
              className="flex-shrink-0 px-3 py-1.5 bg-white border border-pink-100 rounded-xl text-[11px] text-gray-500 font-medium hover:text-pink-500 hover:border-pink-300 transition-colors active:scale-95 shadow-sm"
            >
              {s.title.split(' ').slice(0, 2).join(' ')}
            </button>
          ))}
        </div>
      )}

      {/* Sections */}
      <div className="px-5 py-3">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-10">No sections found for &quot;{searchQuery}&quot;</p>
        ) : (
          filtered.map(section => (
            <div key={section.id} id={section.id}>
              <AccordionSection
                section={section}
                isOpen={openSections.has(section.id)}
                onToggle={() => toggleSection(section.id)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
