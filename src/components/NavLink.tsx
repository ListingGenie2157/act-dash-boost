import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';

interface NavLinkProps {
  to: string;
  children: ReactNode;
  className?: string;
  activeClassName?: string;
  end?: boolean;
}

export function NavLink({ to, children, className, activeClassName, end = false }: NavLinkProps) {
  const location = useLocation();
  const isActive = end 
    ? location.pathname === to 
    : location.pathname.startsWith(to);

  // Auto-close mobile sidebar on navigation
  let setOpenMobile: ((open: boolean) => void) | undefined;
  try {
    const sidebar = useSidebar();
    setOpenMobile = sidebar.setOpenMobile;
  } catch {
    // Not in a sidebar context, that's fine
  }

  const handleClick = () => {
    if (setOpenMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Link
      to={to}
      onClick={handleClick}
      className={cn(className, isActive && activeClassName)}
    >
      {children}
    </Link>
  );
}
