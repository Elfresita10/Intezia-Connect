
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Remove strict mode temporarily to avoid double-mounting issues with SQLite WASM
ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
);
