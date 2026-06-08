import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

type PageTransitionProps = {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="mx-auto flex w-full max-w-[1480px] flex-col gap-5"
    >
      {children}
    </motion.div>
  )
}
