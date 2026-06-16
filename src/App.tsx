import * as Tooltip from "@radix-ui/react-tooltip";
import { useMemo, useState } from "react";
import { ConstructionPreview3D } from "./components/ConstructionPreview3D";
import { ControlsPanel } from "./components/ControlsPanel";
import { ProfileEditor } from "./components/ProfileEditor";
import { TemplateControlsPanel } from "./components/TemplateControlsPanel";
import { TemplatePreview } from "./components/TemplatePreview";
import { sampleBezierProfile, scaleProfileToDimensions } from "./geometry/bezier";
import { buildFlattenedPanels } from "./geometry/panels";
import { useProjectStore } from "./state/projectStore";
import styles from "./App.module.css";

type WorkspaceTab = "edit" | "template";

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("edit");
  const project = useProjectStore((state) => state.project);
  const scaledProfile = useMemo(
    () => scaleProfileToDimensions(project.profile, project.objectDimensions),
    [project.objectDimensions, project.profile],
  );
  const samples = useMemo(
    () => sampleBezierProfile(scaledProfile, project.sampleCount),
    [scaledProfile, project.sampleCount],
  );
  const panels = useMemo(
    () =>
      buildFlattenedPanels(
        samples,
        project.sectionCount,
        project.revolveDegrees,
        project.panelApproximation,
      ),
    [project.panelApproximation, project.revolveDegrees, project.sectionCount, samples],
  );

  return (
    <Tooltip.Provider>
      <div className={styles.appShell}>
        <nav className={styles.tabs} aria-label="Workspace" role="tablist">
          <div className={styles.appName}>VaseFold</div>
          <button
            aria-selected={activeTab === "edit"}
            className={activeTab === "edit" ? styles.tabActive : styles.tab}
            role="tab"
            type="button"
            onClick={() => setActiveTab("edit")}
          >
            Edit
          </button>
          <button
            aria-selected={activeTab === "template"}
            className={activeTab === "template" ? styles.tabActive : styles.tab}
            role="tab"
            type="button"
            onClick={() => setActiveTab("template")}
          >
            Template
          </button>
        </nav>

        {activeTab === "edit" ? (
          <main className={styles.workspace}>
            <ControlsPanel />
            <div className={styles.editGrid}>
              <ProfileEditor />
              <ConstructionPreview3D
                revolveDegrees={project.revolveDegrees}
                panelApproximation={project.panelApproximation}
                samples={samples}
                sectionCount={project.sectionCount}
              />
            </div>
          </main>
        ) : (
          <main className={styles.workspace}>
            <TemplateControlsPanel panels={panels} />
            <div className={styles.templateGrid}>
              <TemplatePreview panels={panels} settings={project} />
            </div>
          </main>
        )}
      </div>
    </Tooltip.Provider>
  );
}
