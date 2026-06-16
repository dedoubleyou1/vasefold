import * as Tooltip from "@radix-ui/react-tooltip";
import { useMemo } from "react";
import { ConstructionPreview3D } from "./components/ConstructionPreview3D";
import { ControlsPanel } from "./components/ControlsPanel";
import { ExportToolbar } from "./components/ExportToolbar";
import { ProfileEditor } from "./components/ProfileEditor";
import { TemplatePreview } from "./components/TemplatePreview";
import { sampleBezierProfile, scaleProfileToDimensions } from "./geometry/bezier";
import { buildFlattenedPanels } from "./geometry/panels";
import { useProjectStore } from "./state/projectStore";
import styles from "./App.module.css";

export default function App() {
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
        <ExportToolbar panels={panels} />
        <main className={styles.workspace}>
          <ControlsPanel />
          <div className={styles.editorGrid}>
            <ProfileEditor />
            <div className={styles.previewStack}>
              <ConstructionPreview3D
                revolveDegrees={project.revolveDegrees}
                panelApproximation={project.panelApproximation}
                samples={samples}
                sectionCount={project.sectionCount}
              />
              <TemplatePreview panels={panels} settings={project} />
            </div>
          </div>
        </main>
      </div>
    </Tooltip.Provider>
  );
}
