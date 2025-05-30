import { useEffect } from 'react'
import { MiniKit } from '@worldcoin/minikit-js'
import SendETH from './components/SendETH'

const App = () => {
  useEffect(() => {
    MiniKit.install('app_31bbb6f9ca99b37c7ee18620c48f92da')
  }, [])

  return (
      <div>
        <h1>World Mini App</h1>
        <SendETH />
      </div>
  )
}

export default App
