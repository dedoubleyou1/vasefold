import type { ProfileControlPoints } from "../types";

export type Preset = {
  id: string;
  name: string;
  profile: ProfileControlPoints;
};

export const presets: Preset[] = [
  {
    id: "dragon-egg",
    name: "Dragon Egg",
    profile: {
      p1: { x: 0, y: 0 },
      p2: { x: 50, y: 0 },
      p3: { x: 100, y: 90 },
      p4: { x: 60, y: 160 },
    },
  },
  {
    id: "dragon-snout",
    name: "Dragon Snout",
    profile: {
      p1: { x: 0, y: 0 },
      p2: { x: 100, y: 50 },
      p3: { x: 10, y: 70 },
      p4: { x: 100, y: 200 },
    },
  },
  {
    id: "bud-vase",
    name: "Bud Vase",
    profile: {
      p1: { x: 0, y: 0 },
      p2: { x: 34, y: 12 },
      p3: { x: 74, y: 112 },
      p4: { x: 42, y: 190 },
    },
  },
];

export const defaultPreset = presets[0];
