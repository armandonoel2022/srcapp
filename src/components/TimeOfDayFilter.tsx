import { Button } from '@/components/ui/button';
import { Sun, Sunset, Moon, Clock } from 'lucide-react';

export type TimeOfDay = 'all' | 'morning' | 'afternoon' | 'night';

interface TimeOfDayFilterProps {
  value: TimeOfDay;
  onChange: (value: TimeOfDay) => void;
}

export const TimeOfDayFilter = ({ value, onChange }: TimeOfDayFilterProps) => {
  const options: { id: TimeOfDay; label: string; icon: React.ReactNode; hours: string }[] = [
    { id: 'all', label: 'Todo', icon: <Clock className="h-3.5 w-3.5" />, hours: '24h' },
    { id: 'morning', label: 'Mañana', icon: <Sun className="h-3.5 w-3.5" />, hours: '6-12' },
    { id: 'afternoon', label: 'Tarde', icon: <Sunset className="h-3.5 w-3.5" />, hours: '12-18' },
    { id: 'night', label: 'Noche', icon: <Moon className="h-3.5 w-3.5" />, hours: '18-6' },
  ];

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-600">Filtrar por horario</label>
      <div className="grid grid-cols-4 gap-1">
        {options.map((option) => (
          <Button
            key={option.id}
            type="button"
            variant={value === option.id ? 'default' : 'outline'}
            size="sm"
            className={`
              h-auto py-1.5 px-1 flex flex-col items-center gap-0.5 text-[10px]
              ${value === option.id 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-white hover:bg-slate-50'
              }
            `}
            onClick={() => onChange(option.id)}
          >
            {option.icon}
            <span className="font-medium">{option.label}</span>
            <span className={value === option.id ? 'text-blue-100' : 'text-slate-400'}>
              {option.hours}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
};

// Helper function to filter history by time of day
export const filterByTimeOfDay = <T extends { deviceTime: string }>(
  data: T[],
  timeOfDay: TimeOfDay
): T[] => {
  if (timeOfDay === 'all') return data;

  return data.filter((point) => {
    const hour = new Date(point.deviceTime).getHours();
    
    switch (timeOfDay) {
      case 'morning':
        return hour >= 6 && hour < 12;
      case 'afternoon':
        return hour >= 12 && hour < 18;
      case 'night':
        return hour >= 18 || hour < 6;
      default:
        return true;
    }
  });
};
