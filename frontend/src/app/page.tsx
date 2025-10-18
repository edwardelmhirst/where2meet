import { MeetingPointCalculator } from '@/components/meeting-point-calculator'
import { MapPin } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12 space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-4 rounded-full">
              <MapPin className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Where2Meet
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find the perfect meeting spot in London that&apos;s convenient for everyone
          </p>
        </div>
        
        <MeetingPointCalculator />
      </div>
    </main>
  )
}