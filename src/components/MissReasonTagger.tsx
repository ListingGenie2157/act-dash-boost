import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const MISS_REASONS = [
  { id: 'misread', label: 'Misread', emoji: '🔤', description: 'Misread question or answer' },
  { id: 'rushed', label: 'Rushed', emoji: '⚡', description: 'Went too fast, careless error' },
  { id: 'forgot_rule', label: 'Forgot Rule', emoji: '🧠', description: 'Knew it before, blanked' },
  { id: 'arithmetic', label: 'Arithmetic', emoji: '➗', description: 'Calculation mistake' },
  { id: 'rabbit_hole', label: 'Ran Out of Time', emoji: '🕳️', description: 'Spent too long' },
  { id: 'didnt_know', label: "Didn't Know", emoji: '❓', description: 'Need to learn this' },
] as const;

export type MissReason = typeof MISS_REASONS[number]['id'] | 'other';

interface MissReasonTaggerProps {
  questionId: string;
  sessionId: string;
  currentReason?: MissReason | null;
  onTagged: (reason: MissReason) => void;
}

export function MissReasonTagger({ 
  questionId, 
  sessionId, 
  currentReason,
  onTagged 
}: MissReasonTaggerProps) {
  const [selectedReason, setSelectedReason] = useState<MissReason | null>(currentReason || null);
  const [saving, setSaving] = useState(false);

  const handleSelectReason = async (reason: MissReason) => {
    if (saving) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('responses')
        .update({ miss_reason: reason })
        .eq('session_id', sessionId)
        .eq('question_id', questionId);

      if (error) throw error;

      setSelectedReason(reason);
      onTagged(reason);
    } catch (error) {
      console.error('Failed to save miss reason:', error);
      toast.error('Failed to save reason');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3">
      <p className="text-sm text-muted-foreground mb-2">Why did you miss this?</p>
      <div className="flex flex-wrap gap-2">
        {MISS_REASONS.map((reason) => (
          <Button
            key={reason.id}
            variant={selectedReason === reason.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSelectReason(reason.id)}
            disabled={saving}
            className={cn(
              'text-xs transition-all',
              selectedReason === reason.id && 'ring-2 ring-primary ring-offset-2'
            )}
            title={reason.description}
          >
            <span className="mr-1">{reason.emoji}</span>
            {reason.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

export { MISS_REASONS };
