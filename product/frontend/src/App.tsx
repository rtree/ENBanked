import { useEffect } from 'react'
import { MiniKit } from '@worldcoin/minikit-js'
import SendETH from './components/SendETH'

const APP_ID = 'app_c22b23e8101db637591586c4a8ca02b1'

const App = () => {
  useEffect(() => {
    MiniKit.install(APP_ID)
  }, [])

  return (
      <div>
        <h1>ENBanked</h1>
        <SendETH />
      </div>
  )
}

export default App
