'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import LibraryView from '@/components/views/LibraryView';
import ReaderView from '@/components/views/ReaderView';
import ComparisonView from '@/components/views/ComparisonView';
import AnalysisView from '@/components/views/AnalysisView';
import { useAppStore } from '@/store/useAppStore';
import { VIEW_MODES } from '@/lib/constants';

export default function Home() {
  const { currentView } = useAppStore();

  const renderCurrentView = () => {
    switch (currentView) {
      case VIEW_MODES.LIBRARY:
        return <LibraryView />;
      case VIEW_MODES.READER:
        return <ReaderView />;
      case VIEW_MODES.COMPARISON:
        return <ComparisonView />;
      case VIEW_MODES.ANALYSIS:
        return <AnalysisView />;
      default:
        return <LibraryView />;
    }
  };

  return (
    <MainLayout>
      {renderCurrentView()}
    </MainLayout>
  );
}
