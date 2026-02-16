import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { CountdownHeader } from '@/components/CountdownHeader';

export function AppLayout() {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full pp-page-bg">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col w-full">
          {/* Header with Sidebar Toggle and Countdown */}
          <header className="pp-header flex items-center gap-4 px-4 py-2">
            <SidebarTrigger className="shrink-0" />
            <CountdownHeader className="border-0 p-0 flex-1 justify-start bg-transparent" />
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
