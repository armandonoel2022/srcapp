import { useLanguage } from '@/contexts/LanguageContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export const LanguageToggle = () => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <div className="flex items-center space-x-2">
      <Label htmlFor="language-toggle" className="text-sm font-medium">
        ES
      </Label>
      <Switch
        id="language-toggle"
        checked={language === 'en'}
        onCheckedChange={toggleLanguage}
        className="data-[state=checked]:bg-primary"
      />
      <Label htmlFor="language-toggle" className="text-sm font-medium">
        EN
      </Label>
    </div>
  );
};