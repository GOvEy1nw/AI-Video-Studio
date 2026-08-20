import * as React from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  badge?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, badge, children, ...props }, ref) => {
    return (
      <div className="relative">
        {label && (
          <label className="flex items-center gap-2 text-[12px] font-semibold text-subtle-foreground mb-2 uppercase leading-4 h-4">
            {label}
            {badge && (
              <span className="px-1.5 py-0.5 text-[10px] bg-surface-selected text-muted-foreground rounded-sm border border-border-strong font-semibold leading-none">
                {badge}
              </span>
            )}
          </label>
        )}
        <div className="relative">
          <select
            className={cn(
              'flex h-10 w-full appearance-none rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground',
              'focus:outline-hidden focus:ring-1 focus:ring-ring focus:border-border-strong',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'pr-8 cursor-pointer',
              '[&>option]:bg-input [&>option]:text-foreground [&>option:disabled]:text-subtle-foreground',
              className
            )}
            ref={ref}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>
    )
  }
)
Select.displayName = 'Select'

export { Select }
