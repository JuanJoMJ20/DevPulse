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
    target: 'theme',
    title: 'Modo claro u oscuro',
    body: 'Este botón cambia entre el tema claro y el oscuro. En Ajustes también puedes elegir «Sistema» para que siga el modo de Windows.',
  },
  {
    target: 'pomodoro-modes',
    title: 'Tipos de sesión',
    body: 'Enfoque, Pausa y Pausa larga, con su duración al lado (puedes cambiarla en Ajustes). Al terminar una sesión, DevPulse pasa sola a la siguiente y te avisa con una notificación.',
  },
  {
    target: 'pomodoro-start',
    title: 'Iniciar y pausar',
    body: 'El botón grande inicia o pausa (también con la barra espaciadora). La flecha reinicia la sesión. Los puntos de abajo marcan tu ciclo de 4 sesiones.',
  },
  {
    target: 'pomodoro-task',
    title: 'Tu tarea actual',
    body: 'Escribe en qué estás trabajando y divídelo en pasos. «Terminar tarea» la cierra y sube la siguiente de la cola «A continuación». Si borras o terminas algo por error, abajo aparece «Deshacer».',
  },
  {
    target: 'metrics',
    title: 'Carga cognitiva',
    body: 'La gráfica muestra tus últimos 2 minutos. Las barras explican de dónde sale la carga: saltos entre apps, tiempo sin pausa, correcciones y ritmo de tecleo.',
  },
  {
    target: 'code',
    title: 'Notas de la sesión',
    body: 'Apunta aquí lo que no quieres olvidar sin salir de tu flujo. Se guarda solo. Arriba a la derecha ves la app en la que estás trabajando.',
  },
  {
    target: 'blocker',
    title: 'Bloqueador de contexto',
    body: 'Con el interruptor de arriba activas el escudo: cierra las apps marcadas de la lista. Puedes añadir cualquier programa escribiendo su nombre, por ejemplo steam.exe.',
  },
  {
    target: 'heatmap',
    title: 'Mapa de flujo profundo',
    body: 'Cada casilla es una hora de los últimos 7 días; cuanto más intensa, más minutos de enfoque. Te dice a qué horas rindes mejor. Con el teclado, entra con Tab y recórrelo con las flechas.',
  },
  {
    target: 'model',
    title: 'Tu modelo de IA',
    body: 'Aquí ves lo que la IA ha aprendido de ti: cuánto pesa cada señal en tu fatiga. Cada vez que respondes «¿cómo te sientes?» se reentrena. Responde mientras trabajas para que aprenda mejor.',
  },
  {
    target: 'notifications',
    title: 'Actividad',
    body: 'El historial de lo que ha pasado: sesiones completadas, tareas terminadas, apps cerradas por el bloqueador y lo que ha aprendido el modelo.',
  },
  {
    target: 'user-menu',
    title: 'Tu cuenta',
    body: 'Desde aquí abres Ajustes (tema, duración del Pomodoro, cada cuánto te pregunta la IA y si el bloqueador se activa solo), repites el tutorial o cierras sesión. Cada cuenta tiene sus propios datos y su propio modelo.',
  },
  {
    title: 'Listo para empezar',
    body: 'Crea tu primera tarea y pulsa Iniciar. Cuando la carga pase de 70, la pantalla pasará a Enfoque Absoluto y solo quedarán el temporizador y tus notas.',
  },
]
