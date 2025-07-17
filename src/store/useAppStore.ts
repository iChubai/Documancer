import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Paper, ChatMessage, UIState, ReadingSession, Annotation } from '@/lib/types';
import { VIEW_MODES } from '@/lib/constants';

interface AppState extends UIState {
  // Papers
  papers: Paper[];
  currentPaperId: string | null;
  
  // Chat
  chatMessages: ChatMessage[];
  
  // Reading sessions
  readingSessions: ReadingSession[];
  currentSession: ReadingSession | null;
  
  // Annotations
  annotations: Annotation[];
  
  // Actions
  setPapers: (papers: Paper[]) => void;
  addPaper: (paper: Paper) => void;
  removePaper: (paperId: string) => void;
  setCurrentPaper: (paperId: string | null) => void;
  
  addChatMessage: (message: ChatMessage) => void;
  clearChatMessages: () => void;
  
  setCurrentView: (view: UIState['currentView']) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  addAnnotation: (annotation: Annotation) => void;
  removeAnnotation: (annotationId: string) => void;
  updateAnnotation: (annotationId: string, updates: Partial<Annotation>) => void;
  
  startReadingSession: (paperId: string) => void;
  endReadingSession: () => void;
  updateReadingProgress: (progress: number) => void;
  
  selectPaper: (paperId: string) => void;
  deselectPaper: (paperId: string) => void;
  clearSelectedPapers: () => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        papers: [],
        currentPaperId: null,
        currentPaper: null,
        selectedPapers: [],
        chatMessages: [],
        readingSessions: [],
        currentSession: null,
        annotations: [],
        isLoading: false,
        error: null,
        sidebarCollapsed: false,
        currentView: VIEW_MODES.LIBRARY,
        
        // Paper actions
        setPapers: (papers) => set({ papers }),
        
        addPaper: (paper) => set((state) => ({
          papers: [...state.papers, paper]
        })),
        
        removePaper: (paperId) => set((state) => ({
          papers: state.papers.filter(p => p.id !== paperId),
          selectedPapers: state.selectedPapers.filter(id => id !== paperId),
          currentPaperId: state.currentPaperId === paperId ? null : state.currentPaperId,
          currentPaper: state.currentPaperId === paperId ? null : state.currentPaper,
        })),
        
        setCurrentPaper: (paperId) => {
          const paper = paperId ? get().papers.find(p => p.id === paperId) : null;
          set({ 
            currentPaperId: paperId, 
            currentPaper: paper || null 
          });
        },
        
        // Chat actions
        addChatMessage: (message) => set((state) => ({
          chatMessages: [...state.chatMessages, message]
        })),
        
        clearChatMessages: () => set({ chatMessages: [] }),
        
        // UI actions
        setCurrentView: (view) => set({ currentView: view }),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
        
        // Annotation actions
        addAnnotation: (annotation) => set((state) => ({
          annotations: [...state.annotations, annotation]
        })),
        
        removeAnnotation: (annotationId) => set((state) => ({
          annotations: state.annotations.filter(a => a.id !== annotationId)
        })),
        
        updateAnnotation: (annotationId, updates) => set((state) => ({
          annotations: state.annotations.map(a => 
            a.id === annotationId ? { ...a, ...updates } : a
          )
        })),
        
        // Reading session actions
        startReadingSession: (paperId) => {
          const session: ReadingSession = {
            id: `session_${Date.now()}`,
            paperId,
            startTime: new Date(),
            progress: 0,
            notes: [],
            bookmarks: [],
          };
          set((state) => ({
            currentSession: session,
            readingSessions: [...state.readingSessions, session]
          }));
        },
        
        endReadingSession: () => set((state) => {
          if (state.currentSession) {
            const updatedSession = {
              ...state.currentSession,
              endTime: new Date()
            };
            return {
              currentSession: null,
              readingSessions: state.readingSessions.map(s => 
                s.id === updatedSession.id ? updatedSession : s
              )
            };
          }
          return state;
        }),
        
        updateReadingProgress: (progress) => set((state) => {
          if (state.currentSession) {
            const updatedSession = { ...state.currentSession, progress };
            return {
              currentSession: updatedSession,
              readingSessions: state.readingSessions.map(s => 
                s.id === updatedSession.id ? updatedSession : s
              )
            };
          }
          return state;
        }),
        
        // Selection actions
        selectPaper: (paperId) => set((state) => ({
          selectedPapers: state.selectedPapers.includes(paperId) 
            ? state.selectedPapers 
            : [...state.selectedPapers, paperId]
        })),
        
        deselectPaper: (paperId) => set((state) => ({
          selectedPapers: state.selectedPapers.filter(id => id !== paperId)
        })),
        
        clearSelectedPapers: () => set({ selectedPapers: [] }),
      }),
      {
        name: 'documancer-store',
        partialize: (state) => ({
          papers: state.papers,
          readingSessions: state.readingSessions,
          annotations: state.annotations,
          sidebarCollapsed: state.sidebarCollapsed,
        }),
      }
    ),
    { name: 'documancer-store' }
  )
);
