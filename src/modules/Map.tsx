import { useDroppable } from "@dnd-kit/core";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { valorantMap } from "../data/valorantMap";
import { MAP_DROP_ZONE_ID } from "@/constants/dnd";
import { useMapSelectionStore } from "@/store/useMapSelectionStore";
import { Layer, Line, Shape, Stage } from "react-konva";
import "./Map.less";

const Map = () => {
  const side = useMapSelectionStore((s) => s.side);
  const mapWidth = valorantMap.bounds.max.x - valorantMap.bounds.min.x + 100;
  const mapHeight = valorantMap.bounds.max.y - valorantMap.bounds.min.y + 100;
  const defense = side === "defense";

  const { setNodeRef, isOver } = useDroppable({ id: MAP_DROP_ZONE_ID });

    return (
    <div
      ref={setNodeRef}
      className={`map-root${isOver ? " map-root--drop-over" : ""}`}
    >
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={2}
        centerOnInit
        limitToBounds
        /* smooth=true 时 wheel.step 会乘以 |deltaY|（鼠标滚轮单次常≈100），0.1*100≈10 会一次顶满 min/max */
        smooth={false}
        wheel={{ step: 0.1 }}
      >
        <TransformComponent
          wrapperStyle={{
            width: '100%',
            height: '100%',
            maxWidth: '100%',
            maxHeight: '100%',
          }}
        >
          <div
            className={defense ? "map-stage-wrap map-stage-wrap--defense" : "map-stage-wrap"}
            style={{ width: mapWidth, height: mapHeight }}
          >
          <Stage
            width={mapWidth}
            height={mapHeight}
            // onClick={handleMapClick}
            // onTap={handleMapClick}
          >
            {/* 层1：地图区域 */}
            <Layer>
              {valorantMap.areas.map((area) => (
                <Shape
                  key={area.id}
                  sceneFunc={(ctx) => {
                    ctx.beginPath();
                    ctx.moveTo(area.polygon[0].x, area.polygon[0].y);
                    area.polygon.forEach(p => ctx.lineTo(p.x, p.y));
                    ctx.closePath();
                    ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
                    ctx.fill();
                    ctx.strokeStyle = '#0ff';
                    ctx.stroke();
                  }}
                />
              ))}
            </Layer>

            {/* 层2：墙体（遮挡物） */}
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

            {/* 层3：视野范围 */}
            
          </Stage>
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  )
}

export default Map;