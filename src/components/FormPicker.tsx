import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface Form {
  id: string;
  label: string;
  description: string;
  badge: 'Complete' | 'Available' | 'Coming Soon';
}

interface FormPickerProps {
  onFormSelect: (formId: string) => void;
}

export function FormPicker({ onFormSelect }: FormPickerProps) {
  const [selectedForm, setSelectedForm] = useState<string>('');
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const { data: formsData, error } = await supabase
          .from('forms')
          .select('id, label, is_active')
          .eq('is_active', true)
          .order('id');

        if (error) {
          console.error('Error fetching forms:', error);
          return;
        }

        const formsWithMetadata: Form[] = (formsData || []).map(form => ({
          id: form.id,
          label: form.label || `Form ${form.id}`,
          description: `Test form with practice content`,
          badge: 'Available' as const
        }));

        setForms(formsWithMetadata);
      } catch (error) {
        console.error('Error fetching forms:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, []);

  const handleFormClick = (formId: string) => {
    setSelectedForm(formId);
    onFormSelect(formId);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Loading Available Forms...</h1>
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  if (forms.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">No Forms Available</h1>
          <p className="text-muted-foreground">No practice forms have been imported yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Choose Your ACT Form</h1>
        <p className="text-muted-foreground">
          Select a test form to begin your simulation
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="grid gap-6 md:grid-cols-3">
          {forms.map((form) => (
            <Card
              key={form.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedForm === form.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleFormClick(form.id)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{form.label}</CardTitle>
                  <Badge variant={form.badge === 'Available' ? 'default' : 'secondary'}>
                    {form.badge}
                  </Badge>
                </div>
                <CardDescription>{form.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">English:</span>
                      <span className="font-medium">75 questions</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">45 min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Math:</span>
                      <span className="font-medium">60 questions</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">60 min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reading:</span>
                      <span className="font-medium">40 questions</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">35 min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Science:</span>
                      <span className="font-medium">40 questions</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">35 min</span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    variant={selectedForm === form.id ? 'default' : 'outline'}
                    disabled={form.badge === 'Coming Soon'}
                  >
                    {selectedForm === form.id ? 'Selected' : 'Select Form'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="mt-8 text-center">
        <div className="text-sm text-muted-foreground">
          <p>Each form contains authentic ACT questions from real tests</p>
          <p>All sections include detailed explanations and timing features</p>
        </div>
      </div>
    </div>
  );
}