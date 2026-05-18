export function calculateRadiusAtDepthForSphere(sagitta, sphereRadius) {
  if (sagitta < 0 || sagitta > sphereRadius * 2) {
    throw new Error("Invalid sagitta");
  }
  const radius = Math.sqrt(2 * sphereRadius * sagitta - sagitta * sagitta);
  return radius;
}

// Minor arc length from sagitta h on a circle of radius R
// s = 2R * acos(1 - h/R)
export function halfArcLenSagitta(sagitta, radius) {
  return radius * Math.acos(1 - sagitta / radius);
}

export function radiusToCircumference(radius) {
  return radius * 2 * Math.PI;
}

export function getPointBetween(p1, p2, t) {
  return {
    x: (1 - t) * p1.x + t * p2.x,
    y: (1 - t) * p1.y + t * p2.y,
  };
}

export function deCasteljau(p1, p2, p3, p4, t) {
  const p12 = getPointBetween(p1, p2, t);
  const p23 = getPointBetween(p2, p3, t);
  const p34 = getPointBetween(p3, p4, t);
  const p123 = getPointBetween(p12, p23, t);
  const p234 = getPointBetween(p23, p34, t);
  return getPointBetween(p123, p234, t);
  x;
}

export function deCasteljauSplit(p1, p2, p3, p4, t) {
  const p1_2 = getPointBetween(p1, p2, t);
  const p2_3 = getPointBetween(p2, p3, t);
  const p3_4 = getPointBetween(p3, p4, t);
  const p12_23 = getPointBetween(p1_2, p2_3, t);
  const p23_34 = getPointBetween(p2_3, p3_4, t);
  const midPoint = getPointBetween(p12_23, p23_34, t);
  return {
    left: [p1, p1_2, p12_23, midPoint],
    right: [midPoint, p23_34, p3_4, p4],
  };
}

export function distanceBetweenPoints(p1, p2) {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

export function simpleApproxCubicBezierLength(p1, p2, p3, p4) {
  const chord = distanceBetweenPoints(p1, p4);
  const contNet =
    distanceBetweenPoints(p1, p2) +
    distanceBetweenPoints(p2, p3) +
    distanceBetweenPoints(p3, p4);
  return (chord + contNet) / 2;
}

export function approximateCubicBezierLength(p1, p2, p3, p4, iterations) {
  let length = 0;
  const lengths = [];

  let nP1 = p1;
  let nP2 = p2;
  let nP3 = p3;
  let nP4 = p4;

  for (let i = iterations; i >= 2; i--) {
    const t = 1 / i;
    const { left, right } = deCasteljauSplit(nP1, nP2, nP3, nP4, t);

    length += simpleApproxCubicBezierLength(...left);
    [nP1, nP2, nP3, nP4] = right;
    lengths.push({ point: { x: nP1.x, y: nP1.y }, length });

    if (i === 2) {
      length += simpleApproxCubicBezierLength(...right);
      lengths.push({ point: { x: nP4.x, y: nP4.y }, length });
    }
  }
  return { length, lengths };
}
