import { useMemo } from "react";
import { getPanelBounds, panelToPath } from "../geometry/panels";
import type { Panel, ProjectSettings } from "../types";
import styles from "./TemplatePreview.module.css";

type TemplatePreviewProps = {
  panels: Panel[];
  settings: ProjectSettings;
};

export function TemplatePreview({ panels, settings }: TemplatePreviewProps) {
  const viewBox = useMemo(() => {
    const bounds = getPanelBounds(panels);
    const margin = Math.max(Number.EPSILON, Math.max(bounds.width, bounds.height) * 0.12);
    return `${bounds.minX - margin} ${bounds.minY - margin} ${bounds.width + margin * 2} ${bounds.height + margin * 2}`;
  }, [panels]);

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
        viewBox={viewBox}
      >
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
