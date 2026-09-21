import { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react';

const MODES = {
  focus: { time: 25 * 60, label: 'Enfoque', color: '#e0a526', icon: Brain },
  break: { time: 5 * 60, label: 'Descanso', color: '#4ade80', icon: Coffee },
};

type Mode = keyof typeof MODES;

export default function PomodoroCard({ expanded }: { expanded: boolean }) {
  const [mode, setMode] = useState<Mode>('focus');
  const [left, setLeft] = useState(MODES.focus.time);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          setRunning(false);
          // Play a simple notification sound if the browser allows it
          try {
            new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => {});
          } catch (e) {}
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const setTimerMode = (newMode: Mode) => {
    setMode(newMode);
    setLeft(MODES[newMode].time);
    setRunning(false);
  };

  const size = expanded ? 260 : 170;
  const r = size / 2 - 10;
  const circ = 2 * Math.PI * r;
  const offset = circ * (left / MODES[mode].time);
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
      <div className="flex gap-2 rounded-full bg-black/5 p-1">
        {(Object.keys(MODES) as Mode[]).map((m) => {
          const Icon = MODES[m].icon;
          return (
            <button
              key={m}
              onClick={() => setTimerMode(m)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                mode === m ? 'bg-white text-[#14302b] shadow-sm' : 'text-gray-500 hover:text-[#14302b]'
              }`}
            >
              <Icon size={14} /> {MODES[m].label}
            </button>
          );
        })}
      </div>
      
      <div className="relative mt-2" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#14302b1a" strokeWidth="10" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={MODES[mode].color} strokeWidth="10"
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ - offset}
            style={{ transition: 'stroke-dashoffset 1s linear' }} />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center font-semibold tabular-nums text-[#14302b] tracking-tight ${expanded ? 'text-6xl' : 'text-4xl'}`}>
          {mm}:{ss}
        </div>
      </div>
      
      <div className="mt-2 flex gap-3">
        <button onClick={() => setRunning((r) => !r)}
          className="flex items-center gap-2 rounded-lg bg-[#14302b] px-5 py-2.5 text-white transition-all hover:bg-[#1d443d] active:scale-95">
          {running ? <Pause size={18} /> : <Play size={18} />} {running ? 'Pausar' : 'Iniciar'}
        </button>
        <button onClick={() => { setRunning(false); setLeft(MODES[mode].time); }} aria-label="Reiniciar"
          className="rounded-lg bg-black/5 p-2.5 text-[#14302b] transition-all hover:bg-black/10 active:scale-95">
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  );
}
