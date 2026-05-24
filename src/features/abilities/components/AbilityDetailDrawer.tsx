import type { DrawerProps } from 'antd';
import { Drawer } from 'antd';
import { useCallback, useEffect } from 'react';
import { AgentMapTokenChip } from '@/features/agents/components/AgentMapTokenChip';
import { getAbilityDisplayName } from '@/features/abilities/abilityDisplayName';
import { formatTimelineQuantized } from '@/shared/utils/timelineQuantize';
import { useTimelinePlaybackStore } from '@/shared/store/timelinePlaybackStore';
import { getAgentLabel } from '@/shared/data/agentsCatalog';
import { useMatchupStore } from '@/shared/store/useMatchupStore';
import { useUiOverlayStore } from '@/shared/store/uiOverlayStore';
import { TACTICAL_DRAWER_Z_INDEX, tacticalDrawerStyles } from '@/features/tactical-panels/components/tacticalDrawerStyles';
import './AbilityDetailDrawer.less';

const drawerStyles = tacticalDrawerStyles satisfies NonNullable<DrawerProps['styles']>;

function formatPlacedAt(ms: number | undefined): string {
  if (ms == null || !Number.isFinite(ms)) return '—';
  return new Date(ms).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function AbilityDetailDrawer() {
  const selectedAbilityPlacementId = useMatchupStore((s) => s.selectedAbilityPlacementId);
  const setSelectedAbilityPlacementId = useMatchupStore((s) => s.setSelectedAbilityPlacementId);
  const abilityPlacements = useMatchupStore((s) => s.abilityPlacements);
  const mapPlacements = useMatchupStore((s) => s.mapPlacements);
  const maxTime = useTimelinePlaybackStore((s) => s.maxTime);
  const pushDrawerLayer = useUiOverlayStore((s) => s.pushDrawerLayer);
  const popDrawerLayer = useUiOverlayStore((s) => s.popDrawerLayer);

  const placement = abilityPlacements.find((p) => p.id === selectedAbilityPlacementId);
  const owner = placement
    ? mapPlacements.find((p) => p.id === placement.ownerPlacementId)
    : undefined;
  const open = !!placement;

  useEffect(() => {
    if (!open) return;
    pushDrawerLayer();
    return () => popDrawerLayer();
  }, [open, pushDrawerLayer, popDrawerLayer]);

  const closeDrawer = useCallback(() => {
    setSelectedAbilityPlacementId(null);
  }, [setSelectedAbilityPlacementId]);

  const abilityName = placement
    ? getAbilityDisplayName(placement.agentId, placement.abilitySlot)
    : '';
  const casterName = owner
    ? getAgentLabel(owner.agentId)
    : placement
      ? getAgentLabel(placement.agentId)
      : null;

  return (
    <Drawer
      title={
        placement ? (
          <span className="ability-detail-drawer__title">{abilityName}</span>
        ) : null
      }
      placement="right"
      open={open}
      onClose={closeDrawer}
      width={320}
      rootClassName="ability-detail-drawer"
      styles={drawerStyles}
      destroyOnClose
      zIndex={TACTICAL_DRAWER_Z_INDEX}
    >
      {placement ? (
        <dl className="ability-detail-drawer__list">
          <div className="ability-detail-drawer__row">
            <dt>技能名</dt>
            <dd>{abilityName}</dd>
          </div>
          <div className="ability-detail-drawer__row ability-detail-drawer__row--caster">
            <dt>技能施放者</dt>
            <dd>
              {owner && casterName ? (
                <div className="ability-detail-drawer__caster">
                  <AgentMapTokenChip
                    agentId={owner.agentId}
                    side={owner.side}
                    eliminated={!!owner.eliminated}
                    size={36}
                    title={`${casterName} · ${owner.side === 'attack' ? '进攻' : '防守'}`}
                  />
                  <div className="ability-detail-drawer__caster-text">
                    <span className="ability-detail-drawer__caster-name">{casterName}</span>
                    <span
                      className={
                        owner.side === 'attack'
                          ? 'ability-detail-drawer__side ability-detail-drawer__side--attack'
                          : 'ability-detail-drawer__side ability-detail-drawer__side--defense'
                      }
                    >
                      {owner.side === 'attack' ? '进攻' : '防守'}
                    </span>
                  </div>
                </div>
              ) : (
                <span className="ability-detail-drawer__placeholder">—</span>
              )}
            </dd>
          </div>
          <div className="ability-detail-drawer__row">
            <dt>技能施放时间</dt>
            <dd>
              {placement.activeAt != null
                ? formatTimelineQuantized(placement.activeAt, maxTime)
                : formatPlacedAt(placement.placedAt)}
            </dd>
          </div>
          {placement.activeAt != null && placement.expiresAt != null ? (
            <div className="ability-detail-drawer__row">
              <dt>烟雾存续</dt>
              <dd>
                {formatTimelineQuantized(placement.activeAt, maxTime)}
                {' — '}
                {formatTimelineQuantized(placement.expiresAt, maxTime)}
              </dd>
            </div>
          ) : null}
          <div className="ability-detail-drawer__row">
            <dt>技能影响范围</dt>
            <dd className="ability-detail-drawer__placeholder">—</dd>
          </div>
        </dl>
      ) : null}
    </Drawer>
  );
}
