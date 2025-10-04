import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const EnglishCheatsheet = () => {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6 no-print">
          <h1 className="text-3xl font-bold">ACT English Cheatsheet</h1>
          <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700">
            Print Cheatsheet
          </Button>
        </div>

        <div className="print-content bg-white text-black p-8 rounded-lg shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">ACT English Quick Reference</h1>
            <p className="text-lg text-gray-600">Essential rules and strategies</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Grammar & Usage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-semibold">Subject-Verb Agreement</h4>
                  <p className="text-sm">Singular subjects take singular verbs; plural subjects take plural verbs.</p>
                </div>
                <div>
                  <h4 className="font-semibold">Pronoun Agreement</h4>
                  <p className="text-sm">Pronouns must agree with their antecedents in number and gender.</p>
                </div>
                <div>
                  <h4 className="font-semibold">Verb Tenses</h4>
                  <p className="text-sm">Maintain consistent tense unless meaning requires a shift.</p>
                </div>
                <div>
                  <h4 className="font-semibold">Modifiers</h4>
                  <p className="text-sm">Place modifiers as close as possible to what they modify.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Punctuation Rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-semibold">Commas</h4>
                  <p className="text-sm">Use for lists, before conjunctions in compound sentences, and around nonessential clauses.</p>
                </div>
                <div>
                  <h4 className="font-semibold">Semicolons</h4>
                  <p className="text-sm">Connect two independent clauses or separate complex list items.</p>
                </div>
                <div>
                  <h4 className="font-semibold">Apostrophes</h4>
                  <p className="text-sm">Show possession (John's book) or contractions (it's = it is).</p>
                </div>
                <div>
                  <h4 className="font-semibold">Colons</h4>
                  <p className="text-sm">Introduce lists, explanations, or elaborations.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Sentence Structure</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-semibold">Run-on Sentences</h4>
                  <p className="text-sm">Fix with periods, semicolons, or coordinating conjunctions.</p>
                </div>
                <div>
                  <h4 className="font-semibold">Fragments</h4>
                  <p className="text-sm">Every sentence needs a subject and predicate.</p>
                </div>
                <div>
                  <h4 className="font-semibold">Parallel Structure</h4>
                  <p className="text-sm">Use consistent grammatical forms in lists and comparisons.</p>
                </div>
                <div>
                  <h4 className="font-semibold">Clarity</h4>
                  <p className="text-sm">Choose the clearest, most concise option.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Strategy Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-semibold">Read for Flow</h4>
                  <p className="text-sm">Read passages to understand context and tone.</p>
                </div>
                <div>
                  <h4 className="font-semibold">Trust Your Ear</h4>
                  <p className="text-sm">Often the correct answer "sounds right" when read aloud.</p>
                </div>
                <div>
                  <h4 className="font-semibold">Shorter is Better</h4>
                  <p className="text-sm">When in doubt, choose the most concise option.</p>
                </div>
                <div>
                  <h4 className="font-semibold">NO CHANGE</h4>
                  <p className="text-sm">Don't be afraid to choose "NO CHANGE" - it's right about 25% of the time.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Common Mistakes to Avoid</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ul className="space-y-2 text-sm">
                    <li>• Confusing "its" (possessive) with "it's" (contraction)</li>
                    <li>• Misusing "who" vs "whom" vs "that"</li>
                    <li>• Incorrect comma usage with essential/nonessential clauses</li>
                    <li>• Mixing up "affect" (verb) and "effect" (noun)</li>
                  </ul>
                  <ul className="space-y-2 text-sm">
                    <li>• Subject-verb disagreement with collective nouns</li>
                    <li>• Dangling or misplaced modifiers</li>
                    <li>• Inconsistent verb tenses within paragraphs</li>
                    <li>• Redundant or wordy expressions</li>
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

export default EnglishCheatsheet;