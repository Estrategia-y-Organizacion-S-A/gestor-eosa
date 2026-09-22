import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { isHoliday } from '../../../utils/holidays';

interface DeskCalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  releasedDates: string[]; // YYYY-MM-DD
  bookedDates: string[]; // YYYY-MM-DD
}

export function DeskCalendar({ selectedDate, onSelectDate, releasedDates, bookedDates }: DeskCalendarProps) {
  const currentDate = new Date(selectedDate);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  // Ajustar para que el primer día sea Lunes (0) en vez de Domingo (0)
  const startingDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const formatLocal = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const handlePrevMonth = () => {
    const prev = new Date(year, month - 1, 1);
    onSelectDate(formatLocal(prev));
  };

  const handleNextMonth = () => {
    const next = new Date(year, month + 1, 1);
    onSelectDate(formatLocal(next));
  };

  const days = [];
  for (let i = 0; i < startingDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isSelected = dateStr === selectedDate;
    const isReleased = releasedDates.includes(dateStr);
    const isBooked = bookedDates.includes(dateStr);
    
    // Si es fin de semana (sábado=6, domingo=0 en getDay)
    const dayOfWeek = new Date(year, month, d).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const holidayInfo = isHoliday(dateStr);
    const isNonWorking = isWeekend || holidayInfo.isHoliday;

    let tooltip = "";
    if (holidayInfo.isHoliday) tooltip = holidayInfo.name || "Festivo";
    else if (isReleased) tooltip = "Puesto liberado";
    else if (isBooked) tooltip = "Reserva temporal";

    days.push(
      <button
        key={d}
        onClick={() => onSelectDate(dateStr)}
        disabled={isNonWorking}
        className={clsx(
          "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
          isNonWorking ? "text-gray-300 cursor-not-allowed" : "hover:bg-gray-100",
          !isNonWorking && !isSelected && !isReleased && !isBooked && "text-gray-700",
          !isNonWorking && isReleased && !isSelected && "bg-orange-100 text-orange-700",
          !isNonWorking && isBooked && !isSelected && "bg-blue-100 text-blue-700",
          holidayInfo.isHoliday && !isWeekend && "bg-red-50 text-red-300",
          isSelected && "bg-brand-red text-white hover:bg-[#A31C30]"
        )}
        title={tooltip}
      >
        {d}
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-bold text-gray-700">{monthNames[month]} {year}</span>
        <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(day => (
          <div key={day} className="text-xs font-semibold text-gray-400 w-8">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-50 flex flex-col gap-2 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-100"></div>
          <span>Día liberado (No voy)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-100"></div>
          <span>Reserva temporal</span>
        </div>
      </div>
    </div>
  );
}
