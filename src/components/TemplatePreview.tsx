import { useMemo } from "react";
import { getPanelBounds, panelToPath } from "../geometry/panels";
import { formatStrokeWidth } from "../strokeUnits";
import type { Panel, ProjectSettings } from "../types";
import { getUnitDefinition } from "../units";
import styles from "./TemplatePreview.module.css";

type TemplatePreviewProps = {
  panels: Panel[];
  settings: ProjectSettings;
};

export function TemplatePreview({ panels, settings }: TemplatePreviewProps) {
  const previewGeometry = useMemo(() => {
    const bounds = getPanelBounds(panels);
    const exportBounds = {
      x: bounds.minX - settings.exportPadding,
      y: bounds.minY - settings.exportPadding,
      width: bounds.width + settings.exportPadding * 2,
      height: bounds.height + settings.exportPadding * 2,
    };
    const visualPadding = Math.max(
      Number.EPSILON,
      Math.max(exportBounds.width, exportBounds.height) * 0.08,
    );
    const x = exportBounds.x - visualPadding;
    const y = exportBounds.y - visualPadding;
    const width = exportBounds.width + visualPadding * 2;
    const height = exportBounds.height + visualPadding * 2;

    return {
      exportBounds,
      x,
      y,
      width,
      height,
      viewBox: `${x} ${y} ${width} ${height}`,
    };
  }, [panels, settings.exportPadding]);

  const unitDefinition = getUnitDefinition(settings.unitSystem);
  const gridSpacing = settings.unitSystem === "metric" ? 10 : 0.5;
  const exportSize = `${previewGeometry.exportBounds.width.toFixed(
    unitDefinition.decimals,
  )} × ${previewGeometry.exportBounds.height.toFixed(unitDefinition.decimals)} ${
    unitDefinition.unit
  }`;

  return (
    <section className={styles.preview} aria-label="Flattened template preview">
      <div className={styles.heading}>
        <h2>Template preview</h2>
        <span data-testid="export-size">
          {panels.length} panels · Export {exportSize}
        </span>
      </div>
      <svg
        className={styles.svg}
        data-panel-count={panels.length}
        data-testid="template-preview"
        viewBox={previewGeometry.viewBox}
      >
        <defs>
          <pattern
            id="template-grid"
            width={gridSpacing}
            height={gridSpacing}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${gridSpacing} 0 L 0 0 0 ${gridSpacing}`}
              fill="none"
              stroke="#eef2f6"
              strokeWidth="0.6"
              vectorEffect="non-scaling-stroke"
            />
          </pattern>
        </defs>
        <rect
          x={previewGeometry.x}
          y={previewGeometry.y}
          width={previewGeometry.width}
          height={previewGeometry.height}
          data-grid-unit={unitDefinition.unit}
          data-grid-size={gridSpacing.toFixed(3)}
          data-testid="template-grid"
          fill="url(#template-grid)"
        />
        <rect
          className={styles.exportBounds}
          data-testid="export-bounds"
          fill="none"
          height={previewGeometry.exportBounds.height}
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          width={previewGeometry.exportBounds.width}
          x={previewGeometry.exportBounds.x}
          y={previewGeometry.exportBounds.y}
        />
        {panels.map((panel) => (
          <path
            key={panel.id}
            className={styles.panelPath}
            d={panelToPath(panel)}
            fill="none"
            stroke={settings.stroke.color}
            strokeDasharray={settings.stroke.dashArray}
            strokeWidth={formatStrokeWidth(settings.stroke)}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
    </section>
  );
}
