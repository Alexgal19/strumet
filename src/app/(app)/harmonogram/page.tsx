'use client';

import { Loader2 } from 'lucide-react';
import { useAppContext } from '@/context/app-context';
import { PublicPlanowanieView } from '@/components/harmonogram/public-planowanie-view';

export default function PlanowaniePage() {
  const { isLoading: isAuthLoading } = useAppContext();
  if (isAuthLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  // /harmonogram zawsze otwiera harmonogram obsady — dla gości i zalogowanych
  return <PublicPlanowanieView />;
}
