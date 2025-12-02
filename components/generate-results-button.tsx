'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw } from 'lucide-react'
import { generateClassResults } from '@/app/(dashboard)/assessments/results/actions'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface GenerateResultsButtonProps {
  classId: string
  sessionId: string
  termId: string
  hasResults: boolean
}

export function GenerateResultsButton({ 
  classId, 
  sessionId, 
  termId,
  hasResults 
}: GenerateResultsButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleGenerate = async () => {
    setIsLoading(true)
    try {
      const result = await generateClassResults(classId, sessionId, termId)
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate results",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleGenerate} 
      disabled={isLoading}
      variant={hasResults ? "outline" : "default"}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          {hasResults ? "Re-generate Results" : "Generate Results"}
        </>
      )}
    </Button>
  )
}
