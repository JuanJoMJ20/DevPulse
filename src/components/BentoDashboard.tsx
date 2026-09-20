import { AnimatePresence, motion } from 'framer-motion';
import { StressLevel } from '../types';
import PomodoroCard from './PomodoroCard';
import SoundPlayerCard from './SoundPlayerCard';
import FocusStatsCard from './FocusStatsCard';
import BreakAlertCard from './BreakAlertCard';

// Clases de Tailwind completas (literales) para que el compilador JIT las detecte.
const SPANS: Record<StressLevel, { pomodoro: string; sound: string; stats: string; alert: string }> = {
  low:    { pomodoro: 'col-span-1', sound: 'col-span-1', stats: 'col-span-1', alert: 'col-span-3' },
  medium: { pomodoro: 'col-span-2', sound: 'col-span-1', stats: 'col-span-2', alert: 'col-span-1' },
  high:   { pomodoro: 'col-span-3', sound: 'col-span-3', stats: '', alert: '' },
};

const card = 'overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5';
const spring = { type: 'spring' as const, stiffness: 260, damping: 30 };

export default function BentoDashboard({ stress }: { stress: StressLevel }) {
  const s = SPANS[stress];
  const focus = stress === 'high';

  return (
    <motion.div layout className="mx-auto grid max-w-5xl grid-cols-3 gap-4 auto-rows-[minmax(220px,auto)]">
      <motion.section layout transition={spring} className={`${card} ${s.pomodoro}`}>
        <PomodoroCard expanded={focus} />
      </motion.section>

      <motion.section layout transition={spring} className={`${card} ${s.sound}`}>
        <SoundPlayerCard />
      </motion.section>

      <AnimatePresence mode="popLayout">
        {!focus && (
          <motion.section key="stats" layout transition={spring}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }} className={`${card} ${s.stats}`}>
            <FocusStatsCard />
          </motion.section>
        )}
        {!focus && (
          <motion.section key="alert" layout transition={spring}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }} className={`${card} ${s.alert}`}>
            <BreakAlertCard />
          </motion.section>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
