import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info, Users, User, X, Bell, Pin } from 'lucide-react';
import { SCHOOL_CALENDAR_2026, Reminder, SchoolEvent } from '../../types';

interface CalendarViewProps {
  reminders: Reminder[];
  personalReminders?: Reminder[];
  title?: string;
  onDayClick?: (date: string) => void;
  selectedDate?: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ 
  reminders, 
  personalReminders = [], 
  title = "Calendário 2026",
  onDayClick,
  selectedDate
}) => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 1)); 
  const [viewingDay, setViewingDay] = useState<string | null>(null);

  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const handleDayInteraction = (dateStr: string) => {
    setViewingDay(dateStr);
    onDayClick?.(dateStr);
  };

  const renderDays = () => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const totalDays = daysInMonth(month, year);
    const startDay = firstDayOfMonth(month, year);
    const days = [];

    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-20 md:h-32 bg-slate-50/50 border border-slate-100"></div>);
    }

    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      const schoolEvents = SCHOOL_CALENDAR_2026.filter(e => e.date === dateStr);
      const classReminders = reminders.filter(r => r.date === dateStr);
      const personalRems = personalReminders.filter(r => r.date === dateStr);

      const isSelected = selectedDate === dateStr;

      days.push(
        <div 
          key={day} 
          onClick={() => handleDayInteraction(dateStr)}
          className={`h-20 md:h-32 border border-slate-100 p-1 md:p-1.5 transition-all relative group bg-white hover:bg-emerald-50 cursor-pointer overflow-hidden
            ${isSelected ? 'ring-2 ring-inset ring-emerald-500 bg-emerald-50/30' : ''}
          `}
        >
          <span className={`text-[10px] md:text-xs font-black mb-1 block ${schoolEvents.some(e => e.type === 'HOLIDAY') ? 'text-red-500' : 'text-slate-400'}`}>
            {day}
          </span>
          
          <div className="flex flex-col gap-0.5 overflow-hidden">
            {schoolEvents.map((e, idx) => (
              <div key={`school-${idx}`} className={`text-[6px] md:text-[8px] px-1 py-0.5 rounded truncate font-black uppercase ${
                e.type === 'HOLIDAY' ? 'bg-red-100 text-red-700' : 
                e.type === 'BIMESTER_START' || e.type === 'BIMESTER_END' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
              }`}>
                {e.title}
              </div>
            ))}

            {classReminders.map((r, idx) => (
                <div key={`rem-${idx}`} className="bg-amber-100 text-amber-800 text-[6px] md:text-[8px] px-1 py-0.5 rounded truncate font-bold">
                    📢 {r.text}
                </div>
            ))}
            
            {personalRems.map((r, idx) => (
                <div key={`p-rem-${idx}`} className="bg-indigo-100 text-indigo-800 text-[6px] md:text-[8px] px-1 py-0.5 rounded truncate font-bold">
                    👤 {r.text}
                </div>
            ))}
          </div>
        </div>
      );
    }
    return days;
  };

  const getViewingDayData = () => {
    if (!viewingDay) return null;
    return {
      date: new Date(viewingDay + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }),
      schoolEvents: SCHOOL_CALENDAR_2026.filter(e => e.date === viewingDay),
      classReminders: reminders.filter(r => r.date === viewingDay),
      personalRems: personalReminders.filter(r => r.date === viewingDay),
    };
  };

  const dayData = getViewingDayData();

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full relative">
      <div className="bg-slate-50 p-4 md:p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex flex-col">
            <h3 className="font-black text-slate-800 text-sm md:text-base flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-emerald-600" />
                <span className="truncate">{title}</span>
            </h3>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-200 rounded-xl text-slate-400 transition-colors"><ChevronLeft size={20} /></button>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-200 rounded-xl text-slate-400 transition-colors"><ChevronRight size={20} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(d => (
          <div key={d} className="py-3 text-center text-[10px] font-black uppercase tracking-tighter text-slate-400">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 flex-1 overflow-auto">
        {renderDays()}
      </div>

      {/* Pop-up Detalhado do Dia */}
      {viewingDay && dayData && (
          <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                  <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                      <div>
                        <h4 className="font-black text-slate-800 text-lg leading-tight">{dayData.date}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Detalhes do Dia</p>
                      </div>
                      <button onClick={() => setViewingDay(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"><X/></button>
                  </div>
                  <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                      {dayData.schoolEvents.length === 0 && dayData.classReminders.length === 0 && dayData.personalRems.length === 0 && (
                          <div className="text-center py-8 text-slate-300 font-bold italic text-sm">Nenhum evento para este dia.</div>
                      )}
                      
                      {dayData.schoolEvents.map((e, i) => (
                          <div key={i} className={`p-4 rounded-2xl flex gap-3 ${e.type === 'HOLIDAY' ? 'bg-red-50 text-red-800 border border-red-100' : 'bg-blue-50 text-blue-800 border border-blue-100'}`}>
                              <Pin size={18} className="shrink-0 mt-1"/>
                              <div>
                                <span className="text-[10px] font-black uppercase block opacity-60">{e.type === 'HOLIDAY' ? 'Feriado' : 'Evento Escolar'}</span>
                                <p className="font-bold text-sm">{e.title}</p>
                              </div>
                          </div>
                      ))}

                      {dayData.classReminders.map((r, i) => (
                          <div key={i} className="p-4 rounded-2xl bg-amber-50 text-amber-800 border border-amber-100 flex gap-3">
                              <Bell size={18} className="shrink-0 mt-1"/>
                              <div>
                                <span className="text-[10px] font-black uppercase block opacity-60">Aviso da Turma</span>
                                <p className="font-bold text-sm leading-snug">{r.text}</p>
                              </div>
                          </div>
                      ))}

                      {dayData.personalRems.map((r, i) => (
                          <div key={i} className="p-4 rounded-2xl bg-indigo-50 text-indigo-800 border border-indigo-100 flex gap-3">
                              <User size={18} className="shrink-0 mt-1"/>
                              <div>
                                <span className="text-[10px] font-black uppercase block opacity-60">Aviso Privado</span>
                                <p className="font-bold text-sm leading-snug">{r.text}</p>
                              </div>
                          </div>
                      ))}
                  </div>
                  <div className="p-4 bg-slate-50 text-center">
                      <button onClick={() => setViewingDay(null)} className="w-full py-3 bg-slate-800 text-white font-black text-xs rounded-2xl shadow-xl hover:bg-slate-700 transition-all uppercase tracking-widest">Fechar Detalhes</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};