'use client';

import { useEffect } from 'react';

// Layout khusus route /designer: aktifkan scrollbar custom monokrom
// untuk body (halaman list), plus sebagai penanda scope designer.
export default function DesignerLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add('designer-scroll');
    return () => {
      document.documentElement.classList.remove('designer-scroll');
    };
  }, []);
  return <>{children}</>;
}
