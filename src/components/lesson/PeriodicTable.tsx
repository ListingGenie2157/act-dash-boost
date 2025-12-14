import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function PeriodicTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Periodic Table of Elements</CardTitle>
        <CardDescription>Reference chart for chemical elements and their properties</CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="overflow-x-auto">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Simple_Periodic_Table_Chart-en.svg/2560px-Simple_Periodic_Table_Chart-en.svg.png"
            alt="Periodic Table of Elements"
            className="w-full h-auto rounded-lg border border-border"
            loading="lazy"
          />
        </div>
        <div className="mt-4 text-sm text-muted-foreground space-y-2">
          <p>Use this periodic table to reference:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Atomic numbers and symbols</li>
            <li>Atomic masses</li>
            <li>Element groups and periods</li>
            <li>Metal, nonmetal, and metalloid classifications</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
