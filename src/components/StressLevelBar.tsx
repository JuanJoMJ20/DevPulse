import { motion } from 'framer-motion';
import { StressLevel, STRESS_OPTIONS } from '../types';

interface Props { value: StressLevel; onChange: (v: StressLevel) => void }

export default function StressLevelBar({ value, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="Nivel de carga mental"
      className="mb-6 inline-flex rounded-xl bg-[#14302b]/10 p-1">
      {STRESS_OPTIONS.map((o) => {
        const active = o.id === value;
        return (
          <button key={o.id} role="radio" aria-checked={active} title={o.hint} onClick={() => onChange(o.id)}
            className="relative rounded-lg px-4 py-2 text-sm font-medium text-[#14302b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e0a526]">
            {active && (
              <motion.span layoutId="stress-pill" className="absolute inset-0 rounded-lg bg-white shadow-sm"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
