# Design

## P0-1: 章节/字幕自动分段

### yt-dlp 章节提取

B 站视频元数据中可能包含章节信息。yt-dlp 支持通过 `--print` 提取章节：

```
yt-dlp --print "%(chapters)s" <url>
```

输出类似 JSON 的章节数组（start_time, end_time, title）。在 download 阶段一并提取，不做额外网络请求。

### yt-dlp 字幕下载

B 站视频常有自动生成字幕（AI 字幕）。yt-dlp 支持：

- `--write-auto-subs`：下载自动生成字幕
- `--write-subs`：下载手动上传字幕
- `--sub-lang zh-Hans`：指定中文简体

字幕文件保存为 `.vtt` 或 `.srt` 格式。

### 分段优先级

```
segment 阶段:
  1. 手抄时间轴 (source.segments) → 最优先
  2. 章节信息 (chapters from yt-dlp) → 回退路径 A
  3. 字幕解析 (parse subtitles for boundaries) → 回退路径 B
  4. 无信息 → TODO 错误（不变）
```

### 字幕分段策略

从字幕文本中识别点位边界：

- **关键词分割**：「第一支」「第二支」「进攻」「防守」「A点」「B点」等模式匹配
- **停顿分割**：字幕中超过 N 秒的空白 → 新段边界
- **最短段长**：≥ 5 秒，避免过碎
- **最长段长**：≤ 90 秒（与 capture 对齐）

字幕解析输出 `Chapter[]` 结构（index, startSec, endSec, title），与章节回退路径复用同一逻辑。

### 对现有段的影响

- `RawCapture.chapters` 字段已存在，当前为空 `[]`
- `segment` 的回退逻辑已预留，只需实现章节/字幕分支
- 不影响手抄时间轴路径（优先级最高）

## P0-2: VLM 自动帧选择

### 接口扩展

`LlmExtractor` 接口新增 `selectFrames`：

```typescript
export interface FrameSelectionInput {
  /** 候选帧列表 */
  candidates: FrameCandidate[];
  /** 该段接触表图（供概览上下文） */
  contactSheet?: string;
  /** agent slug，决定 frame roles */
  agentSlug: string;
}

export interface FrameSelection {
  framePath: string;
  role: string;
  confidence: number;
}

export interface FrameSelectionResult {
  selections: FrameSelection[];
  confidence: number;
  warnings: string[];
}
```

### VlmExtractor 实现

**采样策略**：每段 1fps 候选有 10-90 张。不喂全部，从候选帧中**均匀采样**最多 8 张。

**Prompt 策略**：
- 发送采样帧 + 段标题
- 要求 VLM 识别：哪张是玩家站位 (stand)、哪张是准星瞄准 (aim)、哪张是技能落点/生效 (effect)
- 对 agent-specific 角色的帧也尝试识别（如 Jett 的 dash_direction）
- 输出 JSON：`{ "stand": <index>, "aim": <index>, "effect": <index>, "confidence": <0-1> }`

**索引映射**：VLM 返回的 index 是采样帧的索引，需映射回实际候选帧路径。

### extract 阶段集成

```typescript
export async function extract(seg, src, ctx): Promise<DraftLineup> {
  // 1. parseQuery 硬字段（不变）
  // 2. VLM 软字段抽取（不变）
  // 3. VLM 帧选择（新增）
  const frameResult = await ctx.extractor.selectFrames({
    candidates: seg.candidates,
    contactSheet: seg.contactSheet,
    agentSlug: src.hints?.agent ?? '',
  });
  
  return {
    // ... 现有字段
    frames: Object.fromEntries(
      frameResult.selections.map(s => [s.role, s.framePath])
    ),
    // ...
  };
}
```

结果写入 `draft.frames`，人审时 VLM 预选的帧显示为默认值，可覆盖。

### MockExtractor 行为

`selectFrames` 返回空 selections — 无 VLM 时帧仍为空，人审手动指派。不阻断管线。

### Agent-specific 帧角色区分

`FrameRoleConfig` 扩展 `required` 字段：

```typescript
export interface FrameRoleConfig {
  role: string;
  label: string;
  description?: string;
  required?: boolean;  // true = approve 闸门校验
}
```

`validateForApproval` 只校验 `required: true` 的帧是否已指派。

对于 `draftToLineupInput`（转化为正式 Lineup），仍只收录 `IMAGE_ROLES`（stand/aim/effect），agent-specific 帧不进最终数据，仅在审核期间作辅助指引。

## 风险与权衡

- **章节不可靠**：不是所有 B 站视频都有章节信息。当章节缺失时回退到字幕/手抄，管线不断。
- **字幕自动分段不完美**：AI 字幕可能有误识别，分段边界可能不精确。这比完全手抄好（省人力），但比精确手抄差（可能多/漏段）。交人审兜底。
- **VLM 帧选择准确率**：从采样帧中选 stand/aim/effect 的准确率需要 eval 量化，第一步可以低门槛（预填默认值，错了人审可改），逐步优化。
- **VLM 调用次数增加**：每段多一次 selectFrames 调用（8 张图）。成本可控（当前 extract 一次也只看 1 张接触表）。
