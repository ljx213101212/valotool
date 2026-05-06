import './App.css';
import { AppLayout } from './layout/AppLayout';
import Map from './modules/Map';

function App() {


  return (
    <>
    {/* <Map /> */}
    <AppLayout   left={<div style={{ padding: 20 }}>左侧配置选项</div>}
      main={<Map />} // 你的地图直接放这里！
      right={<div style={{ padding: 20 }}>右侧属性面板</div>}
      timeline={<div style={{ padding: 20 }}>下方时间线</div>}>
  
    </AppLayout>
    </>
  );
}

export default App;
