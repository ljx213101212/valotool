import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, Select, Checkbox, message, Tag, Typography } from 'antd';
import { AGENTS } from '@valotool/lineup-content';

const { TextArea } = Input;
const { Text, Title } = Typography;

function apiUrl(path: string): string {
  const base = import.meta.env.VITE_REVIEW_SERVER_URL ?? '';
  return `${base}${path}`;
}

function imgUrl(p: string | undefined): string {
  if (!p) return '';
  const base = import.meta.env.VITE_REVIEW_SERVER_URL ?? '';
  return `${base}/work/${encodeURIComponent(p.replace(/^.*\.work\//, ''))}`;
}

interface SegmentInfo {
  segmentId: string;
  title: string;
  startSec: number;
  endSec: number;
  candidateCount: number;
  clipPath?: string;
  contactSheet?: string;
}

interface SegmentResult {
  segmentId: string;
  selections: Array<{ role: string; framePath: string; confidence: number }>;
  warnings: string[];
}

export default function VideoIngestPage() {
  const [sourceJson, setSourceJson] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoId, setVideoId] = useState('');
  const [segments, setSegments] = useState<SegmentInfo[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [agentSlugs, setAgentSlugs] = useState<Record<string, string>>({});
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<Record<string, SegmentResult>>({});

  const handleUpload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/source-video'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: sourceJson,
      });
      const data = await res.json() as { videoId?: string; title?: string; segments?: SegmentInfo[]; error?: string };
      if (!res.ok || data.error) {
        message.error(data.error ?? '请求失败');
        return;
      }
      setVideoId(data.videoId ?? '');
      setSegments(data.segments ?? []);
      const newAgentSlugs: Record<string, string> = {};
      const newTitles: Record<string, string> = {};
      for (const s of data.segments ?? []) {
        newAgentSlugs[s.segmentId] = agentSlugs[s.segmentId] ?? '';
        newTitles[s.segmentId] = s.title;
      }
      setAgentSlugs(newAgentSlugs);
      setTitles(newTitles);
      message.success(`已加载 ${data.segments?.length ?? 0} 个片段`);
    } catch (e) {
      message.error(String(e));
    } finally {
      setLoading(false);
    }
  }, [sourceJson, agentSlugs]);

  const toggleSegment = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedIds.size === segments.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(segments.map((s) => s.segmentId)));
  }, [segments, selectedIds]);

  const handleGenerate = useCallback(async () => {
    const toGen = segments.filter((s) => selectedIds.has(s.segmentId));
    if (!toGen.length) { message.warning('请先勾选要处理的片段'); return; }
    setGenerating(new Set(toGen.map((s) => s.segmentId)));
    for (const seg of toGen) {
      try {
        const res = await fetch(apiUrl('/api/video-analyze'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId,
            segmentId: seg.segmentId,
            title: titles[seg.segmentId] ?? seg.title,
            agentSlug: agentSlugs[seg.segmentId],
          }),
        });
        const data = await res.json() as { selections?: SegmentResult['selections']; warnings?: string[]; error?: string };
        if (!res.ok || data.error) {
          message.error(`${seg.segmentId}: ${data.error ?? '失败'}`);
          setResults((prev) => ({ ...prev, [seg.segmentId]: { segmentId: seg.segmentId, selections: [], warnings: [data.error ?? '失败'] } }));
        } else {
          setResults((prev) => ({ ...prev, [seg.segmentId]: { segmentId: seg.segmentId, selections: data.selections ?? [], warnings: data.warnings ?? [] } }));
          message.success(`${seg.segmentId}: 识别到 ${data.selections?.length ?? 0} 帧`);
        }
      } catch (e) {
        message.error(`${seg.segmentId}: ${String(e)}`);
        setResults((prev) => ({ ...prev, [seg.segmentId]: { segmentId: seg.segmentId, selections: [], warnings: [String(e)] } }));
      } finally {
        setGenerating((prev) => {
          const next = new Set(prev);
          next.delete(seg.segmentId);
          return next;
        });
      }
    }
  }, [segments, selectedIds, titles, agentSlugs, videoId]);

  const frameLabel = (role: string): string => {
    const map: Record<string, string> = {
      stand: '站哪', aim: '瞄哪', effect: '落点', smoke_landing: '瞬云落点',
      trigger_timing: '触发时机', dash_landing: 'dash落点', first_angle: '第一枪位',
    };
    return map[role] ?? role;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0e1116', color: '#e5e7eb', fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <Title level={3} style={{ color: '#e5e7eb', marginBottom: 8 }}>视频点位录入</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        粘贴油猴生成的 SourceVideo JSON，自动下载视频并裁剪片段，然后选择片段调用 Gemini 视频分析预选帧。
      </Text>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <TextArea
          value={sourceJson}
          onChange={(e) => setSourceJson(e.target.value)}
          placeholder='粘贴油猴 SourceVideo JSON ...'
          rows={4}
          style={{ flex: 1, background: '#111827', color: '#e5e7eb', borderColor: '#374151' }}
        />
        <Button type="primary" onClick={handleUpload} loading={loading} style={{ alignSelf: 'flex-end' }}>
          加载视频
        </Button>
      </div>

      {segments.length > 0 && (
        <>
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button size="small" onClick={selectAll}>
              {selectedIds.size === segments.length ? '取消全选' : '全选'}
            </Button>
            <Button
              type="primary"
              onClick={handleGenerate}
              disabled={selectedIds.size === 0 || generating.size > 0}
              loading={generating.size > 0}
            >
              生成选中片段 ({selectedIds.size})
            </Button>
            <Link to="/lineup-review" style={{ fontSize: 12, color: '#60a5fa' }}>
              跳转到人审 →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {segments.map((seg) => {
              const gen = generating.has(seg.segmentId);
              const res = results[seg.segmentId];
              return (
                <div
                  key={seg.segmentId}
                  style={{
                    padding: 16, background: '#111827', border: `1px solid ${res ? '#1e5631' : '#1f2937'}`,
                    borderRadius: 8, display: 'flex', gap: 16, alignItems: 'flex-start',
                  }}
                >
                  <Checkbox
                    checked={selectedIds.has(seg.segmentId)}
                    onChange={() => toggleSegment(seg.segmentId)}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                      <Text strong style={{ color: '#e5e7eb' }}>{seg.segmentId}</Text>
                      <Tag>{seg.startSec}s - {seg.endSec}s ({seg.endSec - seg.startSec}s)</Tag>
                      <Tag color="blue">{seg.candidateCount} 候选帧</Tag>
                      {gen && <Tag color="processing">分析中...</Tag>}
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                      <Input
                        size="small"
                        value={titles[seg.segmentId] ?? ''}
                        onChange={(e) => setTitles((prev) => ({ ...prev, [seg.segmentId]: e.target.value }))}
                        placeholder="段标题"
                        style={{ width: 240, background: '#1f2937', color: '#e5e7eb', borderColor: '#374151' }}
                      />
                      <Select
                        size="small"
                        value={agentSlugs[seg.segmentId] || undefined}
                        onChange={(v) => setAgentSlugs((prev) => ({ ...prev, [seg.segmentId]: v }))}
                        placeholder="选择英雄"
                        style={{ width: 140 }}
                        options={AGENTS.map((a) => ({ value: a.slug, label: a.nameZh }))}
                      />
                    </div>
                    {seg.contactSheet && (
                      <img
                        src={imgUrl(seg.contactSheet)}
                        alt="contact sheet"
                        style={{ maxWidth: '100%', maxHeight: 120, borderRadius: 4, marginBottom: 8 }}
                      />
                    )}
                    {res && (
                      <div style={{ marginTop: 8 }}>
                        <Text style={{ color: '#22c55e', fontSize: 13 }}>结果:</Text>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                          {res.selections.map((sel) => (
                            <Tag key={sel.role} color="green">
                              {frameLabel(sel.role)} ({(sel.confidence * 100).toFixed(0)}%)
                            </Tag>
                          ))}
                        </div>
                        {res.warnings.length > 0 && (
                          <div style={{ fontSize: 12, color: '#fbbf24', marginTop: 4 }}>
                            {res.warnings.join('; ')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div style={{ position: 'fixed', right: 14, bottom: 12, display: 'flex', gap: 8 }}>
        <Link to="/" style={{ padding: '4px 10px', fontSize: 12, borderRadius: 6, background: 'rgba(17,24,39,0.85)', color: '#93c5fd', border: '1px solid #334155', textDecoration: 'none' }}>
          ← 回到首页
        </Link>
        <Link to="/lineup-review" style={{ padding: '4px 10px', fontSize: 12, borderRadius: 6, background: 'rgba(17,24,39,0.85)', color: '#93c5fd', border: '1px solid #334155', textDecoration: 'none' }}>
          人审页面 →
        </Link>
      </div>
    </div>
  );
}
