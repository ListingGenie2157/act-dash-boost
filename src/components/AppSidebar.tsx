import { 
  Home, 
  BookOpen, 
  Timer, 
  PlayCircle, 
  Calculator, 
  TrendingDown,
  BarChart3,
  History,
  Target,
  FileText,
  Settings,
  Users,
  FlaskConical,
  Upload,
  Code,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useIsAdmin } from '@/hooks/queries/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const studyItems = [
  { title: 'Dashboard', url: '/', icon: Home, end: true },
  { title: 'Lessons Library', url: '/lessons', icon: BookOpen },
  { title: 'Timed Drills', url: '/drill-runner', icon: Timer },
  { title: 'Practice Tests', url: '/simulation', icon: PlayCircle },
  { title: 'Calculator Lab', url: '/calculator-lab', icon: Calculator },
  { title: 'Weak Areas', url: '/weak-areas', icon: TrendingDown },
];

const progressItems = [
  { title: 'Analytics', url: '/analytics', icon: BarChart3 },
  { title: 'Drill History', url: '/drill-history', icon: History },
  { title: 'Mastery Tracker', url: '/', icon: Target, end: true }, // Links to dashboard mastery section
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
  { title: 'Diagnostic', url: '/diagnostic', icon: FlaskConical },
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
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
      navigate('/login');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to log out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Sidebar className={collapsed ? 'w-14' : 'w-60'} collapsible="icon">
      <SidebarContent>
        {/* Study & Practice */}
        <SidebarGroup>
          <SidebarGroupLabel>Study & Practice</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {studyItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.end}
                      className="flex items-center gap-2 hover:bg-muted/50 transition-colors"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Progress & Analytics */}
        <SidebarGroup>
          <SidebarGroupLabel>Progress & Analytics</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {progressItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url}
                      end={item.end}
                      className="flex items-center gap-2 hover:bg-muted/50 transition-colors"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Resources - Collapsible */}
        <Collapsible defaultOpen={false}>
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-between">
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
                        <NavLink 
                          to={item.url}
                          className="flex items-center gap-2 hover:bg-muted/50 transition-colors"
                          activeClassName="bg-muted text-primary font-medium"
                        >
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

        {/* Settings & More */}
        <SidebarGroup>
          <SidebarGroupLabel>Settings & More</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url}
                      className="flex items-center gap-2 hover:bg-muted/50 transition-colors"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section - Only show if user is admin */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url}
                        className="flex items-center gap-2 hover:bg-muted/50 transition-colors"
                        activeClassName="bg-muted text-primary font-medium"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer with Logout */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start gap-2 hover:bg-muted/50"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                {!collapsed && <span>Logout</span>}
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
