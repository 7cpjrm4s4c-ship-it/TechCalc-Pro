<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TechCalc Pro -- HLK-Rechner</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0a0e27;
      color: #e0e0e0;
      line-height: 1.6;
    }

    .header {
      background: rgba(0, 0, 0, 0.3);
      padding: 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      text-align: center;
    }

    .header h1 {
      font-size: 32px;
      background: linear-gradient(135deg, #5b52ff, #746cff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin: 0;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
      gap: 24px;
    }

    .card {
      background: #1a1f3a;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 24px;
    }

    .card h2 {
      font-size: 18px;
      margin-bottom: 16px;
      color: #5b52ff;
    }

    .input-group {
      margin-bottom: 16px;
    }

    .input-label {
      display: block;
      font-size: 13px;
      color: #a0a0a0;
      margin-bottom: 6px;
      font-weight: 500;
    }

    .input {
      width: 100%;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 10px 12px;
      color: #e0e0e0;
      border-radius: 8px;
      font-size: 14px;
    }

    .input:focus {
      outline: none;
      border-color: #5b52ff;
      background: rgba(91, 82, 255, 0.1);
    }

    .results {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .results h3 {
      font-size: 16px;
      margin-bottom: 16px;
      color: #5b52ff;
    }

    .result-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 14px;
    }

    .result-row:last-child {
      border-bottom: none;
    }

    .result-label {
      color: #a0a0a0;
    }

    .result-value {
      color: #00c4e8;
      font-weight: bold;
      font-size: 18px;
    }

    .result-unit {
      color: #a0a0a0;
      font-size: 12px;
      margin-left: 4px;
    }

    .info-card p {
      font-size: 14px;
      color: #a0a0a0;
      margin-bottom: 12px;
    }

    .info-card ul {
      font-size: 13px;
      color: #a0a0a0;
      margin-left: 20px;
      margin-top: 8px;
    }

    .info-card li {
      margin-bottom: 6px;
    }

    @media (max-width: 768px) {
      .grid {
        grid-template-columns: 1fr;
      }

      .header h1 {
        font-size: 24px;
      }

      .container {
        padding: 16px;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>TechCalc Pro v2</h1>
  </div>

  <div class="container">
    <div class="grid">
      <!-- Rechner -->
      <div class="card">
        <h2>MAG / Druckhaltung</h2>

        <div class="input-group">
          <label class="input-label">Anlagenvolumen (Liter)</label>
          <input class="input" id="VA" type="number" value="50" />
        </div>

        <div class="input-group">
          <label class="input-label">T min (°C)</label>
          <input class="input" id="tMin" type="number" value="10" />
        </div>

        <div class="input-group">
          <label class="input-label">T max (°C)</label>
          <input class="input" id="tMax" type="number" value="80" />
        </div>

        <div class="input-group">
          <label class="input-label">Geodätische Höhe (m)</label>
          <input class="input" id="h" type="number" value="10" />
        </div>

        <div class="input-group">
          <label class="input-label">Sicherheitsventil (bar)</label>
          <input class="input" id="pSV" type="number" value="3" />
        </div>

        <div class="results" id="results" style="display: none;">
          <h3>Ergebnisse</h3>

          <div class="result-row">
            <span class="result-label">Ausdehnungsvolumen</span>
            <span><span class="result-value" id="VE">0</span><span class="result-unit">l</span></span>
          </div>

          <div class="result-row">
            <span class="result-label">Reserve (5%)</span>
            <span><span class="result-value" id="reserve">0</span><span class="result-unit">l</span></span>
          </div>

          <div class="result-row">
            <span class="result-label">MAG-Größe min.</span>
            <span><span class="result-value" id="VNmin">0</span><span class="result-unit">l</span></span>
          </div>

          <div class="result-row">
            <span class="result-label"><strong>MAG empfohlen</strong></span>
            <span><span class="result-value" id="rec" style="color: #34d399;">0</span><span class="result-unit">l</span></span>
          </div>
        </div>
      </div>

      <!-- Info Card -->
      <div class="card info-card">
        <h2>Info</h2>
        <p><strong>TechCalc Pro</strong> -- Professioneller HLK-Rechner für moderne Heizungsanlagen.</p>
        <p><strong>Berechnet automatisch die MAG-Größe basierend auf:</strong></p>
        <ul>
          <li>Anlagenvolumen</li>
          <li>Temperaturbereich</li>
          <li>Geodätischer Höhe</li>
          <li>Sicherheitsventileinstellung</li>
        </ul>
        <p style="margin-top: 16px; color: #5b52ff;"><strong>✓ Alle Berechnungen erfolgen lokal im Browser</strong></p>
      </div>
    </div>
  </div>

  <script>
    const inputs = {
      VA: document.getElementById('VA'),
      tMin: document.getElementById('tMin'),
      tMax: document.getElementById('tMax'),
      h: document.getElementById('h'),
      pSV: document.getElementById('pSV')
    };

    const outputs = {
      VE: document.getElementById('VE'),
      reserve: document.getElementById('reserve'),
      VNmin: document.getElementById('VNmin'),
      rec: document.getElementById('rec'),
      results: document.getElementById('results')
    };

    function parseValue(v) {
      const n = parseFloat(String(v).replace(',', '.'));
      return isNaN(n) ? NaN : n;
    }

    function formatValue(v, decimals = 2) {
      if (isNaN(v)) return '–';
      return Number(v).toFixed(decimals).replace('.', ',');
    }

    function calculate() {
      const VA = parseValue(inputs.VA.value);
      const tMin = parseValue(inputs.tMin.value);
      const tMax = parseValue(inputs.tMax.value);
      const h = parseValue(inputs.h.value);
      const pSV = parseValue(inputs.pSV.value);

      if ([VA, tMin, tMax, h, pSV].some(isNaN)) {
        outputs.results.style.display = 'none';
        return;
      }

      const e = Math.max(0, (tMax - tMin) / 3000);
      const VE = VA * e;
      const reserve = Math.max(3, VA * 0.005);
      const p0 = Math.max(0.8, h * 0.1 + 0.3);
      const pe = Math.max(p0 + 0.5, pSV - 0.5);
      const VNmin = (VE + reserve) * ((pe + 1) / (pe - p0));
      const rec = Math.ceil(VNmin / 25) * 25;

      outputs.VE.textContent = formatValue(VE, 1);
      outputs.reserve.textContent = formatValue(reserve, 1);
      outputs.VNmin.textContent = formatValue(VNmin, 1);
      outputs.rec.textContent = rec;
      outputs.results.style.display = 'block';
    }

    Object.values(inputs).forEach(input => {
      input.addEventListener('input', calculate);
      input.addEventListener('change', calculate);
    });

    calculate();
  </script>
</body>
</html>