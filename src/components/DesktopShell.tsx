import { ReactNode, useState } from 'react';
import { Minus, X, Timer, BarChart3, Waves, Settings } from 'lucide-react';

const NAV = [
  { icon: Timer, label: 'Enfoque' },
  { icon: BarChart3, label: 'Métricas' },
  { icon: Waves, label: 'Sonidos' },
  { icon: Settings, label: 'Ajustes' },
];

export default function DesktopShell({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(0);
  const [minimized, setMinimized] = useState(false);
  const [closed, setClosed] = useState(false);

  if (closed)
    return (
      <div className="grid h-screen place-items-center bg-[#d9e0dc]">
        <button onClick={() => setClosed(false)} className="rounded-lg bg-[#14302b] px-4 py-2 text-white">
          Abrir DevPulse
        </button>
      </div>
    );

  return (
    <div className="grid h-screen place-items-center bg-[#d9e0dc] p-4">
      <div className="flex h-full w-full max-w-[1280px] flex-col overflow-hidden rounded-xl bg-[#eef1ee] shadow-2xl ring-1 ring-black/10">
        {/* Barra de título */}
        <header className="flex h-10 shrink-0 items-center justify-between bg-[#14302b] px-4 text-sm text-[#cfe0da] select-none">
          <span className="font-medium">DevPulse</span>
          <div className="flex gap-1">
            <button aria-label="Minimizar" onClick={() => setMinimized((m) => !m)}
              className="rounded p-1.5 hover:bg-white/10"><Minus size={14} /></button>
            <button aria-label="Cerrar" onClick={() => setClosed(true)}
              className="rounded p-1.5 hover:bg-red-500/80"><X size={14} /></button>
          </div>
        </header>

        {!minimized && (
          <div className="flex min-h-0 flex-1">
            {/* Sidebar */}
            <nav className="flex w-16 shrink-0 flex-col items-center gap-2 bg-[#e1e7e3] py-4">
              {NAV.map(({ icon: Icon, label }, i) => (
                <button key={label} title={label} aria-label={label} onClick={() => setActive(i)}
                  className={`rounded-lg p-3 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e0a526] ${
                    active === i ? 'bg-[#14302b] text-white' : 'text-[#14302b]/70 hover:bg-[#14302b]/10'
                  }`}>
                  <Icon size={20} />
                </button>
              ))}
            </nav>
            {/* Área principal */}
            <main className="min-w-0 flex-1 overflow-auto p-6">{children}</main>
          </div>
        )}
      </div>
    </div>
  );
}
