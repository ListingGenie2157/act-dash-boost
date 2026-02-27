import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { reportError } from '@/lib/errorReporter';
import { ArrowLeft, Wand2, Check, X, Loader2, Save, FileText, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface GeneratedQuestion {
  question: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  answer: "A" | "B" | "C" | "D";
  explanation: string;
  skill_code: string;
  difficulty: "Easy" | "Medium" | "Hard";
  passage_text?: string;
  passage_title?: string;
  passage_id?: string;
  approved?: boolean;
}

interface PassageGroup {
  passage_id: string;
  passage_title: string;
  passage_text: string;
  questions: GeneratedQuestion[];
}

// ACT section configurations
const SECTION_CONFIG: Record<string, { 
  totalQuestions: number; 
  passageCount: number; 
  questionsPerPassage: number;
  batchSize: number;
  hasPassages: boolean;
}> = {
  english: { totalQuestions: 75, passageCount: 5, questionsPerPassage: 15, batchSize: 15, hasPassages: true },
  math: { totalQuestions: 60, passageCount: 0, questionsPerPassage: 0, batchSize: 10, hasPassages: false },
  reading: { totalQuestions: 40, passageCount: 4, questionsPerPassage: 10, batchSize: 10, hasPassages: true },
  science: { totalQuestions: 40, passageCount: 7, questionsPerPassage: 6, batchSize: 6, hasPassages: true },
};

// Reading passage types
const READING_PASSAGE_TYPES = [
  "Literary Fiction",
  "Social Science", 
  "Humanities",
  "Natural Science"
];

// Science passage types
const SCIENCE_PASSAGE_TYPES = [
  "Data Representation",
  "Data Representation",
  "Research Summary",
  "Research Summary",
  "Research Summary",
  "Conflicting Viewpoints",
  "Conflicting Viewpoints"
];

// English passage types
const ENGLISH_PASSAGE_TYPES = [
  "Narrative Essay",
  "Argumentative Essay",
  "Informative Essay",
  "Expository Essay",
  "Personal Essay"
];

// Form options
const FORM_OPTIONS = [
  { id: "A", label: "Form A" },
  { id: "B", label: "Form B" },
  { id: "C", label: "Form C" },
  { id: "D", label: "Form D" },
  { id: "E", label: "Form E" },
];

const SECTION_OPTIONS = [
  { id: "english", label: "English", code: "EN" },
  { id: "math", label: "Math", code: "MA" },
  { id: "reading", label: "Reading", code: "RD" },
  { id: "science", label: "Science", code: "SC" },
];

export default function AdminSimulationGenerator() {
  const navigate = useNavigate();
  const [selectedForm, setSelectedForm] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInserting, setIsInserting] = useState(false);
  const [generatedPassages, setGeneratedPassages] = useState<PassageGroup[]>([]);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);

  const config = selectedSection ? SECTION_CONFIG[selectedSection] : null;
  const formId = selectedForm && selectedSection 
    ? `F${selectedForm}_${SECTION_OPTIONS.find(s => s.id === selectedSection)?.code}` 
    : "";

  const getPassageTypes = (section: string): string[] => {
    switch (section) {
      case "reading": return READING_PASSAGE_TYPES;
      case "science": return SCIENCE_PASSAGE_TYPES;
      case "english": return ENGLISH_PASSAGE_TYPES;
      default: return [];
    }
  };

  const handleGenerate = async () => {
    if (!selectedForm || !selectedSection) {
      toast.error("Please select a form and section");
      return;
    }

    const config = SECTION_CONFIG[selectedSection];
    if (!config) return;

    setIsGenerating(true);
    setGeneratedPassages([]);
    setGeneratedQuestions([]);
    setGenerationProgress(0);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      if (config.hasPassages) {
        // Generate passage-based questions
        const passageTypes = getPassageTypes(selectedSection);
        const passages: PassageGroup[] = [];
        const batches = config.passageCount;
        setTotalBatches(batches);

        for (let i = 0; i < config.passageCount; i++) {
          setCurrentBatch(i + 1);
          const passageType = passageTypes[i] || passageTypes[0];
          
          const response = await fetch(
            `https://hhbkmxrzxcswwokmbtbz.supabase.co/functions/v1/generate-questions`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                action: "generate-simulation",
                section: selectedSection,
                form_id: formId,
                passage_index: i,
                passage_type: passageType,
                questions_per_passage: config.questionsPerPassage,
              }),
            }
          );

          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.error || `Failed to generate passage ${i + 1}`);
          }

          const passageGroup: PassageGroup = {
            passage_id: `${formId}_P${i + 1}`,
            passage_title: data.passage_title || `Passage ${i + 1}`,
            passage_text: data.passage_text || "",
            questions: data.questions.map((q: GeneratedQuestion) => ({
              ...q,
              passage_id: `${formId}_P${i + 1}`,
              approved: true,
            })),
          };

          passages.push(passageGroup);
          setGeneratedPassages([...passages]);
          setGenerationProgress(Math.round(((i + 1) / config.passageCount) * 100));
          
          // Small delay between batches to avoid rate limiting
          if (i < config.passageCount - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        toast.success(`Generated ${passages.length} passages with questions!`);
      } else {
        // Generate non-passage questions (Math)
        const batches = Math.ceil(config.totalQuestions / config.batchSize);
        setTotalBatches(batches);
        const allQuestions: GeneratedQuestion[] = [];

        for (let i = 0; i < batches; i++) {
          setCurrentBatch(i + 1);
          const remaining = config.totalQuestions - allQuestions.length;
          const batchCount = Math.min(config.batchSize, remaining);

          const response = await fetch(
            `https://hhbkmxrzxcswwokmbtbz.supabase.co/functions/v1/generate-questions`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                action: "generate-simulation",
                section: selectedSection,
                form_id: formId,
                batch_index: i,
                count: batchCount,
              }),
            }
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || `Failed to generate batch ${i + 1}`);
          }

          const questionsWithState = data.questions.map((q: GeneratedQuestion) => ({
            ...q,
            approved: true,
          }));

          allQuestions.push(...questionsWithState);
          setGeneratedQuestions([...allQuestions]);
          setGenerationProgress(Math.round(((i + 1) / batches) * 100));

          if (i < batches - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        toast.success(`Generated ${allQuestions.length} questions!`);
      }
    } catch (error) {
      reportError(error instanceof Error ? error : new Error(String(error)), { page: 'AdminSimulationGenerator' });
      toast.error(error instanceof Error ? error.message : "Failed to generate questions");
    } finally {
      setIsGenerating(false);
      setCurrentBatch(0);
    }
  };

  const togglePassageApproval = (passageIndex: number, questionIndex: number) => {
    setGeneratedPassages(prev => 
      prev.map((p, pi) => 
        pi === passageIndex 
          ? {
              ...p,
              questions: p.questions.map((q, qi) => 
                qi === questionIndex ? { ...q, approved: !q.approved } : q
              )
            }
          : p
      )
    );
  };

  const toggleQuestionApproval = (index: number) => {
    setGeneratedQuestions(prev =>
      prev.map((q, i) => (i === index ? { ...q, approved: !q.approved } : q))
    );
  };

  const handleInsert = async () => {
    const hasPassages = config?.hasPassages;
    
    let approvedQuestions: GeneratedQuestion[] = [];
    if (hasPassages) {
      approvedQuestions = generatedPassages.flatMap(p => 
        p.questions.filter(q => q.approved).map(q => ({
          ...q,
          passage_text: p.passage_text,
          passage_title: p.passage_title,
          passage_id: p.passage_id,
        }))
      );
    } else {
      approvedQuestions = generatedQuestions.filter(q => q.approved);
    }

    if (approvedQuestions.length === 0) {
      toast.error("No questions approved for insertion");
      return;
    }

    setIsInserting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch(
        `https://hhbkmxrzxcswwokmbtbz.supabase.co/functions/v1/generate-questions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: "insert-simulation",
            section: selectedSection,
            form_id: formId,
            questions: approvedQuestions,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to insert questions");
      }

      toast.success(`Inserted ${data.inserted} questions into ${formId}`);
      setGeneratedPassages([]);
      setGeneratedQuestions([]);
    } catch (error) {
      reportError(error instanceof Error ? error : new Error(String(error)), { page: 'AdminSimulationGenerator', source: 'insert' });
      toast.error(error instanceof Error ? error.message : "Failed to insert questions");
    } finally {
      setIsInserting(false);
    }
  };

  const getTotalApprovedCount = (): number => {
    if (config?.hasPassages) {
      return generatedPassages.reduce((sum, p) => 
        sum + p.questions.filter(q => q.approved).length, 0
      );
    }
    return generatedQuestions.filter(q => q.approved).length;
  };

  const getTotalQuestionCount = (): number => {
    if (config?.hasPassages) {
      return generatedPassages.reduce((sum, p) => sum + p.questions.length, 0);
    }
    return generatedQuestions.length;
  };

  const approvedCount = getTotalApprovedCount();
  const totalCount = getTotalQuestionCount();

  return (
    <div className="container py-6 max-w-7xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/dashboard")}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
        {/* Left Panel - Controls */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Simulation Generator
              </CardTitle>
              <CardDescription>
                Generate full ACT simulation test sections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Form</label>
                <Select value={selectedForm} onValueChange={setSelectedForm}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select form" />
                  </SelectTrigger>
                  <SelectContent>
                    {FORM_OPTIONS.map(form => (
                      <SelectItem key={form.id} value={form.id}>
                        {form.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Section</label>
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTION_OPTIONS.map(section => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {config && (
                <div className="p-3 rounded-lg bg-muted/50 space-y-2 text-sm">
                  <p className="font-medium">Section Details:</p>
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                    <span>Total Questions:</span>
                    <span className="font-mono">{config.totalQuestions}</span>
                    {config.hasPassages && (
                      <>
                        <span>Passages:</span>
                        <span className="font-mono">{config.passageCount}</span>
                        <span>Questions/Passage:</span>
                        <span className="font-mono">~{config.questionsPerPassage}</span>
                      </>
                    )}
                    <span>Form ID:</span>
                    <span className="font-mono">{formId || "—"}</span>
                  </div>
                </div>
              )}

              {isGenerating && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Generating batch {currentBatch} of {totalBatches}</span>
                    <span>{generationProgress}%</span>
                  </div>
                  <Progress value={generationProgress} />
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleGenerate}
                disabled={isGenerating || !selectedForm || !selectedSection}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Full Section
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Generation may take 1-2 minutes per section due to rate limits.
            </AlertDescription>
          </Alert>
        </div>

        {/* Right Panel - Preview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Generated Content</CardTitle>
                <CardDescription>
                  {totalCount > 0
                    ? `${approvedCount} of ${totalCount} questions approved`
                    : "Questions will appear here after generation"}
                </CardDescription>
              </div>
              {totalCount > 0 && (
                <Button
                  onClick={handleInsert}
                  disabled={isInserting || approvedCount === 0}
                >
                  {isInserting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Inserting...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Insert {approvedCount} Questions
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {totalCount === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Select a form and section, then generate questions</p>
              </div>
            ) : config?.hasPassages ? (
              // Passage-based layout
              <ScrollArea className="h-[700px] pr-4">
                <div className="space-y-8">
                  {generatedPassages.map((passage, pIdx) => (
                    <div key={passage.passage_id} className="border rounded-lg overflow-hidden">
                      <div className="bg-muted/50 p-4 border-b">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">Passage {pIdx + 1}</Badge>
                          <span className="font-semibold">{passage.passage_title}</span>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">
                          {passage.passage_text}
                        </p>
                      </div>
                      
                      <div className="p-4 space-y-4">
                        {passage.questions.map((q, qIdx) => (
                          <QuestionCard
                            key={qIdx}
                            question={q}
                            index={qIdx}
                            onToggleApproval={() => togglePassageApproval(pIdx, qIdx)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              // Non-passage layout (Math)
              <ScrollArea className="h-[700px] pr-4">
                <div className="space-y-4">
                  {generatedQuestions.map((q, idx) => (
                    <QuestionCard
                      key={idx}
                      question={q}
                      index={idx}
                      onToggleApproval={() => toggleQuestionApproval(idx)}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Question card component
function QuestionCard({ 
  question: q, 
  index, 
  onToggleApproval 
}: { 
  question: GeneratedQuestion; 
  index: number; 
  onToggleApproval: () => void;
}) {
  return (
    <div
      className={`p-4 rounded-lg border ${
        q.approved ? "border-primary/50 bg-primary/5" : "border-muted bg-muted/30"
      }`}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Q{index + 1}</Badge>
          <Badge variant="outline">{q.skill_code}</Badge>
          <Badge
            variant={
              q.difficulty === "Easy"
                ? "default"
                : q.difficulty === "Medium"
                ? "secondary"
                : "destructive"
            }
          >
            {q.difficulty}
          </Badge>
        </div>
        <Button
          variant={q.approved ? "default" : "outline"}
          size="sm"
          onClick={onToggleApproval}
        >
          {q.approved ? (
            <>
              <Check className="mr-1 h-3 w-3" />
              Approved
            </>
          ) : (
            <>
              <X className="mr-1 h-3 w-3" />
              Rejected
            </>
          )}
        </Button>
      </div>

      <p className="font-medium mb-2 break-words">{q.question}</p>

      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
        {["A", "B", "C", "D"].map((letter) => {
          const choiceKey = `choice_${letter.toLowerCase()}` as keyof GeneratedQuestion;
          const isCorrect = q.answer === letter;
          return (
            <div
              key={letter}
              className={`p-2 rounded break-words ${
                isCorrect
                  ? "bg-green-100 dark:bg-green-900/30 border border-green-500"
                  : "bg-muted"
              }`}
            >
              <span className="font-semibold mr-1">{letter}.</span>
              {q[choiceKey] as string}
            </div>
          );
        })}
      </div>

      <Separator className="my-2" />

      <details className="text-sm text-muted-foreground">
        <summary className="cursor-pointer font-medium text-foreground">
          Explanation
        </summary>
        <p className="mt-2 break-words">{q.explanation}</p>
      </details>
    </div>
  );
}
