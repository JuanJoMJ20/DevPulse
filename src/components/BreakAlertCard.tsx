import { PersonStanding } from 'lucide-react';

export default function BreakAlertCard() {
  return (
    <div className="flex h-full items-center gap-4 p-6">
      <PersonStanding size={36} className="shrink-0 text-[#b8780f]" />
      <div>
        <h2 className="font-semibold text-[#14302b]">Hora de estirarte</h2>
        <p className="text-sm text-[#14302b]/80">
          Llevas un buen rato sentado. Levanta los brazos, rota los hombros y mira a lo lejos durante 20 segundos.
        </p>
      </div>
    </div>
  );
}
