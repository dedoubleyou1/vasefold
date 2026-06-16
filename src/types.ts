export type Point = {
  x: number;
  y: number;
};

export type ProfileControlPoints = {
  p1: Point;
  p2: Point;
  p3: Point;
  p4: Point;
};

export type PageSize = {
  width: number;
  height: number;
};

export type UnitSystem = "metric" | "imperial";

export type PanelApproximation = "inscribed" | "circumference" | "circumscribed";

export type ObjectDimensions = {
  height: number;
};

export type StrokeStyle = {
  width: number;
  color: string;
  dashArray?: string;
};

export type ProjectSettings = {
  profile: ProfileControlPoints;
  sectionCount: number;
  sampleCount: number;
  revolveDegrees: number;
  panelApproximation: PanelApproximation;
  exportScale: number;
  unitSystem: UnitSystem;
  objectDimensions: ObjectDimensions;
  stroke: StrokeStyle;
  selectedPreset: string;
};

export type ProfileSample = {
  t: number;
  point: Point;
  length: number;
};

export type Panel = {
  id: string;
  points: Point[];
};

export type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
};
