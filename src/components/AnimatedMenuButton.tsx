import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AnimatedMenuButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export const AnimatedMenuButton = ({ onClick, isOpen }: AnimatedMenuButtonProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    setIsAnimating(true);
    onClick();
    // Reset animation after completion
    setTimeout(() => setIsAnimating(false), 600);
  };

  return (
    <Button 
      variant="ghost" 
      size="icon"
      className="relative z-50 bg-white/90 hover:bg-white shadow-md w-12 h-12 rounded-full transition-all duration-300"
      onClick={handleClick}
    >
      {/* Hamburger Icon */}
      <Menu 
        className={`h-6 w-6 transition-all duration-300 ${
          isAnimating ? 'scale-0 rotate-180 opacity-0' : 'scale-100 rotate-0 opacity-100'
        }`} 
      />
      
      {/* SRC Logo */}
      <img 
        src="/src/assets/src-logo.png" 
        alt="SRC Logo" 
        className={`absolute inset-0 w-8 h-8 m-auto object-contain transition-all duration-300 ${
          isAnimating ? 'animate-spin-scale scale-100 opacity-100' : 'scale-0 rotate-0 opacity-0'
        } ${isOpen ? 'scale-100 opacity-100' : ''}`}
      />
    </Button>
  );
};