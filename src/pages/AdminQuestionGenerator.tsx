import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, Wand2, Check, X, Loader2, Save } from "lucide-react";

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
  // UI state
  approved?: boolean;
}

const SECTION_SKILLS: Record<string, { code: string; name: string }[]> = {
  math: [
    { code: "M1.A", name: "Pre-Algebra: Basic operations" },
    { code: "M1.B", name: "Pre-Algebra: Fractions & percents" },
    { code: "M1.C", name: "Pre-Algebra: Factors & primes" },
    { code: "M2.A", name: "Algebra: Linear equations" },
    { code: "M2.B", name: "Algebra: Inequalities" },
    { code: "M2.C", name: "Algebra: Systems of equations" },
    { code: "M3.A", name: "Geometry: Lines & angles" },
    { code: "M3.B", name: "Geometry: Triangles & polygons" },
    { code: "M3.C", name: "Geometry: Circles" },
    { code: "M3.D", name: "Geometry: Area & perimeter" },
    { code: "M4.A", name: "Functions: Notation & evaluation" },
    { code: "M4.B", name: "Functions: Graphs" },
    { code: "M5.A", name: "Statistics: Mean, median, mode" },
    { code: "M5.B", name: "Statistics: Probability" },
  ],
  science: [
    { code: "S1.A", name: "Data Rep: Reading graphs" },
    { code: "S1.B", name: "Data Rep: Identifying trends" },
    { code: "S1.C", name: "Data Rep: Interpolation" },
    { code: "S2.A", name: "Research: Experimental design" },
    { code: "S2.B", name: "Research: Identifying variables" },
    { code: "S2.C", name: "Research: Drawing conclusions" },
    { code: "S3.A", name: "Viewpoints: Comparing hypotheses" },
    { code: "S3.B", name: "Viewpoints: Supporting evidence" },
    { code: "S4.A", name: "Reasoning: Cause & effect" },
    { code: "S4.B", name: "Reasoning: Making predictions" },
    { code: "S5.A", name: "Applied: Biology" },
    { code: "S5.B", name: "Applied: Chemistry" },
    { code: "S5.C", name: "Applied: Physics" },
    { code: "S5.D", name: "Applied: Earth science" },
  ],
  reading: [
    { code: "R1.A", name: "Key Ideas: Main idea" },
    { code: "R1.B", name: "Key Ideas: Supporting details" },
    { code: "R1.C", name: "Key Ideas: Summarizing" },
    { code: "R2.A", name: "Craft: Word meaning" },
    { code: "R2.B", name: "Craft: Author's purpose" },
    { code: "R2.C", name: "Craft: Text structure" },
    { code: "R3.A", name: "Integration: Inferences" },
    { code: "R3.B", name: "Integration: Compare/contrast" },
  ],
  english: [
    { code: "E1.A", name: "Conventions: Punctuation" },
    { code: "E1.B", name: "Conventions: Sentence structure" },
    { code: "E1.C", name: "Conventions: Subject-verb agreement" },
    { code: "E2.A", name: "Production: Topic development" },
    { code: "E2.B", name: "Production: Organization" },
    { code: "E3.A", name: "Knowledge: Word choice & style" },
  ],
};

export default function AdminQuestionGenerator() {
  const navigate = useNavigate();
  const [section, setSection] = useState<string>("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [count, setCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInserting, setIsInserting] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);

  const handleSkillToggle = (skillCode: string) => {
    setSelectedSkills(prev => 
      prev.includes(skillCode)
        ? prev.filter(s => s !== skillCode)
        : [...prev, skillCode]
    );
  };

  const handleSelectAllSkills = () => {
    const sectionSkills = SECTION_SKILLS[section] || [];
    if (selectedSkills.length === sectionSkills.length) {
      setSelectedSkills([]);
    } else {
      setSelectedSkills(sectionSkills.map(s => s.code));
    }
  };

  const handleGenerate = async () => {
    if (!section || selectedSkills.length === 0) {
      toast.error("Please select a section and at least one skill");
      return;
    }

    setIsGenerating(true);
    setGeneratedQuestions([]);

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
            section,
            skill_codes: selectedSkills,
            count,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate questions");
      }

      // Mark all as approved by default
      const questionsWithState = data.questions.map((q: GeneratedQuestion) => ({
        ...q,
        approved: true,
      }));

      setGeneratedQuestions(questionsWithState);
      toast.success(`Generated ${data.count} questions!`);
    } catch (error) {
      console.error("Generation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate questions");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleQuestionApproval = (index: number) => {
    setGeneratedQuestions(prev =>
      prev.map((q, i) => (i === index ? { ...q, approved: !q.approved } : q))
    );
  };

  const handleInsert = async () => {
    const approvedQuestions = generatedQuestions.filter(q => q.approved);
    if (approvedQuestions.length === 0) {
      toast.error("No questions approved for insertion");
      return;
    }

    setIsInserting(true);
    console.log(`Inserting ${approvedQuestions.length} questions via edge function...`);

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
            action: "insert",
            section,
            questions: approvedQuestions,
          }),
        }
      );

      const data = await response.json();
      console.log("Insert response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to insert questions");
      }

      toast.success(`Inserted ${data.inserted} questions into ${data.form_id}`);
      setGeneratedQuestions([]);
    } catch (error) {
      console.error("Insert error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to insert questions");
    } finally {
      setIsInserting(false);
    }
  };

  const approvedCount = generatedQuestions.filter(q => q.approved).length;

  return (
    <div className="container py-6 max-w-6xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/dashboard")}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        {/* Left Panel - Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              AI Question Generator
            </CardTitle>
            <CardDescription>
              Generate ACT-style questions for diagnostic tests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Section</Label>
              <Select value={section} onValueChange={(v) => {
                setSection(v);
                setSelectedSkills([]);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="math">Math</SelectItem>
                  <SelectItem value="science">Science</SelectItem>
                  <SelectItem value="reading">Reading</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {section && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Skills to Target</Label>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleSelectAllSkills}
                    >
                      {selectedSkills.length === SECTION_SKILLS[section]?.length ? "Deselect All" : "Select All"}
                    </Button>
                  </div>
                  <ScrollArea className="h-48 rounded-md border p-2">
                    <div className="space-y-2">
                      {SECTION_SKILLS[section]?.map((skill) => (
                        <div key={skill.code} className="flex items-center space-x-2">
                          <Checkbox
                            id={skill.code}
                            checked={selectedSkills.includes(skill.code)}
                            onCheckedChange={() => handleSkillToggle(skill.code)}
                          />
                          <label
                            htmlFor={skill.code}
                            className="text-sm cursor-pointer"
                          >
                            <span className="font-mono text-xs text-muted-foreground mr-1">
                              {skill.code}
                            </span>
                            {skill.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <div className="space-y-2">
                  <Label>Number of Questions</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={count}
                    onChange={(e) => setCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                  />
                  <p className="text-xs text-muted-foreground">Max 10 per batch</p>
                </div>

                <Button
                  className="w-full"
                  onClick={handleGenerate}
                  disabled={isGenerating || selectedSkills.length === 0}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate Questions
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Right Panel - Preview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Generated Questions</CardTitle>
                <CardDescription>
                  {generatedQuestions.length > 0
                    ? `${approvedCount} of ${generatedQuestions.length} approved`
                    : "Questions will appear here after generation"}
                </CardDescription>
              </div>
              {generatedQuestions.length > 0 && (
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
            {generatedQuestions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Wand2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Select a section and skills, then generate questions</p>
              </div>
            ) : (
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-6">
                  {generatedQuestions.map((q, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border ${
                        q.approved ? "border-primary/50 bg-primary/5" : "border-muted bg-muted/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-2">
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
                          onClick={() => toggleQuestionApproval(idx)}
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

                      {q.passage_text && (
                        <div className="mb-3 p-3 bg-muted/50 rounded text-sm">
                          {q.passage_title && (
                            <p className="font-semibold mb-1">{q.passage_title}</p>
                          )}
                          <p className="whitespace-pre-wrap">{q.passage_text}</p>
                        </div>
                      )}

                      <p className="font-medium mb-2">{q.question}</p>

                      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                        {["A", "B", "C", "D"].map((letter) => {
                          const choiceKey = `choice_${letter.toLowerCase()}` as keyof GeneratedQuestion;
                          const isCorrect = q.answer === letter;
                          return (
                            <div
                              key={letter}
                              className={`p-2 rounded ${
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

                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium text-foreground mb-1">Explanation:</p>
                        <p>{q.explanation}</p>
                      </div>
                    </div>
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
