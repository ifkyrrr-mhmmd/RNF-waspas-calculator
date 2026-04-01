'use client';

import { useState, useRef } from 'react';
import { calculateWASPAS } from '../lib/waspas';

/* ═══════════════════════════════════════════════════
   RNF WASPAS Calculator — Main Page
   ═══════════════════════════════════════════════════ */

export default function Home() {
  /* ────────── State ────────── */
  const [numCriteria, setNumCriteria] = useState(4);
  const [numAlternatives, setNumAlternatives] = useState(4);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Separate display state for sidebar inputs — allows free typing
  const [criteriaInput, setCriteriaInput] = useState('4');
  const [alternativesInput, setAlternativesInput] = useState('4');

  const [criteria, setCriteria] = useState(
    Array.from({ length: 4 }, (_, i) => ({
      name: `Kriteria ${i + 1}`,
      type: 'Benefit',
      weight: 0.25,
    }))
  );

  const [alternatives, setAlternatives] = useState(
    Array.from({ length: 4 }, (_, i) => ({
      name: `Alternatif ${i + 1}`,
      values: Array(4).fill(0),
    }))
  );

  const [results, setResults] = useState(null);
  const resultsRef = useRef(null);

  /* ────────── Handlers: count changes ────────── */

  // Apply criteria count — called on blur / Enter
  const applyCriteriaCount = (rawVal) => {
    const parsed = parseInt(rawVal);
    const count = isNaN(parsed) ? numCriteria : Math.max(2, Math.min(20, parsed));
    setCriteriaInput(String(count));
    if (count === numCriteria) return;
    setNumCriteria(count);

    setCriteria((prev) => {
      const updated = [...prev];
      while (updated.length < count) {
        updated.push({
          name: `Kriteria ${updated.length + 1}`,
          type: 'Benefit',
          weight: 0,
        });
      }
      return updated.slice(0, count);
    });

    setAlternatives((prev) =>
      prev.map((alt) => {
        const values = [...alt.values];
        while (values.length < count) values.push(0);
        return { ...alt, values: values.slice(0, count) };
      })
    );

    setResults(null);
  };

  // Apply alternatives count — called on blur / Enter
  const applyAlternativesCount = (rawVal) => {
    const parsed = parseInt(rawVal);
    const count = isNaN(parsed) ? numAlternatives : Math.max(2, Math.min(50, parsed));
    setAlternativesInput(String(count));
    if (count === numAlternatives) return;
    setNumAlternatives(count);

    setAlternatives((prev) => {
      const updated = [...prev];
      while (updated.length < count) {
        updated.push({
          name: `Alternatif ${updated.length + 1}`,
          values: Array(numCriteria).fill(0),
        });
      }
      return updated.slice(0, count);
    });

    setResults(null);
  };

  /* ────────── Handlers: criteria edits ────────── */
  const updateCriterion = (index, field, value) => {
    setCriteria((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    setResults(null);
  };

  /* ────────── Handlers: alternative edits ────────── */
  const updateAlternativeName = (index, name) => {
    setAlternatives((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], name };
      return updated;
    });
  };

  const updateAlternativeValue = (altIndex, critIndex, value) => {
    setAlternatives((prev) => {
      const updated = [...prev];
      const newValues = [...updated[altIndex].values];
      newValues[critIndex] = value; // Store raw value (string) during editing
      updated[altIndex] = { ...updated[altIndex], values: newValues };
      return updated;
    });
    setResults(null);
  };

  // Convert raw value back to number on blur
  const finalizeAlternativeValue = (altIndex, critIndex) => {
    setAlternatives((prev) => {
      const updated = [...prev];
      const newValues = [...updated[altIndex].values];
      const parsed = parseFloat(newValues[critIndex]);
      newValues[critIndex] = isNaN(parsed) ? 0 : parsed;
      updated[altIndex] = { ...updated[altIndex], values: newValues };
      return updated;
    });
  };

  // Convert weight back to number on blur
  const finalizeWeight = (index) => {
    setCriteria((prev) => {
      const updated = [...prev];
      const parsed = parseFloat(updated[index].weight);
      updated[index] = { ...updated[index], weight: isNaN(parsed) ? 0 : parsed };
      return updated;
    });
  };

  /* ────────── Validation ────────── */
  const totalWeight = criteria.reduce((sum, c) => sum + (parseFloat(c.weight) || 0), 0);
  const isWeightValid = Math.abs(totalWeight - 1) < 0.005;
  const hasAnyZeroWeight = criteria.some((c) => !parseFloat(c.weight));
  const benefitCount = criteria.filter((c) => c.type === 'Benefit').length;
  const costCount = criteria.filter((c) => c.type === 'Cost').length;
  const hasZeroValues = alternatives.some((alt) => alt.values.some((v) => !parseFloat(v)));
  const hasEmptyNames = criteria.some((c) => !String(c.name).trim()) || alternatives.some((a) => !String(a.name).trim());

  // All conditions that must pass before calculating
  const canCalculate = isWeightValid && !hasAnyZeroWeight && !hasZeroValues && !hasEmptyNames;

  /* ────────── Calculate ────────── */
  const handleCalculate = () => {
    if (!canCalculate) return;

    const matrix = alternatives.map((alt) => alt.values.map((v) => parseFloat(v) || 0));
    const weights = criteria.map((c) => parseFloat(c.weight) || 0);
    const types = criteria.map((c) => c.type);

    const result = calculateWASPAS(matrix, weights, types);
    setResults(result);

    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  /* ────────── Helpers ────────── */
  const fmt = (n, d = 6) => Number(n).toFixed(d);

  /* ══════════════════════════════════════
     RENDER
     ══════════════════════════════════════ */
  return (
    <div className="app-layout">
      {/* ──── Mobile menu toggle ──── */}
      <button
        className="menu-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* ──── Mobile overlay ──── */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ════════════════════════════
         SIDEBAR
         ════════════════════════════ */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-inner">
          {/* Brand */}
          <div className="sidebar-brand">
            <div className="brand-icon">W</div>
            <div className="brand-title">RNF WASPAS</div>
            <div className="brand-sub">Calculator</div>
          </div>

          {/* Team Badge */}
          <div className="team-badge">
            <div className="badge-icon-wrap">K2</div>
            <div className="badge-text">
              <strong>Kelompok 2</strong>
              Sistem Pendukung Keputusan
            </div>
          </div>

          {/* Settings */}
          <div className="sidebar-section">
            <div className="sidebar-section-title">Pengaturan</div>

            <label className="sidebar-label">Jumlah Kriteria</label>
            <input
              className="sidebar-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={criteriaInput}
              onChange={(e) => setCriteriaInput(e.target.value)}
              onBlur={(e) => applyCriteriaCount(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.target.blur(); }
              }}
              placeholder="2–20"
            />

            <label className="sidebar-label">Jumlah Alternatif</label>
            <input
              className="sidebar-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={alternativesInput}
              onChange={(e) => setAlternativesInput(e.target.value)}
              onBlur={(e) => applyAlternativesCount(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.target.blur(); }
              }}
              placeholder="2–50"
            />
          </div>

          {/* About */}
          <div className="sidebar-about">
            <div className="sidebar-about-title">Tentang WASPAS</div>
            <p>
              <strong>WASPAS</strong> <em>(Weighted Aggregated Sum Product Assessment)</em>{' '}
              menggabungkan metode <strong>SAW</strong> dan <strong>WP</strong> untuk
              menghasilkan perangkingan yang lebih akurat.
            </p>
            <div className="formula-display">
              Q<sub>i</sub> = 0.5 × Q<sub>i</sub>
              <sup>(1)</sup> + 0.5 × Q<sub>i</sub>
              <sup>(2)</sup>
            </div>
          </div>

          {/* Footer */}
          <div className="sidebar-footer">
            Mata Kuliah SPK
            <br />
            Teknik Informatika
            <br />© 2026 Kelompok 2
          </div>
        </div>
      </aside>

      {/* ════════════════════════════
         MAIN CONTENT
         ════════════════════════════ */}
      <main className="main-content">
        {/* ──── Header ──── */}
        <header className="main-header">
          <h1>RNF WASPAS Calculator</h1>
          <p className="header-subtitle">
            Sistem Pendukung Keputusan — Metode Weighted Aggregated Sum Product Assessment
          </p>
          <span className="header-badge">Kelompok 2 • Teknik Informatika</span>
        </header>

        {/* ════════════════════════════
           TAHAP 1 — KRITERIA & BOBOT
           ════════════════════════════ */}
        <section className="step-section">
          <div className="step-badge">Tahap 1</div>
          <h2>Kriteria &amp; Bobot</h2>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '3rem', textAlign: 'center' }}>#</th>
                  <th>Nama Kriteria</th>
                  <th style={{ width: '140px' }}>Tipe</th>
                  <th style={{ width: '130px', textAlign: 'right' }}>Bobot (Σ=1)</th>
                </tr>
              </thead>
              <tbody>
                {criteria.map((c, i) => (
                  <tr key={i}>
                    <td className="row-num">{i + 1}</td>
                    <td>
                      <input
                        className="table-input"
                        type="text"
                        value={c.name}
                        onChange={(e) => updateCriterion(i, 'name', e.target.value)}
                        placeholder={`Kriteria ${i + 1}`}
                      />
                    </td>
                    <td>
                      <select
                        className="table-select"
                        value={c.type}
                        onChange={(e) => updateCriterion(i, 'type', e.target.value)}
                      >
                        <option value="Benefit">Benefit</option>
                        <option value="Cost">Cost</option>
                      </select>
                    </td>
                    <td>
                      <input
                        className="table-input table-input-number"
                        type="text"
                        inputMode="decimal"
                        value={c.weight}
                        onChange={(e) =>
                          updateCriterion(i, 'weight', e.target.value)
                        }
                        onBlur={() => finalizeWeight(i)}
                        onFocus={(e) => e.target.select()}
                        placeholder="0.00"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="validation-row">
            <span className={`validation-pill ${isWeightValid ? 'validation-valid' : 'validation-invalid'}`}>
              Total bobot = {totalWeight.toFixed(4)}{' '}
              {isWeightValid ? '— Valid' : '— harus = 1.0000'}
            </span>
            {hasAnyZeroWeight && (
              <span className="validation-pill validation-invalid">
                Setiap bobot harus lebih dari 0
              </span>
            )}
            <span className="validation-pill validation-info">
              Benefit: {benefitCount} &nbsp;|&nbsp; Cost: {costCount}
            </span>
          </div>
        </section>

        <hr className="section-divider" />

        {/* ════════════════════════════
           TAHAP 2 — MATRIKS KEPUTUSAN
           ════════════════════════════ */}
        <section className="step-section">
          <div className="step-badge">Tahap 2</div>
          <h2>Matriks Keputusan</h2>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '3rem', textAlign: 'center' }}>#</th>
                  <th>Alternatif</th>
                  {criteria.map((c, j) => (
                    <th key={j} style={{ textAlign: 'right', minWidth: '100px' }}>
                      {c.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {alternatives.map((alt, i) => (
                  <tr key={i}>
                    <td className="row-num">{i + 1}</td>
                    <td>
                      <input
                        className="table-input"
                        type="text"
                        value={alt.name}
                        onChange={(e) => updateAlternativeName(i, e.target.value)}
                        placeholder={`Alternatif ${i + 1}`}
                      />
                    </td>
                    {criteria.map((_, j) => (
                      <td key={j}>
                        <input
                          className="table-input table-input-number"
                          type="text"
                          inputMode="decimal"
                          value={alt.values[j]}
                          onChange={(e) => updateAlternativeValue(i, j, e.target.value)}
                          onBlur={() => finalizeAlternativeValue(i, j)}
                          onFocus={(e) => e.target.select()}
                          placeholder="0"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasZeroValues && (
            <div className="validation-row" style={{ marginTop: '0.75rem' }}>
              <span className="validation-pill validation-invalid">
                Terdapat nilai 0 dalam matriks — pastikan semua nilai sudah diisi
              </span>
            </div>
          )}
        </section>

        <hr className="section-divider" />

        {/* ════════════════════════════
           TAHAP 3 — PERHITUNGAN
           ════════════════════════════ */}
        <section className="step-section">
          <div className="step-badge">Tahap 3</div>
          <h2>Perhitungan WASPAS</h2>

          <button
            className="btn-calculate"
            onClick={handleCalculate}
            disabled={!canCalculate}
          >
            Hitung WASPAS
          </button>

          {!canCalculate && (
            <div style={{ marginTop: '0.6rem', fontSize: '0.8rem', color: '#c04040', lineHeight: 1.6 }}>
              {!isWeightValid && <p>• Total bobot harus = 1.0000</p>}
              {hasAnyZeroWeight && <p>• Setiap bobot kriteria harus lebih dari 0</p>}
              {hasZeroValues && <p>• Semua nilai dalam matriks keputusan harus diisi (&gt; 0)</p>}
              {hasEmptyNames && <p>• Nama kriteria dan alternatif tidak boleh kosong</p>}
            </div>
          )}
        </section>

        {/* ════════════════════════════
           RESULTS
           ════════════════════════════ */}
        {results && (
          <section className="results-section" ref={resultsRef}>
            <hr className="section-divider" />

            {/* Metric Cards */}
            <div className="metric-grid">
              <div className="metric-card">
                <div className="metric-label">Kriteria</div>
                <div className="metric-value">{numCriteria}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Alternatif</div>
                <div className="metric-value">{numAlternatives}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Terbaik</div>
                <div className="metric-value" style={{ fontSize: '1rem' }}>
                  {alternatives[results.rankings[0].index].name}
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Nilai Tertinggi</div>
                <div className="metric-value">{fmt(results.rankings[0].qi, 4)}</div>
              </div>
            </div>

            {/* Normalized Matrix */}
            <details className="collapsible-section">
              <summary>
                <span>Matriks Ternormalisasi</span>
                <span className="chevron">▼</span>
              </summary>
              <div className="collapsible-content">
                <div className="table-container">
                  <table className="result-table">
                    <thead>
                      <tr>
                        <th>Alternatif</th>
                        {criteria.map((c, j) => (
                          <th key={j} style={{ textAlign: 'right' }}>
                            {c.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.normalized.map((row, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{alternatives[i].name}</td>
                          {row.map((val, j) => (
                            <td key={j} style={{ textAlign: 'right' }}>
                              {fmt(val, 4)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </details>

            {/* Q1 & Q2 Detail */}
            <details className="collapsible-section">
              <summary>
                <span>Detail Perhitungan Q1 (SAW) &amp; Q2 (WP)</span>
                <span className="chevron">▼</span>
              </summary>
              <div className="collapsible-content">
                <div className="table-container">
                  <table className="result-table">
                    <thead>
                      <tr>
                        <th>Alternatif</th>
                        <th style={{ textAlign: 'right' }}>Q1 (SAW)</th>
                        <th style={{ textAlign: 'right' }}>Q2 (WP)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.rankings
                        .slice()
                        .sort((a, b) => a.index - b.index)
                        .map((r) => (
                          <tr key={r.index}>
                            <td style={{ fontWeight: 600 }}>
                              {alternatives[r.index].name}
                            </td>
                            <td style={{ textAlign: 'right' }}>{fmt(r.q1)}</td>
                            <td style={{ textAlign: 'right' }}>{fmt(r.q2)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </details>

            {/* Ranking Table */}
            <div className="ranking-container">
              <div className="ranking-header">
                <h3>Hasil Perangkingan WASPAS</h3>
              </div>
              <table className="ranking-table">
                <thead>
                  <tr>
                    <th style={{ width: '4.5rem', textAlign: 'center' }}>Peringkat</th>
                    <th>Alternatif</th>
                    <th style={{ textAlign: 'right' }}>Q1 (SAW)</th>
                    <th style={{ textAlign: 'right' }}>Q2 (WP)</th>
                    <th style={{ textAlign: 'right' }}>Qi (Akhir)</th>
                  </tr>
                </thead>
                <tbody>
                  {results.rankings.map((r) => (
                    <tr key={r.index}>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          className={`rank-number ${
                            r.rank === 1
                              ? 'rank-1'
                              : r.rank === 2
                              ? 'rank-2'
                              : r.rank === 3
                              ? 'rank-3'
                              : 'rank-other'
                          }`}
                        >
                          {r.rank}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{alternatives[r.index].name}</td>
                      <td style={{ textAlign: 'right' }}>{fmt(r.q1)}</td>
                      <td style={{ textAlign: 'right' }}>{fmt(r.q2)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#3d7382' }}>
                        {fmt(r.qi)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Winner Card */}
            <div className="winner-card">
              <div className="winner-icon">★</div>
              <div className="winner-label">Alternatif Terbaik</div>
              <div className="winner-name">
                {alternatives[results.rankings[0].index].name}
              </div>
              <div className="winner-score">
                Nilai akhir WASPAS:{' '}
                <strong>{fmt(results.rankings[0].qi)}</strong>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="chart-section">
              <div className="chart-title">Visualisasi Nilai Akhir</div>
              {(() => {
                const maxQi = Math.max(...results.rankings.map((r) => r.qi));
                return results.rankings.map((r) => {
                  const pct = maxQi > 0 ? (r.qi / maxQi) * 100 : 0;
                  return (
                    <div className="chart-bar-row" key={r.index}>
                      <div className="chart-bar-label">
                        {alternatives[r.index].name}
                      </div>
                      <div className="chart-bar-track">
                        <div
                          className="chart-bar-fill"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="chart-bar-value">{fmt(r.qi, 4)}</div>
                    </div>
                  );
                });
              })()}
            </div>
          </section>
        )}

        {/* ──── Footer ──── */}
        <footer className="main-footer">
          <div className="footer-brand">RNF WASPAS Calculator</div>
          <div className="footer-divider" />
          <div className="footer-team">
            Dibuat oleh <strong>Kelompok 2</strong>
          </div>
          <div className="footer-course">
            Mata Kuliah Sistem Pendukung Keputusan • Teknik Informatika • 2026
          </div>
        </footer>
      </main>
    </div>
  );
}
