import { Download } from "lucide-react";
import { buildSvgDocument, downloadSvg } from "../geometry/svgExport";
import { useProjectStore } from "../state/projectStore";
import { getStrokeUnitDefinition } from "../strokeUnits";
import type { Panel, TemplateLayout } from "../types";
import { getUnitDefinition } from "../units";
import styles from "./ControlsPanel.module.css";

type TemplateControlsPanelProps = {
  panels: Panel[];
};

export function TemplateControlsPanel({ panels }: TemplateControlsPanelProps) {
  const project = useProjectStore((state) => state.project);
  const unitDefinition = getUnitDefinition(project.unitSystem);
  const setTemplateLayout = useProjectStore((state) => state.setTemplateLayout);
  const setAlternatingStripOffset = useProjectStore((state) => state.setAlternatingStripOffset);
  const setExportPadding = useProjectStore((state) => state.setExportPadding);
  const setStrokeWidth = useProjectStore((state) => state.setStrokeWidth);
  const strokeDefinition = getStrokeUnitDefinition(project.stroke.unit);

  function handleExport() {
    const svg = buildSvgDocument(panels, project);
    downloadSvg(svg, "flattened-template.svg");
  }

  return (
    <aside className={styles.panel} aria-label="Template settings">
      <section className={styles.group}>
        <label htmlFor="template-layout">Template setup</label>
        <select
          aria-label="Template setup"
          data-testid="template-layout"
          id="template-layout"
          value={project.templateLayout}
          onChange={(event) => setTemplateLayout(event.target.value as TemplateLayout)}
        >
          <option value="radialFan">Radial fan</option>
          <option value="alternatingStrip">Alternating strip</option>
          <option value="singlePanel">Single panel</option>
        </select>
      </section>

      {project.templateLayout === "alternatingStrip" ? (
        <section className={styles.group}>
          <div className={styles.labelRow}>
            <label htmlFor="alternating-strip-offset">Alternate offset</label>
            <span>{project.alternatingStripOffset}%</span>
          </div>
          <input
            data-testid="alternating-strip-offset"
            id="alternating-strip-offset"
            max={100}
            min={-100}
            step={1}
            type="range"
            value={project.alternatingStripOffset}
            onChange={(event) => setAlternatingStripOffset(Number(event.target.value))}
          />
        </section>
      ) : null}

      <section className={styles.group}>
        <div className={styles.labelRow}>
          <label htmlFor="export-padding">Padding</label>
          <span>{unitDefinition.unit}</span>
        </div>
        <input
          aria-label={`Export padding in ${unitDefinition.unit}`}
          data-testid="export-padding"
          id="export-padding"
          inputMode="decimal"
          max={unitDefinition.exportPadding * 40}
          min={0}
          step={unitDefinition.step}
          type="number"
          value={project.exportPadding}
          onChange={(event) => setExportPadding(Number(event.target.value))}
        />
        <p className={styles.helpText}>Added to each side of the exported SVG bounds.</p>
      </section>

      <section className={styles.group}>
        <div className={styles.labelRow}>
          <label htmlFor="stroke">Stroke</label>
          <span>{strokeDefinition.suffix}</span>
        </div>
        <input
          aria-label={`Stroke width in ${strokeDefinition.suffix}`}
          data-testid="stroke-width"
          id="stroke"
          inputMode="decimal"
          max={strokeDefinition.max}
          min={strokeDefinition.min}
          step={strokeDefinition.step}
          type="number"
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
