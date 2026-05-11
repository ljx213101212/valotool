import './App.css';
import { AppLayout } from './layout/AppLayout';
import { DndAppProvider } from './components/DndAppProvider';
import { LeftTacticalPanel } from './components/LeftTacticalPanel';
import { RightInspectorPanel } from './components/RightInspectorPanel';
import Map from './modules/Map';
import Timeline from './modules/Timeline';

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
