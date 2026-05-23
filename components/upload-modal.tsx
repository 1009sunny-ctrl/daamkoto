'use client'

import { useState } from 'react'
import { UploadForm } from '@/components/upload-form'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Upload } from 'lucide-react'

interface UploadModalProps {
  onSuccess?: () => void
}

export function UploadModal({ onSuccess }: UploadModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSuccess = () => {
    setIsOpen(false)
    onSuccess?.()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <Upload className="h-5 w-5" />
          গরুর ছবি আপলোড করুন
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>আপনার কোরবানির গরু আপলোড করুন</DialogTitle>
        </DialogHeader>
        <UploadForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  )
}
