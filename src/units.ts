import type { ObjectDimensions, UnitSystem } from "./types";

const MM_PER_INCH = 25.4;

export type UnitDefinition = {
  id: UnitSystem;
  label: string;
  unit: "mm" | "in";
  defaultDimensions: ObjectDimensions;
  minDimension: number;
  maxDimension: number;
  step: number;
  decimals: number;
  exportMargin: number;
};

export const unitDefinitions: Record<UnitSystem, UnitDefinition> = {
  metric: {
    id: "metric",
    label: "Metric",
    unit: "mm",
    defaultDimensions: {
      height: 160,
    },
    minDimension: 1,
    maxDimension: 10000,
    step: 1,
    decimals: 0,
    exportMargin: 6,
  },
  imperial: {
    id: "imperial",
    label: "Imperial",
    unit: "in",
    defaultDimensions: {
      height: 6.3,
    },
    minDimension: 0.04,
    maxDimension: 400,
    step: 0.125,
    decimals: 3,
    exportMargin: 0.25,
  },
};

export function getUnitDefinition(unitSystem: UnitSystem): UnitDefinition {
  return unitDefinitions[unitSystem];
}

export function convertUnitValue(value: number, from: UnitSystem, to: UnitSystem): number {
  if (from === to) {
    return value;
  }

  if (from === "metric") {
    return value / MM_PER_INCH;
  }

  return value * MM_PER_INCH;
}

export function convertDimensions(
  dimensions: ObjectDimensions,
  from: UnitSystem,
  to: UnitSystem,
): ObjectDimensions {
  const definition = getUnitDefinition(to);
  return {
    height: Number(convertUnitValue(dimensions.height, from, to).toFixed(definition.decimals)),
  };
}

export function formatUnitValue(value: number, unitSystem: UnitSystem): string {
  const definition = getUnitDefinition(unitSystem);
  return `${value.toFixed(definition.decimals)} ${definition.unit}`;
}
