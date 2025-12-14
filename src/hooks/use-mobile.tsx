import { useEffect, useState } from 'react';
import { isBrowser } from '@/lib/env';

// const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    if (!isBrowser) return;
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return mobile;
}
