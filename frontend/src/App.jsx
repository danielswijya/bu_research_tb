import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
    const [count, setCount] = useState(0)
  
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
        <div className="flex gap-4 mb-6">
          <a href="https://vite.dev" target="_blank">
            <img src={viteLogo} className="w-24 hover:rotate-12 transition" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank">
            <img src={reactLogo} className="w-24 hover:rotate-12 transition" alt="React logo" />
          </a>
        </div>
  
        <h1 className="text-4xl font-bold text-blue-600 mb-4">Vite + React + Tailwind 💨</h1>
  
        <div className="bg-white p-6 rounded-lg shadow-md">
          <button
            onClick={() => setCount((count) => count + 1)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
          >
            count is {count}
          </button>
          <p className="mt-4 text-sm text-gray-700">
            Edit <code>src/App.jsx</code> and save to test HMR
          </p>
        </div>
  
        <p className="mt-8 text-gray-500 italic">
          Click on the logos to learn more
        </p>
      </div>
    )
  }
  

export default App
