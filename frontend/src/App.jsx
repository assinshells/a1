import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './assets/css/App.css'
import { api } from './services/api'

function App() {
  const [count, setCount] = useState(0)
  const [apiStatus, setApiStatus] = useState({ loading: true, error: null, data: null })
  const [healthStatus, setHealthStatus] = useState({ loading: true, error: null, data: null })

  // Проверка подключения к API при загрузке
  useEffect(() => {
    checkAPIConnection()
    checkHealth()
  }, [])

  const checkAPIConnection = async () => {
    try {
      setApiStatus({ loading: true, error: null, data: null })
      const data = await api.getInfo()
      setApiStatus({ loading: false, error: null, data })
    } catch (error) {
      setApiStatus({ loading: false, error: error.message, data: null })
    }
  }

  const checkHealth = async () => {
    try {
      setHealthStatus({ loading: true, error: null, data: null })
      const data = await api.healthCheck()
      setHealthStatus({ loading: false, error: null, data })
    } catch (error) {
      setHealthStatus({ loading: false, error: error.message, data: null })
    }
  }

  const testAsyncRequest = async () => {
    try {
      const data = await api.testAsync()
      alert(`Async test successful: ${data.message}`)
    } catch (error) {
      alert(`Error: ${error.message}`)
    }
  }

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>

      <h1>Vite + React</h1>

      {/* API Status Panel */}
      <div className="api-status">
        <h2>Backend API Status</h2>

        {apiStatus.loading ? (
          <p>🔄 Checking API connection...</p>
        ) : apiStatus.error ? (
          <div className="error">
            <p>❌ API Error: {apiStatus.error}</p>
            <button onClick={checkAPIConnection}>Retry</button>
          </div>
        ) : (
          <div className="success">
            <p>✅ Connected to: {apiStatus.data?.message}</p>
            <p>Version: {apiStatus.data?.version}</p>
            <p>Environment: {apiStatus.data?.environment}</p>
          </div>
        )}

        {healthStatus.loading ? (
          <p>🔄 Checking health...</p>
        ) : healthStatus.error ? (
          <div className="error">
            <p>❌ Health check failed</p>
          </div>
        ) : (
          <p>💚 Server health: OK</p>
        )}

        <button onClick={testAsyncRequest}>Test Async Request</button>
      </div>

      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>

      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App