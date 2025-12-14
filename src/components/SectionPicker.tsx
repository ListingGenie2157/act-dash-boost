import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, FileText, BookOpen, Microscope, Calculator, Sparkles } from 'lucide-react';

interface SectionPickerProps {
  formId: string;
  onSectionSelect: (section: string, coached?: boolean) => void;
  onBack: () => void;
}

export function SectionPicker({ formId, onSectionSelect, onBack }: SectionPickerProps) {
  const sections = [
    {
      id: 'EN',
      name: 'English',
      icon: FileText,
      timeLimit: 45,
      questionCount: 75,
      description: 'Usage, mechanics, and rhetorical skills',
      color: 'bg-blue-100 text-blue-700',
    },
    {
      id: 'MATH',
      name: 'Math',
      icon: Calculator,
      timeLimit: 60,
      questionCount: 60,
      description: 'Algebra, geometry, and trigonometry',
      color: 'bg-green-100 text-green-700',
    },
    {
      id: 'RD',
      name: 'Reading',
      icon: BookOpen,
      timeLimit: 35,
      questionCount: 40,
      description: 'Comprehension and analysis',
      color: 'bg-purple-100 text-purple-700',
    },
    {
      id: 'SCI',
      name: 'Science',
      icon: Microscope,
      timeLimit: 35,
      questionCount: 40,
      description: 'Scientific reasoning and data analysis',
      color: 'bg-orange-100 text-orange-700',
    },
  ];

  const formLetter = formId.split('_')[0].substring(1); // FA_EN -> A, FB_MA -> B
  const formName = `Form ${formLetter}`;

  const isAvailable = (sectionId: string) => {
    // FB_SCI is incomplete (only 29 questions)
    if (formId === 'FB_SCI' || (formId.startsWith('FB_') && sectionId === 'SCI')) {
      return false;
    }
    // All other FA, FB (except SCI), FC sections are available
    return formId.startsWith('FA_') || formId.startsWith('FB_') || formId.startsWith('FC_');
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button variant="outline" onClick={onBack} className="mb-4">
          ← Back to Forms
        </Button>
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Choose Section - {formName}</h1>
          <p className="text-muted-foreground">
            Select which section you'd like to practice
          </p>
        </div>
      </div>

      {/* Mode Selection Info */}
      <div className="max-w-4xl mx-auto mb-6">
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Try Coached Mode!</h3>
                <p className="text-sm text-blue-800 mb-3">
                  Get helpful test-taking reminders and strategy tips during your practice test. 
                  Perfect for building good habits under pressure.
                </p>
                <div className="flex items-center gap-2 text-xs text-blue-700">
                  <Badge variant="outline" className="bg-white/50 text-blue-700 border-blue-300">
                    Time management tips
                  </Badge>
                  <Badge variant="outline" className="bg-white/50 text-blue-700 border-blue-300">
                    Section strategies
                  </Badge>
                  <Badge variant="outline" className="bg-white/50 text-blue-700 border-blue-300">
                    Pacing reminders
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {sections.map((section) => {
          const Icon = section.icon;
          const available = isAvailable(section.id);
          
          return (
            <Card key={section.id} className={`cursor-pointer transition-all duration-200 ${
              available ? 'hover:shadow-lg hover:scale-105' : 'opacity-60'
            }`}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${section.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{section.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {section.description}
                      </CardDescription>
                    </div>
                  </div>
                  {!available && (
                    <Badge variant="outline">Coming Soon</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{section.timeLimit} min</span>
                    </div>
                    <div>
                      {section.questionCount} questions
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Button 
                    className="w-full" 
                    disabled={!available}
                    onClick={() => available && onSectionSelect(section.id, false)}
                  >
                    {available ? 'Start Timed Test' : 'Coming Soon'}
                  </Button>
                  {available && (
                    <Button 
                      variant="outline"
                      className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                      onClick={() => onSectionSelect(section.id, true)}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Start Coached Test
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <div className="text-sm text-muted-foreground">
          <p>Currently available: Reading and Science sections for Form C</p>
          <p>English and Math sections coming soon</p>
        </div>
      </div>
    </div>
  );
}