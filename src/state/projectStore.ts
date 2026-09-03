import { create } from "zustand";
import { defaultPreset, presets } from "../presets/presets";
import { clampStrokeWidth, convertStrokeWidth, getStrokeUnitForSystem } from "../strokeUnits";
import type {
  PanelApproximation,
  Point,
  ProfileControlPoints,
  ProjectSettings,
  TemplateLayout,
  UnitSystem,
} from "../types";
import { convertDimensions, convertUnitValue, getUnitDefinition } from "../units";

type ControlPointKey = keyof ProfileControlPoints;

type ProjectStore = {
  project: ProjectSettings;
  setControlPoint: (key: ControlPointKey, point: Point) => void;
  setSectionCount: (sectionCount: number) => void;
  setRevolveDegrees: (revolveDegrees: number) => void;
  setPanelApproximation: (panelApproximation: PanelApproximation) => void;
  setTemplateLayout: (templateLayout: TemplateLayout) => void;
  setAlternatingStripOffset: (alternatingStripOffset: number) => void;
  setExportPadding: (exportPadding: number) => void;
  setStrokeWidth: (width: number) => void;
  setUnitSystem: (unitSystem: UnitSystem) => void;
  setObjectHeight: (height: number) => void;
  applyPreset: (presetId: string) => void;
  resetProject: () => void;
};

function createDefaultProject(): ProjectSettings {
  const unitDefinition = getUnitDefinition("metric");
  const strokeUnit = getStrokeUnitForSystem(unitDefinition.id);

  return {
    profile: structuredClone(defaultPreset.profile),
    sectionCount: 7,
    sampleCount: 96,
    revolveDegrees: 360,
    panelApproximation: "circumference",
    templateLayout: "radialFan",
    alternatingStripOffset: 0,
    exportPadding: unitDefinition.exportPadding,
    unitSystem: unitDefinition.id,
    objectDimensions: unitDefinition.defaultDimensions,
    stroke: {
      width: convertStrokeWidth(0.5, "pt", strokeUnit),
      unit: strokeUnit,
      color: "#1f2937",
      dashArray: "4 2",
    },
    selectedPreset: defaultPreset.id,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export const useProjectStore = create<ProjectStore>((set) => ({
  project: createDefaultProject(),
  setControlPoint: (key, point) =>
    set((state) => ({
      project: {
        ...state.project,
        profile: {
          ...state.project.profile,
          [key]: {
            x: clamp(point.x, 0, 180),
            y:
              key === "p1" || key === "p4"
                ? state.project.profile[key].y
                : clamp(point.y, -20, 240),
          },
        },
      },
    })),
  setSectionCount: (sectionCount) =>
    set((state) => ({
      project: {
        ...state.project,
        sectionCount: clamp(Math.round(sectionCount), 3, 24),
      },
    })),
  setRevolveDegrees: (revolveDegrees) =>
    set((state) => ({
      project: {
        ...state.project,
        revolveDegrees: clamp(Math.round(revolveDegrees), 1, 360),
      },
    })),
  setPanelApproximation: (panelApproximation) =>
    set((state) => ({
      project: {
        ...state.project,
        panelApproximation,
      },
    })),
  setTemplateLayout: (templateLayout) =>
    set((state) => ({
      project: {
        ...state.project,
        templateLayout,
      },
    })),
  setAlternatingStripOffset: (alternatingStripOffset) =>
    set((state) => ({
      project: {
        ...state.project,
        alternatingStripOffset: clamp(Math.round(alternatingStripOffset), -100, 100),
      },
    })),
  setExportPadding: (exportPadding) =>
    set((state) => ({
      project: {
        ...state.project,
        exportPadding: clampPadding(exportPadding, state.project.unitSystem),
      },
    })),
  setStrokeWidth: (width) =>
    set((state) => ({
      project: {
        ...state.project,
        stroke: {
          ...state.project.stroke,
          width: clampStrokeWidth(width, state.project.stroke.unit),
        },
      },
    })),
  setUnitSystem: (unitSystem) =>
    set((state) => {
      const strokeUnit = getStrokeUnitForSystem(unitSystem);
      const convertedDimensions = convertDimensions(
        state.project.objectDimensions,
        state.project.unitSystem,
        unitSystem,
      );
      const unitDefinition = getUnitDefinition(unitSystem);
      const convertedExportPadding = Number(
        convertUnitValue(state.project.exportPadding, state.project.unitSystem, unitSystem).toFixed(
          unitDefinition.decimals,
        ),
      );

      return {
        project: {
          ...state.project,
          unitSystem,
          objectDimensions: convertedDimensions,
          exportPadding: clampPadding(convertedExportPadding, unitSystem),
          stroke: {
            ...state.project.stroke,
            unit: strokeUnit,
            width: clampStrokeWidth(
              convertStrokeWidth(state.project.stroke.width, state.project.stroke.unit, strokeUnit),
              strokeUnit,
            ),
          },
        },
      };
    }),
  setObjectHeight: (height) =>
    set((state) => ({
      project: {
        ...state.project,
        objectDimensions: {
          height: clampDimension(height, state.project.unitSystem),
        },
      },
    })),
  applyPreset: (presetId) =>
    set((state) => {
      const preset = presets.find((candidate) => candidate.id === presetId) ?? defaultPreset;
      return {
        project: {
          ...state.project,
          selectedPreset: preset.id,
          profile: structuredClone(preset.profile),
        },
      };
    }),
  resetProject: () => set({ project: createDefaultProject() }),
}));

function clampDimension(value: number, unitSystem: UnitSystem): number {
  const definition = getUnitDefinition(unitSystem);
  return clamp(value, definition.minDimension, definition.maxDimension);
}

function clampPadding(value: number, unitSystem: UnitSystem): number {
  const definition = getUnitDefinition(unitSystem);
  return clamp(value, 0, definition.exportPadding * 40);
}
