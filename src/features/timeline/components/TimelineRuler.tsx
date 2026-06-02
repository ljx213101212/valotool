import React from 'react';
import { formatTime } from '@/shared/utils/convert';

export interface TimelineConfig {
  totalDuration: number;
  pixelsPerSecond: number;
  height: number;
  tickConfig: {
    majorTickInterval: number;
    minorTickInterval: number;
    majorTickHeight: number;
    minorTickHeight: number;
  };
}

type TimelineTick =
  | {
      type: 'major';
      time: number;
      x: number;
      height: number;
      label: string;
    }
  | {
      type: 'minor';
      time: number;
      x: number;
      height: number;
      label?: undefined;
    };

const TimelineRuler: React.FC<{ config: TimelineConfig }> = ({ config }) => {

    const generateTicks = (config: TimelineConfig) => {
        const ticks: TimelineTick[] = [];
        const { totalDuration, pixelsPerSecond, tickConfig } = config;
        const { majorTickInterval, minorTickInterval, majorTickHeight, minorTickHeight } = tickConfig;
      
        for (let t = 0; t <= totalDuration; t += majorTickInterval) {
          const x = t * pixelsPerSecond;
          ticks.push({ type: 'major', time: t, x, height: majorTickHeight, label: formatTime(t) });
        }
      
        for (let t = 0; t <= totalDuration; t += minorTickInterval) {
          if (t % majorTickInterval === 0) continue;
          const x = t * pixelsPerSecond;
          ticks.push({ type: 'minor', time: t, x, height: minorTickHeight });
        }
      
        return ticks;
      };


    const ticks = generateTicks(config);
    const canvasWidth = config.totalDuration * config.pixelsPerSecond;
  
    return (
      <svg width={canvasWidth} height={config.height} style={{ display: 'block', background: '#1e1e1e' }}>
        {ticks.map((tick, i) => (
          <g key={i}>
            <line
              x1={tick.x} y1={0} x2={tick.x} y2={tick.height}
              stroke="#575757" strokeWidth={tick.type === 'major' ? 1.5 : 0.5}
            />
            {tick.label && (
              <text x={tick.x + 4} y={config.height - 4} fill="#fff" fontSize={12}>
                {tick.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    );
  };
  
  export default TimelineRuler;
