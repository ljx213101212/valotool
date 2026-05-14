import type { CSSProperties } from 'react';
import { tacticalSideMapTokenColors } from '@/shared/constants/tacticalSideColors';
import { getAgentPortraitUrl } from '@/shared/data/agentPortraitUrl';
import type { MatchupSide } from '@/shared/types/matchup';
import './AgentMapTokenChip.less';

type AgentMapTokenChipProps = {
  agentId: string;
  side: MatchupSide;
  /** 与地图 MapHeroToken 淘汰态一致 */
  eliminated?: boolean;
  /**
   * 击杀列表等：受害者虽在快照里为 eliminated，仍显示角色头像便于辨认；
   * 为 true 时不使用叉号样式（地图上仍按 eliminated 显示叉）。
   */
  alwaysShowPortrait?: boolean;
  /** 外径像素 */
  size?: number;
  /** 悬停显示全名 */
  title?: string;
};

/**
 * 地图特工 token 的只读缩略版（DOM），用于 Drawer 等非 Konva 场景。
 */
export function AgentMapTokenChip({
  agentId,
  side,
  eliminated = false,
  alwaysShowPortrait = false,
  size = 28,
  title,
}: AgentMapTokenChipProps) {
  const { accent } = tacticalSideMapTokenColors(side);
  const portraitUrl = getAgentPortraitUrl(agentId);

  const showEliminatedMark = eliminated && !alwaysShowPortrait;

  const style = {
    width: size,
    height: size,
    ['--chip-accent' as string]: accent,
  } as CSSProperties;

  return (
    <div
      className={`agent-map-token-chip${showEliminatedMark ? ' agent-map-token-chip--eliminated' : ''}`}
      style={style}
      title={title}
      role="img"
      aria-label={title}
    >
      {showEliminatedMark ? (
        <span className="agent-map-token-chip__x" aria-hidden>
          <span className="agent-map-token-chip__x-bar" />
          <span className="agent-map-token-chip__x-bar agent-map-token-chip__x-bar--cross" />
        </span>
      ) : portraitUrl ? (
        <img className="agent-map-token-chip__img" src={portraitUrl} alt="" draggable={false} />
      ) : (
        <span className="agent-map-token-chip__fallback" aria-hidden />
      )}
    </div>
  );
}
