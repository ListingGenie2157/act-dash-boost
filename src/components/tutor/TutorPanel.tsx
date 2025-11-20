import React, { useRef, useEffect, useState } from 'react';
import { X, Send, RotateCcw } from 'lucide-react';
import { useTutor } from '@/hooks/useTutor';
import { TutorMessage } from './TutorMessage';
import { TutorContextDisplay } from './TutorContextDisplay';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export function TutorPanel() {
  const { isOpen, closeTutor, messages, context, loading, sendUserMessage, clearMessages } = useTutor();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const message = input;
    setInput('');
    await sendUserMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    if (confirm('Clear conversation history?')) {
      clearMessages();
    }
  };

  if (!context) return null;

  const modeColors = {
    practice: 'default',
    quiz: 'secondary',
    test: 'destructive',
  } as const;

  return (
    <Sheet open={isOpen} onOpenChange={closeTutor}>
      <SheetContent side="right" className="w-full sm:w-[500px] p-0 flex flex-col">
        <SheetHeader className="p-4 pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <SheetTitle className="text-lg">Homework Tutor</SheetTitle>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {context.subject.replace('_', ' ')}
                </Badge>
                <Badge variant={modeColors[context.mode]} className="text-xs capitalize">
                  {context.mode}
                </Badge>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={closeTutor}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <Separator />

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 pt-3">
            <TutorContextDisplay context={context} />
          </div>

          <ScrollArea className="flex-1 px-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center text-muted-foreground text-sm px-4 py-8">
                <div>
                  <p className="mb-2">👋 Hi! I'm your homework tutor.</p>
                  <p>Ask me anything about this problem, or tell me what you're stuck on.</p>
                  {context.mode === 'quiz' || context.mode === 'test' ? (
                    <p className="mt-4 text-xs">
                      ⚠️ Since you're in {context.mode} mode, I won't give direct answers, but I can help you think through it!
                    </p>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="space-y-2 pb-4">
                {messages.map((message) => (
                  <TutorMessage key={message.id} message={message} />
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <div className="p-4 border-t border-border">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="mb-2 text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Clear Conversation
              </Button>
            )}
            <div className="flex gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={loading ? 'Waiting for response...' : 'Ask a question... (Enter to send, Shift+Enter for new line)'}
                disabled={loading}
                className="min-h-[60px] max-h-[120px] resize-none"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                size="icon"
                className="shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
