import * as React from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  helperText?: string
  charCount?: number
  maxChars?: number
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, helperText, charCount, maxChars, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-[12px] font-semibold text-subtle-foreground mb-2 uppercase leading-4">
            {label}
          </label>
        )}
        <textarea
          className={cn(
            'flex min-h-[120px] w-full rounded-lg border border-border bg-input px-3 py-3 text-sm text-foreground',
            'placeholder:text-subtle-foreground',
            'focus:outline-hidden focus:ring-1 focus:ring-ring focus:border-border-strong',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'resize-y',
            className
          )}
          ref={ref}
          {...props}
        />
        <div className="flex justify-between mt-2">
          {helperText && (
            <span className="text-xs text-subtle-foreground">{helperText}</span>
          )}
          {maxChars !== undefined && (
            <span className="text-xs text-subtle-foreground ml-auto">
              {charCount ?? 0}/{maxChars}
            </span>
          )}
        </div>
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
