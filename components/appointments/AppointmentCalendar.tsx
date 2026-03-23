'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Appointment, AppointmentStatus } from '@/types/appointment';
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek, isSameDay, parseISO, setHours, setMinutes } from 'date-fns';
import { tr } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface AppointmentCalendarProps {
  appointments: Appointment[];
  onDetail: (appointment: Appointment) => void;
  onCreateAppointment: (dateTime: string) => void;
}

interface TimeSlot {
  time: string; // HH:mm format
  label: string; // formatted time
}

interface SlotAppointment {
  appointment: Appointment;
  isStart: boolean; // Is this the first slot of the appointment?
  span: number; // How many slots this appointment occupies
}

const statusConfig: Record<AppointmentStatus, { bg: string; text: string; border: string }> = {
  [AppointmentStatus.SCHEDULED]: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  [AppointmentStatus.COMPLETED]: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  [AppointmentStatus.CANCELLED]: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  [AppointmentStatus.NO_SHOW]: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
  [AppointmentStatus.RESCHEDULED]: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
};

const statusLabels: Record<AppointmentStatus, string> = {
  [AppointmentStatus.SCHEDULED]: 'Planlandı',
  [AppointmentStatus.COMPLETED]: 'Tamamlandı',
  [AppointmentStatus.CANCELLED]: 'İptal',
  [AppointmentStatus.NO_SHOW]: 'Gelmedi',
  [AppointmentStatus.RESCHEDULED]: 'Yeniden Planlandı',
};

// Working hours: 09:00 - 18:00 with 30-minute slots
const WORK_HOURS_START = 9;
const WORK_HOURS_END = 18;
const SLOT_DURATION_MINUTES = 30;

// Generate time slots for the day
function generateTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let hour = WORK_HOURS_START; hour < WORK_HOURS_END; hour++) {
    slots.push({ time: `${hour.toString().padStart(2, '0')}:00`, label: `${hour}:00` });
    slots.push({ time: `${hour.toString().padStart(2, '0')}:30`, label: `${hour}:30` });
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

export function AppointmentCalendar({ appointments, onDetail, onCreateAppointment }: AppointmentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get the week's date range
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  // Generate days of the week
  const weekDays = useMemo(() => {
    const days = [];
    let day = weekStart;
    while (day <= weekEnd) {
      days.push(day);
      day = new Date(day);
      day.setDate(day.getDate() + 1);
    }
    return days;
  }, [weekStart, weekEnd]);

  // Group appointments by day and time, calculate slot spans
  const appointmentsByDateTime = useMemo(() => {
    // Priority order for overlapping appointments
    const statusPriority: Record<AppointmentStatus, number> = {
      [AppointmentStatus.SCHEDULED]: 4,      // Highest priority - show first
      [AppointmentStatus.COMPLETED]: 3,
      [AppointmentStatus.NO_SHOW]: 2,
      [AppointmentStatus.RESCHEDULED]: 1.5,
      [AppointmentStatus.CANCELLED]: 1,      // Lowest priority - only show if alone in slot
    };

    const grouped: Record<string, SlotAppointment> = {};

    // First, collect all appointments by slot
    const slotsMap: Record<string, Array<{ apt: Appointment; priority: number }>> = {};

    appointments.forEach((apt) => {
      try {
        const aptDate = parseISO(apt.scheduled_at);
        const dateKey = format(aptDate, 'yyyy-MM-dd');
        const startHour = aptDate.getHours();
        const startMinute = aptDate.getMinutes();
        const priority = statusPriority[apt.status] || 0;

        // Calculate how many slots this appointment occupies
        const duration = apt.duration || 60; // default 60 minutes
        const slotCount = Math.ceil(duration / SLOT_DURATION_MINUTES);

        // Mark all slots that this appointment occupies
        let currentSlotTime = setMinutes(setHours(aptDate, startHour), startMinute);

        for (let i = 0; i < slotCount; i++) {
          const timeKey = format(currentSlotTime, 'HH:mm');
          const key = `${dateKey}_${timeKey}`;

          if (!slotsMap[key]) {
            slotsMap[key] = [];
          }
          slotsMap[key].push({ apt, priority });

          // Move to next slot
          currentSlotTime = new Date(currentSlotTime.getTime() + SLOT_DURATION_MINUTES * 60 * 1000);

          // Stop if we've passed work hours
          const hour = currentSlotTime.getHours();
          if (hour >= WORK_HOURS_END) break;
        }
      } catch (e) {
        console.error('Error parsing appointment date:', e);
      }
    });

    // For each slot, select the highest priority appointment
    Object.keys(slotsMap).forEach(key => {
      const candidates = slotsMap[key];

      // Sort by priority (highest first)
      candidates.sort((a, b) => b.priority - a.priority);

      const bestCandidate = candidates[0];

      // Skip cancelled appointments if there's any other option
      if (bestCandidate.apt.status === 'cancelled' && candidates.length > 1) {
        const nextBest = candidates.find(c => c.apt.status !== 'cancelled');
        if (nextBest) {
          return; // Skip cancelled
        }
      }

      // Calculate slot span for this appointment
      const aptDate = parseISO(bestCandidate.apt.scheduled_at);
      const duration = bestCandidate.apt.duration || 60;
      const slotCount = Math.ceil(duration / SLOT_DURATION_MINUTES);

      // Determine if this is the start slot
      const slotTime = key.split('_')[1];
      const aptStartTime = format(aptDate, 'HH:mm');
      const isStart = slotTime === aptStartTime;

      grouped[key] = {
        appointment: bestCandidate.apt,
        isStart,
        span: isStart ? slotCount : 0,
      };
    });

    return grouped;
  }, [appointments]);

  const goToPreviousWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const goToNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const weekRangeText = `${format(weekStart, 'd MMM', { locale: tr })} - ${format(weekEnd, 'd MMM yyyy', { locale: tr })}`;

  // Get today's date key for highlighting
  const todayKey = format(new Date(), 'yyyy-MM-dd');

  // Check if a slot is available (no conflicting appointment)
  const isSlotAvailable = (dateKey: string, slotTime: string): boolean => {
    const key = `${dateKey}_${slotTime}`;
    return !appointmentsByDateTime[key];
  };

  // Handle slot click
  const handleSlotClick = (day: Date, slotTime: string) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    if (isSlotAvailable(dateKey, slotTime)) {
      // Create datetime string in format "YYYY-MM-DDTHH:mm"
      const [hour, minute] = slotTime.split(':');
      const slotDate = setMinutes(setHours(day, parseInt(hour)), parseInt(minute));
      const dateTimeStr = format(slotDate, "yyyy-MM-dd'T'HH:mm");
      onCreateAppointment(dateTimeStr);
    }
  };

  // Slot height in pixels - consistent for all slots
  const slotHeight = '56px';

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Bugün
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold ml-2">{weekRangeText}</h3>
        </div>
      </div>

      {/* Week Grid with Time Slots - Single scroll for all days */}
      <div className="overflow-y-auto max-h-[600px] pr-2">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
          {weekDays.map((day, dayIndex) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const isToday = dateKey === todayKey;
            const dayName = format(day, 'EEEE', { locale: tr });
            const dayNumber = format(day, 'd');

            return (
              <motion.div
                key={dateKey}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: dayIndex * 0.05 }}
                className={`rounded-xl border-2 transition-all overflow-hidden sticky top-0 ${
                  isToday
                    ? 'border-indigo-500 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Day Header - Sticky */}
                <div className={`p-2 border-b text-center sticky top-0 z-10 ${
                  isToday ? 'border-indigo-200 bg-indigo-50' : 'border-gray-100 bg-gray-50'
                }`}>
                  <div className={`text-xs font-medium ${isToday ? 'text-indigo-700' : 'text-gray-600'}`}>
                    {dayName}
                  </div>
                  <div className={`text-lg font-bold ${isToday ? 'text-indigo-700' : 'text-gray-900'}`}>
                    {dayNumber}
                  </div>
                </div>

                {/* Time Slots */}
                <div className="p-1 space-y-1">
                  {TIME_SLOTS.map((slot) => {
                    const key = `${dateKey}_${slot.time}`;
                    const slotAppointment = appointmentsByDateTime[key];
                    const isAvailable = isSlotAvailable(dateKey, slot.time);
                    const isPastTime = new Date(`${dateKey}T${slot.time}`) < new Date();

                    return (
                      <div
                        key={slot.time}
                        className={`relative rounded-lg border transition-all ${
                          isPastTime
                            ? 'bg-gray-100 border-gray-200 opacity-50'
                            : slotAppointment
                            ? statusConfig[slotAppointment.appointment.status].bg + ' ' +
                              statusConfig[slotAppointment.appointment.status].border +
                              (slotAppointment.isStart ? ' cursor-pointer hover:shadow-md' : '')
                            : isAvailable && !isPastTime
                            ? 'bg-white border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer hover:shadow-sm'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                        style={{ height: slotHeight, minHeight: slotHeight }}
                        onClick={() => {
                          if (slotAppointment?.isStart) {
                            onDetail(slotAppointment.appointment);
                          } else if (isAvailable && !isPastTime) {
                            handleSlotClick(day, slot.time);
                          }
                        }}
                      >
                        {slotAppointment ? (
                          // Appointment slot (start or continuation)
                          slotAppointment.isStart ? (
                            // First slot - show appointment details
                            <div className="p-2 h-full flex flex-col justify-center">
                              <div className={`text-xs font-medium ${statusConfig[slotAppointment.appointment.status].text} truncate`}>
                                {slotAppointment.appointment.expand?.lead_id?.name || 'İsimsiz'}
                              </div>
                              {slotAppointment.appointment.expand?.lead_id?.company && (
                                <div className={`text-xs ${statusConfig[slotAppointment.appointment.status].text} truncate opacity-75`}>
                                  {slotAppointment.appointment.expand.lead_id.company}
                                </div>
                              )}
                            </div>
                          ) : (
                            // Continuation slot - show "devam" text
                            <div className="h-full flex items-center justify-center">
                              <span className={`text-xs ${statusConfig[slotAppointment.appointment.status].text} opacity-60`}>
                                devam
                              </span>
                            </div>
                          )
                        ) : (
                          // Empty slot
                          <div className={`p-2 h-full flex flex-col items-center justify-center ${
                            isPastTime ? '' : 'group'
                          }`}>
                            {isAvailable && !isPastTime ? (
                              <>
                                <span className="text-xs text-gray-600">{slot.label}</span>
                                <Plus className="h-3 w-3 text-gray-400 group-hover:text-indigo-500 transition-colors mt-0.5" />
                              </>
                            ) : (
                              <span className="text-xs text-gray-400">{slot.label}</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
