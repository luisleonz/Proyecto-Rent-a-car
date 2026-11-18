import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './lib/instalar' // first: catches the install prompt event early
import App from './App'
import './index.css'

// Safari before 16 has no container queries, which lay out the phone view: load a polyfill only there
if (typeof CSS === 'undefined' || !CSS.supports('container-type: inline-size')) import('container-query-polyfill')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)
