import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, DollarSign, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RewardRule {
  id: string;
  type: 'DRILL' | 'SIM' | 'STREAK';
  threshold: number | { accuracy?: number; time_ms?: number; days?: number };
  amount_cents: number;
  created_at: string;
}

interface RewardLedgerEntry {
  id: string;
  student_id: string;
  rule_id: string;
  earned_at: string;
  amount_cents: number;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
}

export default function ParentPortal() {
  const [rules, setRules] = useState<RewardRule[]>([]);
  const [ledger, setLedger] = useState<RewardLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [parentId, setParentId] = useState<string | null>(null);

  // Form state for new rule
  const [newRule, setNewRule] = useState({
    type: 'DRILL' as 'DRILL' | 'SIM' | 'STREAK',
    amount_cents: 50,
    threshold: { days: 5 }
  });

  useEffect(() => {
    initializeParentPortal();
  }, []);

  const initializeParentPortal = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;

      // Create or get parent record
      const { data: existingParent } = await supabase
        .from('parents')
        .select('id')
        .eq('email', user.email)
        .single();

      let currentParentId = existingParent?.id;

      if (!existingParent) {
        const { data: newParent, error } = await supabase
          .from('parents')
          .insert({ email: user.email })
          .select('id')
          .single();

        if (error) {
          console.error('Error creating parent:', error);
          toast.error('Failed to initialize parent portal');
          return;
        }
        currentParentId = newParent.id;
      }

      if (currentParentId) {
        setParentId(currentParentId);
        void fetchRules(currentParentId);
        void fetchLedger(currentParentId);
      }
    } catch (error) {
      console.error('Error initializing parent portal:', error);
      toast.error('Failed to load parent portal');
    } finally {
      setLoading(false);
    }
  };

  const fetchRules = async (parentId: string) => {
    const { data, error } = await supabase
      .from('rewards_rules')
      .select('*')
      .eq('parent_id', parentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching rules:', error);
      return;
    }

    setRules((data || []) as RewardRule[]);
  };

  const fetchLedger = async (parentId: string) => {
    const { data, error } = await supabase
      .from('rewards_ledger')
      .select(`
        *,
        rewards_rules!inner(parent_id)
      `)
      .eq('rewards_rules.parent_id', parentId)
      .eq('status', 'PENDING')
      .order('earned_at', { ascending: false });

    if (error) {
      console.error('Error fetching ledger:', error);
      return;
    }

    setLedger((data || []) as RewardLedgerEntry[]);
  };

  const createRule = async () => {
    if (!parentId) return;

    try {
      const { error } = await supabase
        .from('rewards_rules')
        .insert({
          parent_id: parentId,
          type: newRule.type,
          threshold: newRule.threshold,
          amount_cents: newRule.amount_cents
        });

      if (error) {
        console.error('Error creating rule:', error);
        toast.error('Failed to create rule');
        return;
      }

      toast.success('Rule created successfully');
      fetchRules(parentId);
      setNewRule({ type: 'DRILL', amount_cents: 50, threshold: { days: 5 } });
    } catch (error) {
      console.error('Error creating rule:', error);
      toast.error('Failed to create rule');
    }
  };

  const updateLedgerStatus = async (ledgerId: string, status: 'APPROVED' | 'DENIED') => {
    try {
      const { error } = await supabase
        .from('rewards_ledger')
        .update({ status })
        .eq('id', ledgerId);

      if (error) {
        console.error('Error updating ledger:', error);
        toast.error('Failed to update status');
        return;
      }

      toast.success(`Entry ${status.toLowerCase()}`);
      if (parentId) fetchLedger(parentId);
    } catch (error) {
      console.error('Error updating ledger:', error);
      toast.error('Failed to update status');
    }
  };

  const deleteRule = async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from('rewards_rules')
        .delete()
        .eq('id', ruleId);

      if (error) {
        console.error('Error deleting rule:', error);
        toast.error('Failed to delete rule');
        return;
      }

      toast.success('Rule deleted');
      if (parentId) fetchRules(parentId);
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error('Failed to delete rule');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading parent portal...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <DollarSign className="w-8 h-8 text-green-600" />
        <h1 className="text-3xl font-bold">Parent Rewards Portal</h1>
      </div>

      {/* Create New Rule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create Reward Rule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="rule-type">Type</Label>
              <Select
                value={newRule.type}
                onValueChange={(value: 'DRILL' | 'SIM' | 'STREAK') => 
                  setNewRule({ ...newRule, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRILL">Drill Practice</SelectItem>
                  <SelectItem value="SIM">Simulation Test</SelectItem>
                  <SelectItem value="STREAK">Study Streak</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="amount">Reward Amount ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={newRule.amount_cents / 100}
                onChange={(e) => 
                  setNewRule({ 
                    ...newRule, 
                    amount_cents: Math.round(parseFloat(e.target.value) * 100) 
                  })
                }
                placeholder="0.50"
              />
            </div>

            {newRule.type === 'STREAK' && (
              <div>
                <Label htmlFor="streak-days">Streak Days</Label>
                <Input
                  type="number"
                  value={newRule.threshold.days}
                  onChange={(e) => 
                    setNewRule({ 
                      ...newRule, 
                      threshold: { days: parseInt(e.target.value) } 
                    })
                  }
                  placeholder="5"
                />
              </div>
            )}
          </div>

          <Button onClick={createRule} className="w-full md:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Create Rule
          </Button>
        </CardContent>
      </Card>

      {/* Active Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Active Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{rule.type}</Badge>
                  <span className="font-medium">${(rule.amount_cents / 100).toFixed(2)}</span>
                   {rule.type === 'STREAK' && (
                     <span className="text-sm text-muted-foreground">
                       {typeof rule.threshold === 'object' && 'days' in rule.threshold ? `${rule.threshold.days} days` : `${rule.threshold} days`}
                     </span>
                   )}
                  {rule.type === 'DRILL' && (
                    <span className="text-sm text-muted-foreground">
                      85%+ accuracy, ≤45s
                    </span>
                  )}
                  {rule.type === 'SIM' && (
                    <span className="text-sm text-muted-foreground">
                      +2 points improvement
                    </span>
                  )}
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteRule(rule.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {rules.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No rules created yet. Create your first rule above.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending Rewards */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Rewards</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledger.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    {new Date(entry.earned_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-medium">
                    ${(entry.amount_cents / 100).toFixed(2)}
                  </TableCell>
                  <TableCell>{entry.student_id.slice(0, 8)}...</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => updateLedgerStatus(entry.id, 'APPROVED')}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateLedgerStatus(entry.id, 'DENIED')}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {ledger.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                    No pending rewards
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}