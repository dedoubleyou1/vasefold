import { useMemo } from "react";
import type { ProfileSample } from "../types";
import styles from "./VasePreview.module.css";

type VasePreviewProps = {
  samples: ProfileSample[];
};

export function VasePreview({ samples }: VasePreviewProps) {
  const { path, viewBox } = useMemo(() => {
    if (samples.length === 0) {
      return { path: "", viewBox: "-120 -20 240 260" };
    }

    const right = samples.map(
      (sample) => `${sample.point.x.toFixed(2)} ${sample.point.y.toFixed(2)}`,
    );
    const left = [...samples]
      .reverse()
      .map((sample) => `${(-sample.point.x).toFixed(2)} ${sample.point.y.toFixed(2)}`);
    const maxRadius = Math.max(...samples.map((sample) => sample.point.x));
    const minY = Math.min(...samples.map((sample) => sample.point.y));
    const maxY = Math.max(...samples.map((sample) => sample.point.y));
    const height = Math.max(1, maxY - minY);
    const margin = Math.max(Number.EPSILON, Math.max(maxRadius, height) * 0.12);
    return {
      path: `M ${right.join(" L ")} L ${left.join(" L ")} Z`,
      viewBox: `${-maxRadius - margin} ${minY - margin} ${(maxRadius + margin) * 2} ${
        height + margin * 2
      }`,
    };
  }, [samples]);

  return (
    <section className={styles.preview} aria-label="Revolved vase preview">
      <div className={styles.heading}>
        <h2>Vase preview</h2>
      </div>
      <svg className={styles.svg} data-testid="vase-preview" viewBox={viewBox}>
        <line
          className={styles.axis}
          data-testid="vase-center-line"
          vectorEffect="non-scaling-stroke"
          x1="0"
          x2="0"
          y1="-1000"
          y2="1000"
        />
        <path className={styles.vase} d={path} />
      </svg>
    </section>
  );
}
