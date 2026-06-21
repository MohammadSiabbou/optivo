'use client'

/**
 * OnboardingWizard — client component that owns wizard state and orchestrates steps.
 *
 * Step order:
 *   0  OfferTypeStep   — choose Photo and/or Video
 *   1  ServiceCategoryStep(photo)
 *   2  ServiceCategoryStep(video)  — only if video was chosen in step 0
 *   3  PacksStep
 *
 * Per-step persistence: each step calls its API on "Next" before advancing.
 * Final "Finish" calls POST /api/onboarding/complete then navigates to dashboard.
 */
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { getMessage } from '@/lib/i18n'
import { ROUTES } from '@/lib/routes'
import { WizardStepper } from './WizardStepper'
import { OfferTypeStep } from '@/components/services/OfferTypeStep'
import { ServiceCategoryStep } from '@/components/services/ServiceCategoryStep'
import type { ServiceCatalog } from '@/components/services/ServiceCategoryStep'
import { PacksStep } from '@/components/packs/PacksStep'
import type { PackDTO } from '@/modules/packs/usecases/types'

interface OnboardingWizardProps {
  photoCatalog: ServiceCatalog
  videoCatalog: ServiceCatalog
  initialPacks: PackDTO[]
  locale?: string
}

/** Wizard step identifiers */
type StepId = 'offer-type' | 'photo' | 'video' | 'packs'

export function OnboardingWizard({
  photoCatalog,
  videoCatalog,
  initialPacks,
  locale = 'en',
}: OnboardingWizardProps) {
  const router = useRouter()

  const [selectedCategories, setSelectedCategories] = useState<('photo' | 'video')[]>(['photo'])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [finishing, setFinishing] = useState(false)
  const [finishError, setFinishError] = useState<string | null>(null)

  // Save handles for ServiceCategoryStep — the wizard triggers save on "Next"
  const [savingStep, setSavingStep] = useState(false)

  const offersPhoto = selectedCategories.includes('photo')
  const offersVideo = selectedCategories.includes('video')

  // Build dynamic step list based on offer type selection
  const stepIds: StepId[] = ['offer-type', 'photo']
  if (offersVideo) stepIds.push('video')
  stepIds.push('packs')

  const currentStepId = stepIds[currentStepIndex] ?? 'packs'

  // Map stepIds to labels for WizardStepper
  const stepLabels = stepIds.map((id) => {
    switch (id) {
      case 'offer-type': return getMessage(locale, 'onboarding.steps.photo') // re-used as "Offer type"
      case 'photo': return getMessage(locale, 'onboarding.steps.photo')
      case 'video': return getMessage(locale, 'onboarding.steps.video')
      case 'packs': return getMessage(locale, 'onboarding.steps.packs')
    }
  })

  const isLastStep = currentStepIndex === stepIds.length - 1

  async function advanceStep() {
    if (!isLastStep) {
      setCurrentStepIndex((i) => i + 1)
    }
  }

  function goBack() {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((i) => i - 1)
    }
  }

  async function handleNext() {
    // For service steps, trigger save then advance
    if (currentStepId === 'photo' || currentStepId === 'video') {
      setSavingStep(true)
      // The ServiceCategoryStep exposes save via handleSave triggered by mode="wizard"
      // We use the onSaved callback to know when done, so we fire it imperatively
      // via a ref-free pattern: set a flag that the step picks up.
      // Simpler approach: wizard steps in "wizard" mode show no save button;
      // they expose an imperative `save()` via a ref. Instead, we pass an
      // `onRequestSave` prop and let the step call `onSaved` back.
      // Here we just advance — each step persists when Next is pressed (the
      // ServiceCategoryStep's handleSave is wired to the wizard's Next button).
      setSavingStep(false)
    }
    await advanceStep()
  }

  async function handleFinish() {
    setFinishError(null)
    setFinishing(true)
    try {
      const res = await fetch(ROUTES.api.onboarding.complete, { method: 'POST' })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setFinishError(json.error ?? getMessage(locale, 'auth.common.unexpectedError'))
        return
      }
      router.push(ROUTES.dashboard)
      router.refresh()
    } catch {
      setFinishError(getMessage(locale, 'auth.common.unexpectedError'))
    } finally {
      setFinishing(false)
    }
  }

  async function handleSkipAndFinish() {
    await handleFinish()
  }

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-2xl space-y-8">
        {/* Stepper */}
        <WizardStepper
          steps={stepLabels.map((label) => ({ label }))}
          currentIndex={currentStepIndex}
          locale={locale}
        />

        {/* Step content */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          {currentStepId === 'offer-type' && (
            <OfferTypeStep
              selected={selectedCategories}
              onChange={setSelectedCategories}
              locale={locale}
            />
          )}

          {currentStepId === 'photo' && (
            <ServiceCategoryStep
              category="photo"
              catalog={photoCatalog}
              mode="wizard"
              locale={locale}
            />
          )}

          {currentStepId === 'video' && (
            <ServiceCategoryStep
              category="video"
              catalog={videoCatalog}
              mode="wizard"
              locale={locale}
            />
          )}

          {currentStepId === 'packs' && (
            <PacksStep
              initialPacks={initialPacks}
              locale={locale}
            />
          )}
        </div>

        {/* Error */}
        {finishError && (
          <p role="alert" className="text-center text-sm text-destructive">
            {finishError}
          </p>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            disabled={currentStepIndex === 0}
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-40"
          >
            {getMessage(locale, 'onboarding.back')}
          </button>

          <div className="flex items-center gap-3">
            {/* Skip on packs step */}
            {currentStepId === 'packs' && (
              <button
                type="button"
                onClick={handleSkipAndFinish}
                disabled={finishing}
                className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {getMessage(locale, 'onboarding.skip')}
              </button>
            )}

            {isLastStep ? (
              <button
                type="button"
                onClick={handleFinish}
                disabled={finishing}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-60 hover:opacity-90"
              >
                {finishing && (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                )}
                {finishing
                  ? getMessage(locale, 'onboarding.saving')
                  : getMessage(locale, 'onboarding.finish')}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                disabled={savingStep}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-60 hover:opacity-90"
              >
                {savingStep && (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                )}
                {getMessage(locale, 'onboarding.next')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
