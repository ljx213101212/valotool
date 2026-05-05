import React, { useState } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import {calculateViewPolygon } from "../utils/viewCalculation";
import { testMap } from "../data/testMap";
import type { Point } from "@/types/map";
import { Circle, Layer, Line, Shape, Stage } from "react-konva";

const Map = () => {


    return (
    <div style={{ width: '100vw', height: '100vh', background: '#0f1923' }}>
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={2}
        centerOnInit
        limitToBounds
      >
        <TransformComponent>
          {/* 地图画布 */}
          <Stage
            width={1000}
            height={800}
            // onClick={handleMapClick}
            // onTap={handleMapClick}
          >
            {/* 层1：地图区域 */}
            <Layer>
              {testMap.areas.map((area) => (
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
              {testMap.walls.map((wall) => (
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
        </TransformComponent>
      </TransformWrapper>
    </div>
  )
}

export default Map;