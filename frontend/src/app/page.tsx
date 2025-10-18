import { MeetingPointCalculator } from '@/components/meeting-point-calculator'
import { MapPin, Sparkles } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
        <div className="absolute inset-0 gradient-radial" />
        <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 rounded-full bg-gradient-to-br from-purple-400/20 to-blue-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 rounded-full bg-gradient-to-br from-blue-400/20 to-pink-400/20 blur-3xl animate-pulse animation-delay-150" />
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="text-center mb-12 space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 gradient-primary rounded-full blur-xl opacity-50 animate-pulse" />
              <div className="relative gradient-primary p-5 rounded-full shadow-glow">
                <MapPin className="h-14 w-14 text-white" />
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500 animate-pulse" />
              <span className="text-sm font-medium text-purple-600 tracking-wider uppercase">
                Smart Meeting Points
              </span>
              <Sparkles className="h-5 w-5 text-purple-500 animate-pulse animation-delay-300" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              <span className="text-gradient">Where2Meet</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Find the perfect meeting spot in London that&apos;s 
              <span className="font-semibold text-purple-600"> fair</span>, 
              <span className="font-semibold text-blue-600"> fast</span>, and 
              <span className="font-semibold text-pink-600"> convenient</span> for everyone
            </p>
          </div>
        </div>
        
        <MeetingPointCalculator />
      </div>
    </main>
  )
}