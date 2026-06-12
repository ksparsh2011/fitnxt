import { Suspense } from 'react';
import type { Metadata } from 'next';
import TodayLoading from './loading';
import { TodayPageContent } from './TodayPageContent';

export const metadata: Metadata = { title: 'Today' };

export default function TodayPage() {
  return (
    <Suspense fallback={<TodayLoading />}>
      <TodayPageContent />
    </Suspense>
  );
}
