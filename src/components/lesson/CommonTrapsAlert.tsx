import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CommonTrapsAlertProps {
  traps: string[];
}

export function CommonTrapsAlert({ traps }: CommonTrapsAlertProps) {
  if (traps.length === 0) return null;
  
  return (
    <Alert variant="destructive" className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700">
      <AlertTriangle className="h-5 w-5 text-yellow-700 dark:text-yellow-400" />
      <AlertTitle className="text-yellow-800 dark:text-yellow-300 font-bold">
        Common Traps to Avoid
      </AlertTitle>
      <AlertDescription className="text-yellow-700 dark:text-yellow-400">
        <ul className="list-disc list-inside space-y-2 mt-2">
          {traps.map((trap, idx) => (
            <li key={idx}>{trap}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
