import type { PanelApproximation } from "../types";

const FULL_SWEEP = Math.PI * 2;
const EPSILON = 0.000001;

export function getSweepRadians(revolveDegrees: number): number {
  return (Math.min(360, Math.max(1, revolveDegrees)) / 360) * FULL_SWEEP;
}

export function getPanelEdgeLength(
  radius: number,
  sweepRadians: number,
  sectionCount: number,
  approximation: PanelApproximation,
): number {
  const angleStep = sweepRadians / Math.max(1, Math.round(sectionCount));

  if (radius <= EPSILON || angleStep <= EPSILON) {
    return 0;
  }

  switch (approximation) {
    case "inscribed":
      return 2 * radius * Math.sin(angleStep / 2);
    case "circumscribed": {
      const tangent = Math.tan(angleStep / 2);
      return Math.abs(tangent) <= EPSILON ? radius * angleStep : 2 * radius * tangent;
    }
    case "circumference":
      return radius * angleStep;
  }
}
