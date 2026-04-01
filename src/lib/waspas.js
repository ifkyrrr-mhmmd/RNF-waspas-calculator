/**
 * ═══════════════════════════════════════════════════════════════
 * WASPAS (Weighted Aggregated Sum Product Assessment) Calculator
 * ═══════════════════════════════════════════════════════════════
 *
 * Port 1:1 dari Python (waspas.py) ke JavaScript.
 * Semua rumus dan logika perhitungan identik.
 *
 * Rumus WASPAS:
 *   Qi = λ × Q1(SAW) + (1 - λ) × Q2(WP)
 *
 * Dimana:
 *   Q1 = Σ (rij × wj)         — Simple Additive Weighting
 *   Q2 = Π (rij ^ wj)         — Weighted Product
 *   rij = nilai ternormalisasi
 *   wj  = bobot kriteria
 */

/**
 * Normalisasi matriks keputusan.
 *
 * - Kriteria Benefit: nilai / max(kolom)
 * - Kriteria Cost:    min(kolom) / nilai
 *
 * @param {number[][]} matrix  - Matriks keputusan [alternatif][kriteria]
 * @param {string[]} types     - Tipe kriteria ('Benefit' | 'Cost')
 * @returns {number[][]}       - Matriks ternormalisasi
 */
export function normalizeMatrix(matrix, types) {
  const rows = matrix.length;
  const cols = matrix[0].length;

  // Deep copy matrix
  const normalized = matrix.map((row) => [...row]);

  for (let j = 0; j < cols; j++) {
    // Ambil semua nilai di kolom j
    const colValues = matrix.map((row) => row[j]);

    if (types[j] === 'Benefit') {
      const maxVal = Math.max(...colValues);
      for (let i = 0; i < rows; i++) {
        normalized[i][j] = maxVal !== 0 ? matrix[i][j] / maxVal : 0;
      }
    } else {
      // Cost
      const minVal = Math.min(...colValues);
      for (let i = 0; i < rows; i++) {
        normalized[i][j] = matrix[i][j] !== 0 ? minVal / matrix[i][j] : 0;
      }
    }
  }

  return normalized;
}

/**
 * Hitung SAW — Simple Additive Weighting (Q1).
 *
 * Q1_i = Σ (r_ij × w_j) untuk setiap alternatif i.
 *
 * @param {number[][]} normalizedMatrix - Matriks ternormalisasi
 * @param {number[]} weights            - Bobot kriteria (Σ = 1)
 * @returns {number[]}                  - Nilai Q1 per alternatif
 */
export function calculateSAW(normalizedMatrix, weights) {
  return normalizedMatrix.map((row) =>
    row.reduce((sum, val, j) => sum + val * weights[j], 0)
  );
}

/**
 * Hitung WP — Weighted Product (Q2).
 *
 * Q2_i = Π (r_ij ^ w_j) untuk setiap alternatif i.
 *
 * @param {number[][]} normalizedMatrix - Matriks ternormalisasi
 * @param {number[]} weights            - Bobot kriteria (Σ = 1)
 * @returns {number[]}                  - Nilai Q2 per alternatif
 */
export function calculateWP(normalizedMatrix, weights) {
  return normalizedMatrix.map((row) =>
    row.reduce((prod, val, j) => prod * Math.pow(val, weights[j]), 1)
  );
}

/**
 * Hitung WASPAS secara lengkap.
 *
 * Alur:
 *   1. Normalisasi matriks keputusan
 *   2. Hitung Q1 (SAW) dan Q2 (WP)
 *   3. Hitung nilai akhir: Qi = λ × Q1 + (1-λ) × Q2
 *   4. Urutkan berdasarkan nilai akhir (descending)
 *
 * @param {number[][]} matrix  - Matriks keputusan [alternatif][kriteria]
 * @param {number[]} weights   - Bobot kriteria (total = 1)
 * @param {string[]} types     - Tipe kriteria ('Benefit' | 'Cost')
 * @param {number} [lambda=0.5] - Koefisien lambda WASPAS
 * @returns {{ normalized: number[][], rankings: Object[] }}
 */
export function calculateWASPAS(matrix, weights, types, lambda = 0.5) {
  // 1. Normalisasi
  const normalized = normalizeMatrix(matrix, types);

  // 2. Hitung Q1 (SAW) dan Q2 (WP)
  const q1 = calculateSAW(normalized, weights);
  const q2 = calculateWP(normalized, weights);

  // 3. Hitung nilai akhir WASPAS
  const rankings = matrix.map((_, i) => ({
    index: i,
    q1: q1[i],
    q2: q2[i],
    qi: lambda * q1[i] + (1 - lambda) * q2[i],
  }));

  // 4. Urutkan descending berdasarkan Qi
  rankings.sort((a, b) => b.qi - a.qi);

  // 5. Assign peringkat
  rankings.forEach((r, i) => {
    r.rank = i + 1;
  });

  return { normalized, rankings };
}
