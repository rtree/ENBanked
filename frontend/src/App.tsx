import { useEffect } from 'react'
import { MiniKit } from '@worldcoin/minikit-js'
import SendETH from './components/SendETH'

const App = () => {
  useEffect(() => {
    MiniKit.install('app_c22b23e8101db637591586c4a8ca02b1')
  }, [])

  return (
      <div>
        <h1>World Mini App</h1>
        <SendETH />
      </div>
  )
}

export default App
