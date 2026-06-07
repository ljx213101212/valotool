import { Navigate, useParams } from 'react-router-dom';
import { MatchReplayView } from './MatchReplayView';

/**
 * 路由包装：从 :matchId 取参并以 key={matchId} 挂载复盘视图，
 * 切换对局即重新挂载、状态归零。缺参时回退到对局列表。
 */
export function MatchReplayRoute() {
  const { matchId } = useParams();
  if (!matchId) return <Navigate to="/replay" replace />;
  return <MatchReplayView key={matchId} matchId={matchId} />;
}

export default MatchReplayRoute;
