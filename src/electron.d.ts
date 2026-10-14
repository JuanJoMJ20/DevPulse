import type { AuthResult, BlockedApp, BlockerEvent, ModelSummary, Signals, User } from './types'

interface DevPulseBridge {
  auth: {
    status(): Promise<{ hasUsers: boolean; user: User | null }>
    register(form: { name: string; email: string; password: string }): Promise<AuthResult>
    login(form: { email: string; password: string; remember: boolean }): Promise<AuthResult>
    logout(): Promise<boolean>
  }
  store: {
    get<T>(key: string): Promise<T | undefined>
    set(key: string, value: unknown): Promise<boolean>
  }
  onSignals(cb: (signals: Signals) => void): () => void
  model: {
    checkIn(rating: number): Promise<ModelSummary>
