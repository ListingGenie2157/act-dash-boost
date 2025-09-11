import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const MathCheatsheet = () => {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6 no-print">
          <h1 className="text-3xl font-bold">ACT Math Cheatsheet</h1>
          <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700">
            Print Cheatsheet
          </Button>
        </div>

        <div className="print-content bg-white text-black p-8 rounded-lg shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">ACT Math Quick Reference</h1>
            <p className="text-lg text-gray-600">Essential formulas and concepts</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Algebra</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-semibold">Linear Equations</h4>
                  <p className="text-sm font-mono">y = mx + b</p>
                  <p className="text-xs">m = slope, b = y-intercept</p>
                </div>
                <div>
                  <h4 className="font-semibold">Quadratic Formula</h4>
                  <p className="text-sm font-mono">x = (-b ± √(b² - 4ac)) / 2a</p>
                </div>
                <div>
                  <h4 className="font-semibold">Distance Formula</h4>
                  <p className="text-sm font-mono">d = √((x₂-x₁)² + (y₂-y₁)²)</p>
                </div>
                <div>
                  <h4 className="font-semibold">Midpoint Formula</h4>
                  <p className="text-sm font-mono">((x₁+x₂)/2, (y₁+y₂)/2)</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Geometry</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-semibold">Circle</h4>
                  <p className="text-sm">Area: πr², Circumference: 2πr</p>
                </div>
                <div>
                  <h4 className="font-semibold">Triangle</h4>
                  <p className="text-sm">Area: ½bh, Pythagorean: a² + b² = c²</p>
                </div>
                <div>
                  <h4 className="font-semibold">Rectangle</h4>
                  <p className="text-sm">Area: lw, Perimeter: 2(l + w)</p>
                </div>
                <div>
                  <h4 className="font-semibold">Volume</h4>
                  <p className="text-sm">Cylinder: πr²h, Cone: ⅓πr²h</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Trigonometry</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-semibold">Basic Ratios</h4>
                  <p className="text-sm">sin θ = opp/hyp, cos θ = adj/hyp, tan θ = opp/adj</p>
                </div>
                <div>
                  <h4 className="font-semibold">Special Angles</h4>
                  <p className="text-sm">30°: sin=½, cos=√3/2, tan=1/√3</p>
                  <p className="text-sm">45°: sin=√2/2, cos=√2/2, tan=1</p>
                  <p className="text-sm">60°: sin=√3/2, cos=½, tan=√3</p>
                </div>
                <div>
                  <h4 className="font-semibold">Law of Cosines</h4>
                  <p className="text-sm font-mono">c² = a² + b² - 2ab cos C</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Statistics & Probability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-semibold">Mean, Median, Mode</h4>
                  <p className="text-sm">Average, middle value, most frequent</p>
                </div>
                <div>
                  <h4 className="font-semibold">Probability</h4>
                  <p className="text-sm">P(A) = favorable outcomes / total outcomes</p>
                </div>
                <div>
                  <h4 className="font-semibold">Combinations</h4>
                  <p className="text-sm font-mono">C(n,r) = n! / (r!(n-r)!)</p>
                </div>
                <div>
                  <h4 className="font-semibold">Permutations</h4>
                  <p className="text-sm font-mono">P(n,r) = n! / (n-r)!</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Key Strategies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ul className="space-y-2 text-sm">
                    <li>• Plug in answer choices (backsolving)</li>
                    <li>• Use special numbers for variables</li>
                    <li>• Draw diagrams for geometry problems</li>
                    <li>• Check units in word problems</li>
                  </ul>
                  <ul className="space-y-2 text-sm">
                    <li>• Estimate before calculating</li>
                    <li>• Use calculator efficiently</li>
                    <li>• Look for patterns in sequences</li>
                    <li>• Convert word problems to equations</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Common Formulas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <h5 className="font-semibold mb-2">Interest</h5>
                    <p>Simple: I = Prt</p>
                    <p>Compound: A = P(1+r)ᵗ</p>
                  </div>
                  <div>
                    <h5 className="font-semibold mb-2">Motion</h5>
                    <p>Distance = rate × time</p>
                    <p>d = rt</p>
                  </div>
                  <div>
                    <h5 className="font-semibold mb-2">Work</h5>
                    <p>Work = rate × time</p>
                    <p>1/a + 1/b = 1/combined</p>
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

export default MathCheatsheet;