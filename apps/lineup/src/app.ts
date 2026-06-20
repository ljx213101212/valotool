import { PropsWithChildren } from 'react'

import './app.less'

function App({ children }: PropsWithChildren) {
  // children 是将要渲染的页面
  return children
}

export default App
