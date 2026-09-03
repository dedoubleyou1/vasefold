import type { Panel, Point, TemplateLayout } from "../types";
import { getBounds, getPanelBounds } from "./panels";

const EPSILON = 0.000001;

export function layoutTemplatePanels(
  panels: Panel[],
  layout: TemplateLayout,
  alternatingOffsetPercent = 0,
): Panel[] {
  switch (layout) {
    case "radialFan":
      return panels;
    case "singlePanel":
      return panels.length > 0 ? [canonicalizePanel(panels[0], false)] : [];
    case "alternatingStrip":
      return layoutAlternatingStrip(panels, alternatingOffsetPercent);
  }
}

function layoutAlternatingStrip(panels: Panel[], alternatingOffsetPercent: number): Panel[] {
  if (panels.length === 0) {
    return [];
  }

  const canonicalPanels = panels.map((panel, index) =>
    offsetAlternatingPanel(
      canonicalizePanel(panel, index % 2 === 1),
      index,
      alternatingOffsetPercent,
    ),
  );
  const placedPanels: Panel[] = [];

  for (const panel of canonicalPanels) {
    const bounds = getBounds(panel.points);
    const xNormalizedPanel = translatePanel(panel, -bounds.minX, 0);
    const xOffset = getPackedXOffset(xNormalizedPanel, placedPanels);
    placedPanels.push(translatePanel(xNormalizedPanel, xOffset, 0));
  }

  return placedPanels.map((panel) => {
    const bounds = getPanelBounds(placedPanels);
    return translatePanel(panel, -bounds.minX, -bounds.minY);
  });
}

function offsetAlternatingPanel(panel: Panel, index: number, offsetPercent: number): Panel {
  if (index % 2 === 0 || Math.abs(offsetPercent) <= EPSILON) {
    return panel;
  }

  const bounds = getBounds(panel.points);
  return translatePanel(panel, 0, (bounds.height * offsetPercent) / 100);
}

function getPackedXOffset(panel: Panel, placedPanels: Panel[]): number {
  return placedPanels.reduce(
    (offset, placedPanel) => Math.max(offset, getRequiredXOffset(placedPanel, panel)),
    0,
  );
}

function getRequiredXOffset(placedPanel: Panel, panel: Panel): number {
  const placedBounds = getBounds(placedPanel.points);
  const panelBounds = getBounds(panel.points);
  const minY = Math.max(placedBounds.minY, panelBounds.minY);
  const maxY = Math.min(placedBounds.maxY, panelBounds.maxY);

  if (maxY < minY) {
    return 0;
  }

  return getSharedYSamples(placedPanel, panel, minY, maxY).reduce((offset, y) => {
    const placedSpan = getHorizontalSpan(placedPanel.points, y);
    const panelSpan = getHorizontalSpan(panel.points, y);

    if (!placedSpan || !panelSpan) {
      return offset;
    }

    return Math.max(offset, placedSpan.maxX - panelSpan.minX);
  }, 0);
}

function getSharedYSamples(firstPanel: Panel, secondPanel: Panel, minY: number, maxY: number) {
  const yValues = [minY, maxY];

  for (const point of [...firstPanel.points, ...secondPanel.points]) {
    if (point.y > minY + EPSILON && point.y < maxY - EPSILON) {
      yValues.push(point.y);
    }
  }

  const sortedValues = yValues
    .sort((first, second) => first - second)
    .filter((value, index, values) => index === 0 || Math.abs(value - values[index - 1]) > EPSILON);
  const samples = [...sortedValues];

  for (let index = 0; index < sortedValues.length - 1; index += 1) {
    samples.push((sortedValues[index] + sortedValues[index + 1]) / 2);
  }

  return samples;
}

function getHorizontalSpan(points: Point[], y: number): { minX: number; maxX: number } | null {
  const intersections: number[] = [];

  for (let index = 0; index < points.length; index += 1) {
    const start = points[index];
    const end = points[(index + 1) % points.length];
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);

    if (Math.abs(end.y - start.y) <= EPSILON) {
      if (Math.abs(y - start.y) <= EPSILON) {
        intersections.push(start.x, end.x);
      }
      continue;
    }

    if (y < minY - EPSILON || y > maxY + EPSILON) {
      continue;
    }

    const t = (y - start.y) / (end.y - start.y);
    if (t >= -EPSILON && t <= 1 + EPSILON) {
      intersections.push(start.x + (end.x - start.x) * t);
    }
  }

  if (intersections.length < 2) {
    return null;
  }

  return {
    minX: Math.min(...intersections),
    maxX: Math.max(...intersections),
  };
}

function canonicalizePanel(panel: Panel, reversed: boolean): Panel {
  if (panel.points.length < 2) {
    return panel;
  }

  const sampleCount = Math.floor(panel.points.length / 2);
  const topCenter = midpoint(panel.points[0], panel.points[panel.points.length - 1]);
  const bottomCenter = midpoint(panel.points[sampleCount - 1], panel.points[sampleCount]);
  const centerlineAngle = Math.atan2(bottomCenter.y - topCenter.y, bottomCenter.x - topCenter.x);
  const rotation = Math.PI / 2 - centerlineAngle;
  const rotatedPoints = panel.points.map((point) => rotateAround(point, topCenter, rotation));
  const normalizedPanel = normalizePanel({ id: panel.id, points: rotatedPoints });

  if (!reversed) {
    return normalizedPanel;
  }

  const bounds = getBounds(normalizedPanel.points);
  return normalizePanel({
    id: panel.id,
    points: normalizedPanel.points.map((point) => ({
      x: point.x,
      y: bounds.maxY - (point.y - bounds.minY),
    })),
  });
}

function normalizePanel(panel: Panel): Panel {
  const bounds = getBounds(panel.points);
  return translatePanel(panel, -bounds.minX, -bounds.minY);
}

function translatePanel(panel: Panel, dx: number, dy: number): Panel {
  return {
    id: panel.id,
    points: panel.points.map((point) => ({
      x: point.x + dx,
      y: point.y + dy,
    })),
  };
}

function midpoint(first: Point, second: Point): Point {
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  };
}

function rotateAround(point: Point, origin: Point, radians: number): Point {
  const x = point.x - origin.x;
  const y = point.y - origin.y;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  };
}
