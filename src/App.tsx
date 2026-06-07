import './App.css';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/features/shell/layout/AppLayout';
import { DndAppProvider } from '@/features/shell/components/DndAppProvider';
import { LeftTacticalPanel } from '@/features/tactical-panels/components/LeftTacticalPanel';
import { RightInspectorPanel } from '@/features/tactical-panels/components/RightInspectorPanel';
import Map from '@/features/map/components/Map';
import Timeline from '@/features/timeline/components/Timeline';

function App() {


  return (
    <>
    <Link
      to="/replay"
      style={{
        position: 'fixed', top: 8, right: 12, zIndex: 1000,
        padding: '4px 10px', fontSize: 12, borderRadius: 6,
        background: 'rgba(17,24,39,0.85)', color: '#93c5fd',
        border: '1px solid #334155', textDecoration: 'none',
      }}
    >
      对局复盘 →
    </Link>
    <DndAppProvider>
    <AppLayout   left={<LeftTacticalPanel />}
      main={<Map />}
      right={<RightInspectorPanel />}
      timeline={<div style={{ padding: 20 }}> <Timeline /></div>}>
  
    </AppLayout>
    </DndAppProvider>
    </>
  );
}

export default App;
