import { useEffect } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { NotificationProvider } from '@blockscout/app-sdk';

import { APP_ID } from './config.ts';
import SendWeiQR      from './components/SendWeiQR';
import ClaimWeiQR     from './components/ClaimWeiQR';

const App = () => {
  useEffect(() => {
    MiniKit.install(APP_ID);          // World App MiniKit 初期化
  }, []);

  return (
    <NotificationProvider>
      <Router>
        <h1 style={{textAlign:'center'}}>ENBanked (zk-wei)</h1>
        <Routes>
          <Route path='/'       element={<SendWeiQR />} />
          <Route path='/claim'  element={<ClaimWeiQR/>} />
        </Routes>
      </Router>
    </NotificationProvider>
  );
};

export default App;
