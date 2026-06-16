import { create } from "zustand";
import { defaultPreset, presets } from "../presets/presets";
import type { Point, ProfileControlPoints, ProjectSettings, UnitSystem } from "../types";
import { convertDimensions, getUnitDefinition } from "../units";

type ControlPointKey = keyof ProfileControlPoints;

type ProjectStore = {
  project: ProjectSettings;
  setControlPoint: (key: ControlPointKey, point: Point) => void;
  setSectionCount: (sectionCount: number) => void;
  setSampleCount: (sampleCount: number) => void;
  setRevolveDegrees: (revolveDegrees: number) => void;
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
    sampleCount: 48,
    revolveDegrees: 360,
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
            x: key === "p1" ? 0 : clamp(point.x, 0, 180),
            y: key === "p4" ? state.project.profile.p4.y : clamp(point.y, -20, 240),
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
  setSampleCount: (sampleCount) =>
    set((state) => ({
      project: {
        ...state.project,
        sampleCount: clamp(Math.round(sampleCount), 8, 160),
      },
    })),
  setRevolveDegrees: (revolveDegrees) =>
    set((state) => ({
      project: {
        ...state.project,
        revolveDegrees: clamp(Math.round(revolveDegrees), 1, 360),
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
