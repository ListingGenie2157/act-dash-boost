import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AdminCronButton } from '@/components/AdminCronButton';

interface ImportReport {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: string[];
  insertedQuestions?: number;
  dryRun: boolean;
}

export default function AdminImport() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setReport(null);
    } else {
      toast({
        title: "Invalid file",
        description: "Please select a CSV file",
        variant: "destructive"
      });
    }
  };

  const uploadFile = async (): Promise<string | null> => {
    if (!file) return null;

    setUploading(true);
    const fileName = `${Date.now()}_${file.name}`;

    try {
      const { error } = await supabase.storage
        .from('question-imports')
        .upload(fileName, file);

      if (error) {
        toast({
          title: "Upload failed",
          description: error.message,
          variant: "destructive"
        });
        return null;
      }

      return fileName;
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload file",
        variant: "destructive"
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const processImport = async (dryRun: boolean) => {
    const filePath = await uploadFile();
    if (!filePath) return;

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('import-questions', {
        body: {
          storagePath: filePath,
          dryRun
        }
      });

      if (error) {
        toast({
          title: "Import failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setReport(data);
      
      if (!dryRun && data.insertedQuestions) {
        toast({
          title: "Import successful",
          description: `Imported ${data.insertedQuestions} questions`,
        });
      }
    } catch (error) {
      toast({
        title: "Import failed",
        description: "Failed to process import",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `skill_name,stem,choice_a,choice_b,choice_c,choice_d,answer,explanation,difficulty,time_limit_secs
"Algebra Basics","What is 2x + 3 = 7?","x = 1","x = 2","x = 3","x = 4","B","Subtract 3 from both sides, then divide by 2",1,45
"Reading Comprehension","What is the main idea?","Option A","Option B","Option C","Option D","A","The main idea is clearly stated in the first paragraph",2,60`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questions_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Import questions and manage system operations
          </p>
        </div>

        {/* Admin Controls Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AdminCronButton />
          
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                System administration tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Additional admin tools can be added here
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              CSV Template
            </CardTitle>
            <CardDescription>
              Download the template to see the required format
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={downloadTemplate} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Download Template
            </Button>
            <div className="mt-4 text-sm text-muted-foreground">
              <p className="font-medium mb-2">Required columns:</p>
              <div className="grid grid-cols-2 gap-2">
                <span>• skill_name</span>
                <span>• choice_c</span>
                <span>• stem</span>
                <span>• choice_d</span>
                <span>• choice_a</span>
                <span>• answer (A, B, C, or D)</span>
                <span>• choice_b</span>
                <span>• explanation (optional)</span>
              </div>
              <div className="mt-2">
                <span>• difficulty (1-5)</span>
                <span className="ml-4">• time_limit_secs (1-300)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload CSV File
            </CardTitle>
            <CardDescription>
              Select a CSV file containing questions to import
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click to select a CSV file
                </p>
              </label>
            </div>

            {file && (
              <Alert>
                <FileText className="w-4 h-4" />
                <AlertDescription>
                  Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </AlertDescription>
              </Alert>
            )}

            {file && (
              <div className="flex gap-2">
                <Button
                  onClick={() => processImport(true)}
                  disabled={uploading || processing}
                  variant="outline"
                >
                  {processing ? 'Processing...' : 'Dry Run (Validate Only)'}
                </Button>
                <Button
                  onClick={() => processImport(false)}
                  disabled={uploading || processing}
                >
                  {processing ? 'Processing...' : 'Import Questions'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {report && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {report.invalidRows === 0 ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                )}
                Import Report
              </CardTitle>
              <CardDescription>
                {report.dryRun ? 'Validation results' : 'Import results'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{report.totalRows}</div>
                  <div className="text-sm text-muted-foreground">Total Rows</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{report.validRows}</div>
                  <div className="text-sm text-muted-foreground">Valid</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{report.invalidRows}</div>
                  <div className="text-sm text-muted-foreground">Invalid</div>
                </div>
                {report.insertedQuestions !== undefined && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{report.insertedQuestions}</div>
                    <div className="text-sm text-muted-foreground">Inserted</div>
                  </div>
                )}
              </div>

              {report.dryRun && (
                <Badge variant="secondary">Validation Only - No Data Imported</Badge>
              )}

              {report.errors.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Errors:</h4>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {report.errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}