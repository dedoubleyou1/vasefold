import {
  calculateRadiusAtDepthForSphere,
  halfArcLenSagitta,
  radiusToCircumference,
  deCasteljau,
  simpleApproxCubicBezierLength,
  approximateCubicBezierLength,
} from "./helpers.js";

function drawCircle(context, centerX, centerY, radius) {
  context.strokeStyle = "black";
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  context.stroke();
}

function drawArc(
  context,
  centerX,
  centerY,
  centerAngle,
  arcLength,
  radius,
  strokeColor = "red"
) {
  context.strokeStyle = strokeColor;
  context.beginPath();
  context.arc(
    centerX,
    centerY,
    radius,
    centerAngle - arcLength / 2,
    centerAngle + arcLength / 2
  );
  context.stroke();
}

function drawFlattenedWithCurves(
  context,
  centerX,
  centerY,
  sphereRadius,
  iterations,
  numSections,
  depth
) {
  for (
    let sagitta = depth / iterations;
    sagitta <= depth;
    sagitta += depth / iterations
  ) {
    const radius = calculateRadiusAtDepthForSphere(sagitta, sphereRadius);
    const arcLength = halfArcLenSagitta(sagitta, sphereRadius);
    const circumferenceAtDepth = radiusToCircumference(radius);
    const flattenedArcCircumference = radiusToCircumference(arcLength);
    const scaleFactor = circumferenceAtDepth / flattenedArcCircumference;
    const scaledArcLength = 2 * Math.PI * scaleFactor;

    // drawCircle(context, canvas.width / 2, canvas.height / 2, width / 2);
    for (let i = 0; i < numSections; i++) {
      const angle = (i / numSections) * 2 * Math.PI;
      drawArc(
        context,
        centerX,
        centerY,
        angle,
        scaledArcLength / numSections,
        arcLength
      );
    }
  }
}

function collectPointsForOutlines(
  sphereRadius,
  iterations,
  numSections,
  depth
) {
  // Collect points for each section
  const leftPoints = [];
  const rightPoints = [];
  for (let i = 0; i < numSections; i++) {
    leftPoints.push([]);
    rightPoints.push([]);
  }
  for (
    let sagitta = depth / iterations;
    sagitta <= depth;
    sagitta += depth / iterations
  ) {
    const radius = calculateRadiusAtDepthForSphere(sagitta, sphereRadius);
    const arcLength = halfArcLenSagitta(sagitta, sphereRadius);
    const circumferenceAtDepth = radiusToCircumference(radius);
    const flattenedArcCircumference = radiusToCircumference(arcLength);
    const scaleFactor = circumferenceAtDepth / flattenedArcCircumference;
    const scaledArcLength = 2 * Math.PI * scaleFactor;

    // drawCircle(context, canvas.width / 2, canvas.height / 2, width / 2);
    for (let i = 0; i < numSections; i++) {
      const angle = (i / numSections) * 2 * Math.PI;
      const leftAngle = angle - scaledArcLength / numSections / 2;
      const rightAngle = angle + scaledArcLength / numSections / 2;
      leftPoints[i].push({
        x: Math.cos(leftAngle) * arcLength,
        y: Math.sin(leftAngle) * arcLength,
      });
      rightPoints[i].push({
        x: Math.cos(rightAngle) * arcLength,
        y: Math.sin(rightAngle) * arcLength,
      });
    }
  }
  return { leftPoints, rightPoints };
}

function drawFlattenedWithOutlinesCanvas(
  context,
  centerX,
  centerY,
  sphereRadius,
  iterations,
  numSections
) {
  const { leftPoints, rightPoints } = collectPointsForOutlines(
    sphereRadius,
    iterations,
    numSections
  );
  // Draw outlines
  context.strokeStyle = "blue";
  context.beginPath();
  for (let i = 0; i < numSections; i++) {
    for (let j = 0; j < leftPoints[i].length; j++) {
      const point = leftPoints[i][j];
      if (i === 0 && j === 0) {
        context.moveTo(centerX + point.x, centerY + point.y);
      } else {
        context.lineTo(centerX + point.x, centerY + point.y);
      }
    }
    for (let j = rightPoints[i].length - 1; j >= 0; j--) {
      const point = rightPoints[i][j];
      context.lineTo(centerX + point.x, centerY + point.y);
    }
  }
  context.stroke();
  context.closePath();
}

function drawFlattenedWithOutlinesSVG(
  height,
  width,
  sphereRadius,
  iterations,
  numSections,
  depth
) {
  const { leftPoints, rightPoints } = collectPointsForOutlines(
    sphereRadius,
    iterations,
    numSections,
    depth
  );

  const centerX = width / 2;
  const centerY = height / 2;

  var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  // svg.setAttribute("style", "border: 1px solid black");
  svg.setAttribute("width", height);
  svg.setAttribute("height", width);
  svg.setAttributeNS(
    "http://www.w3.org/2000/xmlns/",
    "xmlns:xlink",
    "http://www.w3.org/1999/xlink"
  );

  const newpath = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  newpath.setAttributeNS(null, "id", "pathIdD");

  const pathStrings = [];
  for (let i = 0; i < numSections; i++) {
    for (let j = 0; j < leftPoints[i].length; j++) {
      const point = leftPoints[i][j];
      const opType = i === 0 && j === 0 ? "M" : "L";
      pathStrings.push(`${opType} ${centerX + point.x},${centerY + point.y}`);
    }
    for (let j = rightPoints[i].length - 1; j >= 0; j--) {
      const point = rightPoints[i][j];
      pathStrings.push(`L ${centerX + point.x},${centerY + point.y}`);
    }
  }
  pathStrings.push("Z");

  newpath.setAttributeNS(null, "d", pathStrings.join(" "));
  newpath.setAttributeNS(null, "stroke", "black");
  newpath.setAttributeNS(null, "stroke-dasharray", "4,2");
  newpath.setAttributeNS(null, "stroke-width", 1);
  newpath.setAttributeNS(null, "opacity", 1);
  newpath.setAttributeNS(null, "fill", "none");

  svg.appendChild(newpath);
  document.body.appendChild(svg);
  return svg;
}

function exportSVGElement(svgElement, filename) {
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.textContent = "Download SVG";
  document.body.appendChild(link);
  // link.click();
  // document.body.removeChild(link);
}

function drawRevolvedBezierCanvas(context, x, y, p2, p3, p4, iterations) {
  const p1 = { x: 0, y: 0 };
  context.strokeStyle = "green";
  for (let i = 0; i <= iterations; i++) {
    const t = i / iterations;
    const point = deCasteljau(p1, p2, p3, p4, t);
    context.beginPath();
    context.ellipse(x, y + point.y, point.x, point.x / 3, 0, 0, 2 * Math.PI);
    context.stroke();
    context.closePath();
    // Revolve point around Y axis and draw
  }
}

function collectPointsForBezierOutlines(p2, p3, p4, iterations, numSections) {
  const p1 = { x: 0, y: 0 };

  // Collect points for each section
  const leftPoints = [];
  const rightPoints = [];
  for (let i = 0; i < numSections; i++) {
    leftPoints.push([]);
    rightPoints.push([]);
  }
  const lengths = approximateCubicBezierLength(
    p1,
    p2,
    p3,
    p4,
    iterations
  ).lengths;

  for (let i = 0; i <= lengths.length - 1; i++) {
    const { point, length } = lengths[i];
    const circumferenceAtDepth = radiusToCircumference(point.x);
    const flattenedArcCircumference = radiusToCircumference(length);
    const scaleFactor = circumferenceAtDepth / flattenedArcCircumference;
    const scaledArcLength = 2 * Math.PI * scaleFactor;

    for (let i = 0; i < numSections; i++) {
      const angle = (i / numSections) * 2 * Math.PI;
      const leftAngle = angle - scaledArcLength / numSections / 2;
      const rightAngle = angle + scaledArcLength / numSections / 2;
      leftPoints[i].push({
        x: Math.cos(leftAngle) * length,
        y: Math.sin(leftAngle) * length,
      });
      rightPoints[i].push({
        x: Math.cos(rightAngle) * length,
        y: Math.sin(rightAngle) * length,
      });
    }
  }
  return { leftPoints, rightPoints };
}

function drawFlattenedRevolvedBezierWithOutlinesSVG(
  height,
  width,
  p2,
  p3,
  p4,
  iterations,
  numSections
) {
  const { leftPoints, rightPoints } = collectPointsForBezierOutlines(
    p2,
    p3,
    p4,
    iterations,
    numSections
  );

  const centerX = width / 2;
  const centerY = height / 2;

  var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  // svg.setAttribute("style", "border: 1px solid black");
  svg.setAttribute("width", height);
  svg.setAttribute("height", width);
  svg.setAttributeNS(
    "http://www.w3.org/2000/xmlns/",
    "xmlns:xlink",
    "http://www.w3.org/1999/xlink"
  );

  const newpath = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  newpath.setAttributeNS(null, "id", "pathIdD");

  const pathStrings = [];
  for (let i = 0; i < numSections; i++) {
    for (let j = 0; j < leftPoints[i].length; j++) {
      const point = leftPoints[i][j];
      const opType = i === 0 && j === 0 ? "M" : "L";
      pathStrings.push(`${opType} ${centerX + point.x},${centerY + point.y}`);
    }
    for (let j = rightPoints[i].length - 1; j >= 0; j--) {
      const point = rightPoints[i][j];
      pathStrings.push(`L ${centerX + point.x},${centerY + point.y}`);
    }
  }
  pathStrings.push("Z");

  newpath.setAttributeNS(null, "d", pathStrings.join(" "));
  newpath.setAttributeNS(null, "stroke", "black");
  newpath.setAttributeNS(null, "stroke-dasharray", "4,2");
  newpath.setAttributeNS(null, "stroke-width", 1);
  newpath.setAttributeNS(null, "opacity", 1);
  newpath.setAttributeNS(null, "fill", "none");

  svg.appendChild(newpath);
  document.body.appendChild(svg);
  return svg;
}

function drawFlattenedRevolvedBezierCanvas(
  context,
  x,
  y,
  p2,
  p3,
  p4,
  iterations,
  numSections
) {
  const p1 = { x: 0, y: 0 };

  const lengths = approximateCubicBezierLength(
    p1,
    p2,
    p3,
    p4,
    iterations
  ).lengths;

  context.strokeStyle = "green";
  for (let i = 0; i <= lengths.length - 1; i++) {
    const { point, length } = lengths[i];
    const circumferenceAtDepth = radiusToCircumference(point.x);
    const flattenedArcCircumference = radiusToCircumference(length);
    console.log({
      point,
      circumferenceAtDepth,
      length,
      flattenedArcCircumference,
    });
    const scaleFactor = circumferenceAtDepth / flattenedArcCircumference;
    const scaledArcLength = 2 * Math.PI * scaleFactor;

    // drawCircle(context, canvas.width / 2, canvas.height / 2, width / 2);
    for (let i = 0; i < numSections; i++) {
      const angle = (i / numSections) * 2 * Math.PI;
      drawArc(
        context,
        x,
        y,
        angle,
        scaledArcLength / numSections,
        length,
        "purple"
      );
    }
  }
}

function init() {
  const canvas = document.getElementById("canvas");
  const context = canvas.getContext("2d");
  const sphereRadius = 100;
  const iterations = 40;
  const numSections = 7;
  const depth = sphereRadius * 2;

  // Dragon Snout Bezier Control Points
  // const p2 = { x: 100, y: 50 };
  // const p3 = { x: 10, y: 70 };
  // const p4 = { x: 100, y: 200 };

  // Dragon Egg Bezier Control Points
  const p2 = { x: 50, y: 0 };
  const p3 = { x: 100, y: 90 };
  const p4 = { x: 60, y: 160 };

  // drawFlattenedWithCurves(
  //   context,
  //   canvas.width / 2,
  //   canvas.height / 2,
  //   sphereRadius,
  //   iterations,
  //   numSections,
  //   depth
  // );

  // drawFlattenedWithOutlinesCanvas(
  //   context,
  //   canvas.width / 2,
  //   canvas.height / 2,
  //   sphereRadius,
  //   iterations,
  //   numSections,
  //   depth
  // );

  drawRevolvedBezierCanvas(
    context,
    canvas.width / 2,
    canvas.height / 2,
    p2,
    p3,
    p4,
    iterations
  );

  console.log(
    simpleApproxCubicBezierLength(
      { x: 0, y: 0 },
      { x: 70, y: 20 },
      { x: 100, y: 120 },
      { x: 100, y: 150 }
    )
  );

  approximateCubicBezierLength(
    { x: 0, y: 0 },
    { x: 70, y: 20 },
    { x: 20, y: 120 },
    { x: 100, y: 150 },
    iterations
  );

  drawFlattenedRevolvedBezierCanvas(
    context,
    canvas.width / 2,
    canvas.height / 2,
    p2,
    p3,
    p4,
    iterations,
    numSections
  );

  // const svg = drawFlattenedWithOutlinesSVG(
  //   640,
  //   640,
  //   sphereRadius,
  //   iterations,
  //   numSections,
  //   depth
  // );

  const svg = drawFlattenedRevolvedBezierWithOutlinesSVG(
    640,
    640,
    p2,
    p3,
    p4,
    iterations,
    numSections
  );

  exportSVGElement(svg, "flattened.svg");
}

init();
