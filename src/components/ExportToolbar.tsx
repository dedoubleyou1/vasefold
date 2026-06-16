import { Download, RotateCcw } from "lucide-react";
import { buildSvgDocument, downloadSvg } from "../geometry/svgExport";
import { useProjectStore } from "../state/projectStore";
import type { Panel } from "../types";
import { TooltipIconButton } from "./TooltipIconButton";
import styles from "./ExportToolbar.module.css";

type ExportToolbarProps = {
  panels: Panel[];
};

export function ExportToolbar({ panels }: ExportToolbarProps) {
  const project = useProjectStore((state) => state.project);
  const resetProject = useProjectStore((state) => state.resetProject);

  function handleExport() {
    const svg = buildSvgDocument(panels, project);
    downloadSvg(svg, "flattened-template.svg");
  }

  return (
    <header className={styles.toolbar}>
      <div>
        <h1>Flatten Revolved Curve</h1>
        <p>Design a vase profile and export a printable papercraft template.</p>
      </div>
      <div className={styles.actions}>
        <TooltipIconButton label="Reset project" onClick={resetProject}>
          <RotateCcw size={18} strokeWidth={2} />
        </TooltipIconButton>
        <button
          className={styles.exportButton}
          data-testid="export-svg"
          type="button"
          onClick={handleExport}
        >
          <Download size={18} strokeWidth={2} />
          Export SVG
        </button>
      </div>
    </header>
  );
}
