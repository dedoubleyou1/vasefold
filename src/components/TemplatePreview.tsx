import { useMemo } from "react";
import { getPanelBounds, panelToPath } from "../geometry/panels";
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
    const margin = Math.max(Number.EPSILON, Math.max(bounds.width, bounds.height) * 0.12);
    const x = bounds.minX - margin;
    const y = bounds.minY - margin;
    const width = bounds.width + margin * 2;
    const height = bounds.height + margin * 2;

    return {
      x,
      y,
      width,
      height,
      viewBox: `${x} ${y} ${width} ${height}`,
    };
  }, [panels]);

  const unitDefinition = getUnitDefinition(settings.unitSystem);
  const gridSpacing = settings.unitSystem === "metric" ? 10 : 0.5;

  return (
    <section className={styles.preview} aria-label="Flattened template preview">
      <div className={styles.heading}>
        <h2>Template preview</h2>
        <span>{panels.length} panels</span>
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
        {panels.map((panel) => (
          <path
            key={panel.id}
            className={styles.panelPath}
            d={panelToPath(panel)}
            fill="none"
            stroke={settings.stroke.color}
            strokeDasharray={settings.stroke.dashArray}
            strokeWidth={settings.stroke.width}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
    </section>
  );
}
