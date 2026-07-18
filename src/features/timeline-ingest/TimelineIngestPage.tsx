import { useState, useCallback, useMemo } from 'react';
import {
  Button,
  Select,
  Input,
  Segmented,
  Upload,
  message,
  Alert,
  Divider,
  Table,
} from 'antd';
import { UploadOutlined, CopyOutlined, DownloadOutlined, FileTextOutlined, EditOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { parseTimeline, buildBilibiliTimelineSource } from '@valotool/lineup-ingest/timeline';
import type { BilibiliTimelineSourceInput, ParsedSegment } from '@valotool/lineup-ingest/timeline';
import { AGENTS, MAPS } from '@valotool/lineup-content';

type InputMode = 'upload' | 'edit';

interface FormErrors {
  timeline?: string;
  bvid?: string;
  title?: string;
  creator?: string;
  map?: string;
  agent?: string;
}

const BV_PATTERN = /^BV[0-9A-Za-z]{10}$/;

function formatTime(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = Math.floor(totalSec % 60);
  const ss = s.toString().padStart(2, '0');
  return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

export default function TimelineIngestPage() {
  const [inputMode, setInputMode] = useState<InputMode>('upload');
  const [timelineText, setTimelineText] = useState('');
  const [bvid, setBvid] = useState('');
  const [title, setTitle] = useState('');
  const [creator, setCreator] = useState('');
  const [map, setMap] = useState<string>();
  const [agent, setAgent] = useState<string>();
  const [creatorUid, setCreatorUid] = useState('');
  const [recordedPatch, setRecordedPatch] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [output, setOutput] = useState('');
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);

  const mapOptions = useMemo(
    () => MAPS.map((m) => ({ value: m.slug, label: `${m.nameZh} (${m.nameEn})` })),
    [],
  );
  const agentOptions = useMemo(
    () => AGENTS.map((a) => ({ value: a.slug, label: `${a.nameZh} (${a.nameEn})` })),
    [],
  );

  const timelinePreview = useMemo(() => {
    if (!timelineText.trim()) return null;
    return parseTimeline(timelineText);
  }, [timelineText]);

  const validate = useCallback((): FormErrors => {
    const errs: FormErrors = {};
    if (!timelineText.trim()) errs.timeline = '请输入或上传时间轴内容';
    if (!bvid.trim()) errs.bvid = '请输入 BVID';
    else if (!BV_PATTERN.test(bvid.trim())) errs.bvid = 'BVID 格式无效（须为 BV + 10 位字母数字）';
    else if (/^BV0{10}$/.test(bvid.trim())) errs.bvid = 'BVID 不能使用全零占位符';
    if (!title.trim()) errs.title = '请输入视频标题';
    if (!creator.trim()) errs.creator = '请输入 UP 主名';
    if (!map) errs.map = '请选择地图';
    if (!agent) errs.agent = '请选择英雄';
    return errs;
  }, [timelineText, bvid, title, creator, map, agent]);

  const handleGenerate = useCallback(() => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0 || !timelinePreview) return;

    const { segments, skipped } = timelinePreview;
    const warns: string[] = [];
    if (skipped.length) warns.push(`跳过 ${skipped.length} 行（无时间戳或注释）`);
    for (let i = 1; i < segments.length; i++) {
      if (segments[i].startSec <= segments[i - 1].startSec) {
        warns.push(`第 ${i + 1} 段时间未递增`);
      }
    }
    setParseWarnings(warns);

    const input: BilibiliTimelineSourceInput = {
      bvid: bvid.trim(),
      title: title.trim(),
      creator: creator.trim(),
      map: map!,
      agent: agent!,
      ...(creatorUid.trim() ? { creatorUid: creatorUid.trim() } : {}),
      ...(recordedPatch.trim() ? { recordedPatch: recordedPatch.trim() } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
    };

    try {
      const sources = buildBilibiliTimelineSource(timelineText, input);
      setOutput(JSON.stringify(sources, null, 2));
    } catch (e) {
      message.error(e instanceof Error ? e.message : String(e));
    }
  }, [validate, timelinePreview, bvid, title, creator, map, agent, creatorUid, recordedPatch, note, timelineText]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(output).then(() => message.success('已复制'));
  }, [output]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bvid || 'output'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [output, bvid]);

  const uploadProps: UploadProps = {
    accept: '.txt',
    showUploadList: false,
    beforeUpload: (file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = (e.target?.result as string) ?? '';
        setTimelineText(text);
        message.success(`已读取 ${file.name}`);
      };
      reader.readAsText(file);
      return false;
    },
  };

  const formItem = (label: string, required: boolean, node: React.ReactNode, error?: string) => (
    <div style={s.formItem}>
      <label style={s.label}>
        {required && <span style={s.required}>* </span>}
        {label}
      </label>
      <div style={s.field}>{node}</div>
      {error && <div style={s.error}>{error}</div>}
    </div>
  );

  return (
    <div style={s.root}>
      <h1 style={s.title}>时间轴录入</h1>

      <section style={s.section}>
        <h2 style={s.sectionTitle}>时间轴来源</h2>
        <Segmented
          value={inputMode}
          onChange={(v) => setInputMode(v as InputMode)}
          options={[
            { value: 'upload', label: <><UploadOutlined /> 文件上传</> },
            { value: 'edit', label: <><EditOutlined /> 直接编辑</> },
          ]}
          style={s.segmented}
        />

        {inputMode === 'upload' ? (
          <Upload.Dragger {...uploadProps} style={s.dragger}>
            <p style={s.draggerIcon}><FileTextOutlined style={{ fontSize: 36, color: '#60a5fa' }} /></p>
            <p style={s.draggerText}>拖拽 .txt 时间轴文件到此处，或点击选择</p>
            <p style={s.draggerHint}>支持 mm:ss 标题 / h:mm:ss 标题 格式</p>
          </Upload.Dragger>
        ) : (
          <Input.TextArea
            rows={10}
            placeholder={'0:22 进攻a点\n1:00 防守b点\n13:44 a二楼下看二楼上'}
            value={timelineText}
            onChange={(e) => setTimelineText(e.target.value)}
            style={s.textarea}
          />
        )}

        {errors.timeline && <Alert type="error" message={errors.timeline} showIcon style={{ marginTop: 8 }} />}

        {timelinePreview && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <h3 style={{ margin: 0, fontSize: 14, color: '#d1d5db' }}>
                解析结果：{timelinePreview.segments.length} 段
              </h3>
              {timelinePreview.skipped.length > 0 && (
                <span style={{ fontSize: 12, color: '#fbbf24' }}>
                  跳过 {timelinePreview.skipped.length} 行
                </span>
              )}
            </div>

            {timelinePreview.segments.length > 0 ? (
              <Table<ParsedSegment & { key: number }>
                dataSource={timelinePreview.segments.map((seg, i) => ({
                  ...seg, key: i,
                }))}
                columns={[
                  {
                    title: '#',
                    dataIndex: 'key',
                    width: 44,
                    render: (_, __, idx) => (
                      <span style={{ color: '#6b7280' }}>{idx + 1}</span>
                    ),
                  },
                  {
                    title: <><ClockCircleOutlined /> 时间</>,
                    dataIndex: 'startSec',
                    width: 90,
                    render: (v: number) => (
                      <span style={{ fontVariantNumeric: 'tabular-nums', color: '#93c5fd' }}>
                        {formatTime(v)}
                      </span>
                    ),
                  },
                  {
                    title: '标题',
                    dataIndex: 'title',
                    render: (v: string) => (
                      <span style={{ color: v ? '#e5e7eb' : '#4b5563', fontStyle: v ? undefined : 'italic' }}>
                        {v || '(无标题)'}
                      </span>
                    ),
                  },
                ]}
                pagination={false}
                size="small"
                style={{ ...s.table }}
                scroll={{ y: 280 }}
              />
            ) : (
              <div style={{ fontSize: 13, color: '#9ca3af', padding: '12px 0' }}>
                未解析出任何有效时间轴行（格式：mm:ss 标题）
              </div>
            )}
          </div>
        )}

        {timelinePreview?.skipped.length ? (
          <div style={{ marginTop: 8 }}>
            <span style={{ fontSize: 12, color: '#6b7280' }}>跳过的行：</span>
            {timelinePreview.skipped.map((line, i) => (
              <span key={i} style={{ fontSize: 11, color: '#4b5563', marginLeft: 6 }}>
                {line}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <Divider style={{ borderColor: '#1f2937' }} />

      <section style={s.section}>
        <h2 style={s.sectionTitle}>视频元信息</h2>

        <div style={s.formGrid}>
          {formItem('BVID', true, <Input value={bvid} onChange={(e) => setBvid(e.target.value)} placeholder="BV1Tz4y1e7NK" />, errors.bvid)}
          {formItem('标题', true, <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="捷风 Ascent 进点合集" />, errors.title)}
          {formItem('UP 主', true, <Input value={creator} onChange={(e) => setCreator(e.target.value)} placeholder="UP 主名" />, errors.creator)}
          {formItem('地图', true,
            <Select
              showSearch
              value={map}
              onChange={setMap}
              options={mapOptions}
              placeholder="选择地图"
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
            />,
            errors.map,
          )}
          {formItem('英雄', true,
            <Select
              showSearch
              value={agent}
              onChange={setAgent}
              options={agentOptions}
              placeholder="选择英雄"
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
            />,
            errors.agent,
          )}
          {formItem('UP 主 UID', false, <Input value={creatorUid} onChange={(e) => setCreatorUid(e.target.value)} placeholder="可选" />)}
          {formItem('录制版本', false, <Input value={recordedPatch} onChange={(e) => setRecordedPatch(e.target.value)} placeholder="如 12.11" />)}
          {formItem('备注', false, <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="可选" />)}
        </div>
      </section>

      <div style={s.actions}>
        <Button type="primary" size="large" onClick={handleGenerate}>
          生成
        </Button>
      </div>

      {parseWarnings.length > 0 && (
        <div style={{ marginTop: 12 }}>
          {parseWarnings.map((w, i) => (
            <Alert key={i} type="warning" message={w} showIcon style={{ marginBottom: 4 }} />
          ))}
        </div>
      )}

      {output && (
        <section style={s.section}>
          <div style={s.outputHeader}>
            <h2 style={s.sectionTitle}>输出结果</h2>
            <div style={s.outputActions}>
              <Button icon={<CopyOutlined />} size="small" onClick={handleCopy}>复制</Button>
              <Button icon={<DownloadOutlined />} size="small" onClick={handleDownload} style={{ marginLeft: 8 }}>下载</Button>
            </div>
          </div>
          <Input.TextArea
            rows={16}
            value={output}
            readOnly
            style={{ ...s.textarea, fontFamily: 'monospace', fontSize: 12 }}
          />
        </section>
      )}
    </div>
  );
}

type CS = React.CSSProperties;
const s = {
  root: {
    minHeight: '100vh',
    boxSizing: 'border-box',
    padding: 32,
    background: '#0e1116',
    color: '#e5e7eb',
    fontFamily: 'system-ui, sans-serif',
    maxWidth: 760,
    margin: '0 auto',
  } as CS,
  title: { margin: '0 0 24px', fontSize: 24, fontWeight: 700 } as CS,
  section: { marginBottom: 24 } as CS,
  sectionTitle: { fontSize: 16, fontWeight: 600, margin: '0 0 12px', color: '#d1d5db' } as CS,
  segmented: { marginBottom: 12 } as CS,
  dragger: {
    background: '#111827', border: '1px dashed #374151', borderRadius: 8,
  } as CS,
  draggerIcon: { marginBottom: 8 } as CS,
  draggerText: { color: '#9ca3af', margin: 0 } as CS,
  draggerHint: { color: '#6b7280', fontSize: 12, margin: 0 } as CS,
  textarea: { background: '#111827', color: '#e5e7eb', border: '1px solid #1f2937', borderRadius: 6 } as CS,
  table: {
    background: 'transparent',
  } as CS,
  charCount: { fontSize: 12, color: '#6b7280', marginTop: 6 } as CS,
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' } as CS,
  formItem: { display: 'flex', flexDirection: 'column', gap: 4 } as CS,
  label: { fontSize: 13, color: '#9ca3af', fontWeight: 500 } as CS,
  required: { color: '#f87171' } as CS,
  field: {} as CS,
  error: { fontSize: 12, color: '#f87171', marginTop: 2 } as CS,
  actions: { marginTop: 8, textAlign: 'center' } as CS,
  outputHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as CS,
  outputActions: {} as CS,
} satisfies Record<string, CS>;
