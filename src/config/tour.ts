import type { TourStep } from '../components/Tutorial'

/** Recorrido del tutorial, en el orden en que se lee la pantalla: arriba → abajo */
export const tourSteps = (name: string): TourStep[] => [
  {
    title: `Bienvenido a DevPulse, ${name.split(' ')[0]}`,
    body: 'En un minuto te enseño para qué sirve cada parte. Puedes repetir este tutorial cuando quieras desde el botón ? de arriba a la derecha.',
  },
  {
    target: 'brand',
    title: 'Una pantalla que se adapta',
    body: 'Los paneles se reorganizan solos según tu carga mental: vista densa (4 columnas), equilibrada (3) o Enfoque Absoluto (2). Esta barra superior se queda siempre igual para que no pierdas la referencia.',
  },
  {
    target: 'stress',
    title: 'Tu carga mental, en vivo',
    body: 'Un número de 0 a 100 que la IA calcula cada 2 segundos con tu actividad real. La palabra (Baja, Media, Alta) resume ese número. La marca vertical de la barra es el umbral de 70: si lo pasas, DevPulse simplifica la pantalla.',
  },
  {
    target: 'layout-control',
    title: 'Quién manda en el layout',
    body: '«IA» deja que el modelo decida solo. «Baja», «Media» y «Alta» fijan la vista a mano, por ejemplo si quieres ver todo aunque estés cansado.',
  },
  {
    target: 'efficiency',
    title: 'Eficiencia de hoy',
    body: 'Qué parte de tu tiempo activo en el PC has pasado en sesiones de enfoque. Aparece cuando llevas al menos 5 minutos activo.',
  },
  {
