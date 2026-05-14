import type { DrawerProps } from 'antd';
import { ConfigProvider, Drawer, Modal, Select, message, theme } from 'antd';
import {
  DeleteOutlined,
  PlusOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { KillEventRow } from '@/components/KillEventRow';
import { getAgentLabel } from '@/data/agentsCatalog';
import { TACTICAL_DRAWER_Z_INDEX, tacticalDrawerStyles } from '@/components/tacticalDrawerStyles';
import { tacticalModalStyles } from '@/components/tacticalModalStyles';
import { useUiOverlayStore } from '@/store/uiOverlayStore';
import { useTimelineKeyframeStore } from '@/store/timelineKeyframeStore';
import { useTimelinePlaybackStore } from '@/store/timelinePlaybackStore';
import { formatTimelineQuantized } from '@/utils/timelineQuantize';
import './KeyframeDetailDrawer.less';

const drawerStyles = tacticalDrawerStyles satisfies NonNullable<DrawerProps['styles']>;

const TACTICAL_MODAL_Z = TACTICAL_DRAWER_Z_INDEX + 50;
const TACTICAL_MODAL_CLASS = 'keyframe-tactical-modal';

export function KeyframeDetailDrawer() {
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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [killerId, setKillerId] = useState<string | null>(null);
  const [victimId, setVictimId] = useState<string | null>(null);

  const entry = useMemo(
    () => keyframes.find((k) => k.id === detailKeyframeId),
    [keyframes, detailKeyframeId]
  );

  const open = !!entry;

  useEffect(() => {
    if (!open) return;
    pushDrawerLayer();
    return () => popDrawerLayer();
  }, [open, pushDrawerLayer, popDrawerLayer]);

  useEffect(() => {
    if (!open) setDeleteOpen(false);
  }, [open]);

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
      .filter((p) => !p.eliminated && p.id !== killerId && p.side !== killer.side)
      .map((p) => ({
        value: p.id,
        label: `${getAgentLabel(p.agentId)}（${p.side === 'attack' ? '攻' : '守'}）`,
      }));
  }, [snap, killerId]);

  const killCount = snap?.killEvents?.length ?? 0;

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
    setDeleteOpen(true);
  }, []);

  const confirmDeleteKeyframe = useCallback(async () => {
    if (!entry) return;
    removeKeyframeById(entry.id);
    setDeleteOpen(false);
    closeKeyframeDetail();
  }, [closeKeyframeDetail, entry, removeKeyframeById]);

  const modalTheme = {
    algorithm: theme.darkAlgorithm,
    components: {
      Modal: {
        contentBg: '#0f172a',
        headerBg: '#1e293b',
        footerBg: '#0f172a',
        titleColor: '#e2e8f0',
      },
      Select: {
        colorBgContainer: 'rgba(15, 23, 42, 0.98)',
        colorBorder: 'rgba(51, 65, 85, 0.9)',
        colorText: 'rgba(226, 232, 240, 0.96)',
        colorTextPlaceholder: 'rgba(100, 116, 139, 0.95)',
      },
      Button: {
        defaultBg: 'rgba(30, 41, 59, 0.75)',
        defaultBorderColor: 'rgba(71, 85, 105, 0.85)',
        defaultColor: 'rgba(226, 232, 240, 0.92)',
      },
    },
  };

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
      extra={
        entry ? (
          <button
            type="button"
            className="keyframe-detail-drawer__header-delete"
            onClick={onDeleteKeyframe}
            title="删除本关键帧"
            aria-label="删除本关键帧"
          >
            <DeleteOutlined aria-hidden />
            <span className="keyframe-detail-drawer__header-delete-text">删除关键帧</span>
          </button>
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
          <ConfigProvider theme={modalTheme}>
            <Modal
              title="新建击杀"
              open={addKillOpen}
              onCancel={() => setAddKillOpen(false)}
              onOk={submitAddKill}
              okText="确认"
              cancelText="取消"
              destroyOnClose
              centered
              zIndex={TACTICAL_MODAL_Z}
              rootClassName={TACTICAL_MODAL_CLASS}
              wrapClassName="keyframe-tactical-modal-wrap"
              width={400}
              styles={tacticalModalStyles}
            >
              <div className="keyframe-detail-drawer__modal-field">
                <div className="keyframe-detail-drawer__modal-label">击杀者</div>
                <Select
                  classNames={{ popup: { root: 'keyframe-tactical-select-dropdown' } }}
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
                  popupMatchSelectWidth={false}
                />
              </div>
              <div className="keyframe-detail-drawer__modal-field">
                <div className="keyframe-detail-drawer__modal-label">被击杀者</div>
                <Select
                  classNames={{ popup: { root: 'keyframe-tactical-select-dropdown' } }}
                  className="keyframe-detail-drawer__modal-select"
                  placeholder={killerId ? '选择敌方存活特工' : '请先选择击杀者'}
                  options={victimOptions}
                  value={victimId ?? undefined}
                  onChange={(v) => setVictimId(v)}
                  disabled={!killerId}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  popupMatchSelectWidth={false}
                />
              </div>
            </Modal>

            <Modal
              title="删除关键帧"
              open={deleteOpen}
              onCancel={() => setDeleteOpen(false)}
              onOk={confirmDeleteKeyframe}
              okText="删除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
              centered
              zIndex={TACTICAL_MODAL_Z}
              rootClassName={`${TACTICAL_MODAL_CLASS} ${TACTICAL_MODAL_CLASS}--confirm`}
              wrapClassName="keyframe-tactical-modal-wrap"
              width={400}
              styles={tacticalModalStyles}
            >
              <p className="keyframe-detail-drawer__delete-confirm-text">
                将删除本刻度的整条关键帧记录，并回滚该帧内的全部击杀（若播放头正在此处，地图上的淘汰标记会恢复）。
              </p>
            </Modal>
          </ConfigProvider>

          <section className="keyframe-detail-drawer__section keyframe-detail-drawer__section--kills">
            <div className="keyframe-detail-drawer__kill-section-head">
              <h2 className="keyframe-detail-drawer__kill-section-title">
                击杀顺序
                <span className="keyframe-detail-drawer__kill-count">{killCount}</span>
              </h2>
              <div className="keyframe-detail-drawer__kill-toolbar" role="toolbar" aria-label="击杀操作">
                <button
                  type="button"
                  className="keyframe-detail-drawer__icon-tool keyframe-detail-drawer__icon-tool--add"
                  onClick={openAddKillModal}
                  title="新建击杀"
                  aria-label="新建击杀"
                >
                  <PlusOutlined />
                </button>
                <button
                  type="button"
                  className="keyframe-detail-drawer__icon-tool keyframe-detail-drawer__icon-tool--undo"
                  disabled={killCount === 0}
                  onClick={onPopKill}
                  title="撤销最后一次击杀"
                  aria-label="撤销最后一次击杀"
                >
                  <RollbackOutlined />
                </button>
              </div>
            </div>
            {killCount === 0 ? (
              <p className="keyframe-detail-drawer__empty">本关键帧无击杀记录</p>
            ) : (
              <ul className="keyframe-detail-drawer__kill-list" role="list">
                {(snap.killEvents ?? []).map((ev, i) => {
                  const killer = snap.matchup.mapPlacements.find((p) => p.id === ev.killerPlacementId);
                  const victim = snap.matchup.mapPlacements.find((p) => p.id === ev.victimPlacementId);
                  return (
                    <KillEventRow
                      key={`${ev.killerPlacementId}-${ev.victimPlacementId}-${i}`}
                      displayIndex={i + 1}
                      killer={killer ?? null}
                      victim={victim ?? null}
                    />
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </Drawer>
  );
}
