import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ScienceCheatsheet = () => {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6 no-print">
          <h1 className="text-3xl font-bold">ACT Science Cheatsheet</h1>
          <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700">
            Print Cheatsheet
          </Button>
        </div>

        <div className="print-content bg-white text-black p-8 rounded-lg shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">ACT Science Quick Reference</h1>
            <p className="text-lg text-gray-600">Data interpretation and reasoning strategies</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Passage Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-semibold">Data Representation (38%)</h4>
                  <p className="text-sm">Graphs, tables, charts. Focus on trends, patterns, and relationships.</p>
                </div>
                <div>
                  <h4 className="font-semibold">Research Summaries (45%)</h4>
                  <p className="text-sm">Experimental descriptions. Identify variables, controls, and conclusions.</p>
                </div>
                <div>
                  <h4 className="font-semibold">Conflicting Viewpoints (17%)</h4>
                  <p className="text-sm">Different theories/hypotheses. Compare similarities and differences.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Graph Reading Skills</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-semibold">Axes & Labels</h4>
                  <p className="text-sm">Always check x and y-axis labels, units, and scales first.</p>
                </div>
                <div>
                  <h4 className="font-semibold">Trends</h4>
                  <p className="text-sm">Identify increasing, decreasing, or constant relationships.</p>
                </div>
                <div>
                  <h4 className="font-semibold">Data Points</h4>
                  <p className="text-sm">Find specific values and interpolate between points.</p>
                </div>
                <div>
                  <h4 className="font-semibold">Comparisons</h4>
                  <p className="text-sm">Compare data sets, look for highest/lowest values.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Experimental Design</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-semibold">Variables</h4>
                  <p className="text-sm">Independent (cause), Dependent (effect), Controlled (constant)</p>
                </div>
                <div>
                  <h4 className="font-semibold">Hypothesis</h4>
                  <p className="text-sm">Testable prediction about relationship between variables.</p>
                </div>
                <div>
                  <h4 className="font-semibold">Control Group</h4>
                  <p className="text-sm">Standard for comparison; no experimental treatment.</p>
                </div>
                <div>
                  <h4 className="font-semibold">Validity</h4>
                  <p className="text-sm">Does the experiment test what it claims to test?</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Common Question Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-semibold">Direct Lookup</h4>
                  <p className="text-sm">Find specific data points from graphs or tables.</p>
                </div>
                <div>
                  <h4 className="font-semibold">Trend Analysis</h4>
                  <p className="text-sm">As X increases, what happens to Y?</p>
                </div>
                <div>
                  <h4 className="font-semibold">Comparison</h4>
                  <p className="text-sm">Which trial/experiment had the highest/lowest result?</p>
                </div>
                <div>
                  <h4 className="font-semibold">Prediction</h4>
                  <p className="text-sm">Extrapolate beyond given data range.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Key Science Concepts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h5 className="font-semibold mb-2">Units</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Temperature: °C, K, °F</li>
                      <li>• Pressure: atm, Pa, mmHg</li>
                      <li>• Time: s, min, hr</li>
                      <li>• Distance: m, cm, km</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-semibold mb-2">Relationships</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Direct: both increase/decrease</li>
                      <li>• Inverse: one up, other down</li>
                      <li>• Linear: straight line</li>
                      <li>• Exponential: curved growth</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-semibold mb-2">Common Terms</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Catalyst: speeds reaction</li>
                      <li>• pH: acid/base scale</li>
                      <li>• Velocity: speed + direction</li>
                      <li>• Density: mass/volume</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Strategy Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ul className="space-y-2 text-sm">
                    <li>• Don't read the passages first - go straight to questions</li>
                    <li>• Use the figures to answer questions, not background knowledge</li>
                    <li>• Look for keywords in questions that match figure labels</li>
                    <li>• Pay attention to units - they often provide clues</li>
                  </ul>
                  <ul className="space-y-2 text-sm">
                    <li>• Practice reading different types of graphs quickly</li>
                    <li>• Don't get bogged down in complex scientific explanations</li>
                    <li>• Use process of elimination for difficult questions</li>
                    <li>• Manage time - aim for 5 minutes per passage</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Quick Reference Formulas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-semibold mb-2">Physics</h5>
                    <p>• Speed = distance/time</p>
                    <p>• Density = mass/volume</p>
                    <p>• Pressure = force/area</p>
                  </div>
                  <div>
                    <h5 className="font-semibold mb-2">Chemistry</h5>
                    <p>• pH = -log[H+]</p>
                    <p>• Molarity = moles/liters</p>
                    <p>• Gas law: PV = nRT</p>
                  </div>
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

export default ScienceCheatsheet;