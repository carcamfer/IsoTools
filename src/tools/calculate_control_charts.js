// src/tools/calculate_control_charts.js
// Motor estadístico de cartas de control SPC. isoEvent: "control_chart_generated".
export const meta = {
  id: 'calculate_control_charts',
  name: 'Cálculo de Cartas de Control',
  version: '1.0.0',
  category: 'quality',
  consumes: ['MEASUREMENTS_CAPTURED', 'MSA_VALIDATED'],
  produces: ['CHART_POINTS_UPDATED']
};

export function handler (event) {
  const input = event.data || {};
  const characteristicId = input.characteristicId || 'XBAR-01';
  const chartType = (input.chartType || 'xbar_r').toLowerCase().replaceAll('_', '-');
  const measurements = Array.isArray(input.measurements) ? input.measurements.map(Number).filter(n => Number.isFinite(n)) : [];
  let subgroupSize = Number.isInteger(input.subgroupSize) ? input.subgroupSize : 5;
  // helpers
  const mean = (arr) => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
  const variance = (arr) => {
    if (!arr.length) return 0;
    const m = mean(arr); return arr.reduce((s,x)=>s+Math.pow(x-m,2),0)/(arr.length-1 || 1);
  };
  const std = (arr) => Math.sqrt(variance(arr));
  const chunk = (arr,n) => {
    const out=[]; for (let i=0;i<arr.length;i+=n) out.push(arr.slice(i,i+n)); return out;
  };
  // SPC constants (standard tables for subgroup sizes 2..10)
  const A2 = {2:1.88,3:1.023,4:0.729,5:0.577,6:0.483,7:0.419,8:0.373,9:0.337,10:0.308};
  const D3 = {2:0,3:0,4:0,5:0,6:0.076,7:0.136,8:0.184,9:0.223,10:0.256};
  const D4 = {2:3.267,3:2.574,4:2.282,5:2.114,6:2.004,7:1.924,8:1.864,9:1.816,10:1.777};
  const d2 = {2:1.128,3:1.693,4:2.059,5:2.326,6:2.534,7:2.704,8:2.847,9:2.970,10:3.078};
  const c4 = {2:0.7979,3:0.8862,4:0.9213,5:0.9400,6:0.9515,7:0.9594,8:0.9650,9:0.9693,10:0.9727};

  // adjust subgroup size if insufficient measurements
  if (measurements.length < subgroupSize) subgroupSize = Math.max(2, Math.min(10, measurements.length));
  subgroupSize = Math.max(2, Math.min(10, subgroupSize));

  let centerLine=0, ucl=null, lcl=null, plotPoints=measurements.slice(), outOfControlPoints=[], inControl=true;

  if (chartType === 'xbar-r' || chartType === 'xbar-s') {
    const groups = chunk(measurements, subgroupSize).filter(g => g.length>=2);
    const subgroupMeans = groups.map(g=>mean(g));
    const subgroupRanges = groups.map(g=>Math.max(...g)-Math.min(...g));
    centerLine = subgroupMeans.length ? mean(subgroupMeans) : mean(measurements);
    const Rbar = subgroupRanges.length ? mean(subgroupRanges) : 0;
    const sbar = groups.length ? mean(groups.map(g=>std(g))) : std(measurements);
    const n = subgroupSize;
    if (chartType === 'xbar-r') {
      const a2 = A2[n] || A2[5];
      ucl = centerLine + a2 * Rbar;
      lcl = centerLine - a2 * Rbar;
    } else {
      const a3 = 3 / ((c4[n] || c4[5]) * Math.sqrt(n));
      ucl = centerLine + a3 * sbar;
      lcl = centerLine - a3 * sbar;
    }
    // mark out-of-control by subgroup mean outside limits
    outOfControlPoints = [];
    for (let i=0;i<subgroupMeans.length;i++) {
      const m = subgroupMeans[i];
      if (m > ucl || m < lcl) {
        // map to index of first point of subgroup
        outOfControlPoints.push(i*subgroupSize);
      }
    }
    inControl = outOfControlPoints.length === 0;
  } else if (chartType === 'imr' || chartType === 'i-mr' || chartType === 'individual') {
    centerLine = mean(measurements);
    const mrs = [];
    for (let i=1;i<measurements.length;i++) mrs.push(Math.abs(measurements[i]-measurements[i-1]));
    const MRbar = mean(mrs);
    const sigmaHat = MRbar / (d2[2] || 1.128); // d2 for n=2
    ucl = centerLine + 3 * sigmaHat;
    lcl = centerLine - 3 * sigmaHat;
    outOfControlPoints = plotPoints.map((v,i)=> (v>ucl||v<lcl) ? i : -1).filter(i=>i>=0);
    inControl = outOfControlPoints.length === 0;
  } else if (['p','np','c','u'].includes(chartType)) {
    // Attributes charts: expect measurements as counts/defects and subgroup sizes
    const subgroupCounts = Array.isArray(input.subgroupCounts) ? input.subgroupCounts.map(Number) : [];
    const defectCounts = measurements;
    const n = subgroupCounts.length ? mean(subgroupCounts) : (input.subgroupSize || subgroupSize);
    if (chartType === 'p' || chartType === 'np') {
      const totalDefects = defectCounts.reduce((a,b)=>a+(Number.isFinite(b)?b:0),0);
      const totalUnits = subgroupCounts.reduce((a,b)=>a+(Number.isFinite(b)?b:0),0) || (defectCounts.length * n);
      const pbar = totalUnits ? totalDefects/totalUnits : 0;
      const se = Math.sqrt((pbar*(1-pbar))/n);
      ucl = pbar + 3*se; lcl = Math.max(0,pbar - 3*se);
      centerLine = pbar;
      plotPoints = defectCounts.map((d,i)=> (totalUnits ? (d / (subgroupCounts[i]||n)) : (d/n)));
      outOfControlPoints = plotPoints.map((v,i)=> (v>ucl||v<lcl) ? i : -1).filter(i=>i>=0);
      inControl = outOfControlPoints.length===0;
    } else { // c or u
      const lambda = defectCounts.length ? mean(defectCounts) : 0;
      if (chartType === 'c') {
        centerLine = lambda;
        ucl = centerLine + 3*Math.sqrt(centerLine);
        lcl = Math.max(0, centerLine - 3*Math.sqrt(centerLine));
        outOfControlPoints = defectCounts.map((d,i)=> (d>ucl||d<lcl) ? i : -1).filter(i=>i>=0);
      } else { // u
        const units = subgroupCounts.length ? mean(subgroupCounts) : n;
        centerLine = lambda/units;
        ucl = centerLine + 3*Math.sqrt(centerLine/units);
        lcl = Math.max(0, centerLine - 3*Math.sqrt(centerLine/units));
        plotPoints = defectCounts.map((d,i)=> d/(subgroupCounts[i]||units));
        outOfControlPoints = plotPoints.map((v,i)=> (v>ucl||v<lcl) ? i : -1).filter(i=>i>=0);
      }
      inControl = outOfControlPoints.length===0;
    }
  } else {
    // fallback: compute simple 3-sigma limits over measurements
    centerLine = mean(measurements);
    const s = std(measurements);
    ucl = centerLine + 3*s; lcl = centerLine - 3*s;
    outOfControlPoints = measurements.map((v,i)=> (v>ucl||v<lcl) ? i : -1).filter(i=>i>=0);
    inControl = outOfControlPoints.length===0;
  }

  return {
    event: { type: 'CHART_POINTS_UPDATED', category: 'quality', severity: inControl ? 'low' : 'high' },
    asset: event.asset,
    data: {
      chartId: `CHART-${characteristicId}`,
      ucl,
      lcl,
      centerLine,
      plotPoints,
      outOfControlPoints,
      inControl
    }
  };
}
