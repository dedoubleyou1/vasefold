import { create } from "zustand";
import { defaultPreset, presets } from "../presets/presets";
import type {
  PanelApproximation,
  Point,
  ProfileControlPoints,
  ProjectSettings,
  UnitSystem,
} from "../types";
import { convertDimensions, getUnitDefinition } from "../units";

type ControlPointKey = keyof ProfileControlPoints;

type ProjectStore = {
  project: ProjectSettings;
  setControlPoint: (key: ControlPointKey, point: Point) => void;
  setSectionCount: (sectionCount: number) => void;
  setRevolveDegrees: (revolveDegrees: number) => void;
  setPanelApproximation: (panelApproximation: PanelApproximation) => void;
  setExportScale: (exportScale: number) => void;
  setStrokeWidth: (width: number) => void;
  setUnitSystem: (unitSystem: UnitSystem) => void;
  setObjectHeight: (height: number) => void;
  applyPreset: (presetId: string) => void;
  resetProject: () => void;
};

function createDefaultProject(): ProjectSettings {
  const unitDefinition = getUnitDefinition("metric");

  return {
    profile: structuredClone(defaultPreset.profile),
    sectionCount: 7,
    sampleCount: 96,
    revolveDegrees: 360,
    panelApproximation: "circumference",
    exportScale: 1,
    unitSystem: unitDefinition.id,
    objectDimensions: unitDefinition.defaultDimensions,
    stroke: {
      width: 1,
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
  setExportScale: (exportScale) =>
    set((state) => ({
      project: {
        ...state.project,
        exportScale: clamp(exportScale, 0.25, 4),
      },
    })),
  setStrokeWidth: (width) =>
    set((state) => ({
      project: {
        ...state.project,
        stroke: {
          ...state.project.stroke,
          width: clamp(width, 0.2, 5),
        },
      },
    })),
  setUnitSystem: (unitSystem) =>
    set((state) => {
      const convertedDimensions = convertDimensions(
        state.project.objectDimensions,
        state.project.unitSystem,
        unitSystem,
      );

      return {
        project: {
          ...state.project,
          unitSystem,
          objectDimensions: convertedDimensions,
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
