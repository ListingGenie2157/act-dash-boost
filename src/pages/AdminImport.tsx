import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, CheckCircle, AlertTriangle, Download, Play } from 'lucide-react';

interface ImportRecord {
  id: string;
  form_id: string;
  section: string;
  ord: number;
  passage_id?: string;
  passage_type?: string;
  passage_title?: string;
  passage_text?: string;
  topic: string;
  skill_code: string;
  difficulty: string;
  question: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  answer: string;
  explanation?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export default function AdminImport() {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{
    success: number;
    errors: ValidationError[];
    warnings: string[];
  } | null>(null);
  const [dryRun, setDryRun] = useState(true);
  const { toast } = useToast();

  const parseTSV = (content: string): ImportRecord[] => {
    const lines = content.trim().split('\n');
    const headers = lines[0].split('\t');
    
    return lines.slice(1).map((line, index) => {
      const values = line.split('\t');
      const record: any = {};
      
      headers.forEach((header, i) => {
        const cleanHeader = header.trim().toLowerCase();
        record[cleanHeader] = values[i]?.trim() || '';
      });

      // Map to our expected format - handle duplicate passage_text columns
      const passageText = record.passage_text || '';
      
      return {
        id: record.id || `${record.form_id}_${record.section}_${String(index + 1).padStart(3, '0')}`,
        form_id: record.form_id,
        section: record.section,
        ord: parseInt(record.ord) || index + 1,
        passage_id: record.passage_id || null,
        passage_type: record.passage_type || null,
        passage_title: record.passage_title || record.title || null,
        passage_text: passageText || null,
        topic: record.topic,
        skill_code: record.skill_code,
        difficulty: record.difficulty,
        question: record.question,
        choice_a: record.choice_a,
        choice_b: record.choice_b,
        choice_c: record.choice_c,
        choice_d: record.choice_d,
        answer: record.answer,
        explanation: record.explanation || null,
      };
    });
  };

  const validateRecord = (record: ImportRecord, rowIndex: number): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Required fields
    if (!record.form_id) errors.push({ row: rowIndex, field: 'form_id', message: 'Form ID is required' });
    if (!record.section) errors.push({ row: rowIndex, field: 'section', message: 'Section is required' });
    if (!record.question) errors.push({ row: rowIndex, field: 'question', message: 'Question is required' });
    if (!record.choice_a) errors.push({ row: rowIndex, field: 'choice_a', message: 'Choice A is required' });
    if (!record.choice_b) errors.push({ row: rowIndex, field: 'choice_b', message: 'Choice B is required' });
    if (!record.choice_c) errors.push({ row: rowIndex, field: 'choice_c', message: 'Choice C is required' });
    if (!record.choice_d) errors.push({ row: rowIndex, field: 'choice_d', message: 'Choice D is required' });

    // Validate answer
    if (!['A', 'B', 'C', 'D'].includes(record.answer)) {
      errors.push({ row: rowIndex, field: 'answer', message: 'Answer must be A, B, C, or D' });
    }

    // Validate section
    if (!['EN', 'MATH', 'RD', 'SCI'].includes(record.section)) {
      errors.push({ row: rowIndex, field: 'section', message: 'Section must be EN, MATH, RD, or SCI' });
    }

    // Validate difficulty
    if (!['Easy', 'Medium', 'Hard'].includes(record.difficulty)) {
      errors.push({ row: rowIndex, field: 'difficulty', message: 'Difficulty must be Easy, Medium, or Hard' });
    }

    return errors;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
    setResults(null);
  };

  const loadFormAFiles = async () => {
    const files = [
      { name: 'form_a_english.tsv', path: '/import-data/form_a_english.tsv' },
      { name: 'form_a_math.tsv', path: '/import-data/form_a_math.tsv' },
      { name: 'form_a_reading.tsv', path: '/import-data/form_a_reading.tsv' },
      { name: 'form_a_science.tsv', path: '/import-data/form_a_science.tsv' },
    ];

    try {
      const fileList = new DataTransfer();
      
      for (const fileInfo of files) {
        const response = await fetch(fileInfo.path);
        if (response.ok) {
          const content = await response.text();
          const file = new File([content], fileInfo.name, { type: 'text/tab-separated-values' });
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
        description: "Please select at least one TSV file to import.",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    setProgress(0);
    
    try {
      const allRecords: ImportRecord[] = [];
      const allErrors: ValidationError[] = [];
      const warnings: string[] = [];
      let processedFiles = 0;

      // Process each file
      for (const file of Array.from(selectedFiles)) {
        if (!file.name.endsWith('.tsv') && !file.name.endsWith('.txt')) {
          warnings.push(`Skipped non-TSV file: ${file.name}`);
          continue;
        }

        const content = await file.text();
        const records = parseTSV(content);
        
        // Validate each record
        records.forEach((record, index) => {
          const errors = validateRecord(record, index + 2); // +2 for header and 1-based indexing
          allErrors.push(...errors.map(e => ({ 
            ...e, 
            row: e.row + (processedFiles * 1000),
            field: `${file.name}: ${e.field}`
          })));
        });

        allRecords.push(...records);
        processedFiles++;
        setProgress((processedFiles / selectedFiles.length) * 50); // First 50% for parsing
      }

      console.log(`Parsed ${allRecords.length} records with ${allErrors.length} errors`);

      if (allErrors.length > 0 && !dryRun) {
        setResults({
          success: 0,
          errors: allErrors,
          warnings,
        });
        toast({
          title: "Validation failed",
          description: `Found ${allErrors.length} validation errors. Please fix them before importing.`,
          variant: "destructive",
        });
        setImporting(false);
        return;
      }

      // Group records by passage_id for passage insertion
      const passages = new Map<string, {
        id: string;
        form_id: string;
        section: string;
        passage_type: string;
        title: string;
        passage_text: string;
      }>();

      allRecords.forEach(record => {
        if (record.passage_id && record.passage_text) {
          passages.set(record.passage_id, {
            id: record.passage_id,
            form_id: record.form_id,
            section: record.section,
            passage_type: record.passage_type || 'Unknown',
            title: record.passage_title || '',
            passage_text: record.passage_text,
          });
        }
      });

      if (dryRun) {
        setResults({
          success: allRecords.length,
          errors: allErrors,
          warnings: [
            ...warnings,
            `Would import ${allRecords.length} questions`,
            `Would import ${passages.size} passages`,
            'This was a dry run - no data was actually imported'
          ],
        });
        toast({
          title: "Dry run completed",
          description: `Validated ${allRecords.length} records with ${allErrors.length} errors.`,
        });
        setImporting(false);
        return;
      }

      // Clear existing staging items for these forms
      const formIds = [...new Set(allRecords.map(r => r.form_id))];
      
      setProgress(60);
      
      const { error: deleteError } = await supabase
        .from('staging_items')
        .delete()
        .in('form_id', formIds);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        warnings.push(`Warning: Could not clear existing data: ${deleteError.message}`);
      }

      setProgress(80);

      // Insert staging items in batches
      const batchSize = 100;
      let insertedCount = 0;
      
      for (let i = 0; i < allRecords.length; i += batchSize) {
        const batch = allRecords.slice(i, i + batchSize);
        const { error: insertError } = await supabase
          .from('staging_items')
          .insert(batch);

        if (insertError) {
          throw new Error(`Failed to insert batch ${Math.floor(i/batchSize) + 1}: ${insertError.message}`);
        }
        
        insertedCount += batch.length;
        setProgress(80 + (insertedCount / allRecords.length) * 20);
      }

      setResults({
        success: allRecords.length,
        errors: allErrors,
        warnings: [
          ...warnings,
          `Successfully imported ${allRecords.length} questions to staging`,
          `Imported ${passages.size} unique passages`,
          `Data imported for forms: ${formIds.join(', ')}`,
        ],
      });

      toast({
        title: "Import successful",
        description: `Imported ${allRecords.length} questions to staging table.`,
      });

    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'id', 'form_id', 'section', 'ord', 'passage_id', 'passage_type', 'passage_title', 
      'passage_text', 'topic', 'skill_code', 'difficulty', 'question', 
      'choice_a', 'choice_b', 'choice_c', 'choice_d', 'answer', 'explanation'
    ].join('\t');
    
    const example = [
      'FA_EN_001', 'A', 'EN', '1', '', '', '', '', 'Grammar', 'E1.A', 'Easy',
      'The books ___ on the shelf.', 'is', 'are', 'was', 'were', 'B',
      'Plural subject "books" requires plural verb "are".'
    ].join('\t');

    const content = `${headers}\n${example}`;
    const blob = new Blob([content], { type: 'text/tab-separated-values' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import_template.tsv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Import Utility</h1>
        <p className="text-muted-foreground">
          Import TSV files containing ACT questions and passages into the staging area.
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
                Select TSV Files
              </label>
              <input
                type="file"
                multiple
                accept=".tsv,.txt"
                onChange={handleFileSelect}
                className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Select one or more TSV files containing question data, or click "Load Form A" to use the uploaded files
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