import React from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { useLayoutStore } from '../store/useLayoutStore';
import { useHotkeys } from 'react-hotkeys-hook';

// 快捷键配置
export const LayoutHotkeys = () => {
  const { toggleLeft, toggleRight, toggleTimeline } = useLayoutStore();

  useHotkeys('ctrl+b', toggleLeft, { preventDefault: true });
  useHotkeys('ctrl+j', toggleTimeline, { preventDefault: true });
  useHotkeys('ctrl+alt+b', toggleRight, { preventDefault: true });

  return null;
};

// 布局容器
interface AppLayoutProps {
  left: React.ReactNode;
  main: React.ReactNode;
  right: React.ReactNode;
  timeline: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  left,
  main,
  right,
  timeline,
}) => {
  const { leftOpen, rightOpen, timelineOpen } = useLayoutStore();

  return (
    <>
      <LayoutHotkeys />
      <div style={{ width: '100vw', height: '100vh', background: '#111827' }}>
        
        {/* 垂直方向：主区域 + 时间线 */}
        <Group orientation="vertical" style={{ height: '100%' }}>
          {/* 主内容：左 + 中 + 右 */}
          <Panel defaultSize={"80%"} minSize={"10%"} maxSize={"80%"}>
            <Group orientation="horizontal">
              
              {/* 左侧：配置选项 */}
              {leftOpen && (
                <>
                  <Panel defaultSize={"20%"} minSize={"10%"} maxSize={"40%"}>
                    <div className="panel-left">{left}</div>
                  </Panel>
                  <Separator className="resize-h" />
                </>
              )}

              {/* 中间：地图 */}
              <Panel defaultSize={"60%"} minSize={"36%"} maxSize={"85%"}>
                <div className="panel-main">{main}</div>
              </Panel>

              {/* 右侧：属性面板 */}
              {rightOpen && (
                <>
                  <Separator className="resize-h" />
                  <Panel defaultSize={"20%"} minSize={"10%"} maxSize={"40%"}>
                    <div className="panel-right">{right}</div>
                  </Panel>
                </>
              )}
            </Group>
          </Panel>

          {/* 时间线 */}
          {timelineOpen && (
            <>
              <Separator className="resize-v" />
              <Panel defaultSize={"20%"} minSize={"20%"} maxSize={"90%"}>
                <div className="panel-timeline">{timeline}</div>
              </Panel>
            </>
          )}
        </Group>
      </div>
    </>
  );
};