import type { Bounds, Panel, PanelApproximation, Point, ProfileSample } from "../types";
import { getPanelEdgeLength, getSweepRadians } from "./panelApproximation";

const EPSILON = 0.000001;

export function buildFlattenedPanels(
  samples: ProfileSample[],
  sectionCount: number,
  revolveDegrees = 360,
  approximation: PanelApproximation = "circumference",
): Panel[] {
  const count = Math.max(1, Math.round(sectionCount));
  const sweepRadians = getSweepRadians(revolveDegrees);
  const layoutAngleStep = count > 1 ? (Math.PI * 2) / count : 0;
  const layoutOffset = getLayoutOffset(
    samples,
    count,
    sweepRadians,
    layoutAngleStep,
    approximation,
  );
  const panels: Panel[] = [];

  for (let sectionIndex = 0; sectionIndex < count; sectionIndex += 1) {
    const centerAngle = sectionIndex * layoutAngleStep;
    const centerDirection = {
      x: Math.cos(centerAngle),
      y: Math.sin(centerAngle),
    };
    const lateralDirection = {
      x: -Math.sin(centerAngle),
      y: Math.cos(centerAngle),
    };
    const leftPoints: Point[] = [];
    const rightPoints: Point[] = [];

    for (const sample of samples) {
      const panelWidth = getPanelEdgeLength(sample.point.x, sweepRadians, count, approximation);
      const centerPoint = {
        x: centerDirection.x * (sample.length + layoutOffset),
        y: centerDirection.y * (sample.length + layoutOffset),
      };

      leftPoints.push({
        x: centerPoint.x - (lateralDirection.x * panelWidth) / 2,
        y: centerPoint.y - (lateralDirection.y * panelWidth) / 2,
      });
      rightPoints.push({
        x: centerPoint.x + (lateralDirection.x * panelWidth) / 2,
        y: centerPoint.y + (lateralDirection.y * panelWidth) / 2,
      });
    }

    panels.push({
      id: `panel-${sectionIndex + 1}`,
      points: [...leftPoints, ...rightPoints.reverse()],
    });
  }

  return panels;
}

function getLayoutOffset(
  samples: ProfileSample[],
  sectionCount: number,
  sweepRadians: number,
  layoutAngleStep: number,
  approximation: PanelApproximation,
): number {
  if (sectionCount <= 1 || layoutAngleStep <= EPSILON) {
    return 0;
  }

  const halfStepTangent = Math.tan(layoutAngleStep / 2);
  if (halfStepTangent <= EPSILON) {
    return 0;
  }

  return samples.reduce((offset, sample) => {
    const panelWidth = getPanelEdgeLength(
      sample.point.x,
      sweepRadians,
      sectionCount,
      approximation,
    );
    const requiredCenterRadius = panelWidth / (2 * halfStepTangent);
    return Math.max(offset, requiredCenterRadius - sample.length);
  }, 0);
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
