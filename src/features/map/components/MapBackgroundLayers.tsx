import { Layer, Shape, Line } from 'react-konva';
import { valorantMap } from '@/shared/data/valorantMap';

/**
 * MapBackgroundLayers renders the static map geometry:
 * Layer 1: walkable floor polygons
 * Layer 2: box walkable areas (with cyan outline)
 * Layer 3: named areas (with cyan fill + stroke)
 * Layer 4: walls (white lines)
 */
const MapBackgroundLayers = () => {
  return (
    <>
      <Layer>
        {valorantMap.walkableFloor.map((poly, idx) => (
          <Shape
            key={`floor-${idx}`}
            sceneFunc={(ctx) => {
              ctx.beginPath();
              ctx.moveTo(poly[0].x, poly[0].y);
              poly.forEach((p) => ctx.lineTo(p.x, p.y));
              ctx.closePath();
              ctx.fillStyle = 'rgba(13, 41, 59, 0.35)';
              ctx.fill();
            }}
          />
        ))}
        {valorantMap.boxWalkable.map((poly, idx) => (
          <Shape
            key={`box-${idx}`}
            sceneFunc={(ctx) => {
              ctx.beginPath();
              ctx.moveTo(poly[0].x, poly[0].y);
              poly.forEach((p) => ctx.lineTo(p.x, p.y));
              ctx.closePath();
              ctx.fillStyle = 'rgba(13, 41, 59, 0.45)';
              ctx.fill();
              ctx.strokeStyle = 'rgba(28, 225, 207, 0.6)';
              ctx.lineWidth = 1;
              ctx.stroke();
            }}
          />
        ))}
      </Layer>

      <Layer>
        {valorantMap.areas.map((area) => (
          <Shape
            key={area.id}
            sceneFunc={(ctx) => {
              ctx.beginPath();
              ctx.moveTo(area.polygon[0].x, area.polygon[0].y);
              area.polygon.forEach((p) => ctx.lineTo(p.x, p.y));
              ctx.closePath();
              ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
              ctx.fill();
              ctx.strokeStyle = '#0ff';
              ctx.stroke();
            }}
          />
        ))}
      </Layer>

      <Layer>
        {valorantMap.walls.map((wall) => (
          <Line
            key={wall.id}
            points={[wall.line[0].x, wall.line[0].y, wall.line[1].x, wall.line[1].y]}
            stroke="#fff"
            strokeWidth={3}
          />
        ))}
      </Layer>
    </>
  );
};

export default MapBackgroundLayers;