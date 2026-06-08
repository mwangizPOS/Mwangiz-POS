import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ModalProps = {
  open: boolean
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
}

export function Modal({ open, title, description, children, onClose }: ModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Close modal"
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            aria-describedby={description ? 'modal-description' : undefined}
            className="relative max-h-[90svh] w-full max-w-3xl overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-elevated"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
              <div className="min-w-0">
                <h2 id="modal-title" className="truncate text-lg font-semibold">
                  {title}
                </h2>
                {description ? (
                  <p id="modal-description" className="mt-1 text-sm text-secondary-foreground">
                    {description}
                  </p>
                ) : null}
              </div>
              <Button type="button" variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
                <X className="size-4" aria-hidden="true" />
              </Button>
            </div>
            <div className="max-h-[calc(90svh-88px)] overflow-y-auto p-5">{children}</div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
