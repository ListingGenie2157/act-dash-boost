import { 
  Home, BookOpen, Timer, PlayCircle, Calculator, TrendingDown,
  BarChart3, History, Target, FileText, Settings, Users,
  Upload, Code, LogOut, ChevronDown, XCircle, RotateCcw
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useIsAdmin } from '@/hooks/queries/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, SidebarHeader, useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import preppitLogo from '@/assets/preppit-logo.png';

const studyItems = [
  { title: 'Dashboard', url: '/', icon: Home, end: true },
  { title: 'Lessons Library', url: '/lessons', icon: BookOpen },
  { title: 'Pacing Lab', url: '/pacing-lab', icon: Timer },
  { title: 'Practice Tests', url: '/simulation', icon: PlayCircle },
  { title: 'Calculator Lab', url: '/calculator-lab', icon: Calculator },
  { title: 'Weak Areas', url: '/weak-areas', icon: TrendingDown },
];

const progressItems = [
  { title: 'Analytics', url: '/analytics', icon: BarChart3 },
  { title: 'Drill History', url: '/drill-history', icon: History },
  { title: 'Mastery Tracker', url: '/analytics', icon: Target },
];

const reviewItems = [
  { title: 'Missed Questions', url: '/review/missed', icon: XCircle },
  { title: 'Spaced Repetition', url: '/review/spaced', icon: RotateCcw },
];

const resourceItems = [
  { title: 'English', url: '/cheatsheets/english', icon: FileText },
  { title: 'Math', url: '/cheatsheets/math', icon: FileText },
  { title: 'Reading', url: '/cheatsheets/reading', icon: FileText },
  { title: 'Science', url: '/cheatsheets/science', icon: FileText },
];

const settingsItems = [
  { title: 'Study Plan', url: '/plan', icon: Settings },
  { title: 'Parent Portal', url: '/parent-portal', icon: Users },
  { title: 'Build Study Plan', url: '/diagnostic', icon: Target },
];

const adminItems = [
  { title: 'Import Questions', url: '/admin-import', icon: Upload },
  { title: 'Import Lessons', url: '/admin-lesson-import', icon: Upload },
  { title: 'Skill Codes', url: '/admin/skill-codes', icon: Code },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { data: isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({ title: 'Logged out', description: 'You have been successfully logged out.' });
      navigate('/login');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to log out. Please try again.', variant: 'destructive' });
    }
  };

  const navClassName = "flex items-center gap-2 hover:bg-white/5 transition-colors";
  const activeClassName = "bg-white/5 text-primary font-medium border-l-2 border-primary";

  const renderSection = (label: string, items: typeof studyItems) => (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink to={item.url} end={item.end} className={navClassName} activeClassName={activeClassName}>
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-white/[0.06] p-4">
        <NavLink to="/" className="flex items-center gap-3">
          <img src={preppitLogo} alt="Preppit Pacing" className={`${collapsed ? 'h-8 w-8' : 'h-10'} w-auto transition-all`} />
          {!collapsed && <span className="font-bold text-lg text-primary">Preppit Pacing</span>}
        </NavLink>
      </SidebarHeader>

      <SidebarContent>
        {renderSection('Study & Practice', studyItems)}
        {renderSection('Progress & Analytics', progressItems)}
        {renderSection('Review & Practice', reviewItems)}

        <Collapsible defaultOpen={false}>
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:bg-white/5 transition-colors flex items-center justify-between">
                <span>Cheatsheets</span>
                {!collapsed && <ChevronDown className="h-4 w-4" />}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {resourceItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} className={navClassName} activeClassName={activeClassName}>
                          <item.icon className="h-4 w-4 shrink-0" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {renderSection('Settings & More', settingsItems)}

        {isAdmin && renderSection('Admin', adminItems)}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-2">
                <LogOut className="h-4 w-4 shrink-0" />
                {!collapsed && <span>Logout</span>}
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {!collapsed && (
          <div className="px-3 py-2 text-xs text-muted-foreground flex gap-3">
            <a href="/terms" className="hover:text-foreground transition-colors">Terms</a>
            <a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
