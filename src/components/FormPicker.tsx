import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { getCodeFromFormId } from '@/lib/sectionMapping';
import { reportError } from '@/lib/errorReporter';
import { EXAM_PACKAGES } from '@/lib/exams';

interface Form {
  id: string;
  label: string;
  questionCount: number;
  isAvailable: boolean;
}

const SECTIONS = ['EN', 'MA', 'RD', 'SC'] as const;



interface FormPickerProps {
  onFormSelect: (formId: string, section: string, questionCount: number) => void;
  /** Exam the study plan scheduled (e.g. 'FA'): shown first and highlighted */
  highlightPrefix?: string | null;
}

export function FormPicker({ onFormSelect, highlightPrefix }: FormPickerProps) {
  const [selectedForm, setSelectedForm] = useState<string>('');
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFormAvailability = async () => {
      try {
        // Query actual question counts from database
        const formIds = EXAM_PACKAGES.flatMap(pkg => SECTIONS.map(section => `${pkg.prefix}_${section}`));

        // Single query: count questions grouped by form_id
        const { data: counts, error } = await supabase
          .from('v_staging_items_public')
          .select('form_id')
          .in('form_id', formIds);

        if (error) {
          reportError(error instanceof Error ? error : new Error(String(error)), { component: 'FormPicker' });
        }

        // Aggregate counts client-side from the flat list
        const countMap: Record<string, number> = {};
        (counts ?? []).forEach(row => {
          if (!row.form_id) return;
          countMap[row.form_id] = (countMap[row.form_id] || 0) + 1;
        });

        const sectionNames: Record<string, string> = {
          'EN': 'ACT English',
          'MA': 'ACT Math',
          'RD': 'ACT Reading',
          'SC': 'ACT Science'
        };

        const formData: Form[] = formIds.map((formId) => {
          const [prefix, section] = formId.split('_');
          const actual = countMap[formId] || 0;
          const pkg = EXAM_PACKAGES.find(p => p.prefix === prefix);
          return {
            id: formId,
            label: `${sectionNames[section]} – ${pkg?.label ?? prefix}`,
            questionCount: actual,
            isAvailable: actual > 0,
          };
        });

        setForms(formData);
      } catch (error) {
        reportError(error instanceof Error ? error : new Error(String(error)), { component: 'FormPicker' });
        // Fallback to empty array on error
        setForms([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFormAvailability();
  }, []);

  // Group forms by exam: 3 timed full simulations, then 5 coach-mode exams
  const testPackages = EXAM_PACKAGES.map(pkg => ({
    id: pkg.prefix,
    label: pkg.label,
    coached: pkg.coached,
    forms: forms.filter(f => f.id.startsWith(`${pkg.prefix}_`)),
  })).sort((a, b) => Number(b.id === highlightPrefix) - Number(a.id === highlightPrefix));

  const handleFormClick = (form: Form) => {
    if (!form.isAvailable) return;
    // Extract section from formId and normalize to standard code (e.g., 'FA_MA' -> 'MATH')
    const section = getCodeFromFormId(form.id) || form.id.split('_')[1];
    setSelectedForm(form.id);
    onFormSelect(form.id, section, form.questionCount);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading available tests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Choose Your ACT Form</h1>
        <p className="text-muted-foreground">
          Select an individual section or a complete test package
        </p>
      </div>

      <div className="grid gap-6">
        {testPackages.map((pkg) => {
          const allComplete = pkg.forms.every(f => f.isAvailable);
          
          return (
            <Card key={pkg.id} className={`w-full ${pkg.id === highlightPrefix ? 'ring-2 ring-primary' : ''}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{pkg.label}</CardTitle>
                    <CardDescription>
                      {pkg.coached
                        ? 'Coach Mode: strategy tips and pacing feedback as you go'
                        : 'Timed, test-day conditions'}
                    </CardDescription>
                  </div>
                  <Badge variant={allComplete ? 'default' : 'secondary'}>
                    {allComplete ? 'Complete' : pkg.forms.some(f => f.isAvailable) ? 'Partial' : 'Coming Soon'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {pkg.forms.map((form) => {
                    const section = form.id.split('_')[1];
                    const sectionNames: Record<string, string> = {
                      'EN': 'English',
                      'MA': 'Math', 
                      'RD': 'Reading',
                      'SC': 'Science'
                    };
                    
                    // Must match session-start (ACT enhanced format)
                    const timeLimits: Record<string, string> = {
                      'EN': '35 min',
                      'MA': '50 min',
                      'RD': '40 min',
                      'SC': '40 min'
                    };

                    return (
                      <Button
                        key={form.id}
                        variant={selectedForm === form.id ? 'default' : 'outline'}
                        className="h-auto p-4 flex flex-col items-start text-left"
                        onClick={() => handleFormClick(form)}
                        disabled={!form.isAvailable}
                      >
                        <div className="font-semibold text-sm">
                          {sectionNames[section]}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {timeLimits[section]}
                        </div>
                        {!form.isAvailable && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            Coming Soon
                          </Badge>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <div className="text-sm text-muted-foreground">
          <p>Sections marked Coming Soon don't have questions loaded yet.</p>
        </div>
      </div>
    </div>
  );
}
