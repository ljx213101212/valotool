import type { DrawerProps } from 'antd';
import { Button, Drawer, Modal, Select, message } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAgentLabel } from '@/data/agentsCatalog';
import { getMapById } from '@/data/mapsCatalog';
import { TACTICAL_DRAWER_Z_INDEX, tacticalDrawerStyles } from '@/components/tacticalDrawerStyles';
import { useUiOverlayStore } from '@/store/uiOverlayStore';
import { useTimelineKeyframeStore } from '@/store/timelineKeyframeStore';
import { useTimelinePlaybackStore } from '@/store/timelinePlaybackStore';
import { formatTimelineQuantized, timelineTimesEqualStep } from '@/utils/timelineQuantize';
import './KeyframeDetailDrawer.less';

const drawerStyles = tacticalDrawerStyles satisfies NonNullable<DrawerProps['styles']>;

export function KeyframeDetailDrawer() {
  const currentTime = useTimelinePlaybackStore((s) => s.currentTime);
  const maxTime = useTimelinePlaybackStore((s) => s.maxTime);
  const detailKeyframeId = useTimelineKeyframeStore((s) => s.detailKeyframeId);
  const keyframes = useTimelineKeyframeStore((s) => s.keyframes);
  const closeKeyframeDetail = useTimelineKeyframeStore((s) => s.closeKeyframeDetail);
  const removeKeyframeById = useTimelineKeyframeStore((s) => s.removeKeyframeById);
  const appendKillToKeyframe = useTimelineKeyframeStore((s) => s.appendKillToKeyframe);
  const popKillFromKeyframe = useTimelineKeyframeStore((s) => s.popKillFromKeyframe);
  const pushDrawerLayer = useUiOverlayStore((s) => s.pushDrawerLayer);
  const popDrawerLayer = useUiOverlayStore((s) => s.popDrawerLayer);

  const [addKillOpen, setAddKillOpen] = useState(false);
  const [killerId, setKillerId] = useState<string | null>(null);
  const [victimId, setVictimId] = useState<string | null>(null);

  const entry = useMemo(
    () => keyframes.find((k) => k.id === detailKeyframeId),
    [keyframes, detailKeyframeId]
  );

  const open = !!entry;

  const playheadOnThisKeyframe = useMemo(
    () => !!entry && timelineTimesEqualStep(currentTime, entry.time, maxTime),
    [entry, currentTime, maxTime]
  );

  useEffect(() => {
    if (!open) return;
    pushDrawerLayer();
    return () => popDrawerLayer();
  }, [open, pushDrawerLayer, popDrawerLayer]);

  const snap = entry?.snapshot;

  const alivePlacements = useMemo(() => {
    if (!snap) return [];
    return snap.matchup.mapPlacements.filter((p) => !p.eliminated);
  }, [snap]);

  const killerOptions = useMemo(
    () =>
      alivePlacements.map((p) => ({
        value: p.id,
        label: `${getAgentLabel(p.agentId)}（${p.side === 'attack' ? '攻' : '守'}）`,
      })),
    [alivePlacements]
  );

  const victimOptions = useMemo(() => {
    if (!snap || !killerId) return [];
    const killer = snap.matchup.mapPlacements.find((p) => p.id === killerId);
    if (!killer) return [];
    return snap.matchup.mapPlacements
      .filter(
        (p) =>
          !p.eliminated &&
          p.id !== killerId &&
          p.side !== killer.side
      )
      .map((p) => ({
        value: p.id,
        label: `${getAgentLabel(p.agentId)}（${p.side === 'attack' ? '攻' : '守'}）`,
      }));
  }, [snap, killerId]);

  const openAddKillModal = useCallback(() => {
    setKillerId(null);
    setVictimId(null);
    setAddKillOpen(true);
  }, []);

  const submitAddKill = useCallback(async () => {
    if (!entry || !killerId || !victimId) {
      message.warning('请选择击杀者与被击杀者');
      return Promise.reject();
    }
    const ok = appendKillToKeyframe(entry.id, killerId, victimId);
    if (!ok) {
      message.error('记录失败（请确认双方为存活敌对关系）');
      return Promise.reject();
    }
    setAddKillOpen(false);
    setKillerId(null);
    setVictimId(null);
  }, [appendKillToKeyframe, entry, killerId, victimId]);

  const onPopKill = useCallback(() => {
    if (!entry) return;
    const ok = popKillFromKeyframe(entry.id);
    if (!ok) message.info('当前关键帧没有可撤销的击杀');
  }, [entry, popKillFromKeyframe]);

  const onDeleteKeyframe = useCallback(() => {
    if (!entry) return;
    Modal.confirm({
      title: '删除关键帧',
      content: '将删除本刻度的整条关键帧记录，并回滚该帧内的全部击杀（若播放头正在此处，地图上的淘汰标记会恢复）。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        removeKeyframeById(entry.id);
        closeKeyframeDetail();
      },
    });
  }, [closeKeyframeDetail, entry, removeKeyframeById]);

  return (
    <Drawer
      title={
        entry ? (
          <span className="keyframe-detail-drawer__title">
            <span className="keyframe-detail-drawer__label">关键帧</span>
            <span className="keyframe-detail-drawer__time">
              {formatTimelineQuantized(entry.time, maxTime)}
            </span>
          </span>
        ) : null
      }
      placement="right"
      open={open}
      onClose={closeKeyframeDetail}
      width={340}
      rootClassName="keyframe-detail-drawer"
      styles={drawerStyles}
      destroyOnClose
      zIndex={TACTICAL_DRAWER_Z_INDEX}
    >
      {snap && entry ? (
        <div className="keyframe-detail-drawer__body">
          {!playheadOnThisKeyframe ? (
            <p className="keyframe-detail-drawer__playhead-hint">
              当前播放头未对准本关键帧时间；在此编辑击杀后，需将播放头移到该时间才会在地图上同步落位与淘汰状态。
            </p>
          ) : null}

          <div className="keyframe-detail-drawer__actions">
            <Button type="primary" size="small" onClick={openAddKillModal}>
              新建击杀
            </Button>
            <Button
              size="small"
              disabled={(snap.killEvents?.length ?? 0) === 0}
              onClick={onPopKill}
            >
              撤销最后一次击杀
            </Button>
            <Button size="small" danger onClick={onDeleteKeyframe}>
              删除本关键帧
            </Button>
          </div>

          <Modal
            title="新建击杀"
            open={addKillOpen}
            onCancel={() => setAddKillOpen(false)}
            onOk={submitAddKill}
            okText="确认"
            cancelText="取消"
            destroyOnClose
          >
            <div className="keyframe-detail-drawer__modal-field">
              <div className="keyframe-detail-drawer__modal-label">击杀者</div>
              <Select
                className="keyframe-detail-drawer__modal-select"
                placeholder="选择特工"
                options={killerOptions}
                value={killerId ?? undefined}
                onChange={(v) => {
                  setKillerId(v);
                  setVictimId(null);
                }}
                allowClear
                showSearch
                optionFilterProp="label"
              />
            </div>
            <div className="keyframe-detail-drawer__modal-field">
              <div className="keyframe-detail-drawer__modal-label">被击杀者</div>
              <Select
                className="keyframe-detail-drawer__modal-select"
                placeholder={killerId ? '选择敌方存活特工' : '请先选择击杀者'}
                options={victimOptions}
                value={victimId ?? undefined}
                onChange={(v) => setVictimId(v)}
                disabled={!killerId}
                allowClear
                showSearch
                optionFilterProp="label"
              />
            </div>
          </Modal>

          <dl className="keyframe-detail-drawer__list">
            <div className="keyframe-detail-drawer__row">
              <dt>地图</dt>
              <dd>{getMapById(snap.mapSelection.selectedMapId)?.label ?? snap.mapSelection.selectedMapId}</dd>
            </div>
            <div className="keyframe-detail-drawer__row">
              <dt>视角</dt>
              <dd>{snap.mapSelection.side === 'attack' ? '进攻' : '防守'}</dd>
            </div>
            <div className="keyframe-detail-drawer__row">
              <dt>拖入阵营偏好</dt>
              <dd>{snap.matchup.dragDropTargetSide === 'attack' ? '进攻' : '防守'}</dd>
            </div>
            <div className="keyframe-detail-drawer__row">
              <dt>阵容规模</dt>
              <dd>
                进攻 {snap.matchup.attackAgentIds.length} · 防守 {snap.matchup.defenseAgentIds.length}
              </dd>
            </div>
          </dl>

          <section className="keyframe-detail-drawer__section">
            <h3 className="keyframe-detail-drawer__section-title">进攻</h3>
            <ul className="keyframe-detail-drawer__agents">
              {snap.matchup.attackAgentIds.map((id) => (
                <li key={id}>{getAgentLabel(id)}</li>
              ))}
              {snap.matchup.attackAgentIds.length === 0 ? (
                <li className="keyframe-detail-drawer__empty">—</li>
              ) : null}
            </ul>
          </section>

          <section className="keyframe-detail-drawer__section">
            <h3 className="keyframe-detail-drawer__section-title">防守</h3>
            <ul className="keyframe-detail-drawer__agents">
              {snap.matchup.defenseAgentIds.map((id) => (
                <li key={id}>{getAgentLabel(id)}</li>
              ))}
              {snap.matchup.defenseAgentIds.length === 0 ? (
                <li className="keyframe-detail-drawer__empty">—</li>
              ) : null}
            </ul>
          </section>

          <section className="keyframe-detail-drawer__section">
            <h3 className="keyframe-detail-drawer__section-title">
              击杀顺序（{snap.killEvents?.length ?? 0}）
            </h3>
            {(snap.killEvents?.length ?? 0) === 0 ? (
              <p className="keyframe-detail-drawer__empty">本关键帧无击杀记录</p>
            ) : (
              <ol className="keyframe-detail-drawer__kill-list">
                {(snap.killEvents ?? []).map((ev, i) => {
                  const killer = snap.matchup.mapPlacements.find((p) => p.id === ev.killerPlacementId);
                  const victim = snap.matchup.mapPlacements.find((p) => p.id === ev.victimPlacementId);
                  const kLabel = killer ? getAgentLabel(killer.agentId) : '（未知）';
                  const vLabel = victim ? getAgentLabel(victim.agentId) : '（未知）';
                  return (
                    <li key={`${ev.killerPlacementId}-${ev.victimPlacementId}-${i}`}>
                      <span className="keyframe-detail-drawer__kill-idx">{i + 1}.</span>
                      {kLabel} 击杀 {vLabel}
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <section className="keyframe-detail-drawer__section">
            <h3 className="keyframe-detail-drawer__section-title">地图落位（{snap.matchup.mapPlacements.length}）</h3>
            <ul className="keyframe-detail-drawer__placements">
              {snap.matchup.mapPlacements.map((p) => (
                <li key={p.id}>
                  <span
                    className={
                      p.side === 'attack'
                        ? 'keyframe-detail-drawer__side-tag keyframe-detail-drawer__side-tag--attack'
                        : 'keyframe-detail-drawer__side-tag keyframe-detail-drawer__side-tag--defense'
                    }
                  >
                    {p.side === 'attack' ? '攻' : '守'}
                  </span>
                  {getAgentLabel(p.agentId)} · ({p.x.toFixed(0)}, {p.y.toFixed(0)}) · 朝向{' '}
                  {((p.facing * 180) / Math.PI).toFixed(0)}°
                  {p.eliminated ? ' · 已淘汰' : ''}
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </Drawer>
  );
}
