import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface Form {
  id: string;
  label: string;
  questionCount: number;
  isAvailable: boolean;
}

interface FormPickerProps {
  onFormSelect: (formId: string) => void;
}

export function FormPicker({ onFormSelect }: FormPickerProps) {
  const [selectedForm, setSelectedForm] = useState<string>('');
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFormAvailability = async () => {
      try {
        // Query actual question counts from database
        const formIds = [
          'FA_EN', 'FA_MA', 'FA_RD', 'FA_SCI',
          'FB_EN', 'FB_MA', 'FB_RD', 'FB_SCI',
          'FC_EN', 'FC_MA', 'FC_RD', 'FC_SCI'
        ];

        const formData: Form[] = await Promise.all(
          formIds.map(async (formId) => {
            const [prefix, section] = formId.split('_');
            const sectionNames: Record<string, string> = {
              'EN': 'ACT English',
              'MA': 'ACT Math',
              'RD': 'ACT Reading',
              'SCI': 'ACT Science'
            };

            // Count questions for this form/section
            const { count } = await supabase
              .from('form_questions')
              .select('*', { count: 'exact', head: true })
              .eq('form_id', formId);

            const expectedCounts: Record<string, number> = {
              'EN': 75,
              'MA': 60,
              'RD': 40,
              'SCI': 40
            };

            const expected = expectedCounts[section];
            const actual = count || 0;

            return {
              id: formId,
              label: `${sectionNames[section]} – Form ${prefix.replace('F', '')}`,
              questionCount: actual,
              isAvailable: actual >= expected
            };
          })
        );

        setForms(formData);
      } catch (error) {
        console.error('Error fetching form availability:', error);
        // Fallback to empty array on error
        setForms([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFormAvailability();
  }, []);

  // Group forms by test package
  const testPackages = [
    {
      id: 'FA',
      label: 'Full ACT – Form A',
      forms: forms.filter(f => f.id.startsWith('FA_'))
    },
    {
      id: 'FB', 
      label: 'Full ACT – Form B',
      forms: forms.filter(f => f.id.startsWith('FB_'))
    },
    {
      id: 'FC',
      label: 'Full ACT – Form C', 
      forms: forms.filter(f => f.id.startsWith('FC_'))
    },
  ];

  const handleFormClick = (formId: string, isAvailable: boolean) => {
    if (!isAvailable) return;
    setSelectedForm(formId);
    onFormSelect(formId);
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
          const availableCount = pkg.forms.filter(f => f.isAvailable).length;
          
          return (
            <Card key={pkg.id} className="w-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{pkg.label}</CardTitle>
                    <CardDescription>
                      {availableCount} of {pkg.forms.length} sections available
                    </CardDescription>
                  </div>
                  <Badge variant={allComplete ? 'default' : 'secondary'}>
                    {allComplete ? 'Complete' : 'Partial'}
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
                      'SCI': 'Science'
                    };
                    
                    const timeLimits: Record<string, string> = {
                      'EN': '45 min',
                      'MA': '60 min',
                      'RD': '35 min', 
                      'SCI': '35 min'
                    };

                    return (
                      <Button
                        key={form.id}
                        variant={selectedForm === form.id ? 'default' : 'outline'}
                        className="h-auto p-4 flex flex-col items-start text-left"
                        onClick={() => handleFormClick(form.id, form.isAvailable)}
                        disabled={!form.isAvailable}
                      >
                        <div className="font-semibold text-sm">
                          {sectionNames[section]}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {timeLimits[section]} • {form.questionCount} questions
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
          <p>Available tests are loaded from the database in real-time</p>
        </div>
      </div>
    </div>
  );
}