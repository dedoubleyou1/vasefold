import type { StrokeStyle, StrokeUnit, UnitSystem } from "./types";

const MM_PER_INCH = 25.4;
const POINTS_PER_INCH = 72;
const MM_PER_POINT = MM_PER_INCH / POINTS_PER_INCH;

export type StrokeUnitDefinition = {
  id: StrokeUnit;
  label: string;
  suffix: string;
  min: number;
  max: number;
  step: number;
  decimals: number;
};

export const strokeUnitDefinitions: Record<StrokeUnit, StrokeUnitDefinition> = {
  pt: {
    id: "pt",
    label: "Points",
    suffix: "pt",
    min: 0.1,
    max: 6,
    step: 0.1,
    decimals: 2,
  },
  mm: {
    id: "mm",
    label: "Millimeters",
    suffix: "mm",
    min: 0.03,
    max: 2,
    step: 0.01,
    decimals: 3,
  },
};

export function getStrokeUnitDefinition(unit: StrokeUnit): StrokeUnitDefinition {
  return strokeUnitDefinitions[unit];
}

export function getStrokeUnitForSystem(unitSystem: UnitSystem): StrokeUnit {
  return unitSystem === "metric" ? "mm" : "pt";
}

export function clampStrokeWidth(width: number, unit: StrokeUnit): number {
  const definition = getStrokeUnitDefinition(unit);
  return Math.min(definition.max, Math.max(definition.min, width));
}

export function convertStrokeWidth(width: number, from: StrokeUnit, to: StrokeUnit): number {
  if (from === to) {
    return width;
  }

  const millimeters = from === "pt" ? width * MM_PER_POINT : width;
  const converted = to === "pt" ? millimeters / MM_PER_POINT : millimeters;
  const definition = getStrokeUnitDefinition(to);

  return Number(converted.toFixed(definition.decimals));
}

export function formatStrokeWidth(stroke: StrokeStyle): string {
  const definition = getStrokeUnitDefinition(stroke.unit);
  return `${formatDecimal(stroke.width, definition.decimals)}${definition.suffix}`;
}

function formatDecimal(value: number, decimals: number): string {
  return Number(value.toFixed(decimals)).toString();
}
