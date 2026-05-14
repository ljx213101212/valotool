import type { ModalProps } from 'antd';

/** 与战术 Drawer 一致的 Modal / Modal.confirm 深色语义样式（配合 ConfigProvider dark） */
export const tacticalModalStyles = {
  mask: {
    background: 'rgba(15, 23, 42, 0.78)',
    backdropFilter: 'blur(4px)',
  },
  container: {
    background: '#0f172a',
    borderRadius: 12,
    border: '1px solid rgba(51, 65, 85, 0.92)',
    boxShadow: '0 28px 56px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(56, 189, 248, 0.06)',
    overflow: 'hidden',
    padding: 0,
  },
  header: {
    margin: 0,
    padding: '14px 18px',
    background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.72) 0%, rgba(15, 23, 42, 1) 100%)',
    borderBottom: '1px solid rgba(51, 65, 85, 0.88)',
  },
  title: {
    color: '#e2e8f0',
    fontWeight: 700,
    fontSize: 15,
    letterSpacing: '0.02em',
  },
  body: {
    padding: '18px 18px 10px',
    background: '#0f172a',
  },
  footer: {
    margin: 0,
    padding: '12px 18px 16px',
    borderTop: '1px solid rgba(51, 65, 85, 0.65)',
    background: '#0f172a',
  },
} satisfies NonNullable<ModalProps['styles']>;
