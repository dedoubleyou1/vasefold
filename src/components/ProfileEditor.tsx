import { useMemo, useRef, useState } from "react";
import { deCasteljau } from "../geometry/bezier";
import { useProjectStore } from "../state/projectStore";
import type { Point, ProfileControlPoints } from "../types";
import { getUnitDefinition } from "../units";
import styles from "./ProfileEditor.module.css";

type EditablePoint = Exclude<keyof ProfileControlPoints, "p1">;

const editablePoints: EditablePoint[] = ["p2", "p3", "p4"];

function curvePath(profile: ProfileControlPoints): string {
  return `M ${profile.p1.x} ${profile.p1.y} C ${profile.p2.x} ${profile.p2.y}, ${profile.p3.x} ${profile.p3.y}, ${profile.p4.x} ${profile.p4.y}`;
}

function getRawProfileHeight(profile: ProfileControlPoints): number {
  const points = [profile.p1, profile.p2, profile.p3, profile.p4];
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  return Math.max(1, maxY - minY);
}

function screenToSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number): Point {
  const point = svg.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  const transformed = point.matrixTransform(svg.getScreenCTM()?.inverse());
  return { x: transformed.x, y: transformed.y };
}

export function ProfileEditor() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [activePoint, setActivePoint] = useState<EditablePoint | null>(null);
  const project = useProjectStore((state) => state.project);
  const profile = project.profile;
  const setControlPoint = useProjectStore((state) => state.setControlPoint);

  const grid = useMemo(() => {
    const unitDefinition = getUnitDefinition(project.unitSystem);
    const physicalStep = project.unitSystem === "metric" ? 10 : 0.5;
    const spacing = (physicalStep * getRawProfileHeight(profile)) / project.objectDimensions.height;

    return {
      label: project.unitSystem === "metric" ? "Grid: 1 cm" : "Grid: 1/2 in",
      spacing,
      unit: unitDefinition.unit,
    };
  }, [profile, project.objectDimensions.height, project.unitSystem]);

  const sampledPath = useMemo(() => {
    const commands = [];
    for (let index = 0; index <= 40; index += 1) {
      const point = deCasteljau(profile, index / 40);
      commands.push(`${index === 0 ? "M" : "L"} ${point.x} ${point.y}`);
    }
    return commands.join(" ");
  }, [profile]);

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (!activePoint || !svgRef.current) {
      return;
    }

    setControlPoint(activePoint, screenToSvgPoint(svgRef.current, event.clientX, event.clientY));
  }

  function stopDragging() {
    setActivePoint(null);
  }

  return (
    <section className={styles.editor} aria-label="Profile editor">
      <div className={styles.heading}>
        <h2>Profile</h2>
        <span>{grid.label}</span>
      </div>
      <svg
        ref={svgRef}
        className={styles.svg}
        preserveAspectRatio="xMidYMin meet"
        viewBox="-24 -24 230 290"
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerLeave={stopDragging}
      >
        <defs>
          <pattern
            id="profile-grid"
            width={grid.spacing}
            height={grid.spacing}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${grid.spacing} 0 L 0 0 0 ${grid.spacing}`}
              fill="none"
              stroke="#d8dee6"
              strokeWidth="0.6"
            />
          </pattern>
        </defs>
        <rect
          x="-24"
          y="-24"
          width="230"
          height="290"
          data-grid-unit={grid.unit}
          data-grid-size={grid.spacing.toFixed(3)}
          data-testid="profile-grid"
          fill="url(#profile-grid)"
        />
        <line className={styles.axis} x1="0" x2="0" y1="-18" y2="248" />
        <path
          className={styles.controlLine}
          d={`M ${profile.p1.x} ${profile.p1.y} L ${profile.p2.x} ${profile.p2.y}`}
        />
        <path
          className={styles.controlLine}
          d={`M ${profile.p3.x} ${profile.p3.y} L ${profile.p4.x} ${profile.p4.y}`}
        />
        <path className={styles.curveShadow} d={curvePath(profile)} />
        <path className={styles.curve} d={sampledPath} />
        <circle className={styles.anchor} cx={profile.p1.x} cy={profile.p1.y} r="5" />
        {editablePoints.map((key) => (
          <circle
            key={key}
            className={key === "p4" ? `${styles.handle} ${styles.horizontalHandle}` : styles.handle}
            cx={profile[key].x}
            cy={profile[key].y}
            data-testid={`handle-${key}`}
            r="7"
            tabIndex={0}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              setActivePoint(key);
            }}
          />
        ))}
      </svg>
    </section>
  );
}
