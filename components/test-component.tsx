"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function TestComponent() {
  const [count, setCount] = useState(0)

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Test Component</h1>
      <p className="mt-2">Count: {count}</p>
      <Button className="mt-4" onClick={() => setCount(count + 1)}>
        Increment
      </Button>
    </div>
  )
}
