import { MapPicker } from '@/components/MapPicker';
import { MatchupModule } from '@/components/MatchupModule';
import { useMapSelectionStore } from '@/store/useMapSelectionStore';
import './LeftTacticalPanel.less';

/** 左侧战术配置区：攻防、地图；英雄选择后续接入 */
export function LeftTacticalPanel() {
  const { side, setSide } = useMapSelectionStore();

  return (
    <div className="left-tactical-panel">
      <header className="left-tactical-panel__header">
        <h1 className="left-tactical-panel__title">场景</h1>
      </header>

      <MapPicker />

      <section className="left-tactical-panel__block" aria-labelledby="side-toggle-label">
        <p id="side-toggle-label" className="left-tactical-panel__field-label">
          阵营
        </p>
        <div className="side-toggle" role="group" aria-label="进攻或防守">
          <button
            type="button"
            className={`side-toggle__btn${side === 'attack' ? ' side-toggle__btn--active' : ''}`}
            aria-pressed={side === 'attack'}
            onClick={() => setSide('attack')}
          >
            进攻
          </button>
          <button
            type="button"
            className={`side-toggle__btn${side === 'defense' ? ' side-toggle__btn--active' : ''}`}
            aria-pressed={side === 'defense'}
            onClick={() => setSide('defense')}
          >
            防守
          </button>
        </div>
      </section>

      <MatchupModule />
    </div>
  );
}
