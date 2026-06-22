'use client'

/**
 * WizardStepper — horizontal step indicator for the onboarding wizard.
 *
 * Renders a numbered step list with "done", "active", and "upcoming" states.
 * Fully accessible (aria-current="step").
 */
import { Check } from 'lucide-react'
import { getMessage } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export interface WizardStep {
  label: string
}

interface WizardStepperProps {
  steps: WizardStep[]
  currentIndex: number
  locale?: string
}

export function WizardStepper({ steps, currentIndex, locale = 'en' }: WizardStepperProps) {
  return (
    <nav
      aria-label={getMessage(locale, 'onboarding.progressLabel')
        .replace('{current}', String(currentIndex + 1))
        .replace('{total}', String(steps.length))}
    >
      <ol className="flex items-center gap-0">
        {steps.map((step, i) => {
          const isDone = i < currentIndex
          const isActive = i === currentIndex

          return (
            <li key={i} className="flex items-center">
              {/* Step bubble */}
              <div className="flex flex-col items-center">
                <span
                  aria-current={isActive ? 'step' : undefined}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors',
                    isDone
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isActive
                        ? 'border-primary bg-background text-primary'
                        : 'border-border bg-background text-muted-foreground',
                  )}
                >
                  {isDone ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </span>
                <span
                  className={cn(
                    'mt-1.5 hidden text-[11px] font-medium sm:block',
                    isActive ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector */}
              {i < steps.length - 1 && (
                <div
                  aria-hidden="true"
                  className={cn(
                    'mx-2 mb-5 h-0.5 w-8 shrink-0 sm:w-12',
                    i < currentIndex ? 'bg-primary' : 'bg-border',
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
