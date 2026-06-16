import type { ObjectDimensions, Point, ProfileControlPoints, ProfileSample } from "../types";

export function pointBetween(start: Point, end: Point, t: number): Point {
  return {
    x: (1 - t) * start.x + t * end.x,
    y: (1 - t) * start.y + t * end.y,
  };
}

export function deCasteljau({ p1, p2, p3, p4 }: ProfileControlPoints, t: number): Point {
  const p12 = pointBetween(p1, p2, t);
  const p23 = pointBetween(p2, p3, t);
  const p34 = pointBetween(p3, p4, t);
  const p123 = pointBetween(p12, p23, t);
  const p234 = pointBetween(p23, p34, t);
  return pointBetween(p123, p234, t);
}

export function distanceBetweenPoints(start: Point, end: Point): number {
  return Math.hypot(end.x - start.x, end.y - start.y);
}

export function sampleBezierProfile(
  controlPoints: ProfileControlPoints,
  sampleCount: number,
): ProfileSample[] {
  const count = Math.max(2, Math.round(sampleCount));
  const samples: ProfileSample[] = [];
  let accumulatedLength = 0;
  let previousPoint: Point | undefined;

  for (let index = 0; index <= count; index += 1) {
    const t = index / count;
    const point = deCasteljau(controlPoints, t);

    if (previousPoint) {
      accumulatedLength += distanceBetweenPoints(previousPoint, point);
    }

    samples.push({
      t,
      point: {
        x: Math.max(0, point.x),
        y: point.y,
      },
      length: accumulatedLength,
    });
    previousPoint = point;
  }

  return samples;
}

export function scaleProfileToDimensions(
  controlPoints: ProfileControlPoints,
  dimensions: ObjectDimensions,
): ProfileControlPoints {
  const points = [controlPoints.p1, controlPoints.p2, controlPoints.p3, controlPoints.p4];
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const heightScale = dimensions.height / Math.max(1, maxY - minY);

  return {
    p1: scalePoint(controlPoints.p1, minY, heightScale),
    p2: scalePoint(controlPoints.p2, minY, heightScale),
    p3: scalePoint(controlPoints.p3, minY, heightScale),
    p4: scalePoint(controlPoints.p4, minY, heightScale),
  };
}

export function deriveMaxDiameter(
  controlPoints: ProfileControlPoints,
  dimensions: ObjectDimensions,
): number {
  const points = [controlPoints.p1, controlPoints.p2, controlPoints.p3, controlPoints.p4];
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const maxRadius = Math.max(...points.map((point) => point.x));
  const heightScale = dimensions.height / Math.max(1, maxY - minY);
  return maxRadius * heightScale * 2;
}

function scalePoint(point: Point, minY: number, heightScale: number): Point {
  return {
    x: Math.max(0, point.x * heightScale),
    y: (point.y - minY) * heightScale,
  };
}
