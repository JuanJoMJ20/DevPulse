import { useRef, useState } from 'react';
import { CloudRain, Coffee, Trees } from 'lucide-react';

type SoundId = 'rain' | 'cafe' | 'forest';
// Ruido blanco generado con Web Audio (sin archivos externos); cada sonido usa un filtro distinto.
const SOUNDS = [
  { id: 'rain' as SoundId, label: 'Lluvia', icon: CloudRain, freq: 4000, type: 'highpass' as BiquadFilterType },
  { id: 'cafe' as SoundId, label: 'Café', icon: Coffee, freq: 900, type: 'bandpass' as BiquadFilterType },
  { id: 'forest' as SoundId, label: 'Bosque', icon: Trees, freq: 500, type: 'lowpass' as BiquadFilterType },
];

export default function SoundPlayerCard() {
  const [current, setCurrent] = useState<SoundId | null>(null);
  const [volume, setVolume] = useState(0.4);
  const ctx = useRef<AudioContext>();
  const src = useRef<AudioBufferSourceNode>();
  const gain = useRef<GainNode>();

  const stop = () => { src.current?.stop(); src.current = undefined; };

  const toggle = (s: (typeof SOUNDS)[number]) => {
    stop();
    if (current === s.id) return setCurrent(null);
    const ac = (ctx.current ??= new AudioContext());
    const buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const node = ac.createBufferSource();
    node.buffer = buf; node.loop = true;
    const filter = ac.createBiquadFilter();
    filter.type = s.type; filter.frequency.value = s.freq;
    const g = (gain.current = ac.createGain());
    g.gain.value = volume;
    node.connect(filter).connect(g).connect(ac.destination);
    node.start();
    src.current = node;
    setCurrent(s.id);
  };

  return (
    <div className="flex h-full flex-col justify-center gap-4 p-6">
      <h2 className="text-lg font-semibold text-[#14302b]">Sonidos ambientales</h2>
      <div className="flex flex-wrap gap-3">
        {SOUNDS.map((s) => (
          <button key={s.id} onClick={() => toggle(s)} aria-pressed={current === s.id}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-colors ${
              current === s.id ? 'bg-[#14302b] text-white' : 'bg-[#14302b]/10 text-[#14302b] hover:bg-[#14302b]/20'}`}>
            <s.icon size={18} /> {s.label}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-3 text-sm text-[#14302b]">
        Volumen
        <input type="range" min="0" max="1" step="0.05" value={volume} className="flex-1 accent-[#e0a526]"
          onChange={(e) => { const v = +e.target.value; setVolume(v); if (gain.current) gain.current.gain.value = v; }} />
      </label>
    </div>
  );
}
