"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

interface VerificationScreenProps {
  email: string
  onVerify: () => void
  onBack: () => void
}

export function VerificationScreen({ email, onVerify, onBack }: VerificationScreenProps) {
  const [code, setCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    // Check if code is correct (123456)
    if (code === "113355") {
      // Simulate a delay
      setTimeout(() => {
        onVerify()
        setIsSubmitting(false)
      }, 500)
    } else {
      setTimeout(() => {
        setError("Invalid verification code. Please try again.")
        setIsSubmitting(false)
      }, 500)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-2 sm:p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Verification Code</CardTitle>
          <CardDescription>We've sent a verification code to {email}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                  required
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <span>Verifying...</span>
              ) : (
                <span className="flex items-center">
                  Verify <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              )}
            </Button>
            <Button type="button" variant="ghost" onClick={onBack} disabled={isSubmitting}>
              Back
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

