import { Suspense } from 'react';
import WidgetHeartbeat from './_shared/components/WidgetHeartbeat';

export default function WidgetsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <WidgetHeartbeat />
      </Suspense>
      {children}
    </>
  );
}
