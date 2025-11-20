import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { TutorMessage, TutorContextData, TutorChatRequest, TutorChatResponse } from '@/types/tutor';

interface TutorContextType {
  isOpen: boolean;
  messages: TutorMessage[];
  context: TutorContextData | null;
  loading: boolean;
  sessionId: string | null;
  openTutor: (initialContext: TutorContextData) => void;
  closeTutor: () => void;
  sendUserMessage: (content: string) => Promise<void>;
  setProblemContext: (problem: TutorContextData['problem']) => void;
  clearMessages: () => void;
}

const TutorContext = createContext<TutorContextType | undefined>(undefined);

export function TutorProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [context, setContext] = useState<TutorContextData | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const openTutor = useCallback((initialContext: TutorContextData) => {
    setContext(initialContext);
    setIsOpen(true);
  }, []);

  const closeTutor = useCallback(() => {
    setIsOpen(false);
  }, []);

  const setProblemContext = useCallback((problem: TutorContextData['problem']) => {
    setContext((prev) => {
      if (!prev) return prev;
      return { ...prev, problem };
    });
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setSessionId(null);
  }, []);

  const sendUserMessage = useCallback(async (content: string) => {
    if (!context || !content.trim()) return;

    const userMessage: TutorMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Send last 15 messages to keep context manageable
      const recentMessages = [...messages, userMessage].slice(-15);

      const requestBody: TutorChatRequest = {
        user_id: user?.id,
        subject: context.subject,
        topic: context.topic,
        mode: context.mode,
        problem: context.problem || { id: null, text: '' },
        messages: recentMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.createdAt.toISOString(),
        })),
        session_id: sessionId || undefined,
      };

      const { data, error } = await supabase.functions.invoke<TutorChatResponse>('tutor-chat', {
        body: requestBody,
      });

      // Check if function returned an error response (200 with error field)
      if (data && (data as any).error && !(data as any).assistant_message) {
        throw new Error((data as any).error);
      }

      if (error) throw error;

      if (data?.assistant_message) {
        const assistantMessage: TutorMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.assistant_message,
          createdAt: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        if (data.session_id && !sessionId) {
          setSessionId(data.session_id);
        }
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      let errorMessage = 'Failed to get response from tutor. Please try again.';
      
      if (error.message?.includes('LOVABLE_API_KEY not configured') || 
          error.message?.includes('Tutor is not configured on the server')) {
        errorMessage = 'The tutor is not fully configured on the server yet. Please contact support.';
      } else if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (error.message?.includes('402') || error.message?.includes('credits exhausted')) {
        errorMessage = 'AI credits exhausted. Please contact support.';
      } else if (error.message && error.message.length < 200 && !error.message.includes('fetch')) {
        // Show the actual error message if it's user-safe
        errorMessage = error.message;
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });

      // Remove the user message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }, [context, messages, sessionId]);

  return (
    <TutorContext.Provider
      value={{
        isOpen,
        messages,
        context,
        loading,
        sessionId,
        openTutor,
        closeTutor,
        sendUserMessage,
        setProblemContext,
        clearMessages,
      }}
    >
      {children}
    </TutorContext.Provider>
  );
}

export function useTutor() {
  const context = useContext(TutorContext);
  if (context === undefined) {
    throw new Error('useTutor must be used within a TutorProvider');
  }
  return context;
}
