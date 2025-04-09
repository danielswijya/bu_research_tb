import { useState } from 'react'
import './index.css'
import {Button} from "@/components/ui/button"

function App() {
return (
    <><div>
        <Button>Click me</Button>
    </div>
    
    <div className="flex flex-col md:flex-row w-full h-screen overflow-hidden">
        <div className="w-full md:w-[70%] bg-yellow-100 p-4">
        <h2 className="text-xl font-bold">🗺️ Map goes here</h2>
        </div>
        <div className="flex flex-col items-center justify-center min-h-svh">
            <Button>Click me</Button>
        </div>
        <div className="w-full md:w-[30%] bg-blue-100 p-4">
        <h2 className="text-xl font-bold">📋 Priority List goes here</h2>
        </div>
    </div>
    </>
)
}

export default App

