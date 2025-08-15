import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Clock } from 'lucide-react';

interface DashboardHeaderProps {
  currentTime: Date;
}

export const DashboardHeader = ({ currentTime }: DashboardHeaderProps) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-DO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-DO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="hidden md:flex items-center justify-between p-4 bg-white border-b shadow-sm">
      <div className="flex items-center gap-4">
        <img 
          src="/src/assets/src-logo.png" 
          alt="SRC Logo" 
          className="h-8 w-8 object-contain"
        />
        <div>
          <h1 className="text-xl font-bold text-foreground">
            CONTROL DE ACCESO DIARIO EN PUESTO
          </h1>
          <p className="text-sm text-muted-foreground">
            RESIDENCIA DE FRANCIA
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm text-muted-foreground">
            Fecha: {formatDate(currentTime)}
          </p>
          <div className="flex items-center gap-2 text-lg font-mono">
            <Clock className="h-4 w-4" />
            {formatTime(currentTime)}
          </div>
        </div>
        <LanguageToggle />
      </div>
    </div>
  );
};