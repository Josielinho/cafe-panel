import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';

interface QuestionCardProps {
  questionKey: string;
  direction: number;
  sectionTitle?: string;
  questionText: string;
  required?: boolean;
  children: ReactNode;
}

const variants = {
  enter: (d: number) => ({
    y: d > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: { y: 0, opacity: 1 },
  exit: (d: number) => ({
    y: d > 0 ? -60 : 60,
    opacity: 0,
  }),
};

export function QuestionCard({
  questionKey,
  direction,
  sectionTitle,
  questionText,
  required,
  children,
}: QuestionCardProps) {
  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={questionKey}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-2xl mx-auto"
      >
        <div className="bg-card rounded-2xl shadow-lg border border-border p-8 md:p-12">
          {sectionTitle && (
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-4">
              {sectionTitle}
            </span>
          )}
          <h2 className="text-2xl md:text-3xl font-bold text-card-foreground leading-tight mb-8">
            {questionText}
            {required && <span className="text-destructive ml-1">*</span>}
          </h2>
          {children}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
