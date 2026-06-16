import { describe, expect, it } from "vitest";
import { sampleBezierProfile } from "./bezier";
import { buildFlattenedPanels, panelToPath } from "./panels";
import { buildSvgDocument } from "./svgExport";
import { defaultPreset } from "../presets/presets";
import type { ProjectSettings } from "../types";

const baseProject: ProjectSettings = {
  profile: defaultPreset.profile,
  sectionCount: 7,
  sampleCount: 48,
  revolveDegrees: 360,
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

  it("bunches partial-revolution panels into the selected sweep", () => {
    const samples = sampleBezierProfile(defaultPreset.profile, 48);
    const fullPanels = buildFlattenedPanels(samples, 7, 360);
    const halfPanels = buildFlattenedPanels(samples, 7, 180);
    const fullGap =
      getOuterCenterAngle(fullPanels[1], samples.length) -
      getOuterCenterAngle(fullPanels[0], samples.length);
    const halfGap =
      getOuterCenterAngle(halfPanels[1], samples.length) -
      getOuterCenterAngle(halfPanels[0], samples.length);

    expect(halfGap).toBeCloseTo(fullGap / 2, 5);
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
