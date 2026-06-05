import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { Modal } from 'antd';
import './MapPicker.less';
import { MAPS_CATALOG, getMapById } from '@/shared/data/mapsCatalog';
import { useMapSelectionStore } from '@/shared/store/useMapSelectionStore';

export function MapPicker() {
  const { selectedMapId, setSelectedMapId } = useMapSelectionStore();
  const [open, setOpen] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);

  const current = useMemo(() => getMapById(selectedMapId) ?? MAPS_CATALOG[0], [selectedMapId]);

  useEffect(() => {
    const timer = window.setTimeout(() => setThumbFailed(false), 0);
    return () => window.clearTimeout(timer);
  }, [selectedMapId]);

  const openPicker = () => {
    setThumbFailed(false);
    setOpen(true);
  };

  const pick = (id: string) => {
    setSelectedMapId(id);
    setOpen(false);
  };

  return (
    <section className="map-picker">
      <p className="map-picker__section-title">地图</p>
      <button
        type="button"
        className="map-picker__square"
        onClick={openPicker}
        aria-haspopup="dialog"
        aria-expanded={open}
        style={
          {
            '--map-accent': current.accent,
          } as CSSProperties
        }
      >
        <span className="map-picker__square-media">
          {!thumbFailed && (
            <img
              className="map-picker__square-img"
              src={current.thumbFile}
              alt=""
              decoding="async"
              onError={() => setThumbFailed(true)}
            />
          )}
          <span className="map-picker__square-fallback" aria-hidden />
        </span>
        <span className="map-picker__square-scrim" aria-hidden />
        <span className="map-picker__square-label">{current.label}</span>
        <span className="map-picker__square-hint">点击更换</span>
      </button>

      <Modal
        title="选择地图"
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        width={720}
        centered
        destroyOnHidden
        className="map-picker-modal"
        styles={{
          container: { background: '#0b1220', padding: 20 },
          header: { background: '#0b1220', borderBottom: '1px solid rgba(56,189,248,0.2)' },
        }}
      >
        <div className="map-picker-grid">
          {MAPS_CATALOG.map((m) => (
            <MapGridItem
              key={m.id}
              map={m}
              selected={m.id === selectedMapId}
              onPick={() => pick(m.id)}
            />
          ))}
        </div>
      </Modal>
    </section>
  );
}

function MapGridItem({
  map,
  selected,
  onPick,
}: {
  map: (typeof MAPS_CATALOG)[number];
  selected: boolean;
  onPick: () => void;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <button
      type="button"
      className={`map-picker-tile${selected ? ' map-picker-tile--selected' : ''}`}
      onClick={onPick}
      style={{ '--map-accent': map.accent } as CSSProperties}
    >
      <span className="map-picker-tile__media">
        {!failed && (
          <img
            src={map.thumbFile}
            alt=""
            className="map-picker-tile__img"
            decoding="async"
            onError={() => setFailed(true)}
          />
        )}
        <span className="map-picker-tile__fallback" aria-hidden />
      </span>
      <span className="map-picker-tile__scrim" aria-hidden />
      <span className="map-picker-tile__label">{map.label}</span>
    </button>
  );
}
