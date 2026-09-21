export type StressLevel = 'low' | 'medium' | 'high';

export const STRESS_OPTIONS: { id: StressLevel; label: string; hint: string }[] = [
  { id: 'low', label: 'Bajo Estrés (Normal)', hint: 'Todos los paneles visibles' },
  { id: 'medium', label: 'Estrés Medio', hint: 'Prioriza Pomodoro y métricas' },
  { id: 'high', label: 'Alta Carga Mental (Modo Enfoque)', hint: 'Solo Pomodoro y sonido' },
];
