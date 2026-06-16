import * as Tooltip from "@radix-ui/react-tooltip";
import { useMemo } from "react";
import { ControlsPanel } from "./components/ControlsPanel";
import { ExportToolbar } from "./components/ExportToolbar";
import { ProfileEditor } from "./components/ProfileEditor";
import { TemplatePreview } from "./components/TemplatePreview";
import { VasePreview } from "./components/VasePreview";
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
    () => buildFlattenedPanels(samples, project.sectionCount, project.revolveDegrees),
    [samples, project.revolveDegrees, project.sectionCount],
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
              <VasePreview samples={samples} />
              <TemplatePreview panels={panels} settings={project} />
            </div>
          </div>
        </main>
      </div>
    </Tooltip.Provider>
  );
}
