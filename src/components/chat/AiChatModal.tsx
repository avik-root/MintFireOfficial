
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, User } from 'lucide-react';
import { chatAssistant, ChatAssistantInput } from '@/ai/flows/ai-chat-assistant';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

const AiChatModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputValue.trim() === '') return;

    const userMessage: Message = { id: Date.now().toString(), text: inputValue, sender: 'user' };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const input: ChatAssistantInput = { query: userMessage.text };
      const result = await chatAssistant(input);
      const aiMessage: Message = { id: (Date.now() + 1).toString(), text: result.response, sender: 'ai' };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error('Error calling AI assistant:', error);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: "Sorry, I couldn't connect to the AI assistant. Please try again later.",
      });
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble connecting right now. Please try again later.",
        sender: 'ai'
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        className="fixed bottom-6 right-6 rounded-full w-16 h-16 shadow-lg bg-primary hover:bg-primary/80 text-primary-foreground z-50"
        onClick={() => setIsOpen(true)}
        aria-label="Open AI Chat"
      >
        <Bot size={28} className="text-accent" />
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px] md:max-w-[600px] lg:max-w-[700px] h-[80vh] flex flex-col p-0 border-primary shadow-2xl shadow-primary/30">
        <DialogHeader className="p-4 border-b border-border sticky top-0 bg-card z-10">
          <DialogTitle className="flex items-center font-headline text-xl">
            <Bot className="mr-2 text-accent" /> MintFire AI Assistant
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-grow p-4 bg-background/70" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-end space-x-3 ${
                  message.sender === 'user' ? 'justify-end' : ''
                }`}
              >
                {message.sender === 'ai' && (
                  <div className="p-2 bg-muted rounded-full mb-1">
                    <Bot className="w-5 h-5 text-accent" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-lg max-w-[75%] shadow-md ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-card-foreground border border-border'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                </div>
                {message.sender === 'user' && (
                   <div className="p-2 bg-muted rounded-full mb-1">
                    <User className="w-5 h-5 text-accent" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start space-x-3">
                 <div className="p-2 bg-muted rounded-full">
                   <Bot className="w-5 h-5 text-accent animate-pulse" />
                 </div>
                <div className="p-3 rounded-lg bg-card text-card-foreground border border-border">
                  <p className="text-sm italic">MintFire AI is thinking...</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <DialogFooter className="p-4 border-t border-border sticky bottom-0 bg-card z-10">
          <div className="flex w-full space-x-2">
            <Input
              type="text"
              placeholder="Ask about our products or services..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
              className="flex-grow focus-visible:ring-accent"
              disabled={isLoading}
            />
            <Button onClick={handleSendMessage} disabled={isLoading} className="bg-accent hover:bg-accent/80 text-accent-foreground">
              <Send className="w-5 h-5" />
              <span className="sr-only">Send message</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AiChatModal;
