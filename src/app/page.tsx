'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import LibraryView from '@/components/views/LibraryView';
import ReaderView from '@/components/views/ReaderView';
import ComparisonView from '@/components/views/ComparisonView';
import AnalysisView from '@/components/views/AnalysisView';
import ResearchAssistant from '@/components/features/ResearchAssistant';
import PaperTimeline from '@/components/features/PaperTimeline';
import CollaborationHub from '@/components/features/CollaborationHub';
import SmartInsights from '@/components/features/SmartInsights';
import ResearchLab from '@/components/features/ResearchLab';
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
      case 'research-assistant':
        return <ResearchAssistant />;
      case 'paper-timeline':
        return <PaperTimeline />;
      case 'collaboration-hub':
        return <CollaborationHub />;
      case 'smart-insights':
        return <SmartInsights />;
      case 'research-lab':
        return <ResearchLab />;
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
