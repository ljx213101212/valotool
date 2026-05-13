import { ThunderboltOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';
import { AgentMapTokenChip } from '@/components/AgentMapTokenChip';
import { getAgentLabel } from '@/data/agentsCatalog';
import type { MapAgentPlacement } from '@/types/matchup';
import './KillEventRow.less';

type KillEventRowProps = {
  /** 展示序号，从 1 起 */
  displayIndex: number;
  killer: MapAgentPlacement | null;
  victim: MapAgentPlacement | null;
  onClick?: () => void;
  /** 如关键帧时间码 */
  trailing?: ReactNode;
  /** 可点击时读屏文案 */
  ariaJumpLabel?: string;
};

export function KillEventRow({ displayIndex, killer, victim, onClick, trailing, ariaJumpLabel }: KillEventRowProps) {
  const kLabel = killer ? getAgentLabel(killer.agentId) : '未知';
  const vLabel = victim ? getAgentLabel(victim.agentId) : '未知';
  const rowLabel = `${kLabel} 击杀 ${vLabel}`;

  const tokens = (
    <div className="kill-event-row__tokens" role="group" aria-label={rowLabel}>
      {killer ? (
        <AgentMapTokenChip
          agentId={killer.agentId}
          side={killer.side}
          eliminated={!!killer.eliminated}
          title={getAgentLabel(killer.agentId)}
        />
      ) : (
        <span className="kill-event-row__missing" title="未知特工">
          ?
        </span>
      )}
      <ThunderboltOutlined className="kill-event-row__icon" aria-label="击杀" title="击杀" />
      {victim ? (
        <AgentMapTokenChip
          agentId={victim.agentId}
          side={victim.side}
          eliminated={!!victim.eliminated}
          alwaysShowPortrait
          title={getAgentLabel(victim.agentId)}
        />
      ) : (
        <span className="kill-event-row__missing" title="未知特工">
          ?
        </span>
      )}
    </div>
  );

  const idx = (
    <span className="kill-event-row__idx" aria-hidden>
      {displayIndex}
    </span>
  );

  if (onClick) {
    return (
      <li className="kill-event-row">
        <button
          type="button"
          className="kill-event-row__btn"
          onClick={onClick}
          aria-label={ariaJumpLabel ?? `跳转到该关键帧：${rowLabel}`}
        >
          {idx}
          <div className="kill-event-row__body">
            {tokens}
            {trailing ? <div className="kill-event-row__trailing">{trailing}</div> : null}
          </div>
        </button>
      </li>
    );
  }

  return (
    <li className="kill-event-row">
      <div className="kill-event-row__static">
        {idx}
        <div className="kill-event-row__body">
          {tokens}
          {trailing ? <div className="kill-event-row__trailing">{trailing}</div> : null}
        </div>
      </div>
    </li>
  );
}
