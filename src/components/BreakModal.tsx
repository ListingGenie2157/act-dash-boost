import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Coffee, Play } from 'lucide-react';

interface BreakModalProps {
  open: boolean;
  questionsCompleted: number;
  onTakeBreak: () => void;
  onContinue: () => void;
}

export function BreakModal({
  open,
  questionsCompleted,
  onTakeBreak,
  onContinue,
}: BreakModalProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Coffee className="h-8 w-8 text-primary" />
            </div>
          </div>
          <AlertDialogTitle className="text-center text-xl">
            Nice work! {questionsCompleted} questions done! 🎉
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            You've earned a quick break. Take 2 minutes to rest your eyes and stretch.
            <br />
            <span className="text-sm mt-2 block text-muted-foreground">
              Short breaks improve focus and retention!
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <AlertDialogCancel onClick={onContinue} className="flex-1">
            <Play className="h-4 w-4 mr-2" />
            Keep Going
          </AlertDialogCancel>
          <AlertDialogAction onClick={onTakeBreak} className="flex-1">
            <Coffee className="h-4 w-4 mr-2" />
            Take 2-Min Break
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
