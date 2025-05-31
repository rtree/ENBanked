import { useEffect } from 'react'
import { MiniKit } from '@worldcoin/minikit-js'
// import SendETH from './components/SendETH'
import SendETHCodeTrue from './components/SendETHCodeTrue'
import ClaimETHCode from './components/ClaimETHCode'
import { NotificationProvider, TransactionPopupProvider } from '@blockscout/app-sdk'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

const APP_ID = 'app_c22b23e8101db637591586c4a8ca02b1'
const contractAddress = '0xA55b1bBa54B2d9F31f6B5a83BA2eDAc5320D0a22'

const App = () => {
  useEffect(() => {
    MiniKit.install(APP_ID)
  }, [])

  return (
      <div>
        <h1>ENBanked</h1>
          <NotificationProvider>
            {/* <SendETH /> */}
              <Router>
                <Routes>
                  <Route path="/"      element={<SendETHCodeTrue />} />
                  <Route path="/claim" element={<ClaimETHCode />} />
                </Routes>
              </Router>
          </NotificationProvider>
      </div>
  )
}



export default App
