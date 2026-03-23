// src/lib/svgPath.ts
// Pure function: builds SVG path `d` string from bend segments.
// No React, no side effects.

export type Segment =
  | { type: 'line'; length: number }
  | { type: 'arc'; radius: number; angleDeg: number; sweepFlag: 0 | 1 }

export interface SegmentEndpoint {
  x: number
  y: number
  headingDeg: number  // 0 = rightward, 90 = downward
}

export interface PathResult {
  d: string
  boundingBox: { x: number; y: number; width: number; height: number }
  segmentEndpoints: SegmentEndpoint[]
}

const DEG_TO_RAD = Math.PI / 180

function toRad(deg: number): number {
  return deg * DEG_TO_RAD
}

/**
 * Build an SVG path `d` string from an ordered array of conduit segments.
 *
 * @param segments   Array of line or arc segments
 * @param startX     Starting X in SVG units
 * @param startY     Starting Y in SVG units
 * @param startHeadingDeg  Initial direction: 0=right, 90=down, 180=left, 270=up
 * @param diagramScale    Conversion: 1 inch = how many SVG units
 */
export function buildConduitPath(
  segments: Segment[],
  startX: number,
  startY: number,
  startHeadingDeg: number,
  diagramScale: number
): PathResult {
  let x = startX
  let y = startY
  let headingDeg = startHeadingDeg   // current travel direction

  const points: Array<{ x: number; y: number }> = [{ x, y }]
  const endpoints: SegmentEndpoint[] = []

  let dStr = `M ${x.toFixed(3)} ${y.toFixed(3)}`

  for (const seg of segments) {
    if (seg.type === 'line') {
      const length = seg.length * diagramScale
      const dx = length * Math.cos(toRad(headingDeg))
      const dy = length * Math.sin(toRad(headingDeg))
      x += dx
      y += dy
      dStr += ` L ${x.toFixed(3)} ${y.toFixed(3)}`
      points.push({ x, y })
      endpoints.push({ x, y, headingDeg })
    } else if (seg.type === 'arc') {
      // Arc: sweep an angle of angleDeg around a center offset perpendicular to current heading.
      // sweepFlag: 0 = counter-clockwise, 1 = clockwise (in SVG coordinates where Y increases down)
      const radius = seg.radius * diagramScale
      const angleDeg = seg.angleDeg

      // The center of the arc is 90° left (CCW) or right (CW) of the current heading.
      // sweepFlag 1 = CW in screen coords = turn right
      // sweepFlag 0 = CCW in screen coords = turn left
      const perpOffset = seg.sweepFlag === 1 ? 90 : -90
      const centerAngleRad = toRad(headingDeg + perpOffset)
      const cx = x + radius * Math.cos(centerAngleRad)
      const cy = y + radius * Math.sin(centerAngleRad)

      // Compute the new heading after sweeping angleDeg
      const deltaHeading = seg.sweepFlag === 1 ? angleDeg : -angleDeg
      const newHeadingDeg = headingDeg + deltaHeading

      // Compute the end point of the arc
      const endAngleFromCenter = toRad(newHeadingDeg + (seg.sweepFlag === 1 ? -90 : 90))
      const endX = cx + radius * Math.cos(endAngleFromCenter)
      const endY = cy + radius * Math.sin(endAngleFromCenter)

      // SVG arc: A rx ry x-rotation large-arc-flag sweep-flag x y
      const largeArcFlag = angleDeg > 180 ? 1 : 0

      dStr += ` A ${radius.toFixed(3)} ${radius.toFixed(3)} 0 ${largeArcFlag} ${seg.sweepFlag} ${endX.toFixed(3)} ${endY.toFixed(3)}`

      x = endX
      y = endY
      headingDeg = newHeadingDeg
      points.push({ x, y })
      endpoints.push({ x, y, headingDeg })
    }
  }

  // Compute bounding box
  const xs = points.map(p => p.x)
  const ys = points.map(p => p.y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const maxX = Math.max(...xs)
  const maxY = Math.max(...ys)

  return {
    d: dStr,
    boundingBox: {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    },
    segmentEndpoints: endpoints,
  }
}

/**
 * Generate the segments array for a standard two-bend offset.
 * The conduit runs in 3 sections: straight → bend1 → angled → bend2 → straight.
 *
 * @param rise           Perpendicular offset in inches
 * @param thetaDeg       Bend angle in degrees
 * @param centerlineRadius  Bender shoe centerline radius in inches
 * @param legLength      Length of the straight section before/after the offset (inches)
 */
export function offsetSegments(
  rise: number,
  thetaDeg: number,
  centerlineRadius: number,
  legLength: number
): Segment[] {
  // Distance between bend marks along the conduit (hypotenuse)
  const distBetween = rise / Math.sin(thetaDeg * DEG_TO_RAD)

  return [
    { type: 'line', length: legLength },
    { type: 'arc', radius: centerlineRadius, angleDeg: thetaDeg, sweepFlag: 1 },
    { type: 'line', length: distBetween },
    { type: 'arc', radius: centerlineRadius, angleDeg: thetaDeg, sweepFlag: 0 },
    { type: 'line', length: legLength },
  ]
}
