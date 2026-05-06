import { useMemo, useState } from 'react';
import { Dropdown, Modal } from 'antd';
import type { ModalProps } from 'antd';
import { AGENTS_CATALOG, getAgentLabel } from '@/data/agentsCatalog';
import { useMatchupStore, type MatchupSide } from '@/store/useMatchupStore';
import './MatchupModule.less';

/** 与左栏 / 地图战术风一致的 Modal 语义样式（antd 6） */
const MATCHUP_MODAL_STYLES = {
  mask: {
    background: 'rgba(2, 6, 23, 0.78)',
    backdropFilter: 'blur(4px)',
  },
  container: {
    padding: 0,
    background: '#0f172a',
    borderRadius: 14,
    border: '1px solid rgba(56, 189, 248, 0.22)',
    boxShadow:
      '0 0 0 1px rgba(15, 23, 42, 0.9), 0 24px 56px rgba(0, 0, 0, 0.55), 0 0 40px rgba(56, 189, 248, 0.06)',
    overflow: 'hidden',
  },
  header: {
    margin: 0,
    padding: '12px 18px',
    background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.98) 100%)',
    borderBottom: '1px solid rgba(56, 189, 248, 0.14)',
  },
  body: {
    padding: '14px 18px 16px',
    background: '#0f172a',
  },
  title: {
    margin: 0,
    color: '#f1f5f9',
    fontSize: 15,
    fontWeight: 600,
    lineHeight: 1.35,
  },
} satisfies NonNullable<ModalProps['styles']>;

export function MatchupModule() {
  const attackAgentIds = useMatchupStore((s) => s.attackAgentIds);
  const defenseAgentIds = useMatchupStore((s) => s.defenseAgentIds);

  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingSide, setEditingSide] = useState<MatchupSide>('attack');

  const openTeamModal = (side: MatchupSide) => {
    setEditingSide(side);
    setTeamModalOpen(true);
    setPickerOpen(false);
  };

  const teamIds = editingSide === 'attack' ? attackAgentIds : defenseAgentIds;
  const addAgent = useMatchupStore((s) => s.addAgent);
  const removeAgent = useMatchupStore((s) => s.removeAgent);

  const pickHero = (agentId: string) => {
    addAgent(editingSide, agentId);
    setPickerOpen(false);
  };

  const detailsPanel = useMemo(
    () => (
      <div className="matchup-details-panel" onClick={(e) => e.stopPropagation()}>
        <div className="matchup-details-panel__block">
          <p className="matchup-details-panel__title matchup-details-panel__title--attack">攻方</p>
          {attackAgentIds.length === 0 ? (
            <p className="matchup-details-panel__empty">暂无英雄</p>
          ) : (
            <ul className="matchup-details-panel__list">
              {attackAgentIds.map((id) => (
                <li key={id}>{getAgentLabel(id)}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="matchup-details-panel__block">
          <p className="matchup-details-panel__title matchup-details-panel__title--defense">守方</p>
          {defenseAgentIds.length === 0 ? (
            <p className="matchup-details-panel__empty">暂无英雄</p>
          ) : (
            <ul className="matchup-details-panel__list">
              {defenseAgentIds.map((id) => (
                <li key={id}>{getAgentLabel(id)}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    ),
    [attackAgentIds, defenseAgentIds]
  );

  return (
    <section className="matchup" aria-labelledby="matchup-label">
      <p id="matchup-label" className="left-tactical-panel__field-label">
        对阵
      </p>
      <div className="matchup__row">
        <button
          type="button"
          className="matchup__team-btn matchup__team-btn--attack"
          onClick={() => openTeamModal('attack')}
        >
          攻方
          <span className="matchup__team-count">{attackAgentIds.length} 人</span>
        </button>
        <button
          type="button"
          className="matchup__team-btn matchup__team-btn--defense"
          onClick={() => openTeamModal('defense')}
        >
          守方
          <span className="matchup__team-count">{defenseAgentIds.length} 人</span>
        </button>
        <Dropdown
          dropdownRender={() => detailsPanel}
          trigger={['click']}
          placement="bottomRight"
        >
          <button type="button" className="matchup__details-trigger">
            详情 ▾
          </button>
        </Dropdown>
      </div>

      <Modal
        title={editingSide === 'attack' ? '编辑攻方阵容' : '编辑守方阵容'}
        open={teamModalOpen}
        onCancel={() => {
          setTeamModalOpen(false);
          setPickerOpen(false);
        }}
        footer={null}
        width="min(360px, 92vw)"
        centered
        destroyOnHidden
        rootClassName="matchup-modal-root"
        styles={MATCHUP_MODAL_STYLES}
        zIndex={1050}
      >
        {teamIds.length === 0 ? (
          <p className="matchup-modal__empty">暂无英雄，点击下方新增</p>
        ) : (
          <ul className="matchup-team-list">
            {teamIds.map((id) => (
              <li key={id} className="matchup-team-list__item">
                <span className="matchup-team-list__name">{getAgentLabel(id)}</span>
                <button
                  type="button"
                  className="matchup-team-list__remove"
                  onClick={() => removeAgent(editingSide, id)}
                >
                  删除
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          className="matchup-modal__add"
          onClick={() => setPickerOpen(true)}
        >
          ＋ 新增英雄
        </button>
      </Modal>

      <Modal
        title="选择英雄"
        open={pickerOpen}
        onCancel={() => setPickerOpen(false)}
        footer={null}
        width="min(440px, 94vw)"
        centered
        destroyOnHidden
        rootClassName="matchup-modal-root matchup-modal-root--wide"
        styles={MATCHUP_MODAL_STYLES}
        zIndex={1100}
      >
        <div className="matchup-hero-grid">
          {AGENTS_CATALOG.map((a) => {
            const onTeam = teamIds.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                className={`matchup-hero-tile${onTeam ? ' matchup-hero-tile--picked' : ''}`}
                disabled={onTeam}
                onClick={() => !onTeam && pickHero(a.id)}
                title={onTeam ? '已在当前阵容' : `加入${editingSide === 'attack' ? '攻方' : '守方'}`}
              >
                {a.label}
              </button>
            );
          })}
        </div>
      </Modal>
    </section>
  );
}
