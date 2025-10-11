import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, CheckCircle, Eye } from 'lucide-react';
import { sanitizeHTML } from '@/lib/sanitize';

interface Skill {
  id: string;
  name: string;
  subject: string;
  cluster: string;
}

interface ExtractedContent {
  overview_html?: string;
  concept_explanation?: string;
  guided_practice?: string;
  common_traps?: string;
  independent_practice?: string;
  independent_practice_answers?: string;
  checkpoint_quiz?: string;
  checkpoint_quiz_answers?: string;
  recap?: string;
  error_analysis?: string;
}

export default function AdminLessonImport() {
  const [htmlContent, setHtmlContent] = useState('');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [extractedContent, setExtractedContent] = useState<ExtractedContent | null>(null);
  const [importing, setImporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    const { data, error } = await supabase
      .from('skills')
      .select('id, name, subject, cluster')
      .order('subject')
      .order('cluster')
      .order('name');

    if (error) {
      toast({
        title: 'Error loading skills',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setSkills(data || []);
  };

  const extractSections = () => {
    if (!htmlContent.trim()) {
      toast({
        title: 'No content',
        description: 'Please paste HTML content first',
        variant: 'destructive',
      });
      return;
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');

      const sections: ExtractedContent = {};

      // Extract each section by id
      const sectionIds = [
        'overview',
        'concept-explanation',
        'guided-practice',
        'common-traps',
        'independent-practice',
        'independent-practice-answers',
        'checkpoint-quiz',
        'checkpoint-quiz-answers',
        'recap',
        'error-analysis'
      ];

      sectionIds.forEach(id => {
        const element = doc.getElementById(id);
        if (element) {
          // Get inner HTML and sanitize
          const html = sanitizeHTML(element.innerHTML);
          
          // Map id to field name
          const fieldName = id.replace(/-/g, '_') as keyof ExtractedContent;
          sections[fieldName] = html;
        }
      });

      if (Object.keys(sections).length === 0) {
        toast({
          title: 'No sections found',
          description: 'Could not find any sections with expected IDs',
          variant: 'destructive',
        });
        return;
      }

      setExtractedContent(sections);
      toast({
        title: 'Extraction successful',
        description: `Found ${Object.keys(sections).length} sections`,
      });
    } catch (error) {
      toast({
        title: 'Extraction failed',
        description: error instanceof Error ? error.message : 'Invalid HTML',
        variant: 'destructive',
      });
    }
  };

  const handleImport = async () => {
    if (!selectedSkill) {
      toast({
        title: 'No skill selected',
        description: 'Please select a skill',
        variant: 'destructive',
      });
      return;
    }

    if (!extractedContent) {
      toast({
        title: 'No content extracted',
        description: 'Please extract content first',
        variant: 'destructive',
      });
      return;
    }

    setImporting(true);

    try {
      const { error } = await supabase.functions.invoke('import-lesson-content', {
        body: {
          lessons: [{
            skill_code: selectedSkill,
            ...extractedContent,
          }],
        },
      });

      if (error) throw error;

      toast({
        title: 'Import successful',
        description: `Lesson content imported for skill: ${skills.find(s => s.id === selectedSkill)?.name}`,
      });

      // Reset form
      setHtmlContent('');
      setExtractedContent(null);
      setSelectedSkill('');
      setShowPreview(false);
    } catch (error) {
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Admin Lesson Content Import</h1>
        <p className="text-muted-foreground">
          Paste complete HTML lesson document to extract and import sections
        </p>
      </div>

      <div className="grid gap-6">
        {/* Step 1: Paste HTML */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Step 1: Paste HTML Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              placeholder="Paste your complete HTML lesson document here..."
              className="min-h-[200px] font-mono text-sm"
            />
            <Button onClick={extractSections} disabled={!htmlContent.trim()}>
              <Upload className="mr-2 h-4 w-4" />
              Extract Sections
            </Button>
          </CardContent>
        </Card>

        {/* Step 2: Select Skill */}
        {extractedContent && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Step 2: Select Target Skill
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Skill</Label>
                <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a skill..." />
                  </SelectTrigger>
                  <SelectContent>
                    {skills.map((skill) => (
                      <SelectItem key={skill.id} value={skill.id}>
                        {skill.subject} - {skill.cluster} - {skill.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Alert>
                <AlertDescription>
                  Found {Object.keys(extractedContent).length} sections:{' '}
                  {Object.keys(extractedContent).join(', ')}
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  {showPreview ? 'Hide' : 'Show'} Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview */}
        {showPreview && extractedContent && (
          <Card>
            <CardHeader>
              <CardTitle>Content Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(extractedContent).map(([key, value]) => (
                <div key={key} className="border-l-4 border-primary pl-4">
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                    {key.replace(/_/g, ' ').toUpperCase()}
                  </h3>
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: value }}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Import */}
        {extractedContent && selectedSkill && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Step 3: Import to Database
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleImport}
                disabled={importing}
                size="lg"
                className="w-full"
              >
                {importing ? 'Importing...' : 'Import Lesson Content'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
