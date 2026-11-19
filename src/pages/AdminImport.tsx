import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, CheckCircle, AlertTriangle, Download, Play } from 'lucide-react';
import { logger } from '@/lib/logger';
import { reportError } from '@/lib/errorReporter';
import { buildImportRows, onlyNewRows, type ImportError, type StagingInsert } from '@/lib/questionImport';

export default function AdminImport() {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{
    success: number;
    errors: ImportError[];
    warnings: string[];
  } | null>(null);
  const [dryRun, setDryRun] = useState(true);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
    setResults(null);
  };

  const loadFormAFiles = async () => {
    const files = [
      { name: 'form_a_english.csv', path: '/import-data/form_a_english.csv' },
      { name: 'form_a_math.csv', path: '/import-data/form_a_math.csv' },
      { name: 'form_a_reading.csv', path: '/import-data/form_a_reading.csv' },
      { name: 'form_a_science.csv', path: '/import-data/form_a_science.csv' },
    ];

    try {
      const fileList = new DataTransfer();
      
      for (const fileInfo of files) {
        const response = await fetch(fileInfo.path);
        if (response.ok) {
          const content = await response.text();
          const file = new File([content], fileInfo.name, { type: 'text/csv' });
          fileList.items.add(file);
        }
      }
      
      setSelectedFiles(fileList.files);
      toast({
        title: "Form A Files Loaded",
        description: `Loaded ${fileList.files.length} Form A files for import.`,
      });
    } catch (error) {
      toast({
        title: "Failed to load files",
        description: "Could not load the Form A files. Please upload them manually.",
        variant: "destructive",
      });
    }
  };

  const processFiles = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one CSV file to import.",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    setProgress(0);
    
    try {
      const allRecords: StagingInsert[] = [];
      const allErrors: ImportError[] = [];
      const warnings: string[] = [];
      let processedFiles = 0;

      for (const file of Array.from(selectedFiles)) {
        if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
          warnings.push(`Skipped non-CSV file: ${file.name}`);
          continue;
        }
        const { rows, errors, ignoredColumns } = buildImportRows(await file.text());
        allErrors.push(...errors.map(e => ({ ...e, field: `${file.name}: ${e.field}` })));
        if (ignoredColumns.length) {
          warnings.push(`${file.name}: these columns are not in the question table and were not imported: ${ignoredColumns.join(', ')}`);
        }
        allRecords.push(...rows);
        processedFiles++;
        setProgress((processedFiles / selectedFiles.length) * 40);
      }

      logger.debug(`Parsed ${allRecords.length} records with ${allErrors.length} errors`);

      // Nothing is imported while any row has an error
      if (allErrors.length > 0) {
        setResults({ success: 0, errors: allErrors, warnings });
        toast({
          title: 'Validation failed',
          description: `Found ${allErrors.length} errors. Fix them and try again - nothing was imported.`,
          variant: 'destructive',
        });
        return;
      }

      // Existing questions are never deleted: rows already in a form (same question text) are skipped
      const formIds = [...new Set(allRecords.map(r => r.form_id))];
      const existing: Array<{ form_id: string; question: string | null }> = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase
          .from('staging_items')
          .select('form_id, question')
          .in('form_id', formIds)
          .range(from, from + 999);
        if (error) throw new Error(`Could not read existing questions: ${error.message}`);
        existing.push(...(data ?? []));
        if (!data || data.length < 1000) break;
      }
      const { fresh, skipped } = onlyNewRows(allRecords, existing);
      if (skipped) warnings.push(`${skipped} questions are already in ${formIds.join(', ')} and were skipped`);
      setProgress(50);

      if (dryRun) {
        setResults({
          success: fresh.length,
          errors: [],
          warnings: [...warnings, `Would add ${fresh.length} new questions to ${formIds.join(', ')}`, 'This was a dry run - nothing was imported'],
        });
        toast({ title: 'Dry run completed', description: `${fresh.length} new questions ready to add.` });
        return;
      }

      const batchSize = 100;
      let insertedCount = 0;
      for (let i = 0; i < fresh.length; i += batchSize) {
        const batch = fresh.slice(i, i + batchSize);
        const { error: insertError } = await supabase.from('staging_items').insert(batch);
        if (insertError) {
          throw new Error(`Added ${insertedCount} questions, then batch ${Math.floor(i / batchSize) + 1} failed: ${insertError.message}. Existing questions were not touched; re-running skips the ones already added.`);
        }
        insertedCount += batch.length;
        setProgress(50 + (insertedCount / Math.max(fresh.length, 1)) * 50);
      }

      setResults({
        success: insertedCount,
        errors: [],
        warnings: [...warnings, `Added ${insertedCount} new questions to ${formIds.join(', ')}`],
      });
      toast({ title: 'Import successful', description: `Added ${insertedCount} new questions.` });
    } catch (error) {
      reportError(error instanceof Error ? error : new Error(String(error)), { page: 'AdminImport' });
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'ord', 'form_id', 'section', 'skill_code', 'difficulty',
      'question', 'choice_a', 'choice_b', 'choice_c', 'choice_d', 'answer', 'explanation',
      'underlined_text', 'reference_number', 'position_in_passage', 'calculator_allowed',
      'passage_id', 'passage_title', 'passage_text',
      'image_url', 'image_caption', 'image_position',
    ].join(',');

    const comments = [
      '# ACT Question Import CSV Template',
      '# Required: form_id, section, skill_code, difficulty, question, choice_a-d, answer',
      '# Sections: English, Math, Reading, Science (EN, MATH, RD, SCI also accepted)',
      '# Difficulty: Easy, Medium or Hard. Answer: A, B, C or D (4 choices only)',
      '# Passages: same passage_id on every question of the group; passage_title and passage_text on the FIRST question',
      '# Importing adds new questions only; it never deletes. Questions already in the form are skipped.',
      '',
    ].join('\n');

    const q = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const examples = [
      ['1', 'D3EN', 'English', 'E1.A', 'Easy', q('Choose the best alternative for the underlined portion.'), 'goes', 'go', 'going', 'gone', 'A', q('Singular subject takes "goes".'), 'goes', '1', '', '', '', '', '', '', '', 'above_question'],
      ['2', 'D3MA', 'Math', 'M2.A', 'Medium', q('If 2x + 5 = 15, what is x?'), '3', '5', '7', '10', 'B', q('2x = 10, so x = 5.'), '', '', '', 'TRUE', '', '', '', '', '', 'above_question'],
      ['3', 'D3RD', 'Reading', 'R1.A', 'Hard', q('The main purpose of the passage is to:'), 'describe', 'analyze', 'argue', 'explain', 'D', '', '', '', '', '', 'P001', 'The Nature of Light', q('Light behaves as both a wave and a particle...'), '', '', 'above_question'],
      ['4', 'D3RD', 'Reading', 'R1.B', 'Medium', q('According to the passage, light:'), 'is only a wave', 'is only a particle', 'has a dual nature', 'has mass', 'C', '', '', '', '', '', 'P001', '', '', '', '', 'above_question'],
    ].map(r => r.join(','));

    const content = comments + headers + '\n' + examples.join('\n');
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'act_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Import Utility</h1>
        <p className="text-muted-foreground">
          Import CSV files containing ACT questions and passages into the staging area.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>File Upload</span>
              </CardTitle>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Template
                </Button>
                <Button variant="outline" size="sm" onClick={loadFormAFiles}>
                  <Play className="h-4 w-4 mr-2" />
                  Load Form A
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Select CSV Files
              </label>
              <input
                type="file"
                multiple
                accept=".csv,.txt"
                onChange={handleFileSelect}
                className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Select one or more CSV files containing question data, or click "Load Form A" to use the uploaded files
              </p>
            </div>

            {selectedFiles && selectedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Selected files:</p>
                <div className="flex flex-wrap gap-2">
                  {Array.from(selectedFiles).map((file, index) => (
                    <Badge key={index} variant="outline">
                      {file.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Dry run (validate only)</span>
              </label>
            </div>

            <Button
              onClick={processFiles}
              disabled={!selectedFiles || importing}
              className="w-full"
            >
              {importing ? (
                <>Processing...</>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  {dryRun ? 'Validate Files' : 'Import Files'}
                </>
              )}
            </Button>

            {importing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>

        {results && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {results.errors.length > 0 ? (
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
                <span>Import Results</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Badge variant="default">
                  {results.success} Records Processed
                </Badge>
                {results.errors.length > 0 && (
                  <Badge variant="destructive">
                    {results.errors.length} Errors
                  </Badge>
                )}
                {results.warnings.length > 0 && (
                  <Badge variant="secondary">
                    {results.warnings.length} Warnings
                  </Badge>
                )}
              </div>

              {results.warnings.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Warnings:</strong>
                    <ul className="list-disc list-inside mt-2">
                      {results.warnings.map((warning, index) => (
                        <li key={index} className="text-sm">{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {results.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Validation Errors:</strong>
                    <div className="mt-2 max-h-40 overflow-y-auto">
                      {results.errors.slice(0, 10).map((error, index) => (
                        <div key={index} className="text-sm">
                          Row {error.row}, {error.field}: {error.message}
                        </div>
                      ))}
                      {results.errors.length > 10 && (
                        <div className="text-sm text-muted-foreground mt-1">
                          ... and {results.errors.length - 10} more errors
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