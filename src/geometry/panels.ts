import type { Bounds, Panel, Point, ProfileSample } from "../types";

const EPSILON = 0.000001;

export function buildFlattenedPanels(
  samples: ProfileSample[],
  sectionCount: number,
  revolveDegrees = 360,
): Panel[] {
  const count = Math.max(1, Math.round(sectionCount));
  const revolveFraction = Math.min(360, Math.max(1, revolveDegrees)) / 360;
  const sweepRadians = Math.PI * 2 * revolveFraction;
  const panels: Panel[] = [];

  for (let sectionIndex = 0; sectionIndex < count; sectionIndex += 1) {
    const centerAngle = (sectionIndex / count) * sweepRadians;
    const leftPoints: Point[] = [];
    const rightPoints: Point[] = [];

    for (const sample of samples) {
      const panelArcLength = (Math.PI * 2 * sample.point.x * revolveFraction) / count;
      const angleWidth = sample.length > EPSILON ? panelArcLength / sample.length : 0;
      const leftAngle = centerAngle - angleWidth / 2;
      const rightAngle = centerAngle + angleWidth / 2;

      leftPoints.push({
        x: Math.cos(leftAngle) * sample.length,
        y: Math.sin(leftAngle) * sample.length,
      });
      rightPoints.push({
        x: Math.cos(rightAngle) * sample.length,
        y: Math.sin(rightAngle) * sample.length,
      });
    }

    panels.push({
      id: `panel-${sectionIndex + 1}`,
      points: [...leftPoints, ...rightPoints.reverse()],
    });
  }

  return panels;
}

export function getBounds(points: Point[]): Bounds {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 1, maxY: 1, width: 1, height: 1 };
  }

  const minX = Math.min(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxX = Math.max(...points.map((point) => point.x));
  const maxY = Math.max(...points.map((point) => point.y));

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(EPSILON, maxX - minX),
    height: Math.max(EPSILON, maxY - minY),
  };
}

export function getPanelBounds(panels: Panel[]): Bounds {
  return getBounds(panels.flatMap((panel) => panel.points));
}

export function panelToPath(panel: Panel): string {
  if (panel.points.length === 0) {
    return "";
  }

  const [firstPoint, ...remainingPoints] = panel.points;
  const commands = [`M ${firstPoint.x.toFixed(3)} ${firstPoint.y.toFixed(3)}`];

  for (const point of remainingPoints) {
    commands.push(`L ${point.x.toFixed(3)} ${point.y.toFixed(3)}`);
  }

  commands.push("Z");
  return commands.join(" ");
}
