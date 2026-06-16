import { describe, expect, it } from "vitest";
import { sampleBezierProfile } from "./bezier";
import { buildAssembledPanelMesh, buildConstructionMesh } from "./mesh";
import { buildFlattenedPanels, panelToPath } from "./panels";
import { buildSvgDocument } from "./svgExport";
import { defaultPreset } from "../presets/presets";
import type { ProjectSettings } from "../types";

const baseProject: ProjectSettings = {
  profile: defaultPreset.profile,
  sectionCount: 7,
  sampleCount: 96,
  revolveDegrees: 360,
  panelApproximation: "circumference",
  exportScale: 1,
  unitSystem: "metric",
  objectDimensions: { height: 160 },
  stroke: { width: 1, color: "#111827", dashArray: "4 2" },
  selectedPreset: defaultPreset.id,
};

describe("Bezier geometry", () => {
  it("keeps sampled endpoints stable", () => {
    const samples = sampleBezierProfile(defaultPreset.profile, 32);

    expect(samples[0].point).toEqual(defaultPreset.profile.p1);
    expect(samples.at(-1)?.point).toEqual(defaultPreset.profile.p4);
  });

  it("returns monotonic accumulated lengths", () => {
    const samples = sampleBezierProfile(defaultPreset.profile, 64);

    for (let index = 1; index < samples.length; index += 1) {
      expect(samples[index].length).toBeGreaterThanOrEqual(samples[index - 1].length);
    }
  });
});

describe("Panel generation", () => {
  it("generates one closed path per section", () => {
    const samples = sampleBezierProfile(defaultPreset.profile, 48);
    const panels = buildFlattenedPanels(samples, 9);

    expect(panels).toHaveLength(9);
    for (const panel of panels) {
      expect(panel.points.length).toBe(samples.length * 2);
      expect(panelToPath(panel).endsWith("Z")).toBe(true);
    }
  });

  it("narrows panel geometry for partial revolutions", () => {
    const samples = sampleBezierProfile(defaultPreset.profile, 48);
    const fullPanels = buildFlattenedPanels(samples, 7, 360);
    const halfPanels = buildFlattenedPanels(samples, 7, 180);

    expect(panelToPath(halfPanels[0])).not.toEqual(panelToPath(fullPanels[0]));
  });

  it("supports inscribed, circumference-matched, and circumscribed panel widths", () => {
    const samples = sampleBezierProfile(defaultPreset.profile, 48);
    const inscribedPanels = buildFlattenedPanels(samples, 7, 360, "inscribed");
    const circumferencePanels = buildFlattenedPanels(samples, 7, 360, "circumference");
    const circumscribedPanels = buildFlattenedPanels(samples, 7, 360, "circumscribed");
    const outerSampleIndex = samples.length - 1;
    const inscribedWidth = getSampleWidth(inscribedPanels[0], outerSampleIndex, samples.length);
    const circumferenceWidth = getSampleWidth(
      circumferencePanels[0],
      outerSampleIndex,
      samples.length,
    );
    const circumscribedWidth = getSampleWidth(
      circumscribedPanels[0],
      outerSampleIndex,
      samples.length,
    );

    expect(inscribedWidth).toBeLessThan(circumferenceWidth);
    expect(circumferenceWidth).toBeLessThan(circumscribedWidth);
  });

  it("spreads partial-revolution panels out in the template layout", () => {
    const samples = sampleBezierProfile(defaultPreset.profile, 48);
    const fullPanels = buildFlattenedPanels(samples, 7, 360);
    const halfPanels = buildFlattenedPanels(samples, 7, 180);
    const fullGap =
      getOuterCenterAngle(fullPanels[1], samples.length) -
      getOuterCenterAngle(fullPanels[0], samples.length);
    const halfGap =
      getOuterCenterAngle(halfPanels[1], samples.length) -
      getOuterCenterAngle(halfPanels[0], samples.length);

    expect(halfGap).toBeCloseTo(fullGap, 5);
  });

  it("keeps a visible top edge when the profile starts away from center", () => {
    const profileWithTopOpening = {
      ...defaultPreset.profile,
      p1: { ...defaultPreset.profile.p1, x: 30 },
    };
    const samples = sampleBezierProfile(profileWithTopOpening, 48);
    const [panel] = buildFlattenedPanels(samples, 7, 360);
    const topLeft = panel.points[0];
    const topRight = panel.points.at(-1)!;
    const topEdgeLength = Math.hypot(topRight.x - topLeft.x, topRight.y - topLeft.y);

    expect(topEdgeLength).toBeGreaterThan(0);
  });

  it("makes adjacent leaves touch at the constraining opening without overlap", () => {
    const profileWithTopOpening = {
      ...defaultPreset.profile,
      p1: { ...defaultPreset.profile.p1, x: 40 },
      p2: { ...defaultPreset.profile.p2, x: 20 },
      p3: { ...defaultPreset.profile.p3, x: 20 },
      p4: { ...defaultPreset.profile.p4, x: 20 },
    };
    const samples = sampleBezierProfile(profileWithTopOpening, 48);
    const panels = buildFlattenedPanels(samples, 7, 360);
    const firstTopRight = getSampleRightPoint(panels[0], 0, samples.length);
    const secondTopLeft = getSampleLeftPoint(panels[1], 0);
    const endpointDistance = Math.hypot(
      secondTopLeft.x - firstTopRight.x,
      secondTopLeft.y - firstTopRight.y,
    );

    expect(endpointDistance).toBeCloseTo(0, 5);
  });
});

function getOuterCenterAngle(
  panel: { points: { x: number; y: number }[] },
  sampleCount: number,
): number {
  const leftOuterPoint = panel.points[sampleCount - 1];
  const rightOuterPoint = panel.points[sampleCount];
  return Math.atan2(
    (leftOuterPoint.y + rightOuterPoint.y) / 2,
    (leftOuterPoint.x + rightOuterPoint.x) / 2,
  );
}

function getSampleLeftPoint(
  panel: { points: { x: number; y: number }[] },
  sampleIndex: number,
): { x: number; y: number } {
  return panel.points[sampleIndex];
}

function getSampleRightPoint(
  panel: { points: { x: number; y: number }[] },
  sampleIndex: number,
  sampleCount: number,
): { x: number; y: number } {
  return panel.points[sampleCount * 2 - sampleIndex - 1];
}

function getSampleWidth(
  panel: { points: { x: number; y: number }[] },
  sampleIndex: number,
  sampleCount: number,
): number {
  const leftPoint = getSampleLeftPoint(panel, sampleIndex);
  const rightPoint = getSampleRightPoint(panel, sampleIndex, sampleCount);
  return Math.hypot(rightPoint.x - leftPoint.x, rightPoint.y - leftPoint.y);
}

describe("Construction mesh", () => {
  it("builds indexed 3D mesh geometry from profile samples", () => {
    const samples = sampleBezierProfile(defaultPreset.profile, 16);
    const mesh = buildConstructionMesh(samples, 360, 7);

    expect(mesh.positions.length).toBeGreaterThan(0);
    expect(mesh.indices.length).toBeGreaterThan(0);
    expect(mesh.positions.length % 3).toBe(0);
    expect(mesh.bounds.height).toBeGreaterThan(0);
    expect(mesh.bounds.maxRadius).toBeGreaterThan(0);
  });

  it("uses a narrower sweep for partial revolutions", () => {
    const samples = sampleBezierProfile(defaultPreset.profile, 16);
    const full = buildConstructionMesh(samples, 360, 7);
    const half = buildConstructionMesh(samples, 180, 7);

    expect(half.bounds.sweepRadians).toBeCloseTo(full.bounds.sweepRadians / 2, 5);
  });

  it("builds one flat assembled panel surface per section", () => {
    const samples = sampleBezierProfile(defaultPreset.profile, 16);
    const mesh = buildAssembledPanelMesh(samples, 270, 5, "inscribed");

    expect(mesh.positions.length / 3).toBe(samples.length * 2 * 5);
    expect(mesh.indices.length).toBe((samples.length - 1) * 6 * 5);
    expect(mesh.bounds.sweepRadians).toBeCloseTo(Math.PI * 1.5, 5);
  });
});

describe("SVG export", () => {
  it("includes derived metric dimensions, a viewBox, and panel metadata", () => {
    const samples = sampleBezierProfile(baseProject.profile, baseProject.sampleCount);
    const panels = buildFlattenedPanels(samples, baseProject.sectionCount);
    const svg = buildSvgDocument(panels, baseProject);

    expect(svg).toMatch(/width="[0-9.]+mm"/);
    expect(svg).toMatch(/height="[0-9.]+mm"/);
    expect(svg).toContain("viewBox=");
    expect(svg).toContain('data-panel-count="7"');
    expect(svg.match(/<path id="panel-/g)).toHaveLength(7);
  });

  it("uses imperial dimensions when the project is set to imperial units", () => {
    const imperialProject: ProjectSettings = {
      ...baseProject,
      unitSystem: "imperial",
      objectDimensions: { height: 6.3 },
    };
    const samples = sampleBezierProfile(imperialProject.profile, imperialProject.sampleCount);
    const panels = buildFlattenedPanels(samples, imperialProject.sectionCount);
    const svg = buildSvgDocument(panels, imperialProject);

    expect(svg).toMatch(/width="[0-9.]+in"/);
    expect(svg).toMatch(/height="[0-9.]+in"/);
  });
});
