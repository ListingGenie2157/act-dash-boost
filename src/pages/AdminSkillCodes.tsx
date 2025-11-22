import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Search } from 'lucide-react';
import { toast } from 'sonner';

const SUBJECTS = ['All', 'English', 'Math', 'Reading', 'Science'];

export default function AdminSkillCodes() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: skills, isLoading } = useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .order('subject')
        .order('order_index');
      
      if (error) throw error;
      return data;
    },
  });

  const filteredSkills = skills?.filter(skill => {
    const matchesSearch = 
      skill.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.cluster.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSubject = selectedSubject === 'All' || skill.subject === selectedSubject;
    
    return matchesSearch && matchesSubject;
  });

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAll = async () => {
    const text = filteredSkills?.map(s => `${s.id} - ${s.name}`).join('\n') || '';
    await navigator.clipboard.writeText(text);
    toast.success(`Copied ${filteredSkills?.length} skill codes`);
  };

  const subjectCounts = {
    English: skills?.filter(s => s.subject === 'English').length || 0,
    Math: skills?.filter(s => s.subject === 'Math').length || 0,
    Reading: skills?.filter(s => s.subject === 'Reading').length || 0,
    Science: skills?.filter(s => s.subject === 'Science').length || 0,
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Skill Codes Reference</h1>
        <p className="text-muted-foreground">
          Browse and copy all {skills?.length || 0} skill codes across all subjects
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(subjectCounts).map(([subject, count]) => (
          <Card key={subject}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{subject}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{count}</div>
              <p className="text-xs text-muted-foreground">skills</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by code, name, cluster, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={handleCopyAll} variant="outline">
              <Copy className="mr-2 h-4 w-4" />
              Copy All ({filteredSkills?.length || 0})
            </Button>
          </div>
          
          <div className="flex gap-2 flex-wrap pt-4">
            {SUBJECTS.map(subject => (
              <Button
                key={subject}
                variant={selectedSubject === subject ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedSubject(subject)}
              >
                {subject}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading skills...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Code</TableHead>
                    <TableHead className="w-[100px]">Subject</TableHead>
                    <TableHead className="w-[150px]">Cluster</TableHead>
                    <TableHead>Skill Name</TableHead>
                    <TableHead className="w-[80px]">Copy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSkills?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No skills found matching your search
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSkills?.map((skill) => (
                      <TableRow key={skill.id}>
                        <TableCell className="font-mono font-medium">{skill.id}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{skill.subject}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {skill.cluster}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{skill.name}</div>
                            {skill.description && (
                              <div className="text-sm text-muted-foreground mt-1">
                                {skill.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(skill.id, skill.id)}
                          >
                            {copiedId === skill.id ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
