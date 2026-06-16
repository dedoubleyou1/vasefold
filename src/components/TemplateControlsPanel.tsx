import { Download } from "lucide-react";
import { buildSvgDocument, downloadSvg } from "../geometry/svgExport";
import { useProjectStore } from "../state/projectStore";
import type { Panel } from "../types";
import styles from "./ControlsPanel.module.css";

type TemplateControlsPanelProps = {
  panels: Panel[];
};

export function TemplateControlsPanel({ panels }: TemplateControlsPanelProps) {
  const project = useProjectStore((state) => state.project);
  const setExportScale = useProjectStore((state) => state.setExportScale);
  const setStrokeWidth = useProjectStore((state) => state.setStrokeWidth);

  function handleExport() {
    const svg = buildSvgDocument(panels, project);
    downloadSvg(svg, "flattened-template.svg");
  }

  return (
    <aside className={styles.panel} aria-label="Template settings">
      <section className={styles.group}>
        <div className={styles.labelRow}>
          <label htmlFor="scale">Export margin</label>
          <span>{project.exportScale.toFixed(2)}x</span>
        </div>
        <input
          id="scale"
          max={4}
          min={0.25}
          step={0.25}
          type="range"
          value={project.exportScale}
          onChange={(event) => setExportScale(Number(event.target.value))}
        />
        <p className={styles.helpText}>
          SVG size is calculated from the flattened template bounds.
        </p>
      </section>

      <section className={styles.group}>
        <div className={styles.labelRow}>
          <label htmlFor="stroke">Stroke</label>
          <span>{project.stroke.width.toFixed(1)}</span>
        </div>
        <input
          id="stroke"
          max={5}
          min={0.2}
          step={0.1}
          type="range"
          value={project.stroke.width}
          onChange={(event) => setStrokeWidth(Number(event.target.value))}
        />
      </section>

      <button
        className={styles.exportButton}
        data-testid="export-svg"
        type="button"
        onClick={handleExport}
      >
        <Download size={18} strokeWidth={2} />
        Export SVG
      </button>
    </aside>
  );
}
