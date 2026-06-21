/**
 * Use case: mark a studio's onboarding as complete by setting
 * onboarding_completed_at to the current timestamp.
 *
 * Uses the existing ClientRepository.update which accepts partial columns.
 */
import type { IClientRepository } from '@/modules/clients/repositories/IClientRepository'

export class CompleteOnboardingUseCase {
  constructor(private readonly repo: IClientRepository) {}

  async execute(clientId: string): Promise<void> {
    await this.repo.update(clientId, {
      onboarding_completed_at: new Date(),
    })
  }
}
