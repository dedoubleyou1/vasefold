import type { PanelApproximation, ProfileSample } from "../types";
import { getPanelEdgeLength, getSweepRadians } from "./panelApproximation";

export type ConstructionMesh = {
  positions: number[];
  indices: number[];
  bounds: {
    height: number;
    maxRadius: number;
    sweepRadians: number;
  };
};

export function buildConstructionMesh(
  samples: ProfileSample[],
  revolveDegrees: number,
  sectionCount: number,
): ConstructionMesh {
  const sweepRadians = getSweepRadians(revolveDegrees);
  const fullSweep = Math.PI * 2;
  const angularSegments = Math.max(8, Math.ceil(sectionCount * 8 * (sweepRadians / fullSweep)));
  const positions: number[] = [];
  const indices: number[] = [];
  const maxY = Math.max(...samples.map((sample) => sample.point.y), 1);
  const maxRadius = Math.max(...samples.map((sample) => sample.point.x), 1);
  const startAngle = sweepRadians >= fullSweep ? 0 : -sweepRadians / 2;

  for (const sample of samples) {
    for (let segment = 0; segment <= angularSegments; segment += 1) {
      const theta = startAngle + (segment / angularSegments) * sweepRadians;
      positions.push(
        Math.cos(theta) * sample.point.x,
        maxY / 2 - sample.point.y,
        Math.sin(theta) * sample.point.x,
      );
    }
  }

  const rowLength = angularSegments + 1;
  for (let row = 0; row < samples.length - 1; row += 1) {
    for (let segment = 0; segment < angularSegments; segment += 1) {
      const topLeft = row * rowLength + segment;
      const topRight = topLeft + 1;
      const bottomLeft = (row + 1) * rowLength + segment;
      const bottomRight = bottomLeft + 1;

      indices.push(topLeft, bottomLeft, topRight);
      indices.push(topRight, bottomLeft, bottomRight);
    }
  }

  return {
    positions,
    indices,
    bounds: {
      height: maxY,
      maxRadius,
      sweepRadians,
    },
  };
}

export function buildAssembledPanelMesh(
  samples: ProfileSample[],
  revolveDegrees: number,
  sectionCount: number,
  approximation: PanelApproximation = "circumference",
): ConstructionMesh {
  const sweepRadians = getSweepRadians(revolveDegrees);
  const count = Math.max(1, Math.round(sectionCount));
  const angleStep = sweepRadians / count;
  const halfAngleTangent = Math.tan(angleStep / 2);
  const positions: number[] = [];
  const indices: number[] = [];
  const maxY = Math.max(...samples.map((sample) => sample.point.y), 1);
  const maxRadius = Math.max(...samples.map((sample) => sample.point.x), 1);
  const fullSweep = Math.PI * 2;
  const startAngle = sweepRadians >= fullSweep ? 0 : -sweepRadians / 2;

  for (let sectionIndex = 0; sectionIndex < count; sectionIndex += 1) {
    const centerAngle = startAngle + ((sectionIndex + 0.5) / count) * sweepRadians;
    const centerDirection = {
      x: Math.cos(centerAngle),
      z: Math.sin(centerAngle),
    };
    const lateralDirection = {
      x: -Math.sin(centerAngle),
      z: Math.cos(centerAngle),
    };
    const sectionOffset = positions.length / 3;

    for (const sample of samples) {
      const panelWidth = getPanelEdgeLength(sample.point.x, sweepRadians, count, approximation);
      const apothem =
        Math.abs(halfAngleTangent) <= 0.000001
          ? sample.point.x
          : panelWidth / (2 * halfAngleTangent);
      const centerX = centerDirection.x * apothem;
      const centerZ = centerDirection.z * apothem;
      const halfWidth = panelWidth / 2;

      positions.push(
        centerX - lateralDirection.x * halfWidth,
        maxY / 2 - sample.point.y,
        centerZ - lateralDirection.z * halfWidth,
        centerX + lateralDirection.x * halfWidth,
        maxY / 2 - sample.point.y,
        centerZ + lateralDirection.z * halfWidth,
      );
    }

    for (let row = 0; row < samples.length - 1; row += 1) {
      const topLeft = sectionOffset + row * 2;
      const topRight = topLeft + 1;
      const bottomLeft = topLeft + 2;
      const bottomRight = topLeft + 3;

      indices.push(topLeft, bottomLeft, topRight);
      indices.push(topRight, bottomLeft, bottomRight);
    }
  }

  return {
    positions,
    indices,
    bounds: {
      height: maxY,
      maxRadius,
      sweepRadians,
    },
  };
}
