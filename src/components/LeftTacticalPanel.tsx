import { MapPicker } from '@/components/MapPicker';
import './LeftTacticalPanel.less';

/** 左侧战术配置区：当前仅地图选择，英雄选择后续接入 */
export function LeftTacticalPanel() {
  return (
    <div className="left-tactical-panel">
      <header className="left-tactical-panel__header">
        <h1 className="left-tactical-panel__title">场景</h1>
      </header>
      <MapPicker />
    </div>
  );
}
