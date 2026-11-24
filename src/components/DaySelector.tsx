import { ORDERED_DAYS, WEEKLY_THEMES } from '../data/themes';
import type { DayId } from '../types/studio';

interface DaySelectorProps {
  selectedDay: DayId;
  todayDayId: DayId;
  onSelectDay: (dayId: DayId) => void;
}

export function DaySelector({ selectedDay, todayDayId, onSelectDay }: DaySelectorProps) {
  return (
    <div className="flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar py-1">
      {ORDERED_DAYS.map((dayId) => {
        const theme = WEEKLY_THEMES[dayId];
        const isSelected = selectedDay === dayId;
        const isToday = todayDayId === dayId;

        return (
          <button
            key={dayId}
            type="button"
            onClick={() => onSelectDay(dayId)}
            className={`relative flex min-w-[44px] flex-1 flex-col items-center justify-center rounded-xl px-2 py-2 text-xs font-semibold transition-all ${
              isSelected
                ? 'btn-cobalt-3d text-white'
                : 'btn-glass-3d text-[#94A3B8] hover:text-[#F5F7FA]'
            }`}
          >
            <span>{theme.shortName}</span>
            {isToday ? (
              <span
                className={`mt-1 h-1.5 w-1.5 rounded-full ${
                  isSelected ? 'bg-white' : 'bg-[#0080FF]'
                }`}
                title="Bugün (UTC+3)"
              />
            ) : (
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-transparent" />
            )}
          </button>
        );
      })}
    </div>
  );
}
