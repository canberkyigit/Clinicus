// Pure geometry helpers shared by the SVG charts (unit-tested).

export function scaleLinear(domainMin, domainMax, rangeMin, rangeMax) {
  const span = domainMax - domainMin || 1;
  return v => rangeMin + ((v - domainMin) / span) * (rangeMax - rangeMin);
}

// Returns SVG path strings for a line and the area under it. `pad` keeps the
// stroke from being clipped at the edges.
export function buildLinePath(values, width, height, pad = 0) {
  if (!width || values.length < 2) return { line: '', area: '', points: [] };
  const max = Math.max(...values);
  const min = Math.min(0, ...values);
  const x = scaleLinear(0, values.length - 1, pad, width - pad);
  const y = scaleLinear(min, max || 1, height - pad, pad);
  const points = values.map((v, i) => ({ x: x(i), y: y(v) }));
  return { ...smoothPath(points, height), points };
}

// Smooth curve through points (horizontal-tangent cubic segments) plus the
// closed area down to `baseline`.
export function smoothPath(points, baseline) {
  if (points.length < 2) return { line: '', area: '' };
  let line = `M${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const midX = (prev.x + cur.x) / 2;
    line += ` C${midX},${prev.y} ${midX},${cur.y} ${cur.x},${cur.y}`;
  }
  const area = `${line} L${points[points.length - 1].x},${baseline} L${points[0].x},${baseline} Z`;
  return { line, area };
}

// Nice rounded upper bound for axis ticks (e.g. 8730 -> 10000).
export function niceMax(value) {
  if (value <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(value)));
  const f = value / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * exp;
}

export function arcPath(cx, cy, r, startAngle, endAngle) {
  const toXY = a => [cx + r * Math.cos(a - Math.PI / 2), cy + r * Math.sin(a - Math.PI / 2)];
  const [x1, y1] = toXY(startAngle);
  const [x2, y2] = toXY(endAngle);
  const large = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2}`;
}

export function donutSegments(data) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total <= 0) return [];
  let start = 0;
  return data.map(d => {
    const fraction = d.value / total;
    const seg = { ...d, fraction, start, end: start + fraction * Math.PI * 2 };
    start = seg.end;
    return seg;
  });
}
