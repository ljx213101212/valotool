import './App.css';
import { AppLayout } from '@/features/shell/layout/AppLayout';
import { DndAppProvider } from '@/features/shell/components/DndAppProvider';
import { LeftTacticalPanel } from '@/features/tactical-panels/components/LeftTacticalPanel';
import { RightInspectorPanel } from '@/features/tactical-panels/components/RightInspectorPanel';
import Map from '@/features/map/components/Map';
import Timeline from '@/features/timeline/components/Timeline';

function App() {


  return (
    <>
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
