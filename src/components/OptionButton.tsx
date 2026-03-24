import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface OptionButtonProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  letter?: string;
}

export function OptionButton({ label, selected, onClick, letter }: OptionButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'w-full flex items-center gap-3 px-5 py-4 rounded-xl text-left transition-colors duration-200 border-2',
        selected
          ? 'bg-[hsl(var(--survey-option-selected))] text-[hsl(var(--survey-option-selected-foreground))] border-[hsl(var(--survey-option-selected))]'
          : 'bg-[hsl(var(--survey-option))] text-foreground border-transparent hover:bg-[hsl(var(--survey-option-hover))] hover:border-[hsl(var(--survey-option-selected)/0.3)]'
      )}
    >
      {letter && (
        <span
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border',
            selected
              ? 'bg-[hsl(var(--survey-option-selected-foreground))] text-[hsl(var(--survey-option-selected))] border-transparent'
              : 'border-border text-muted-foreground'
          )}
        >
          {letter}
        </span>
      )}
      <span className="flex-1 text-base font-medium">{label}</span>
      {selected && <Check className="w-5 h-5 flex-shrink-0" />}
    </motion.button>
  );
}
