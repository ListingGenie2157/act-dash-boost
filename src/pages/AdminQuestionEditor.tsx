import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BackButton } from '@/components/BackButton';
import { Download, Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

const questionSchema = z.object({
  ord: z.coerce.number().min(1),
  section: z.enum(['ENG', 'MATH', 'READ', 'SCI']),
  form_id: z.string().min(1),
  question: z.string().min(1),
  choice_a: z.string().min(1),
  choice_b: z.string().min(1),
  choice_c: z.string().min(1),
  choice_d: z.string().min(1),
  choice_e: z.string().optional(),
  answer: z.enum(['A', 'B', 'C', 'D', 'E']),
  skill_code: z.string().min(1),
  difficulty: z.string().min(1),
  explanation: z.string().optional(),
  
  // Images
  image_url: z.string().optional(),
  image_caption: z.string().optional(),
  image_position: z.enum(['above_question', 'below_question', 'inline']).optional(),
  
  // Math-specific
  calculator_allowed: z.boolean().optional(),
  
  // English-specific
  underlined_text: z.string().optional(),
  reference_number: z.coerce.number().optional(),
  position_in_passage: z.coerce.number().optional(),
  
  // Passage
  passage_id: z.string().optional(),
  passage_title: z.string().optional(),
  passage_text: z.string().optional(),
  passage_format: z.enum(['Single', 'Paired', 'Comparative']).optional(),
  passage_type: z.string().optional(),
  has_charts: z.boolean().optional(),
  chart_images: z.string().optional(),
  line_numbers_enabled: z.boolean().optional(),
});

type QuestionFormData = z.infer<typeof questionSchema>;

const defaultValues: Partial<QuestionFormData> = {
  ord: 1,
  section: 'MATH',
  form_id: 'FA_MA',
  answer: 'A',
  difficulty: '2',
  image_position: 'above_question',
  calculator_allowed: true,
  line_numbers_enabled: true,
  has_charts: false,
  passage_format: 'Single',
};

export default function AdminQuestionEditor() {
  const [questions, setQuestions] = useState<QuestionFormData[]>([]);
  const [currentSection, setCurrentSection] = useState<'ENG' | 'MATH' | 'READ' | 'SCI'>('MATH');

  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues,
  });

  const section = form.watch('section');

  const onSubmit = (data: QuestionFormData) => {
    setQuestions([...questions, data]);
    toast.success('Question added to batch');
    form.reset({ ...defaultValues, ord: data.ord + 1, section: data.section, form_id: data.form_id });
  };

  const exportToTSV = () => {
    if (questions.length === 0) {
      toast.error('No questions to export');
      return;
    }

    // Get all unique keys across all questions
    const allKeys = Array.from(
      new Set(questions.flatMap(q => Object.keys(q)))
    );

    // Create header row
    const header = allKeys.join('\t');

    // Create data rows
    const rows = questions.map(question => {
      return allKeys.map(key => {
        const value = question[key as keyof QuestionFormData];
        if (value === undefined || value === null) return '';
        if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
        return String(value);
      }).join('\t');
    });

    const tsv = [header, ...rows].join('\n');

    // Download file
    const blob = new Blob([tsv], { type: 'text/tab-separated-values' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `questions_${currentSection}_${Date.now()}.tsv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${questions.length} questions`);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
    toast.success('Question removed');
  };

  const clearAll = () => {
    if (confirm('Clear all questions? This cannot be undone.')) {
      setQuestions([]);
      toast.success('All questions cleared');
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <BackButton />
          <h1 className="text-3xl font-bold mt-2">Question Editor</h1>
          <p className="text-muted-foreground">Create ACT questions with a visual form</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={clearAll} disabled={questions.length === 0}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
          <Button onClick={exportToTSV} disabled={questions.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export TSV ({questions.length})
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Question Details</CardTitle>
            <CardDescription>Fill in the question information below</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="basic">Basic</TabsTrigger>
                    <TabsTrigger value="choices">Choices</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                    <TabsTrigger value="passage">Passage</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="ord"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Order</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="section"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Section</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="ENG">English</SelectItem>
                                <SelectItem value="MATH">Math</SelectItem>
                                <SelectItem value="READ">Reading</SelectItem>
                                <SelectItem value="SCI">Science</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="form_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Form ID</FormLabel>
                            <FormControl>
                              <Input placeholder="FA_MA" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="skill_code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Skill Code</FormLabel>
                            <FormControl>
                              <Input placeholder="MATH.001" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="question"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question Stem</FormLabel>
                          <FormControl>
                            <Textarea rows={3} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="answer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Correct Answer</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="A">A</SelectItem>
                                <SelectItem value="B">B</SelectItem>
                                <SelectItem value="C">C</SelectItem>
                                <SelectItem value="D">D</SelectItem>
                                {section === 'MATH' && <SelectItem value="E">E</SelectItem>}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="difficulty"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Difficulty</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1">1 - Easy</SelectItem>
                                <SelectItem value="2">2 - Medium-Easy</SelectItem>
                                <SelectItem value="3">3 - Medium</SelectItem>
                                <SelectItem value="4">4 - Medium-Hard</SelectItem>
                                <SelectItem value="5">5 - Hard</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {section === 'MATH' && (
                      <FormField
                        control={form.control}
                        name="calculator_allowed"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel>Calculator Allowed</FormLabel>
                              <FormDescription>
                                Can students use a calculator for this question?
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}

                    {section === 'ENG' && (
                      <>
                        <FormField
                          control={form.control}
                          name="underlined_text"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Underlined Text</FormLabel>
                              <FormControl>
                                <Input placeholder="The portion being tested" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="reference_number"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Reference Number</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="position_in_passage"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Position in Passage</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value="choices" className="space-y-4">
                    <FormField
                      control={form.control}
                      name="choice_a"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Choice A</FormLabel>
                          <FormControl>
                            <Textarea rows={2} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="choice_b"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Choice B</FormLabel>
                          <FormControl>
                            <Textarea rows={2} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="choice_c"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Choice C</FormLabel>
                          <FormControl>
                            <Textarea rows={2} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="choice_d"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Choice D</FormLabel>
                          <FormControl>
                            <Textarea rows={2} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {section === 'MATH' && (
                      <FormField
                        control={form.control}
                        name="choice_e"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Choice E (Optional)</FormLabel>
                            <FormControl>
                              <Textarea rows={2} {...field} />
                            </FormControl>
                            <FormDescription>Only for Math 5-option questions</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="explanation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Explanation</FormLabel>
                          <FormControl>
                            <Textarea rows={3} placeholder="Explain why the answer is correct..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="advanced" className="space-y-4">
                    <FormField
                      control={form.control}
                      name="image_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="image_caption"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image Caption</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="image_position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image Position</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="above_question">Above Question</SelectItem>
                              <SelectItem value="below_question">Below Question</SelectItem>
                              <SelectItem value="inline">Inline</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="passage" className="space-y-4">
                    <FormField
                      control={form.control}
                      name="passage_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Passage ID</FormLabel>
                          <FormControl>
                            <Input placeholder="P001" {...field} />
                          </FormControl>
                          <FormDescription>Links question to a passage</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="passage_title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Passage Title</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>Only needed for first question of passage</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="passage_text"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Passage Text</FormLabel>
                          <FormControl>
                            <Textarea rows={6} {...field} />
                          </FormControl>
                          <FormDescription>Only needed for first question of passage</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {(section === 'READ' || section === 'SCI') && (
                      <>
                        <FormField
                          control={form.control}
                          name="passage_format"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Passage Format</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Single">Single</SelectItem>
                                  <SelectItem value="Paired">Paired</SelectItem>
                                  <SelectItem value="Comparative">Comparative</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="passage_type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Passage Type</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Natural Science, Literary Narrative" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="line_numbers_enabled"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel>Line Numbers</FormLabel>
                                <FormDescription>Show line numbers in passage</FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {section === 'SCI' && (
                          <>
                            <FormField
                              control={form.control}
                              name="has_charts"
                              render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                  <div className="space-y-0.5">
                                    <FormLabel>Has Charts</FormLabel>
                                    <FormDescription>Passage includes charts/graphs</FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="chart_images"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Chart Images (JSON Array)</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      rows={2}
                                      placeholder='["url1.png", "url2.png"]'
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormDescription>JSON array of image URLs</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </>
                        )}
                      </>
                    )}
                  </TabsContent>
                </Tabs>

                <Button type="submit" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question to Batch
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Question Batch</CardTitle>
            <CardDescription>{questions.length} questions ready to export</CardDescription>
          </CardHeader>
          <CardContent>
            {questions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No questions added yet. Fill out the form and click "Add Question to Batch".
              </p>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {questions.map((q, index) => (
                  <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        Q{q.ord}: {q.question.substring(0, 50)}...
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {q.section} • {q.skill_code}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(index)}
                      className="ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
