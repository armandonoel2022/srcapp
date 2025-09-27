export const formatMinutesToHours = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min tarde`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hora${hours > 1 ? 's' : ''} tarde`;
  }
  
  return `${hours} hora${hours > 1 ? 's' : ''} ${remainingMinutes} min tarde`;
};