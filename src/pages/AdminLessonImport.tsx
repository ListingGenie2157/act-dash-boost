import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import { sanitizeHTML } from '@/lib/sanitize';

interface ExtractedContent {
  skill_code: string;
  overview_html?: string;
  concept_explanation?: string;
  guided_practice?: string;
  common_traps?: string;
  independent_practice?: string;
  independent_practice_answers?: string;
  checkpoint_quiz_q1?: string;
  checkpoint_quiz_q2?: string;
  checkpoint_quiz_q3?: string;
  checkpoint_quiz_q4?: string;
  checkpoint_quiz_q5?: string;
  checkpoint_quiz_q6?: string;
  checkpoint_quiz_q7?: string;
  checkpoint_quiz_q8?: string;
  checkpoint_quiz_q9?: string;
  checkpoint_quiz_q10?: string;
  recap?: string;
  error_analysis?: string;
  objectives?: string;
  estimated_minutes?: number;
  difficulty?: string;
}

interface LessonPreview extends ExtractedContent {
  skill_name?: string;
  validation_status: 'valid' | 'invalid';
  validation_errors: string[];
}

// Normalize skill codes to handle formatting issues
function normalizeSkillCode(code: string): string {
  return code
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '') // Remove zero-width characters
    .replace(/\u00A0/g, '') // Remove non-breaking spaces
    .replace(/[·•‧⋅・｡。．]/g, '.') // Replace dot-like chars with period
    .replace(/\s*\.\s*/g, '.') // Collapse spaces around separators
    .trim()
    .toUpperCase();
}

export default function AdminLessonImport() {
  const [htmlContent, setHtmlContent] = useState('');
  const [tsvContent, setTsvContent] = useState('');
  const [importMode, setImportMode] = useState<'html' | 'tsv'>('tsv');
  const [extractedLessons, setExtractedLessons] = useState<LessonPreview[]>([]);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    totalProcessed: number;
    successCount: number;
    errorCount: number;
    errors: string[];
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [forceImport, setForceImport] = useState(false);
  const { toast } = useToast();

  const extractSections = () => {
    if (importMode === 'tsv') {
      parseTsvContent();
    } else {
      parseHtmlContent();
    }
  };

  const parseTsvContent = async () => {
    if (!tsvContent.trim()) {
      toast({
        title: 'No content',
        description: 'Please paste TSV content first',
        variant: 'destructive',
      });
      return;
    }

    try {
      const lines = tsvContent.trim().split('\n');
      if (lines.length < 2) {
        throw new Error('TSV must have header and at least one data row');
      }

      const headers = lines[0].split('\t').map(h => h.trim());
      const dataRows = lines.slice(1);

      const lessons: ExtractedContent[] = [];

      for (const row of dataRows) {
        const values = row.split('\t').map(v => v.trim());
        const lesson: any = {};

        headers.forEach((header, idx) => {
          const value = values[idx]?.trim() || '';
          if (value !== '') {
            if (header === 'estimated_minutes') {
              const n = Number(value);
              lesson[header] = Number.isFinite(n) && n > 0 ? n : undefined;
            } else {
              lesson[header] = value;
            }
          }
        });

        if (lesson.skill_code) {
          // Normalize skill_code immediately
          const originalCode = lesson.skill_code;
          const normalizedCode = normalizeSkillCode(originalCode);
          lesson.skill_code = normalizedCode;
          
          if (originalCode !== normalizedCode) {
            console.log(`Normalized skill code: "${originalCode}" → "${normalizedCode}"`);
          }
          
          lessons.push(lesson as ExtractedContent);
        }
      }

      if (lessons.length === 0) {
        throw new Error('No valid lessons found. Each row must include a skill_code column.');
      }

      // Fetch all skills to build a robust index for validation
      const { data: allSkills, error: skillError } = await supabase
        .from('skills')
        .select('id, code, name');

      if (skillError) {
        toast({
          title: 'Error',
          description: 'Failed to fetch skills for validation: ' + skillError.message,
          variant: 'destructive',
        });
        return;
      }

      if (!allSkills || allSkills.length === 0) {
        toast({
          title: 'Warning',
          description: 'No skills found in database. Cannot validate skill codes.',
          variant: 'destructive',
        });
        console.error('No skills found for validation');
        return;
      }

      // Build an index of valid skill references (both id and code)
      const validSkillRefs = new Set<string>();
      const skillNameMap = new Map<string, string>();
      
      allSkills.forEach(skill => {
        validSkillRefs.add(skill.id);
        skillNameMap.set(skill.id, skill.name);
        
        if (skill.code) {
          validSkillRefs.add(skill.code);
          skillNameMap.set(skill.code, skill.name);
        }
      });

      console.info('Skill validation index built:', {
        totalSkills: allSkills.length,
        uniqueRefs: validSkillRefs.size,
        extractedLessons: lessons.length,
        uniqueCodes: new Set(lessons.map(l => l.skill_code)).size
      });

      // Validate each lesson
      const previews: LessonPreview[] = lessons.map((lesson) => {
        const errors: string[] = [];

        if (!lesson.skill_code) {
          errors.push('Missing skill_code');
        }

        if (!lesson.overview_html || lesson.overview_html.trim() === '') {
          errors.push('Missing overview_html');
        }

        // Check if skill exists using our robust index
        const isValid = validSkillRefs.has(lesson.skill_code);
        const skill_name = skillNameMap.get(lesson.skill_code);
        
        if (!isValid) {
          errors.push(`Skill not found: ${lesson.skill_code}`);
          console.warn(`Skill not found after normalization: "${lesson.skill_code}"`);
        }

        return {
          ...lesson,
          skill_name: skill_name || 'Unknown',
          validation_status: errors.length === 0 ? 'valid' : 'invalid',
          validation_errors: errors,
        } as LessonPreview;
      });

      setExtractedLessons(previews);
      setShowPreview(true);

      const validCount = previews.filter(p => p.validation_status === 'valid').length;
      const invalidCount = previews.filter(p => p.validation_status === 'invalid').length;

      toast({
        title: 'TSV parsed successfully',
        description: `Found ${previews.length} lesson(s): ${validCount} valid, ${invalidCount} invalid`,
      });
    } catch (error) {
      toast({
        title: 'TSV parsing failed',
        description: error instanceof Error ? error.message : 'Invalid TSV format',
        variant: 'destructive',
      });
    }
  };

  const parseHtmlContent = async () => {
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

      const sections: any = { skill_code: '' };

      const sectionIds = [
        'overview',
        'concept-explanation',
        'guided-practice',
        'common-traps',
        'independent-practice',
        'independent-practice-answers',
        'recap',
        'error-analysis'
      ];

      sectionIds.forEach(id => {
        const element = doc.getElementById(id);
        if (element) {
          const html = sanitizeHTML(element.innerHTML);
          const fieldName = id.replace(/-/g, '_');
          sections[fieldName] = html;
        }
      });

      if (Object.keys(sections).filter(k => k !== 'skill_code').length === 0) {
        toast({
          title: 'No sections found',
          description: 'HTML mode is not fully supported for batch import. Use TSV format.',
          variant: 'destructive',
        });
        return;
      }

      const errors: string[] = ['Missing skill_code (HTML mode not supported)'];
      
      setExtractedLessons([{
        ...sections,
        skill_name: 'N/A',
        validation_status: 'invalid',
        validation_errors: errors,
      } as LessonPreview]);
      
      setShowPreview(true);
      
      toast({
        title: 'Extraction successful',
        description: `Found ${Object.keys(sections).filter(k => k !== 'skill_code').length} sections. Use TSV format for batch import.`,
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
    if (extractedLessons.length === 0) {
      toast({ title: 'No lessons to import', variant: 'destructive' });
      return;
    }

    // If force import is enabled, import all; otherwise only valid ones
    const lessonsToImport = forceImport 
      ? extractedLessons 
      : extractedLessons.filter(l => l.validation_status === 'valid');
      
    if (lessonsToImport.length === 0) {
      toast({
        title: 'No lessons to import',
        description: forceImport 
          ? 'No lessons found in the content.'
          : 'All lessons have validation errors. Enable "Force import" to proceed with server-side validation.',
        variant: 'destructive',
      });
      return;
    }

    setImporting(true);
    setImportStatus(null);

    try {
      const lessonsData = lessonsToImport.map(({ skill_name, validation_status, validation_errors, ...lesson }) => lesson);

      const { data, error } = await supabase.functions.invoke('import-lesson-content', {
        body: lessonsData,
      });

      if (error) throw error;

      setImportStatus({
        totalProcessed: data?.total_processed || lessonsToImport.length,
        successCount: data?.success_count || data?.imported || 0,
        errorCount: data?.error_count || data?.failed || 0,
        errors: data?.errors || (data?.details?.errors || []).map((e: any) => `${e.skill_code}: ${e.error}`) || [],
      });

      if ((data?.success_count || data?.imported || 0) > 0) {
        toast({
          title: 'Import complete',
          description: `${data?.success_count || data?.imported || 0} lesson(s) imported successfully.`,
        });
        
        // Clear form after success
        setHtmlContent('');
        setTsvContent('');
        setExtractedLessons([]);
        setShowPreview(false);
        setForceImport(false);
      }

      if ((data?.error_count || data?.failed || 0) > 0) {
        toast({
          title: (data?.error_count || data?.failed) === lessonsToImport.length ? 'Import failed' : 'Partial import',
          description: `${data?.error_count || data?.failed || 0} lesson(s) failed. Check status below.`,
          variant: 'destructive',
        });
      }
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

  const removeLessonFromPreview = (skillCode: string) => {
    setExtractedLessons(prev => prev.filter(l => l.skill_code !== skillCode));
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Admin Lesson Content Import</h1>
        <p className="text-muted-foreground">
          Batch import lessons using TSV format with skill_code column
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Import Mode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button
                variant={importMode === 'tsv' ? 'default' : 'outline'}
                onClick={() => setImportMode('tsv')}
              >
                TSV Format (Recommended)
              </Button>
              <Button
                variant={importMode === 'html' ? 'default' : 'outline'}
                onClick={() => setImportMode('html')}
              >
                HTML Format (Not Supported)
              </Button>
            </div>
            <Alert>
              <AlertDescription>
                {importMode === 'tsv' 
                  ? 'Paste TSV with columns: skill_code, overview_html, concept_explanation, etc. Multiple rows for batch import.'
                  : 'HTML mode is not supported for batch import. Use TSV format instead.'}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Step 1: Paste {importMode === 'tsv' ? 'TSV' : 'HTML'} Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={extractSections} 
              disabled={importMode === 'tsv' ? !tsvContent.trim() : !htmlContent.trim()}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              {importMode === 'tsv' ? 'Parse TSV' : 'Extract Sections'}
            </Button>
            {importMode === 'tsv' ? (
              <Textarea
                value={tsvContent}
                onChange={(e) => setTsvContent(e.target.value)}
                placeholder="Paste your TSV content here (tab-separated with headers)..."
                className="min-h-[200px] font-mono text-sm"
              />
            ) : (
              <Textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                placeholder="HTML mode not supported for batch import..."
                className="min-h-[200px] font-mono text-sm"
              />
            )}
          </CardContent>
        </Card>

        {showPreview && extractedLessons.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Step 2: Review Lessons ({extractedLessons.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {extractedLessons.map((lesson, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-2 ${
                      lesson.validation_status === 'valid'
                        ? 'border-green-500 bg-green-50/50'
                        : 'border-red-500 bg-red-50/50'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 font-semibold">
                          <span>{lesson.validation_status === 'valid' ? '✅' : '❌'}</span>
                          <span className="font-mono text-sm">{lesson.skill_code}</span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {lesson.skill_name || 'Unknown skill'}
                        </div>
                        {lesson.validation_errors.length > 0 && (
                          <div className="mt-2 text-sm text-red-600">
                            Errors: {lesson.validation_errors.join(', ')}
                          </div>
                        )}
                        <div className="mt-1 text-xs text-muted-foreground">
                          {Object.keys(lesson).filter(k =>
                            !['skill_code', 'skill_name', 'validation_status', 'validation_errors'].includes(k) &&
                            lesson[k as keyof ExtractedContent]
                          ).length} fields populated
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLessonFromPreview(lesson.skill_code)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="text-sm">
                  <strong>Summary:</strong> {extractedLessons.filter(l => l.validation_status === 'valid').length} valid, {extractedLessons.filter(l => l.validation_status === 'invalid').length} invalid
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {showPreview && extractedLessons.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Step 3: Import to Database
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Force Import Toggle */}
              <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
                <input
                  type="checkbox"
                  id="force-import"
                  checked={forceImport}
                  onChange={(e) => setForceImport(e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="force-import" className="text-sm cursor-pointer">
                  Force import (server will validate and skip invalid rows)
                </label>
              </div>

              <Button
                onClick={handleImport}
                disabled={importing || (!forceImport && extractedLessons.filter(l => l.validation_status === 'valid').length === 0)}
                size="lg"
                className="w-full"
              >
                {importing
                  ? 'Importing...'
                  : `Import ${forceImport ? extractedLessons.length : extractedLessons.filter(l => l.validation_status === 'valid').length} Lesson(s)`}
              </Button>

              {importStatus && (
                <Alert variant={importStatus.errorCount > 0 ? 'destructive' : 'default'}>
                  <AlertDescription>
                    <div className="space-y-1">
                      <div><strong>Processed:</strong> {importStatus.totalProcessed}</div>
                      <div>✅ <strong>Success:</strong> {importStatus.successCount}</div>
                      <div>❌ <strong>Failed:</strong> {importStatus.errorCount}</div>
                      {importStatus.errors.length > 0 && (
                        <div className="mt-2">
                          <strong>Errors:</strong>
                          <ul className="list-disc pl-5 mt-1 text-xs">
                            {importStatus.errors.map((err, idx) => (
                              <li key={idx}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
