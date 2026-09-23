const DATA = [
  { day: 'Lun', h: 5.5 }, { day: 'Mar', h: 6.5 }, { day: 'Mié', h: 4 },
  { day: 'Jue', h: 7 }, { day: 'Vie', h: 3.5 },
];

export default function FocusStatsCard() {
  const max = Math.max(...DATA.map((d) => d.h));
  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <h2 className="text-lg font-semibold text-[#14302b]">Horas programadas esta semana</h2>
      <div className="flex flex-1 items-end gap-3">
        {DATA.map((d) => (
          <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-xs text-[#14302b]/70">{d.h} h</span>
            <div className="w-full rounded-t-md bg-[#5b8c85]" style={{ height: `${(d.h / max) * 100}px` }} />
            <span className="text-xs font-medium text-[#14302b]">{d.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
