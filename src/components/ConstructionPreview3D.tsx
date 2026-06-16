import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo, useState } from "react";
import { BufferAttribute, BufferGeometry, DoubleSide } from "three";
import { buildAssembledPanelMesh, buildConstructionMesh } from "../geometry/mesh";
import type { PanelApproximation, ProfileSample } from "../types";
import styles from "./ConstructionPreview3D.module.css";

type ConstructionPreview3DProps = {
  samples: ProfileSample[];
  revolveDegrees: number;
  sectionCount: number;
  panelApproximation: PanelApproximation;
};

type PreviewMode = "smooth" | "flat";

export function ConstructionPreview3D({
  samples,
  revolveDegrees,
  sectionCount,
  panelApproximation,
}: ConstructionPreview3DProps) {
  const [previewMode, setPreviewMode] = useState<PreviewMode>("smooth");
  const meshData = useMemo(
    () =>
      previewMode === "smooth"
        ? buildConstructionMesh(samples, revolveDegrees, sectionCount)
        : buildAssembledPanelMesh(samples, revolveDegrees, sectionCount, panelApproximation),
    [panelApproximation, previewMode, revolveDegrees, samples, sectionCount],
  );
  const cameraDistance = Math.max(meshData.bounds.height, meshData.bounds.maxRadius * 2) * 1.35;

  return (
    <section className={styles.preview} aria-label="3D construction preview">
      <div className={styles.heading}>
        <div>
          <h2>3D construction</h2>
          <span>{revolveDegrees}° sweep</span>
        </div>
        <div aria-label="3D preview mode" className={styles.modeToggle} role="group">
          <button
            aria-pressed={previewMode === "smooth"}
            className={previewMode === "smooth" ? styles.modeActive : styles.modeButton}
            type="button"
            onClick={() => setPreviewMode("smooth")}
          >
            Smooth
          </button>
          <button
            aria-pressed={previewMode === "flat"}
            className={previewMode === "flat" ? styles.modeActive : styles.modeButton}
            data-testid="construction-mode-flat"
            type="button"
            onClick={() => setPreviewMode("flat")}
          >
            Flat panels
          </button>
        </div>
      </div>
      <div className={styles.scene} data-testid="construction-preview-3d">
        <Canvas
          camera={{
            fov: 42,
            near: 0.01,
            far: cameraDistance * 12,
            position: [cameraDistance, cameraDistance * 0.55, cameraDistance],
          }}
          dpr={[1, 2]}
        >
          <color args={["#f8fafc"]} attach="background" />
          <ambientLight intensity={0.65} />
          <directionalLight intensity={1.4} position={[4, 8, 6]} />
          <directionalLight intensity={0.45} position={[-5, 3, -4]} />
          <ConstructedSurface meshData={meshData} />
          <axesHelper
            args={[Math.max(meshData.bounds.height, meshData.bounds.maxRadius * 2) * 0.65]}
          />
          <OrbitControls
            enableDamping
            makeDefault
            maxDistance={cameraDistance * 5}
            minDistance={cameraDistance * 0.25}
          />
        </Canvas>
      </div>
    </section>
  );
}

function ConstructedSurface({ meshData }: { meshData: ReturnType<typeof buildConstructionMesh> }) {
  const geometry = useMemo(() => {
    const bufferGeometry = new BufferGeometry();
    bufferGeometry.setAttribute(
      "position",
      new BufferAttribute(new Float32Array(meshData.positions), 3),
    );
    bufferGeometry.setIndex(meshData.indices);
    bufferGeometry.computeVertexNormals();
    return bufferGeometry;
  }, [meshData]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color="#8ecae6"
        opacity={0.88}
        roughness={0.72}
        side={DoubleSide}
        flatShading
        transparent
      />
    </mesh>
  );
}
