import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Form {
  id: string;
  label: string;
}

interface FormPickerProps {
  onFormSelect: (formId: string) => void;
}

export function FormPicker({ onFormSelect }: FormPickerProps) {
  const [selectedForm, setSelectedForm] = useState<string>('');

  const forms: Form[] = [
    { id: 'FA_EN', label: 'ACT English – Form A' },
    { id: 'FA_MA', label: 'ACT Math – Form A' },
    { id: 'FA_RD', label: 'ACT Reading – Form A' },
    { id: 'FA_SCI', label: 'ACT Science – Form A' },
    { id: 'FB_EN', label: 'ACT English – Form B' },
    { id: 'FB_MA', label: 'ACT Math – Form B' },
    { id: 'FB_RD', label: 'ACT Reading – Form B' },
    { id: 'FB_SCI', label: 'ACT Science – Form B' },
    { id: 'FC_EN', label: 'ACT English – Form C' },
    { id: 'FC_MA', label: 'ACT Math – Form C' },
    { id: 'FC_RD', label: 'ACT Reading – Form C' },
    { id: 'FC_SCI', label: 'ACT Science – Form C' },
  ];

  // Group forms by test package
  const testPackages = [
    {
      id: 'FA',
      label: 'Full ACT – Form A',
      forms: forms.filter(f => f.id.startsWith('FA_')),
      badge: 'Complete',
    },
    {
      id: 'FB', 
      label: 'Full ACT – Form B',
      forms: forms.filter(f => f.id.startsWith('FB_')),
      badge: 'Partial', // FB_SCI incomplete (29/40 questions)
    },
    {
      id: 'FC',
      label: 'Full ACT – Form C', 
      forms: forms.filter(f => f.id.startsWith('FC_')),
      badge: 'Complete',
    },
  ];

  const handleFormClick = (formId: string) => {
    setSelectedForm(formId);
    onFormSelect(formId);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Choose Your ACT Form</h1>
        <p className="text-muted-foreground">
          Select an individual section or a complete test package
        </p>
      </div>

      <div className="grid gap-6">
        {testPackages.map((pkg) => (
          <Card key={pkg.id} className="w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{pkg.label}</CardTitle>
                  <CardDescription>
                    {pkg.forms.length} sections available
                  </CardDescription>
                </div>
                <Badge variant={pkg.badge === 'Complete' ? 'default' : 'secondary'}>
                  {pkg.badge}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {pkg.forms.map((form) => {
                  const section = form.id.split('_')[1]; // FA_EN -> EN, FB_MA -> MA
                  const sectionNames = {
                    'EN': 'English',
                    'MA': 'Math', 
                    'RD': 'Reading',
                    'SCI': 'Science'
                  };
                  
                  const timeLimits = {
                    'EN': '45 min',
                    'MA': '60 min',
                    'RD': '35 min', 
                    'SCI': '35 min'
                  };

                  const questionCounts = {
                    'EN': '75 questions',
                    'MA': '60 questions',
                    'RD': '40 questions',
                    'SCI': '40 questions'
                  };

                  // FB_SCI is incomplete (only 29 questions), mark as unavailable
                  const isAvailable = form.id !== 'FB_SCI';

                  return (
                    <Button
                      key={form.id}
                      variant={selectedForm === form.id ? 'default' : 'outline'}
                      className="h-auto p-4 flex flex-col items-start text-left"
                      onClick={() => handleFormClick(form.id)}
                      disabled={!isAvailable}
                    >
                      <div className="font-semibold text-sm">
                        {sectionNames[section as keyof typeof sectionNames]}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {timeLimits[section as keyof typeof timeLimits]} • {questionCounts[section as keyof typeof questionCounts]}
                      </div>
                      {!isAvailable && (
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
        ))}
      </div>

      <div className="mt-8 text-center">
        <div className="text-sm text-muted-foreground">
          <p>• Form A and Form C are fully complete</p>
          <p>• Form B Science section coming soon (currently incomplete)</p>
        </div>
      </div>
    </div>
  );
}