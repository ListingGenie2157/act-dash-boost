import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ReadingCheatsheet = () => {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6 no-print">
          <h1 className="text-3xl font-bold">ACT Reading Cheatsheet</h1>
          <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700">
            Print Cheatsheet
          </Button>
        </div>

        <div className="print-content bg-white text-black p-8 rounded-lg shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">ACT Reading Quick Reference</h1>
            <p className="text-lg text-gray-600">Strategies and question types</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Passage Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-semibold">Literary Narrative</h4>
                  <p className="text-sm">Fiction, memoirs, personal essays - focus on character, theme, tone</p>
                </div>
                <div>
                  <h4 className="font-semibold">Social Science</h4>
                  <p className="text-sm">Psychology, sociology, economics - look for main ideas and evidence</p>
                </div>
                <div>
                  <h4 className="font-semibold">Humanities</h4>
                  <p className="text-sm">Art, literature, philosophy - analyze author's perspective and purpose</p>
                </div>
                <div>
                  <h4 className="font-semibold">Natural Science</h4>
                  <p className="text-sm">Biology, chemistry, physics - focus on processes and cause/effect</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Question Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-semibold">Main Idea</h4>
                  <p className="text-sm">What is the passage primarily about? Focus on central theme.</p>
                </div>
                <div>
                  <h4 className="font-semibold">Detail</h4>
                  <p className="text-sm">According to the passage... Look for specific information stated.</p>
                </div>
                <div>
                  <h4 className="font-semibold">Inference</h4>
                  <p className="text-sm">The author suggests/implies... Draw logical conclusions.</p>
                </div>
                <div>
                  <h4 className="font-semibold">Vocabulary</h4>
                  <p className="text-sm">As used in line X, "word" most nearly means... Use context clues.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Reading Strategies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-semibold">Active Reading</h4>
                  <p className="text-sm">Take notes, underline key points, identify main ideas in each paragraph.</p>
                </div>
                <div>
                  <h4 className="font-semibold">Time Management</h4>
                  <p className="text-sm">8-9 minutes per passage. Skim first, then read carefully.</p>
                </div>
                <div>
                  <h4 className="font-semibold">Question Order</h4>
                  <p className="text-sm">Answer line reference questions first, then general questions.</p>
                </div>
                <div>
                  <h4 className="font-semibold">Elimination</h4>
                  <p className="text-sm">Cross out obviously wrong answers, then choose best remaining option.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Common Mistakes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-semibold">Outside Knowledge</h4>
                  <p className="text-sm">Don't use information not in the passage. Stick to what's given.</p>
                </div>
                <div>
                  <h4 className="font-semibold">Extreme Answers</h4>
                  <p className="text-sm">Avoid words like "always," "never," "all" - they're usually wrong.</p>
                </div>
                <div>
                  <h4 className="font-semibold">Misreading</h4>
                  <p className="text-sm">Read questions carefully. Look for "NOT," "EXCEPT," and other qualifiers.</p>
                </div>
                <div>
                  <h4 className="font-semibold">First Impressions</h4>
                  <p className="text-sm">Don't always go with your first instinct - check against the passage.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Key Question Words</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h5 className="font-semibold mb-2">Main Idea Words</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Primary purpose</li>
                      <li>• Main point</li>
                      <li>• Central theme</li>
                      <li>• Overall message</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-semibold mb-2">Detail Words</h5>
                    <ul className="text-sm space-y-1">
                      <li>• According to</li>
                      <li>• States that</li>
                      <li>• Mentions</li>
                      <li>• Indicates</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-semibold mb-2">Inference Words</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Suggests</li>
                      <li>• Implies</li>
                      <li>• Can be inferred</li>
                      <li>• Most likely</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Time-Saving Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ul className="space-y-2 text-sm">
                    <li>• Read the first and last paragraphs carefully</li>
                    <li>• Skim middle paragraphs for topic sentences</li>
                    <li>• Look for transition words (however, therefore, etc.)</li>
                    <li>• Pay attention to quotation marks and italics</li>
                  </ul>
                  <ul className="space-y-2 text-sm">
                    <li>• Don't get stuck on difficult vocabulary</li>
                    <li>• Use line references to locate answers quickly</li>
                    <li>• Read a little before and after line references</li>
                    <li>• Trust the process - practice builds speed</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              .no-print { display: none !important; }
              .print-content { box-shadow: none !important; }
              body { -webkit-print-color-adjust: exact !important; }
            }
          `
        }} />
      </div>
    </div>
  );
};

export default ReadingCheatsheet;