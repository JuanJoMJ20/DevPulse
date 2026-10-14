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
    reset(): Promise<ModelSummary>
  }
  blocker: {
    configure(config: { armed: boolean; apps: Pick<BlockedApp, 'name' | 'process'>[] }): void
    onEvent(cb: (event: BlockerEvent) => void): () => void
  }
  notify(title: string, body: string): void
  /** Ajusta la barra de título nativa y el fondo de la ventana al tema */
  setTheme(theme: 'light' | 'dark'): void
}

declare global {
  interface Window {
    /** Solo existe dentro de la app de escritorio */
    devpulse?: DevPulseBridge
  }
}
