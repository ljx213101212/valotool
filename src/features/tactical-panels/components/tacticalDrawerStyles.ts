import type { DrawerProps } from 'antd';

/** AgentDetailDrawer / KeyframeDetailDrawer 共用玻璃质感 */
export const tacticalDrawerStyles: NonNullable<DrawerProps['styles']> = {
  mask: {
    background: 'rgba(15, 23, 42, 0.78)',
    backdropFilter: 'blur(4px)',
  },
  wrapper: {
    boxShadow: '-18px 0 52px rgba(0, 0, 0, 0.58)',
  },
  section: {
    background: '#0f172a',
    borderLeft: '1px solid rgba(56, 189, 248, 0.16)',
  },
  header: {
    background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.55) 0%, rgba(15, 23, 42, 1) 100%)',
    borderBottom: '1px solid rgba(51, 65, 85, 0.88)',
    padding: '14px 18px',
    boxShadow: 'inset 0 -1px 0 rgba(56, 189, 248, 0.06)',
  },
  title: {
    color: '#e2e8f0',
  },
  body: {
    background: '#0f172a',
    padding: '18px 18px 24px',
  },
  close: {
    color: 'rgba(148, 163, 184, 0.95)',
  },
};

/** 保证在所有自定义 HUD（如时间轴 cursor z-index）之上 */
export const TACTICAL_DRAWER_Z_INDEX = 12000;
