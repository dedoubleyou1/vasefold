import type { Panel, ProjectSettings } from "../types";
import { getUnitDefinition } from "../units";
import { getPanelBounds, panelToPath } from "./panels";

const XMLNS = "http://www.w3.org/2000/svg";

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function buildSvgDocument(panels: Panel[], settings: ProjectSettings): string {
  const unitDefinition = getUnitDefinition(settings.unitSystem);
  const bounds = getPanelBounds(panels);
  const margin = unitDefinition.exportMargin / settings.exportScale;
  const exportWidth = Number((bounds.width + margin * 2).toFixed(unitDefinition.decimals));
  const exportHeight = Number((bounds.height + margin * 2).toFixed(unitDefinition.decimals));
  const viewBox = [
    bounds.minX - margin,
    bounds.minY - margin,
    bounds.width + margin * 2,
    bounds.height + margin * 2,
  ]
    .map((value) => Number(value.toFixed(3)))
    .join(" ");
  const dashArray = settings.stroke.dashArray
    ? ` stroke-dasharray="${escapeAttribute(settings.stroke.dashArray)}"`
    : "";

  const panelPaths = panels
    .map(
      (panel) =>
        `  <path id="${panel.id}" d="${panelToPath(panel)}" fill="none" stroke="${escapeAttribute(
          settings.stroke.color,
        )}" stroke-width="${settings.stroke.width}"${dashArray} vector-effect="non-scaling-stroke" />`,
    )
    .join("\n");

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="${XMLNS}" width="${exportWidth}${unitDefinition.unit}" height="${exportHeight}${unitDefinition.unit}" viewBox="${viewBox}" role="img" aria-label="Flattened papercraft template">`,
    `  <title>Flattened Papercraft Template</title>`,
    `  <g id="template-panels" data-panel-count="${panels.length}">`,
    panelPaths,
    `  </g>`,
    `</svg>`,
  ].join("\n");
}

export function downloadSvg(svgMarkup: string, filename: string): void {
  const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
