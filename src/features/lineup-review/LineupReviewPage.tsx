import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Button,
  Select,
  Input,
  message,
  Tag,
  Alert,
  Typography,
} from 'antd';
import type { FrameRoleConfig } from '@valotool/lineup-content';
import { AGENTS, MAPS, DEFAULT_FRAME_ROLES } from '@valotool/lineup-content';

const { Text } = Typography;

function apiUrl(path: string): string {
  const base = import.meta.env.VITE_REVIEW_SERVER_URL ?? '';
  return `${base}${path}`;
}

function imgUrl(p: string | undefined): string {
  if (!p) return '';
  const clean = p.replace(/^\.work\//, '');
  const base = import.meta.env.VITE_REVIEW_SERVER_URL ?? '';
  return `${base}/work/${encodeURIComponent(clean)}`;
}

interface FrameCandidate {
  path: string;
  atSec: number;
}

interface Provenance {
  videoId: string;
  url: string;
  creator: string;
  startSec: number;
  endSec: number;
}

interface DraftData {
  file: string;
  draftId: string;
  fields: Record<string, unknown>;
  frames: Record<string, string>;
  candidates: FrameCandidate[];
  contactSheet?: string;
  provenance: Provenance;
  confidence: number;
  warnings: string[];
  reviewStatus: 'pending' | 'approved' | 'rejected';
  frameRoles: FrameRoleConfig[];
}

interface FieldDef {
  key: string;
  label: string;
  hint: string;
  type: 'input' | 'select' | 'textarea';
  options?: { value: string; label: string }[];
}

const FIELD_DEFS: FieldDef[] = [
  { key: 'id', label: 'ID', hint: '唯一英文标识，已自动生成，可改', type: 'input' },
  { key: 'abilitySlot', label: '技能键', hint: 'C / Q / E / X', type: 'select', options: ['', 'C', 'Q', 'E', 'X'].map((v) => ({ value: v, label: v || '—' })) },
  { key: 'tier', label: '难度档', hint: 'must-learn / advanced / flashy', type: 'select', options: ['', 'must-learn', 'advanced', 'flashy'].map((v) => ({ value: v, label: v || '—' })) },
  { key: 'status', label: '状态', hint: 'verified / stale / draft', type: 'select', options: ['', 'verified', 'stale', 'draft'].map((v) => ({ value: v, label: v || '—' })) },
  { key: 'verifiedPatch', label: '验证版本', hint: '如 12.11', type: 'input' },
  { key: 'title', label: '标题', hint: '给玩家看的名字', type: 'input' },
  { key: 'technique', label: '手法', hint: 'stand / jump-throw / walk-throw ...', type: 'select', options: ['', 'stand', 'crouch', 'jump-throw', 'run-jump-throw', 'hold-jump-throw', 'walk-throw', 'placed'].map((v) => ({ value: v, label: v || '—' })) },
  { key: 'timing', label: '时机', hint: '选填，如「开局推进前」', type: 'input' },
  { key: 'origin', label: '站位', hint: '你站在哪扔', type: 'input' },
  { key: 'target', label: '落点', hint: '技能落在哪 / 覆盖什么', type: 'input' },
  { key: 'purpose', label: '用途', hint: '这个点位干嘛', type: 'textarea' },
];

const STATUS_COLOR: Record<string, string> = { pending: '#d97706', approved: '#16a34a', rejected: '#dc2626' };
const STATUS_LABEL: Record<string, string> = { pending: '待审', approved: '已通过', rejected: '已退回' };

export default function LineupReviewPage() {
  const [drafts, setDrafts] = useState<DraftData[]>([]);
  const [filterMap, setFilterMap] = useState<string | undefined>();
  const [filterAgent, setFilterAgent] = useState<string | undefined>();
  const [filterAbility, setFilterAbility] = useState<string | undefined>();
  const [selectedIdx, setSelectedIdx] = useState<number>(-1);
  const [workFields, setWorkFields] = useState<Record<string, unknown>>({});
  const [workFrames, setWorkFrames] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState<string>('');

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    setLoadError('');
    try {
      const r = await fetch(apiUrl('/api/lineup-review/drafts'));
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setDrafts(data);
    } catch (e) {
      setLoadError(String(e));
    }
  };

  const mapOptions = useMemo(
    () => [{ value: '', label: '全部地图' }, ...MAPS.map((m) => ({ value: m.slug, label: `${m.nameZh} (${m.nameEn})` }))],
    [],
  );
  const agentOptions = useMemo(
    () => [{ value: '', label: '全部特工' }, ...AGENTS.map((a) => ({ value: a.slug, label: `${a.nameZh} (${a.nameEn})` }))],
    [],
  );

  const abilityOptions = useMemo(() => {
    if (!filterAgent) return [{ value: '', label: '全部技能' }];
    const agent = AGENTS.find((a) => a.slug === filterAgent);
    if (!agent) return [{ value: '', label: '全部技能' }];
    return [
      { value: '', label: '全部技能' },
      ...agent.abilities.map((ab) => ({
        value: ab.slot,
        label: `${ab.slot} - ${ab.nameZh} (${ab.nameEn})`,
      })),
    ];
  }, [filterAgent]);

  const filteredDrafts = useMemo(() => {
    return drafts.filter((d) => {
      const f = d.fields as Record<string, unknown>;
      if (filterMap && f.map !== filterMap) return false;
      if (filterAgent && f.agent !== filterAgent) return false;
      if (filterAbility && f.abilitySlot !== filterAbility) return false;
      return true;
    });
  }, [drafts, filterMap, filterAgent, filterAbility]);

  const selected = selectedIdx >= 0 && selectedIdx < filteredDrafts.length ? filteredDrafts[selectedIdx] : null;

  const selectDraft = useCallback((idx: number) => {
    setSelectedIdx(idx);
    const d = filteredDrafts[idx];
    if (d) {
      setWorkFields({ ...d.fields });
      setWorkFrames({ ...d.frames });
    }
  }, [filteredDrafts]);

  const editField = useCallback((k: string, v: string) => {
    setWorkFields((prev) => ({ ...prev, [k]: v === '' ? undefined : v }));
  }, []);

  const assignFrame = useCallback((role: string, path: string) => {
    setWorkFrames((prev) => {
      const next = { ...prev };
      for (const [k, v] of Object.entries(next)) {
        if (v === path && k !== role) delete next[k];
      }
      next[role] = path;
      return next;
    });
  }, []);

  const save = useCallback(async (reviewStatus: DraftData['reviewStatus']) => {
    if (!selected) return;
    const body = JSON.stringify({
      file: selected.file,
      draftId: selected.draftId,
      patch: { fields: workFields, frames: workFrames, reviewStatus },
    });
    try {
      const r = await fetch(apiUrl('/api/lineup-review/draft'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
      });
      const out = await r.json();
      if (out.ok) {
        message.success(`已保存 (${STATUS_LABEL[out.draft.reviewStatus] ?? out.draft.reviewStatus})`);
        setDrafts((prev) => {
          const next = [...prev];
          const fi = next.findIndex((d) => d.draftId === selected.draftId);
          if (fi >= 0) next[fi] = { ...next[fi], ...out.draft, frameRoles: getFrameRoles(next[fi]) };
          return next;
        });
      } else {
        message.error(out.issues?.join('\n') ?? '保存失败');
      }
    } catch (e) {
      message.error(String(e));
    }
  }, [selected, workFields, workFrames]);

  const clearFilters = useCallback(() => {
    setFilterMap(undefined);
    setFilterAgent(undefined);
    setFilterAbility(undefined);
    setSelectedIdx(-1);
    setWorkFields({});
    setWorkFrames({});
  }, []);

  return (
    <div style={s.root}>
      <h1 style={s.title}>点位草稿人审</h1>

      {loadError && <Alert type="error" message={`无法连接审核服务: ${loadError}`} style={{ marginBottom: 16 }} showIcon closable />}

      <div style={s.filterBar}>
        <span style={s.filterLabel}>筛选：</span>
        <Select
          showSearch
          allowClear
          placeholder="地图"
          style={{ width: 180 }}
          value={filterMap}
          onChange={(v) => { setFilterMap(v); setSelectedIdx(-1); }}
          options={mapOptions}
          filterOption={(input, option) =>
            (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
          }
        />
        <Select
          showSearch
          allowClear
          placeholder="特工"
          style={{ width: 180, marginLeft: 8 }}
          value={filterAgent}
          onChange={(v) => { setFilterAgent(v); setFilterAbility(undefined); setSelectedIdx(-1); }}
          options={agentOptions}
          filterOption={(input, option) =>
            (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
          }
        />
        <Select
          showSearch
          allowClear
          placeholder="技能"
          style={{ width: 220, marginLeft: 8 }}
          value={filterAbility}
          onChange={(v) => { setFilterAbility(v); setSelectedIdx(-1); }}
          options={abilityOptions}
          filterOption={(input, option) =>
            (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
          }
        />
        <Button size="small" onClick={clearFilters} style={{ marginLeft: 8 }}>清除</Button>
        <Text type="secondary" style={{ marginLeft: 12 }}>
          共 {filteredDrafts.length} / {drafts.length} 条
        </Text>
      </div>

      <div style={s.main}>
        <div style={s.sidebar}>
          {filteredDrafts.map((d, i) => (
            <div
              key={d.draftId}
              style={{ ...s.sidebarItem, ...(i === selectedIdx ? s.sidebarItemActive : {}) }}
              onClick={() => selectDraft(i)}
            >
              <div style={s.sidebarTitle}>{(d.fields as Record<string, string>).title || d.draftId}</div>
              <div style={s.sidebarMeta}>
                <Tag color={STATUS_COLOR[d.reviewStatus]}>{STATUS_LABEL[d.reviewStatus] ?? d.reviewStatus}</Tag>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {String(d.fields.map ?? '?')} / {String(d.fields.agent ?? '?')}
                </Text>
              </div>
            </div>
          ))}
          {filteredDrafts.length === 0 && (
            <div style={{ padding: 16, color: '#6b7280', fontSize: 13 }}>{drafts.length === 0 ? '暂无草稿' : '无匹配项'}</div>
          )}
        </div>

        <div style={s.editor}>
          {!selected ? (
            <div style={{ color: '#6b7280', padding: 40, textAlign: 'center' }}>从左侧选择一条草稿开始审核</div>
          ) : (
            <DraftEditor
              draft={selected}
              workFields={workFields}
              workFrames={workFrames}
              onEditField={editField}
              onAssignFrame={assignFrame}
              onSave={save}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function DraftEditor({
  draft,
  workFields,
  workFrames,
  onEditField,
  onAssignFrame,
  onSave,
}: {
  draft: DraftData;
  workFields: Record<string, unknown>;
  workFrames: Record<string, string>;
  onEditField: (k: string, v: string) => void;
  onAssignFrame: (role: string, path: string) => void;
  onSave: (status: DraftData['reviewStatus']) => void;
}) {
  const f = workFields as Record<string, string>;
  const roles = draft.frameRoles ?? DEFAULT_FRAME_ROLES;

  return (
    <div>
      <h2 style={s.editorTitle}>{f.title || draft.draftId}</h2>
      <div style={s.meta}>
        <span style={s.metaItem}>地图: <b>{f.map}</b></span>
        <span style={s.metaItem}>特工: <b>{f.agent}</b></span>
        <span style={s.metaItem}>阵营: <b>{f.side || '—'}</b></span>
        <span style={s.metaItem}>点位: <b>{f.site || '—'}</b></span>
      </div>
      <div style={s.provenance}>
        来源：<a href={draft.provenance.url} target="_blank" rel="noreferrer">{draft.provenance.creator}</a>
        {' '}{draft.provenance.startSec}s–{draft.provenance.endSec}s | 置信度: {draft.confidence.toFixed(2)}
      </div>
      {draft.warnings.length > 0 && (
        <Alert type="warning" message={draft.warnings.join(' / ')} style={{ marginTop: 8 }} />
      )}

      <h3 style={s.sectionTitle}>指派人审帧 <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>（点击候选帧按钮指派）</Text></h3>
      <div style={s.roleSlots}>
        {roles.map((role) => (
          <div key={role.role} style={s.roleSlot}>
            <div style={s.roleLabel}>{role.label}</div>
            {workFrames[role.role] ? (
              <img src={imgUrl(workFrames[role.role])} alt={role.label} style={s.roleImg} />
            ) : (
              <div style={s.roleEmpty}>(未指派)</div>
            )}
          </div>
        ))}
      </div>

      {draft.contactSheet && (
        <details open style={{ marginTop: 12 }}>
          <summary style={s.summary}>接触表（整段 1fps 概览）</summary>
          <img src={imgUrl(draft.contactSheet)} alt="contact sheet" style={s.contactImg} />
        </details>
      )}

      <h4 style={s.sectionTitle}>候选帧</h4>
      <div style={s.candGrid}>
        {draft.candidates.map((c) => (
          <div key={c.path} style={s.candItem}>
            <img src={imgUrl(c.path)} alt={`${c.atSec}s`} style={s.candImg} />
            <div style={s.candTime}>{c.atSec}s</div>
            <div style={s.candBtns}>
              {roles.map((role) => (
                <button
                  key={role.role}
                  style={{
                    ...s.candBtn,
                    ...(workFrames[role.role] === c.path ? s.candBtnActive : {}),
                  }}
                  onClick={() => onAssignFrame(role.role, c.path)}
                  title={role.label}
                >
                  {role.label.slice(0, 1)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <h4 style={s.sectionTitle}>字段编辑</h4>
      <div style={s.fieldGrid}>
        {FIELD_DEFS.map((fd) => (
          <div key={fd.key} style={s.fieldRow}>
            <label style={s.fieldLabel} title={fd.hint}>
              {fd.label}
            </label>
            {fd.type === 'select' ? (
              <Select
                size="small"
                style={s.fieldInput}
                value={(workFields[fd.key] as string) ?? ''}
                onChange={(v) => onEditField(fd.key, v)}
                options={fd.options}
              />
            ) : fd.type === 'textarea' ? (
              <Input.TextArea
                size="small"
                style={s.fieldInput}
                value={(workFields[fd.key] as string) ?? ''}
                placeholder={fd.hint}
                onChange={(e) => onEditField(fd.key, e.target.value)}
                rows={2}
              />
            ) : (
              <Input
                size="small"
                style={s.fieldInput}
                value={(workFields[fd.key] as string) ?? ''}
                placeholder={fd.hint}
                onChange={(e) => onEditField(fd.key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      <div style={s.actions}>
        <Button onClick={() => onSave('pending')}>保存草稿</Button>
        <Button type="primary" style={s.approveBtn} onClick={() => onSave('approved')}>✓ 通过</Button>
        <Button danger onClick={() => onSave('rejected')}>✕ 退回</Button>
      </div>
    </div>
  );
}

function getFrameRoles(d: DraftData): FrameRoleConfig[] {
  return d.frameRoles ?? [];
}

type CS = React.CSSProperties;
const s = {
  root: {
    minHeight: '100vh',
    boxSizing: 'border-box',
    padding: '24px 32px',
    background: '#0e1116',
    color: '#e5e7eb',
    fontFamily: 'system-ui, sans-serif',
    maxWidth: 1200,
    margin: '0 auto',
  } as CS,
  title: { margin: '0 0 20px', fontSize: 24, fontWeight: 700 } as CS,
  filterBar: {
    display: 'flex', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 4,
  } as CS,
  filterLabel: { fontSize: 13, color: '#9ca3af', marginRight: 8 } as CS,
  main: { display: 'flex', gap: 16, minHeight: 0 } as CS,
  sidebar: {
    width: 260, flexShrink: 0, overflow: 'auto', maxHeight: 'calc(100vh - 140px)',
    border: '1px solid #1f2937', borderRadius: 8, background: '#111827',
  } as CS,
  sidebarItem: {
    padding: '10px 14px', borderBottom: '1px solid #1f2937', cursor: 'pointer',
    transition: 'background 0.15s',
  } as CS,
  sidebarItemActive: { background: '#1e3a5f', borderLeft: '3px solid #3b82f6' } as CS,
  sidebarTitle: { fontSize: 13, fontWeight: 500, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as CS,
  sidebarMeta: { display: 'flex', alignItems: 'center', gap: 6 } as CS,
  editor: { flex: 1, overflow: 'auto', maxHeight: 'calc(100vh - 140px)', paddingRight: 8 } as CS,
  editorTitle: { margin: '0 0 6px', fontSize: 18 } as CS,
  meta: { display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 4 } as CS,
  metaItem: { fontSize: 13, color: '#9ca3af' } as CS,
  provenance: { fontSize: 12, color: '#6b7280' } as CS,
  sectionTitle: { fontSize: 14, fontWeight: 600, margin: '16px 0 8px', color: '#d1d5db' } as CS,
  roleSlots: { display: 'flex', gap: 12, flexWrap: 'wrap' } as CS,
  roleSlot: { width: 200 } as CS,
  roleLabel: { fontWeight: 600, fontSize: 12, color: '#93c5fd', marginBottom: 4 } as CS,
  roleImg: { width: 200, height: 112, objectFit: 'cover', border: '2px solid #3b82f6', borderRadius: 4, background: '#1f2937' } as CS,
  roleEmpty: { width: 200, height: 112, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #374151', borderRadius: 4, color: '#6b7280', fontSize: 13 } as CS,
  summary: { cursor: 'pointer', fontSize: 13, color: '#9ca3af', fontWeight: 500 } as CS,
  contactImg: { maxWidth: '100%', border: '1px solid #374151', borderRadius: 4, marginTop: 6 } as CS,
  candGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 142px)', gap: 8, marginBottom: 8 } as CS,
  candItem: { border: '1px solid #1f2937', borderRadius: 4, overflow: 'hidden', background: '#111827' } as CS,
  candImg: { width: 140, height: 79, objectFit: 'cover', display: 'block' } as CS,
  candTime: { fontSize: 10, color: '#6b7280', padding: '2px 4px', textAlign: 'center' } as CS,
  candBtns: { display: 'flex' } as CS,
  candBtn: { flex: 1, fontSize: 11, padding: '2px 0', cursor: 'pointer', background: '#1f2937', color: '#9ca3af', border: 'none', borderRight: '1px solid #374151' } as CS,
  candBtnActive: { background: '#3b82f6', color: '#fff' } as CS,
  fieldGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', maxWidth: 680 } as CS,
  fieldRow: { display: 'flex', flexDirection: 'column', gap: 2 } as CS,
  fieldLabel: { fontSize: 12, color: '#9ca3af' } as CS,
  fieldInput: { width: '100%' } as CS,
  actions: { marginTop: 20, display: 'flex', gap: 10 } as CS,
  approveBtn: { background: '#16a34a', borderColor: '#16a34a' } as CS,
} satisfies Record<string, CS>;
