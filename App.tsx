import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ScenarioSelector } from './components/ScenarioSelector';
import { ChatBubble } from './components/ChatBubble';
import { Scenario, ChatMessage, Role } from './types';
import { createChatSession, sendMessageToChat, generateSpeech } from './services/geminiService';
import { Chat } from '@google/genai';
import { MicrophoneIcon, PaperAirplaneIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';

const App: React.FC = () => {
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  // Refs for Chat and Audio
  const chatSessionRef = useRef<Chat | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null); // For SpeechRecognition

  // Initialize AudioContext
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  // Initialize SpeechRecognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'en-US'; // We want the user to speak English
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(prev => prev + (prev ? ' ' : '') + transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Start Scenario
  const handleSelectScenario = async (scenario: Scenario) => {
    setActiveScenario(scenario);
    setMessages([]);
    setIsLoading(true);

    try {
      chatSessionRef.current = createChatSession(scenario.initialPrompt);
      
      // Initial greeting from AI (Empty message to trigger the greeting based on system instruction, 
      // but usually the system instruction sets the persona. We need to prompt it to start.)
      const response = await sendMessageToChat(chatSessionRef.current, "Start the roleplay now. Greet me.");
      
      const audioBuffer = await generateSpeech(response.characterResponse);

      const initialMessage: ChatMessage = {
        id: Date.now().toString(),
        role: Role.MODEL,
        text: response.characterResponse,
        translation: response.translation,
        feedback: undefined, // No feedback on first message
        audioData: audioBuffer || undefined,
        isAudioPlaying: false
      };

      setMessages([initialMessage]);
      if (audioBuffer) playAudio(audioBuffer, initialMessage.id);
      
    } catch (error) {
      console.error("Failed to start scenario", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !chatSessionRef.current) return;

    const userMsgId = Date.now().toString();
    const userMessage: ChatMessage = {
      id: userMsgId,
      role: Role.USER,
      text: inputText,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await sendMessageToChat(chatSessionRef.current, userMessage.text);
      
      // Generate audio in parallel if possible, but sequential is safer for logic
      const audioBuffer = await generateSpeech(response.characterResponse);

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        text: response.characterResponse,
        translation: response.translation,
        feedback: response.feedback,
        audioData: audioBuffer || undefined,
        isAudioPlaying: false
      };

      setMessages(prev => [...prev, aiMessage]);
      if (audioBuffer) playAudio(audioBuffer, aiMessage.id);

    } catch (error) {
      console.error("Error sending message", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  // Audio Playback Logic
  const playAudio = useCallback(async (buffer: AudioBuffer, messageId: string) => {
    if (!audioContextRef.current) return;

    // Resume context if suspended (browser policy)
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    
    // Update state to show playing icon
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isAudioPlaying: true } : { ...m, isAudioPlaying: false }));
    
    source.onended = () => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isAudioPlaying: false } : m));
    };

    source.start();
  }, []);

  const handleManualPlayAudio = (message: ChatMessage) => {
    if (message.audioData) {
      playAudio(message.audioData, message.id);
    }
  };

  const handleExit = () => {
    setActiveScenario(null);
    setMessages([]);
    chatSessionRef.current = null;
  };

  // --- RENDER ---

  if (!activeScenario) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <ScenarioSelector onSelect={handleSelectScenario} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white md:max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
      
      {/* Header */}
      <header className={`flex items-center p-4 shadow-sm z-10 ${activeScenario.color.split(' ')[0]} bg-opacity-20 backdrop-blur-md`}>
        <button onClick={handleExit} className="p-2 hover:bg-black/10 rounded-full transition-colors mr-3">
          <ArrowLeftIcon className="w-6 h-6 text-slate-700" />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span>{activeScenario.icon}</span>
            {activeScenario.title}
          </h2>
          <p className="text-xs text-slate-600 truncate max-w-xs">{activeScenario.description}</p>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-6">
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} onPlayAudio={handleManualPlayAudio} />
        ))}
        
        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 p-4 animate-pulse">
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="relative flex items-end gap-2 bg-slate-100 rounded-3xl p-2 pr-2 shadow-inner focus-within:ring-2 focus-within:ring-blue-300 transition-shadow">
          
          <button
            onClick={toggleRecording}
            className={`p-3 rounded-full transition-all duration-300 flex-shrink-0 ${
              isRecording 
                ? 'bg-red-500 text-white shadow-red-300 shadow-lg scale-110 animate-pulse' 
                : 'bg-white text-slate-500 hover:text-blue-500 hover:bg-blue-50'
            }`}
            title="Falar (Hold)"
          >
            <MicrophoneIcon className="w-6 h-6" />
          </button>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type your answer in English..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 placeholder-slate-400 resize-none py-3 max-h-32 scrollbar-hide"
            rows={1}
            style={{ minHeight: '48px' }}
          />

          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
            className={`p-3 rounded-full transition-all duration-300 flex-shrink-0 ${
              !inputText.trim() || isLoading
                ? 'bg-slate-200 text-slate-400'
                : 'bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:scale-105'
            }`}
          >
            <PaperAirplaneIcon className="w-6 h-6 -ml-0.5" />
          </button>
        </div>
        <p className="text-center text-xs text-slate-400 mt-2">
          Use o microfone para praticar a fala! 🎙️
        </p>
      </div>

    </div>
  );
};

export default App;
