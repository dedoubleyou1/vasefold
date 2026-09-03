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

export type TemplateLayout = "radialFan" | "alternatingStrip" | "singlePanel";

export type ObjectDimensions = {
  height: number;
};

export type StrokeStyle = {
  width: number;
  unit: StrokeUnit;
  color: string;
  dashArray?: string;
};

export type StrokeUnit = "pt" | "mm";

export type ProjectSettings = {
  profile: ProfileControlPoints;
  sectionCount: number;
  sampleCount: number;
  revolveDegrees: number;
  panelApproximation: PanelApproximation;
  templateLayout: TemplateLayout;
  alternatingStripOffset: number;
  exportPadding: number;
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
