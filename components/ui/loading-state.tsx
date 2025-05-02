import { Loader2 } from "lucide-react"

interface LoadingStateProps {
  text?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function LoadingState({ text = "Loading...", size = "md", className = "" }: LoadingStateProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }

  return (
    <div className={`flex flex-col items-center justify-center p-6 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-slate-400 mb-2`} />
      <span className="text-slate-500">{text}</span>
    </div>
  )
}
