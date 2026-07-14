import type { CurvePoint } from "../control-types";

export type CurveInterpolation = "monotone" | "smooth";

export const curveViewBoxSize = 268;
export const curveInset = 18;
export const curveGraphSize = 232;
export const curveGraphMax = curveInset + curveGraphSize;
export const curveGridStops = [0.25, 0.5, 0.75] as const;
export const curveHitThreshold = 10;
export const defaultCurveInterpolation = "smooth" satisfies CurveInterpolation;

export function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function normalizeCurvePoints(points: readonly CurvePoint[]): CurvePoint[] {
  return points.map((point) => ({ x: clamp(point.x), y: clamp(point.y) })).sort(sortPointsByX);
}

export function mapPointToSvg(point: CurvePoint): [number, number] {
  return [curveInset + point.x * curveGraphSize, curveGraphMax - point.y * curveGraphSize];
}

export function pointFromSvgEvent(
  event: Pick<PointerEvent, "clientX" | "clientY">,
  svg: SVGSVGElement | null,
): CurvePoint {
  const rect = svg?.getBoundingClientRect();
  if (!rect) {
    return { x: 0, y: 0 };
  }

  const viewBox = svg?.viewBox.baseVal;
  const viewBoxX =
    (viewBox?.x ?? 0) + ((event.clientX - rect.left) / rect.width) * (viewBox?.width ?? rect.width);
  const viewBoxY =
    (viewBox?.y ?? 0) +
    ((event.clientY - rect.top) / rect.height) * (viewBox?.height ?? rect.height);

  return {
    x: clamp((viewBoxX - curveInset) / curveGraphSize),
    y: clamp(1 - (viewBoxY - curveInset) / curveGraphSize),
  };
}

export function constrainCurvePoint(
  points: readonly CurvePoint[],
  index: number,
  point: CurvePoint,
): CurvePoint {
  if (index === 0 || index === points.length - 1) {
    return { x: points[index]?.x ?? point.x, y: point.y };
  }

  const previousPoint = points[index - 1];
  const nextPoint = points[index + 1];
  const minX = (previousPoint?.x ?? 0) + 0.01;
  const maxX = (nextPoint?.x ?? 1) - 0.01;

  return { x: Math.min(maxX, Math.max(minX, point.x)), y: point.y };
}

export function replaceCurvePoint(
  points: readonly CurvePoint[],
  index: number,
  point: CurvePoint,
): CurvePoint[] {
  return normalizeCurvePoints(
    points.map((item, itemIndex) => (itemIndex === index ? point : item)),
  );
}

export function insertCurvePoint(
  points: readonly CurvePoint[],
  point: CurvePoint,
): { index: number; points: CurvePoint[] } {
  const normalizedPoints = normalizeCurvePoints(points);
  const insertIndex = normalizedPoints.findIndex((item) => item.x > point.x);

  if (insertIndex <= 0) {
    return {
      index: 0,
      points: replaceCurvePoint(normalizedPoints, 0, { x: 0, y: point.y }),
    };
  }

  if (insertIndex === -1) {
    const endpointIndex = normalizedPoints.length - 1;

    return {
      index: endpointIndex,
      points: replaceCurvePoint(normalizedPoints, endpointIndex, { x: 1, y: point.y }),
    };
  }

  return {
    index: insertIndex,
    points: normalizeCurvePoints([
      ...normalizedPoints.slice(0, insertIndex),
      point,
      ...normalizedPoints.slice(insertIndex),
    ]),
  };
}

export function removeCurvePoint(points: readonly CurvePoint[], index: number): CurvePoint[] {
  return normalizeCurvePoints(points.filter((_, itemIndex) => itemIndex !== index));
}

export function isPointNearCurve(
  points: readonly CurvePoint[],
  point: CurvePoint,
  threshold = curveHitThreshold,
  interpolation: CurveInterpolation = defaultCurveInterpolation,
): boolean {
  const curvePoint = getCurvePointAtX(points, point.x, interpolation);
  const distance = Math.abs(curvePoint.y - point.y) * curveGraphSize;

  return distance <= threshold;
}

export function getCurvePointAtX(
  points: readonly CurvePoint[],
  x: number,
  interpolation: CurveInterpolation = defaultCurveInterpolation,
): CurvePoint {
  const normalizedPoints = normalizeCurvePoints(points);
  const firstPoint = normalizedPoints[0];

  if (!firstPoint) {
    return { x: clamp(x), y: 0 };
  }

  if (x <= firstPoint.x) {
    return { x: firstPoint.x, y: firstPoint.y };
  }

  for (let index = 1; index < normalizedPoints.length; index += 1) {
    const point = normalizedPoints[index];

    if (point && x <= point.x) {
      return getCurvePointInSegment(normalizedPoints, index, x, interpolation);
    }
  }

  const lastPoint = normalizedPoints[normalizedPoints.length - 1] ?? firstPoint;

  return { x: lastPoint.x, y: lastPoint.y };
}

export function getCurvePath(
  points: readonly CurvePoint[],
  interpolation: CurveInterpolation = defaultCurveInterpolation,
): string {
  const normalizedPoints = normalizeCurvePoints(points);
  const firstPoint = normalizedPoints[0];

  if (!firstPoint) {
    return "";
  }

  const tangents = getCurveTangents(normalizedPoints, interpolation);
  const [startX, startY] = mapPointToSvg(firstPoint);
  let path = `M ${startX} ${startY}`;

  for (let index = 1; index < normalizedPoints.length; index += 1) {
    path += getCurveSegmentPath(normalizedPoints, tangents, index);
  }

  return path;
}

function getCurveSegmentPath(
  points: readonly CurvePoint[],
  tangents: readonly number[],
  index: number,
): string {
  const previousPoint = points[index - 1];
  const point = points[index];
  const deltaX = point.x - previousPoint.x;
  const controlPointOne = {
    x: previousPoint.x + deltaX / 3,
    y: previousPoint.y + (deltaX * (tangents[index - 1] ?? 0)) / 3,
  };
  const controlPointTwo = {
    x: point.x - deltaX / 3,
    y: point.y - (deltaX * (tangents[index] ?? 0)) / 3,
  };
  const [controlOneX, controlOneY] = mapPointToSvg(controlPointOne);
  const [controlTwoX, controlTwoY] = mapPointToSvg(controlPointTwo);
  const [pointX, pointY] = mapPointToSvg(point);

  return ` C ${controlOneX} ${controlOneY} ${controlTwoX} ${controlTwoY} ${pointX} ${pointY}`;
}

function getCurvePointInSegment(
  points: readonly CurvePoint[],
  index: number,
  x: number,
  interpolation: CurveInterpolation,
): CurvePoint {
  const previousPoint = points[index - 1];
  const point = points[index];

  if (!previousPoint || !point) {
    return { x: clamp(x), y: 0 };
  }

  const tangents = getCurveTangents(points, interpolation);
  const deltaX = Math.max(Number.EPSILON, point.x - previousPoint.x);
  const t = clamp((x - previousPoint.x) / deltaX);
  const tSquared = t * t;
  const tCubed = tSquared * t;
  const startTangent = tangents[index - 1] ?? 0;
  const endTangent = tangents[index] ?? 0;
  const y =
    (2 * tCubed - 3 * tSquared + 1) * previousPoint.y +
    (tCubed - 2 * tSquared + t) * deltaX * startTangent +
    (-2 * tCubed + 3 * tSquared) * point.y +
    (tCubed - tSquared) * deltaX * endTangent;

  return { x: clamp(x), y: clamp(y) };
}

function getCurveTangents(
  points: readonly CurvePoint[],
  interpolation: CurveInterpolation,
): number[] {
  return interpolation === "monotone"
    ? getMonotoneTangents(points)
    : getSmoothTangents(points);
}

function getSmoothTangents(points: readonly CurvePoint[]): number[] {
  if (points.length <= 1) {
    return points.map(() => 0);
  }

  if (points.length === 2) {
    const slope = getSlope(points[0], 0, points);

    return [slope, slope];
  }

  return points.map((point, index) => {
    if (index === 0) {
      return getSlope(point, 0, points);
    }

    if (index === points.length - 1) {
      return getSlope(points[index - 1] ?? point, index - 1, points);
    }

    const previousPoint = points[index - 1];
    const nextPoint = points[index + 1];
    const deltaX = Math.max(Number.EPSILON, (nextPoint?.x ?? point.x) - previousPoint.x);

    return ((nextPoint?.y ?? point.y) - previousPoint.y) / deltaX;
  });
}

function getMonotoneTangents(points: readonly CurvePoint[]): number[] {
  if (points.length <= 1) {
    return points.map(() => 0);
  }

  if (points.length === 2) {
    const slope = getSlope(points[0], 0, points);

    return [slope, slope];
  }

  const intervals = points.slice(0, -1).map((point, index) =>
    Math.max(Number.EPSILON, (points[index + 1]?.x ?? point.x) - point.x),
  );
  const slopes = points.slice(0, -1).map((point, index) => getSlope(point, index, points));

  return points.map((_, index) => {
    if (index === 0) {
      return getEndpointTangent({
        adjacentInterval: intervals[1] ?? intervals[0] ?? 1,
        interval: intervals[0] ?? 1,
        adjacentSlope: slopes[1] ?? slopes[0] ?? 0,
        slope: slopes[0] ?? 0,
      });
    }

    if (index === points.length - 1) {
      return getEndpointTangent({
        adjacentInterval: intervals[index - 2] ?? intervals[index - 1] ?? 1,
        interval: intervals[index - 1] ?? 1,
        adjacentSlope: slopes[index - 2] ?? slopes[index - 1] ?? 0,
        slope: slopes[index - 1] ?? 0,
      });
    }

    const leftSlope = slopes[index - 1] ?? 0;
    const rightSlope = slopes[index] ?? 0;

    if (leftSlope * rightSlope <= 0) {
      return 0;
    }

    const leftInterval = intervals[index - 1] ?? 1;
    const rightInterval = intervals[index] ?? 1;
    const leftWeight = 2 * rightInterval + leftInterval;
    const rightWeight = rightInterval + 2 * leftInterval;

    return (
      (leftWeight + rightWeight) /
      (leftWeight / leftSlope + rightWeight / rightSlope)
    );
  });
}

function getEndpointTangent({
  adjacentInterval,
  adjacentSlope,
  interval,
  slope,
}: {
  adjacentInterval: number;
  adjacentSlope: number;
  interval: number;
  slope: number;
}): number {
  const tangent =
    ((2 * interval + adjacentInterval) * slope - interval * adjacentSlope) /
    (interval + adjacentInterval);

  if (Math.sign(tangent) !== Math.sign(slope)) {
    return 0;
  }

  if (
    Math.sign(slope) !== Math.sign(adjacentSlope) &&
    Math.abs(tangent) > Math.abs(3 * slope)
  ) {
    return 3 * slope;
  }

  return tangent;
}

function getSlope(point: CurvePoint, index: number, points: readonly CurvePoint[]): number {
  const nextPoint = points[index + 1];
  const deltaX = Math.max(Number.EPSILON, nextPoint.x - point.x);

  return (nextPoint.y - point.y) / deltaX;
}

function sortPointsByX(left: CurvePoint, right: CurvePoint): number {
  return left.x - right.x;
}
