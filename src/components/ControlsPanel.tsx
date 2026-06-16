import { deriveMaxDiameter } from "../geometry/bezier";
import { presets } from "../presets/presets";
import { useProjectStore } from "../state/projectStore";
import type { PanelApproximation } from "../types";
import { formatUnitValue, getUnitDefinition } from "../units";
import styles from "./ControlsPanel.module.css";

export function ControlsPanel() {
  const project = useProjectStore((state) => state.project);
  const unitDefinition = getUnitDefinition(project.unitSystem);
  const derivedDiameter = deriveMaxDiameter(project.profile, project.objectDimensions);
  const applyPreset = useProjectStore((state) => state.applyPreset);
  const setSectionCount = useProjectStore((state) => state.setSectionCount);
  const setRevolveDegrees = useProjectStore((state) => state.setRevolveDegrees);
  const setPanelApproximation = useProjectStore((state) => state.setPanelApproximation);
  const setUnitSystem = useProjectStore((state) => state.setUnitSystem);
  const setObjectHeight = useProjectStore((state) => state.setObjectHeight);

  return (
    <aside className={styles.panel} aria-label="Edit settings">
      <section className={styles.group}>
        <label htmlFor="preset">Preset</label>
        <select
          id="preset"
          value={project.selectedPreset}
          onChange={(event) => applyPreset(event.target.value)}
        >
          {presets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
      </section>

      <section className={styles.group}>
        <span className={styles.fieldLabel}>Units</span>
        <div
          aria-label="Units"
          className={styles.segmentedControl}
          data-testid="unit-system"
          role="group"
        >
          <button
            aria-pressed={project.unitSystem === "metric"}
            className={project.unitSystem === "metric" ? styles.segmentActive : styles.segment}
            type="button"
            onClick={() => setUnitSystem("metric")}
          >
            Metric
          </button>
          <button
            aria-pressed={project.unitSystem === "imperial"}
            className={project.unitSystem === "imperial" ? styles.segmentActive : styles.segment}
            type="button"
            onClick={() => setUnitSystem("imperial")}
          >
            Imperial
          </button>
        </div>
      </section>

      <section className={styles.group}>
        <div className={styles.labelRow}>
          <label htmlFor="object-height">Vase height</label>
          <span>{unitDefinition.unit}</span>
        </div>
        <input
          aria-label={`Vase height in ${unitDefinition.unit}`}
          data-testid="object-height"
          id="object-height"
          inputMode="decimal"
          max={unitDefinition.maxDimension}
          min={unitDefinition.minDimension}
          step={unitDefinition.step}
          type="number"
          value={project.objectDimensions.height}
          onChange={(event) => setObjectHeight(Number(event.target.value))}
        />
        <p className={styles.helpText}>
          Max diameter derives from the profile:{" "}
          {formatUnitValue(derivedDiameter, project.unitSystem)}
        </p>
      </section>

      <section className={styles.group}>
        <div className={styles.labelRow}>
          <label htmlFor="revolve">Revolve</label>
          <span>{project.revolveDegrees}°</span>
        </div>
        <input
          data-testid="revolve-degrees"
          id="revolve"
          max={360}
          min={1}
          type="range"
          value={project.revolveDegrees}
          onChange={(event) => setRevolveDegrees(Number(event.target.value))}
        />
      </section>

      <section className={styles.group}>
        <div className={styles.labelRow}>
          <label htmlFor="sections">Sections</label>
          <span>{project.sectionCount}</span>
        </div>
        <input
          data-testid="section-count"
          id="sections"
          max={24}
          min={3}
          type="range"
          value={project.sectionCount}
          onChange={(event) => setSectionCount(Number(event.target.value))}
        />
      </section>

      <section className={styles.group}>
        <label htmlFor="panel-approximation">Panel approximation</label>
        <select
          aria-label="Panel approximation"
          data-testid="panel-approximation"
          id="panel-approximation"
          value={project.panelApproximation}
          onChange={(event) => setPanelApproximation(event.target.value as PanelApproximation)}
        >
          <option value="inscribed">Inscribed</option>
          <option value="circumference">Match arc length</option>
          <option value="circumscribed">Circumscribed</option>
        </select>
      </section>
    </aside>
  );
}
