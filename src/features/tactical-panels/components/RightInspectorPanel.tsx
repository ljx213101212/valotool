import { useState } from 'react';
import { Segmented } from 'antd';
import { RightHeroesPicker } from '@/features/tactical-panels/components/RightHeroesPicker';
import './RightInspectorPanel.less';

type RightSection = 'heroes' | 'props';

export function RightInspectorPanel() {
  const [section, setSection] = useState<RightSection>('heroes');

  return (
    <div className="right-inspector-panel">
      <Segmented
        block
        className="right-inspector-panel__segmented"
        value={section}
        onChange={(v) => setSection(v as RightSection)}
        options={[
          { label: '英雄', value: 'heroes' },
          { label: '属性', value: 'props' },
        ]}
      />
      <div className="right-inspector-panel__body">
        {section === 'heroes' ? (
          <RightHeroesPicker />
        ) : (
          <div className="right-inspector-props">
            <p className="right-inspector-props__hint">
              在地图上选中线条、区域或标记后，将在此显示并编辑其属性。
            </p>
            <p className="right-inspector-props__muted">（功能预留）</p>
          </div>
        )}
      </div>
    </div>
  );
}
