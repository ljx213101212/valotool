import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { TimelineAbilityDeployEvent } from '@/shared/types/timelineAbility';
import type { TimelineKeyframeEntry, TimelineKeyframeSnapshot } from '@/shared/types/timelineKeyframe';
import { useMatchupStore } from '@/shared/store/useMatchupStore';
import {
  applyTimelineKeyframeSnapshot,
  captureTimelineKeyframeSnapshot,
} from '@/shared/utils/timelineKeyframeSnapshot';
import {
  removePlacementFromSnapshot,
  snapshotWithAbilityDeployAppended,
} from '@/shared/utils/timelineAbilityMutations';
import { syncLiveAbilityPlacementsForPlayhead } from '@/shared/utils/timelineAbilityPlayheadSync';
import {
  canRecordKillInPlacements,
  reviveVictimsFromKillEvents,
  reviveOneKillVictim,
  snapshotWithKillAppended,
} from '@/shared/utils/timelineKillMutations';
import {
  registerTimelinePlaybackKeyframesSource,
  useTimelinePlaybackStore,
} from '@/shared/store/timelinePlaybackStore';
import {
  quantizeTimelineSeconds,
  timelineTimeToTick,
  timelineTimesEqualStep,
} from '@/shared/utils/timelineQuantize';

export type TimelineKeyframeState = {
  keyframes: TimelineKeyframeEntry[];
  /** 关键帧详情 Drawer 当前聚焦的关键帧 id */
  detailKeyframeId: string | null;
  /** 在当前播放头时间写入或覆盖一条关键帧 */
  addKeyframeAtCurrentTime: () => void;
  /** 删除当前播放头时间上的关键帧（时间与关键帧一致时） */
  removeKeyframeAtCurrentTime: () => void;
  /** 按 id 删除关键帧；若播放头在该帧上则回滚该帧内所有击杀对地图的影响 */
  removeKeyframeById: (keyframeId: string) => void;
  /** 在当前量化时间记录一条击杀并写入/合并关键帧；成功返回 true */
  recordKillAtPlayhead: (killerPlacementId: string, victimPlacementId: string) => boolean;
  /** 在指定关键帧末尾追加一条击杀（与播放头无关）；播放头在该帧时同步地图 */
  appendKillToKeyframe: (
    keyframeId: string,
    killerPlacementId: string,
    victimPlacementId: string
  ) => boolean;
  /** 撤销该关键帧内最后一次击杀；成功返回 true */
  popKillFromKeyframe: (keyframeId: string) => boolean;
  /** 在指定时间写入/合并关键帧并追加一条技能施放记录 */
  recordAbilityDeployAtTime: (timeSeconds: number, event: TimelineAbilityDeployEvent) => void;
  /** 从时间轴移除技能实例及其在所有关键帧中的施放记录 */
  purgeAbilityPlacementFromTimeline: (abilityPlacementId: string) => void;
  /** 拖拽修改关键帧时间戳（100ms 网格，冲突则忽略） */
  moveKeyframeTime: (id: string, newTimeSeconds: number) => void;
  seekToPrevKeyframe: () => void;
  seekToNextKeyframe: () => void;
  openKeyframeDetail: (id: string) => void;
  closeKeyframeDetail: () => void;
};

function sortedKeyframes(entries: TimelineKeyframeEntry[]): TimelineKeyframeEntry[] {
  return [...entries].sort((a, b) => a.time - b.time);
}

function preserveKeyframeEventFields(
  snapshot: TimelineKeyframeSnapshot,
  existing: TimelineKeyframeEntry | undefined,
): void {
  if (!existing) return;
  snapshot.killEvents = [...(existing.snapshot.killEvents ?? [])];
  snapshot.abilityDeployEvents = [...(existing.snapshot.abilityDeployEvents ?? [])];
  const abilityPlacementsById = new Map(
    (existing.snapshot.matchup.abilityPlacements ?? []).map((p) => [p.id, p])
  );
  for (const placement of snapshot.matchup.abilityPlacements ?? []) {
    abilityPlacementsById.set(placement.id, placement);
  }
  snapshot.matchup.abilityPlacements = structuredClone([...abilityPlacementsById.values()]);
}

function mergeKeyframeSnapshotAtTime(
  keyframes: TimelineKeyframeEntry[],
  t: number,
  maxTime: number,
  build: (existing: TimelineKeyframeEntry | undefined) => TimelineKeyframeSnapshot,
): TimelineKeyframeEntry[] {
  const existingAtT = keyframes.find((k) => timelineTimesEqualStep(k.time, t, maxTime));
  const rest = keyframes.filter((k) => !timelineTimesEqualStep(k.time, t, maxTime));
  const snapshot = build(existingAtT);
  return sortedKeyframes([
    ...rest,
    {
      id: existingAtT?.id ?? crypto.randomUUID(),
      time: t,
      snapshot,
    },
  ]);
}

function applySnapshotToLiveIfAtPlayhead(t: number, snapshot: TimelineKeyframeSnapshot): void {
  const { currentTime, maxTime } = useTimelinePlaybackStore.getState();
  if (!timelineTimesEqualStep(currentTime, t, maxTime)) return;
  applyTimelineKeyframeSnapshot(snapshot);
  syncLiveAbilityPlacementsForPlayhead(currentTime);
}

/** 播放头落在被删关键帧的同一刻度时，回滚该帧内击杀对当前地图落位的影响 */
function applyKillRollbackToLiveMatchupIfNeeded(removed: TimelineKeyframeEntry, maxTime: number) {
  const { currentTime } = useTimelinePlaybackStore.getState();
  if (!timelineTimesEqualStep(currentTime, removed.time, maxTime)) return;
  const kills = removed.snapshot.killEvents ?? [];
  if (!kills.length) return;
  useMatchupStore.setState((s) => ({
    mapPlacements: reviveVictimsFromKillEvents(s.mapPlacements, kills),
  }));
}

export const useTimelineKeyframeStore = create<TimelineKeyframeState>()(
  devtools(
    (set, get) => ({
      keyframes: [],
      detailKeyframeId: null,

      openKeyframeDetail: (id: string) => set({ detailKeyframeId: id }),

      closeKeyframeDetail: () => set({ detailKeyframeId: null }),

      addKeyframeAtCurrentTime: () => {
        const { currentTime, maxTime } = useTimelinePlaybackStore.getState();
        const t = quantizeTimelineSeconds(currentTime, maxTime);
        set((s) => ({
          keyframes: mergeKeyframeSnapshotAtTime(s.keyframes, t, maxTime, (existingAtT) => {
            const snapshot = captureTimelineKeyframeSnapshot();
            preserveKeyframeEventFields(snapshot, existingAtT);
            return snapshot;
          }),
        }));
      },

      recordKillAtPlayhead: (killerPlacementId: string, victimPlacementId: string) => {
        const { currentTime, maxTime } = useTimelinePlaybackStore.getState();
        const t = quantizeTimelineSeconds(currentTime, maxTime);
        const m = useMatchupStore.getState();
        if (!canRecordKillInPlacements(m.mapPlacements, killerPlacementId, victimPlacementId)) {
          return false;
        }

        set((s) => ({
          keyframes: mergeKeyframeSnapshotAtTime(s.keyframes, t, maxTime, (existingAtT) => {
            const base = captureTimelineKeyframeSnapshot();
            preserveKeyframeEventFields(base, existingAtT);
            const prevKills = existingAtT?.snapshot.killEvents ?? base.killEvents ?? [];
            base.killEvents = [...prevKills];
            return snapshotWithKillAppended(base, killerPlacementId, victimPlacementId);
          }),
        }));

        const snap = useTimelineKeyframeStore
          .getState()
          .keyframes.find((k) => timelineTimesEqualStep(k.time, t, maxTime))?.snapshot;
        if (snap) {
          useMatchupStore.setState({
            mapPlacements: snap.matchup.mapPlacements,
            abilityPlacements: structuredClone(snap.matchup.abilityPlacements ?? []),
          });
        }
        return true;
      },

      removeKeyframeById: (keyframeId: string) => {
        const maxTime = useTimelinePlaybackStore.getState().maxTime;
        const removed = get().keyframes.find((k) => k.id === keyframeId);
        if (!removed) return;
        set((s) => ({
          keyframes: s.keyframes.filter((k) => k.id !== keyframeId),
          detailKeyframeId: keyframeId === s.detailKeyframeId ? null : s.detailKeyframeId,
        }));
        applyKillRollbackToLiveMatchupIfNeeded(removed, maxTime);
      },

      removeKeyframeAtCurrentTime: () => {
        const { currentTime, maxTime } = useTimelinePlaybackStore.getState();
        const t = quantizeTimelineSeconds(currentTime, maxTime);
        const removed = get().keyframes.find((k) => timelineTimesEqualStep(k.time, t, maxTime));
        if (!removed) return;
        set((s) => ({
          keyframes: s.keyframes.filter((k) => !timelineTimesEqualStep(k.time, t, maxTime)),
          detailKeyframeId: removed.id === s.detailKeyframeId ? null : s.detailKeyframeId,
        }));
        applyKillRollbackToLiveMatchupIfNeeded(removed, maxTime);
      },

      appendKillToKeyframe: (keyframeId, killerPlacementId, victimPlacementId) => {
        const { currentTime, maxTime } = useTimelinePlaybackStore.getState();
        const entry = get().keyframes.find((k) => k.id === keyframeId);
        if (!entry) return false;
        const placements = entry.snapshot.matchup.mapPlacements;
        if (!canRecordKillInPlacements(placements, killerPlacementId, victimPlacementId)) {
          return false;
        }
        const newSnap = snapshotWithKillAppended(entry.snapshot, killerPlacementId, victimPlacementId);
        set((s) => ({
          keyframes: sortedKeyframes(
            s.keyframes.map((k) => (k.id === keyframeId ? { ...k, snapshot: newSnap } : k))
          ),
        }));
        if (timelineTimesEqualStep(currentTime, entry.time, maxTime)) {
          useMatchupStore.setState({
            mapPlacements: newSnap.matchup.mapPlacements,
            abilityPlacements: structuredClone(newSnap.matchup.abilityPlacements ?? []),
          });
        }
        return true;
      },

      recordAbilityDeployAtTime: (timeSeconds, event) => {
        const maxTime = useTimelinePlaybackStore.getState().maxTime;
        const t = quantizeTimelineSeconds(timeSeconds, maxTime);
        let builtSnapshot: TimelineKeyframeSnapshot | null = null;
        set((s) => {
          const next = mergeKeyframeSnapshotAtTime(s.keyframes, t, maxTime, (existingAtT) => {
            const base = captureTimelineKeyframeSnapshot();
            preserveKeyframeEventFields(base, existingAtT);
            const snap = snapshotWithAbilityDeployAppended(base, event, t);
            builtSnapshot = snap;
            return snap;
          });
          return { keyframes: next };
        });
        if (builtSnapshot) applySnapshotToLiveIfAtPlayhead(t, builtSnapshot);
      },

      purgeAbilityPlacementFromTimeline: (abilityPlacementId) => {
        const maxTime = useTimelinePlaybackStore.getState().maxTime;
        const { currentTime } = useTimelinePlaybackStore.getState();
        let snapshotAtPlayhead: TimelineKeyframeSnapshot | null = null;
        set((s) => {
          const next = s.keyframes.map((k) => ({
            ...k,
            snapshot: removePlacementFromSnapshot(k.snapshot, abilityPlacementId),
          }));
          const hit = next.find((k) => timelineTimesEqualStep(k.time, currentTime, maxTime));
          if (hit) snapshotAtPlayhead = hit.snapshot;
          return { keyframes: next };
        });
        useMatchupStore.setState((s) => ({
          abilityPlacements: s.abilityPlacements.filter((p) => p.id !== abilityPlacementId),
          sphericalSmokePlacementId:
            s.sphericalSmokePlacementId === abilityPlacementId
              ? null
              : s.sphericalSmokePlacementId,
          sphericalSmokePreview:
            s.sphericalSmokePlacementId === abilityPlacementId
              ? null
              : s.sphericalSmokePreview,
          fixedDualLineSmokePlacementId:
            s.fixedDualLineSmokePlacementId === abilityPlacementId
              ? null
              : s.fixedDualLineSmokePlacementId,
          fixedDualLineSmokePreview:
            s.fixedDualLineSmokePlacementId === abilityPlacementId
              ? null
              : s.fixedDualLineSmokePreview,
          fixedSingleLineSmokePlacementId:
            s.fixedSingleLineSmokePlacementId === abilityPlacementId
              ? null
              : s.fixedSingleLineSmokePlacementId,
          fixedSingleLineSmokePreview:
            s.fixedSingleLineSmokePlacementId === abilityPlacementId
              ? null
              : s.fixedSingleLineSmokePreview,
          curveSmokePlacementId:
            s.curveSmokePlacementId === abilityPlacementId
              ? null
              : s.curveSmokePlacementId,
          curveSmokePreviewPoints:
            s.curveSmokePlacementId === abilityPlacementId
              ? []
              : s.curveSmokePreviewPoints,
          directMovementPlacementId:
            s.directMovementPlacementId === abilityPlacementId
              ? null
              : s.directMovementPlacementId,
          directMovementPreview:
            s.directMovementPlacementId === abilityPlacementId
              ? null
              : s.directMovementPreview,
          blastPackPlacementId:
            s.blastPackPlacementId === abilityPlacementId
              ? null
              : s.blastPackPlacementId,
          blastPackPreview:
            s.blastPackPlacementId === abilityPlacementId
              ? null
              : s.blastPackPreview,
          statusEffectPlacementId:
            s.statusEffectPlacementId === abilityPlacementId
              ? null
              : s.statusEffectPlacementId,
          statusEffectPreview:
            s.statusEffectPlacementId === abilityPlacementId
              ? null
              : s.statusEffectPreview,
          anchorMovementPlacementDraft:
            s.anchorMovementPlacementDraft?.ownerPlacementId === abilityPlacementId
              ? null
              : s.anchorMovementPlacementDraft,
          selectedAbilityPlacementId:
            s.selectedAbilityPlacementId === abilityPlacementId
              ? null
              : s.selectedAbilityPlacementId,
          abilityInstancePopoverId:
            s.abilityInstancePopoverId === abilityPlacementId
              ? null
              : s.abilityInstancePopoverId,
          abilityInstancePopoverAnchor:
            s.abilityInstancePopoverId === abilityPlacementId
              ? null
              : s.abilityInstancePopoverAnchor,
        }));
        if (snapshotAtPlayhead) {
          applyTimelineKeyframeSnapshot(snapshotAtPlayhead);
          syncLiveAbilityPlacementsForPlayhead(currentTime);
        }
      },

      popKillFromKeyframe: (keyframeId) => {
        const { currentTime, maxTime } = useTimelinePlaybackStore.getState();
        const entry = get().keyframes.find((k) => k.id === keyframeId);
        if (!entry) return false;
        const kills = [...(entry.snapshot.killEvents ?? [])];
        if (!kills.length) return false;
        const last = kills.pop()!;
        const mapPlacements = reviveOneKillVictim(entry.snapshot.matchup.mapPlacements, last);
        const newSnap = {
          ...entry.snapshot,
          killEvents: kills,
          matchup: { ...entry.snapshot.matchup, mapPlacements },
        };
        set((s) => ({
          keyframes: sortedKeyframes(
            s.keyframes.map((k) => (k.id === keyframeId ? { ...k, snapshot: newSnap } : k))
          ),
        }));
        if (timelineTimesEqualStep(currentTime, entry.time, maxTime)) {
          useMatchupStore.setState({
            mapPlacements: newSnap.matchup.mapPlacements,
            abilityPlacements: structuredClone(newSnap.matchup.abilityPlacements ?? []),
          });
        }
        return true;
      },

      moveKeyframeTime: (id: string, newTimeSeconds: number) => {
        const maxTime = useTimelinePlaybackStore.getState().maxTime;
        const newT = quantizeTimelineSeconds(newTimeSeconds, maxTime);
        set((s) => {
          const idx = s.keyframes.findIndex((k) => k.id === id);
          if (idx < 0) return s;
          const others = s.keyframes.filter((k) => k.id !== id);
          if (others.some((k) => timelineTimesEqualStep(k.time, newT, maxTime))) {
            return s;
          }
          const cur = s.keyframes[idx];
          const merged = [...others, { ...cur, time: newT }];
          return { keyframes: sortedKeyframes(merged) };
        });
      },

      seekToPrevKeyframe: () => {
        const { currentTime, maxTime } = useTimelinePlaybackStore.getState();
        const sorted = sortedKeyframes(get().keyframes);
        const curTick = timelineTimeToTick(currentTime, maxTime);
        let target: TimelineKeyframeEntry | undefined;
        for (let i = sorted.length - 1; i >= 0; i--) {
          if (timelineTimeToTick(sorted[i].time, maxTime) < curTick) {
            target = sorted[i];
            break;
          }
        }
        if (!target) return;
        useTimelinePlaybackStore.getState().pausePlayback();
        useTimelinePlaybackStore.getState().seek(target.time);
      },

      seekToNextKeyframe: () => {
        const { currentTime, maxTime } = useTimelinePlaybackStore.getState();
        const sorted = sortedKeyframes(get().keyframes);
        const curTick = timelineTimeToTick(currentTime, maxTime);
        let target: TimelineKeyframeEntry | undefined;
        for (let i = 0; i < sorted.length; i++) {
          if (timelineTimeToTick(sorted[i].time, maxTime) > curTick) {
            target = sorted[i];
            break;
          }
        }
        if (!target) return;
        useTimelinePlaybackStore.getState().pausePlayback();
        useTimelinePlaybackStore.getState().seek(target.time);
      },
    }),
    { name: 'TimelineKeyframeStore', enabled: import.meta.env.DEV }
  )
);

export function useKeyframeSkipAvailability(
  currentTime: number,
  maxTime: number
): {
  canPrev: boolean;
  canNext: boolean;
} {
  const keyframes = useTimelineKeyframeStore((s) => s.keyframes);
  const curTick = timelineTimeToTick(currentTime, maxTime);
  let canPrev = false;
  let canNext = false;
  for (let i = 0; i < keyframes.length; i++) {
    const kt = timelineTimeToTick(keyframes[i].time, maxTime);
    if (kt < curTick) canPrev = true;
    if (kt > curTick) canNext = true;
  }
  return { canPrev, canNext };
}

/** 播放头是否对齐某一关键帧（100ms 网格） */
export function usePlayheadAtKeyframe(currentTime: number, maxTime: number): boolean {
  const keyframes = useTimelineKeyframeStore((s) => s.keyframes);
  return keyframes.some((k) => timelineTimesEqualStep(k.time, currentTime, maxTime));
}

/** 播放头所在的关键帧条目（用于详情按钮） */
export function useKeyframeAtPlayhead(
  currentTime: number,
  maxTime: number
): TimelineKeyframeEntry | undefined {
  const keyframes = useTimelineKeyframeStore((s) => s.keyframes);
  return keyframes.find((k) => timelineTimesEqualStep(k.time, currentTime, maxTime));
}

registerTimelinePlaybackKeyframesSource(() => useTimelineKeyframeStore.getState().keyframes);
