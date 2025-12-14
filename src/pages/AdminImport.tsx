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
  id?: string;
  form_id: string;
  section: string;
  ord: number;
  passage_id?: string | null;
  passage_title?: string | null;
  passage_text?: string | null;
  passage_format?: string | null;
  passage_type?: string | null;
  has_charts?: boolean | null;
  chart_images?: string | null;
  marked_text?: string | null;
  line_numbers_enabled?: boolean | null;
  skill_code: string;
  difficulty: string;
  question: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  choice_e?: string | null;
  answer: string;
  explanation?: string | null;
  calculator_allowed?: boolean | null;
  underlined_text?: string | null;
  reference_number?: number | null;
  position_in_passage?: number | null;
  image_url?: string | null;
  image_caption?: string | null;
  image_position?: string | null;
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

  const parseCSV = (content: string): ImportRecord[] => {
    const lines = content.trim().split('\n');
    
    // Parse CSV with quoted field support
    const parseCSVLine = (line: string): string[] => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    };
    
    const headers = parseCSVLine(lines[0]);
    
    return lines.slice(1).map((line, index) => {
      const values = parseCSVLine(line);
      const record: Record<string, string> = {};
      
      headers.forEach((header, i) => {
        const cleanHeader = header.trim().toLowerCase();
        record[cleanHeader] = values[i]?.trim() || '';
      });

      // Map to our expected format
      const passageText = record.passage_text || '';
      const toBool = (val: string) => val?.toUpperCase() === 'TRUE';
      
      return {
        id: record.id || undefined,
        form_id: record.form_id,
        section: record.section,
        ord: parseInt(record.ord) || index + 1,
        passage_id: record.passage_id || null,
        passage_title: record.passage_title || record.title || null,
        passage_text: passageText || null,
        passage_format: record.passage_format || null,
        passage_type: record.passage_type || null,
        has_charts: record.has_charts ? toBool(record.has_charts) : null,
        chart_images: record.chart_images || null,
        marked_text: record.marked_text || null,
        line_numbers_enabled: record.line_numbers_enabled ? toBool(record.line_numbers_enabled) : null,
        skill_code: record.skill_code,
        difficulty: record.difficulty,
        question: record.question,
        choice_a: record.choice_a,
        choice_b: record.choice_b,
        choice_c: record.choice_c,
        choice_d: record.choice_d,
        choice_e: record.choice_e || null,
        answer: record.answer,
        explanation: record.explanation || null,
        calculator_allowed: record.calculator_allowed ? toBool(record.calculator_allowed) : null,
        underlined_text: record.underlined_text || null,
        reference_number: record.reference_number ? parseInt(record.reference_number) : null,
        position_in_passage: record.position_in_passage ? parseInt(record.position_in_passage) : null,
        image_url: record.image_url || null,
        image_caption: record.image_caption || null,
        image_position: record.image_position || 'above_question',
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
    if (record.section === 'MATH' && record.choice_e) {
      if (!['A', 'B', 'C', 'D', 'E'].includes(record.answer)) {
        errors.push({ row: rowIndex, field: 'answer', message: 'Answer must be A, B, C, D, or E for 5-choice Math questions' });
      }
    } else {
      if (!['A', 'B', 'C', 'D'].includes(record.answer)) {
        errors.push({ row: rowIndex, field: 'answer', message: 'Answer must be A, B, C, or D' });
      }
    }

    // Validate section
    if (!['EN', 'MATH', 'RD', 'SCI'].includes(record.section)) {
      errors.push({ row: rowIndex, field: 'section', message: 'Section must be EN, MATH, RD, or SCI' });
    }

    // Validate difficulty
    if (!['Easy', 'Medium', 'Hard'].includes(record.difficulty)) {
      errors.push({ row: rowIndex, field: 'difficulty', message: 'Difficulty must be Easy, Medium, or Hard' });
    }

    // Validate image_position if provided
    if (record.image_position && !['above_question', 'inline', 'between'].includes(record.image_position)) {
      errors.push({ row: rowIndex, field: 'image_position', message: 'Image position must be above_question, inline, or between' });
    }

    // Validate image_url format if provided
    if (record.image_url) {
      try {
        new URL(record.image_url);
      } catch {
        // Check if it's a storage path
        if (!record.image_url.startsWith('/') && !record.image_url.includes('supabase')) {
          errors.push({ row: rowIndex, field: 'image_url', message: 'Image URL must be a valid URL or storage path' });
        }
      }
    }

    return errors;
  };

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
      const allRecords: ImportRecord[] = [];
      const allErrors: ValidationError[] = [];
      const warnings: string[] = [];
      let processedFiles = 0;

      // Process each file
      for (const file of Array.from(selectedFiles)) {
        if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
          warnings.push(`Skipped non-CSV file: ${file.name}`);
          continue;
        }

        const content = await file.text();
        const records = parseCSV(content);
        
        // Validate each record
        records.forEach((record: ImportRecord, index: number) => {
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

      console.warn(`Parsed ${allRecords.length} records with ${allErrors.length} errors`);

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
        title: string;
        passage_text: string;
      }>();

      allRecords.forEach(record => {
        if (record.passage_id && record.passage_text) {
          passages.set(record.passage_id, {
            id: record.passage_id,
            form_id: record.form_id,
            section: record.section,
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
      // Core required fields
      'ord', 'form_id', 'section', 'skill_code', 'difficulty',
      'question', 'choice_a', 'choice_b', 'choice_c', 'choice_d', 'choice_e', 'answer',
      'explanation',
      // English-specific fields
      'underlined_text', 'reference_number', 'position_in_passage',
      // Math-specific fields
      'calculator_allowed',
      // Passage fields (include on first question of passage only)
      'passage_id', 'passage_title', 'passage_text', 'passage_format', 'passage_type',
      'has_charts', 'chart_images', 'marked_text', 'line_numbers_enabled',
      // Image fields
      'image_url', 'image_caption', 'image_position'
    ].join(',');
    
    // Comment lines explaining the format
    const comments = [
      '# ACT Question Import CSV Template',
      '# Required: ord, form_id, section, skill_code, difficulty, question, choice_a-d, answer',
      '# Optional: choice_e (Math 5-option), explanation, image fields',
      '# English: underlined_text, reference_number, position_in_passage',
      '# Math: calculator_allowed (TRUE/FALSE)',
      '# Passages: passage_id, passage_title, passage_text (include on FIRST question only)',
      '# Boolean fields: Use TRUE or FALSE',
      '# JSON arrays: Use ["item1","item2"] format for chart_images',
      '# Sections: EN (English), MATH (Math), RD (Reading), SCI (Science)',
      '# Difficulty: Easy, Medium, or Hard',
      '# Answer: A, B, C, D, or E (E for Math only)',
      '',
    ].join('\n');

    // Example rows for each section
    const examples = [
      // English example with underlined text
      [
        '1', 'FA_EN', 'EN', 'ENG.001', 'Easy',
        '"Choose the best alternative for the underlined portion."', 'goes to', 'is going to', 'went to', 'has gone to', '',
        'B', '"The present progressive ""is going to"" indicates ongoing action."',
        'goes to', '5', '12',
        '',
        'P001', '', '', '', '',
        '', '', '', '',
        '', '', 'above_question'
      ].join(','),
      
      // Math example with 5 choices and calculator
      [
        '1', 'FA_MA', 'MATH', 'MATH.001', 'Medium',
        '"What is the value of x if 2x + 5 = 15?"', '3', '5', '7', '10', '12',
        'B', '"Subtract 5 from both sides: 2x = 10. Divide by 2: x = 5"',
        '', '', '',
        'TRUE',
        '', '', '', '', '',
        '', '', '', '',
        '', '', ''
      ].join(','),
      
      // Reading example with passage (first question of passage)
      [
        '1', 'FA_RE', 'RD', 'READ.001', 'Hard',
        '"The main purpose of the passage is to:"', 'describe a historical event', 'analyze a literary technique', 'argue for a policy change', 'explain a scientific concept', '',
        'D', '',
        '', '', '',
        '',
        'P001', 'The Nature of Light', '"Light behaves as both a wave and a particle..."', 'Single', 'Natural Science',
        'FALSE', '', '', 'TRUE',
        '', '', 'above_question'
      ].join(','),
      
      // Reading example (subsequent question - no passage data)
      [
        '2', 'FA_RE', 'RD', 'READ.002', 'Medium',
        '"According to the passage, which is true?"', 'Light is only a wave', 'Light is only a particle', 'Light has dual nature', 'Light has no mass', '',
        'C', '',
        '', '', '',
        '',
        'P001', '', '', '', '',
        '', '', '', '',
        '', '', ''
      ].join(','),
      
      // Science example with charts
      [
        '1', 'FA_SC', 'SCI', 'SCI.001', 'Medium',
        '"Based on Figure 1, what is the relationship between temperature and pressure?"', 'directly proportional', 'inversely proportional', 'no relationship', 'exponential', '',
        'A', '',
        '', '', '',
        '',
        'P001', 'Experiment 1: Gas Properties', '"Students conducted an experiment..."', 'Data Representation', 'Natural Science',
        'TRUE', '["https://example.com/chart1.png"]', '', 'FALSE',
        '', '', 'above_question'
      ].join(',')
    ];

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