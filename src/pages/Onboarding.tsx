import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Step 1: Test Date
  const [testDate, setTestDate] = useState<Date>();
  
  // Step 2: Past Scores
  const [scores, setScores] = useState({
    English: '',
    Math: '',
    Reading: '',
    Science: ''
  });
  const [notes, setNotes] = useState('');

  const handleSetTestDate = async () => {
    if (!testDate) {
      toast.error('Please select a test date');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('set-test-date', {
        body: { test_date: format(testDate, 'yyyy-MM-dd') }
      });

      if (error) throw error;

      toast.success('Test date set successfully!');
      setStep(2);
    } catch (error) {
      console.error('Error setting test date:', error);
      toast.error('Failed to set test date');
    } finally {
      setLoading(false);
    }
  };

  const handleSetBaseline = async () => {
    // Convert scores to numbers, filtering out empty values
    const numericScores: Record<string, number> = {};
    Object.entries(scores).forEach(([section, score]) => {
      if (score.trim()) {
        const num = parseInt(score);
        if (num >= 1 && num <= 36) {
          numericScores[section] = num;
        }
      }
    });

    if (Object.keys(numericScores).length === 0) {
      toast.error('Please enter at least one valid score (1-36)');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('set-baseline', {
        body: {
          scores: numericScores,
          notes: notes.trim() || undefined
        }
      });

      if (error) throw error;

      toast.success('Baseline scores saved successfully!');
      setStep(3);
    } catch (error) {
      console.error('Error setting baseline:', error);
      toast.error('Failed to save baseline scores');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle>When is your ACT test?</CardTitle>
        <CardDescription>
          Select your upcoming ACT test date to help us create your personalized study plan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Test Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !testDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {testDate ? format(testDate, "PPP") : "Select test date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={testDate}
                onSelect={setTestDate}
                disabled={(date) => date < new Date()}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
        <Button 
          onClick={handleSetTestDate} 
          disabled={!testDate || loading}
          className="w-full"
        >
          {loading ? 'Setting...' : 'Continue'}
        </Button>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Share your past ACT scores</CardTitle>
        <CardDescription>
          Enter any previous ACT scores to help us understand your current level. You can skip sections you haven't taken.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(scores).map(([section, score]) => (
            <div key={section}>
              <Label htmlFor={section}>{section}</Label>
              <Input
                id={section}
                type="number"
                min="1"
                max="36"
                placeholder="1-36"
                value={score}
                onChange={(e) => setScores(prev => ({ ...prev, [section]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        
        <div>
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            placeholder="Any additional context about your previous test experience..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
            Back
          </Button>
          <Button onClick={handleSetBaseline} disabled={loading} className="flex-1">
            {loading ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-6 w-6 text-green-500" />
          Setup Complete!
        </CardTitle>
        <CardDescription>
          You're all set! Let's start with a diagnostic test to assess your current skills and create your personalized study plan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-semibold mb-2">What happens next:</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Take a 20-minute diagnostic test</li>
            <li>• Get your personalized study plan</li>
            <li>• Start improving your ACT scores</li>
          </ul>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
            Back
          </Button>
          <Button onClick={() => navigate('/diagnostic')} className="flex-1">
            Start Diagnostic Test
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  step >= i 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                )}
              >
                {step > i ? <CheckCircle className="h-4 w-4" /> : i}
              </div>
            ))}
          </div>
          <div className="w-full bg-muted h-2 rounded-full">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </div>
  );
}