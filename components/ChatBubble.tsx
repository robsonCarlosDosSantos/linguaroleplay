import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Role, WordDefinition } from '../types';
import { SpeakerWaveIcon, PlayIcon, ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { audioBufferToWav } from '../services/audioUtils';
import { getWordDefinition } from '../services/geminiService';

interface ChatBubbleProps {
  message: ChatMessage;
  onPlayAudio: (message: ChatMessage) => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onPlayAudio }) => {
  const isUser = message.role === Role.USER;
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, visible: boolean, word: string, loading: boolean, data: WordDefinition | null }>({
    x: 0,
    y: 0,
    visible: false,
    word: '',
    loading: false,
    data: null
  });

  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setContextMenu(prev => ({ ...prev, visible: false }));
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDownload = () => {
    if (!message.audioData) return;
    
    const blob = audioBufferToWav(message.audioData);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `linguaroleplay_${message.id}.wav`;
    
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleRightClickWord = async (e: React.MouseEvent, rawWord: string) => {
    e.preventDefault();
    // Strip punctuation for API lookup, but keep display logic simple
    const cleanWord = rawWord.replace(/[^\w']/g, '');
    
    if (!cleanWord) return;

    // Calculate position (keep it within viewport roughly)
    const x = Math.min(e.clientX, window.innerWidth - 300);
    const y = e.clientY + 10;

    setContextMenu({
      x,
      y,
      visible: true,
      word: cleanWord,
      loading: true,
      data: null
    });

    const definition = await getWordDefinition(cleanWord, message.text);
    
    if (definition) {
      setContextMenu(prev => ({ ...prev, loading: false, data: definition }));
    } else {
      setContextMenu(prev => ({ ...prev, visible: false })); // Hide if failed
    }
  };

  // Render text split by spaces to allow individual word interaction
  const renderInteractiveText = (text: string) => {
    // Split by spaces but preserve delimiters in the array to reconstruct perfectly
    const parts = text.split(/(\s+)/);
    
    return parts.map((part, index) => {
      // If it's just whitespace, render it
      if (part.match(/^\s+$/)) return <span key={index}>{part}</span>;
      
      return (
        <span 
          key={index}
          onContextMenu={(e) => handleRightClickWord(e, part)}
          className={`cursor-context-menu hover:bg-black/5 rounded px-0.5 transition-colors ${!isUser ? 'hover:text-blue-600 font-medium' : ''}`}
          title="Right-click for definition"
        >
          {part}
        </span>
      );
    });
  };

  return (
    <>
      <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div className={`flex flex-col max-w-[85%] md:max-w-[70%] ${isUser ? 'items-end' : 'items-start'}`}>
          
          {/* Main Message Bubble */}
          <div 
            className={`relative p-4 rounded-2xl shadow-sm text-lg leading-relaxed
              ${isUser 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
              }`}
          >
            <p>
              {isUser ? message.text : renderInteractiveText(message.text)}
            </p>

            {/* Audio Actions for Model */}
            {!isUser && message.audioData && (
              <div className="absolute -right-12 top-2 flex flex-col gap-2">
                
                {/* Play Button */}
                <button 
                  onClick={() => onPlayAudio(message)}
                  className={`p-2 rounded-full transition-colors shadow-sm ${
                    message.isAudioPlaying ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-500'
                  }`}
                  title="Ouvir pronúncia"
                >
                  {message.isAudioPlaying ? (
                    <SpeakerWaveIcon className="w-5 h-5 animate-pulse" />
                  ) : (
                    <PlayIcon className="w-5 h-5" />
                  )}
                </button>

                {/* Download Button */}
                <button 
                  onClick={handleDownload}
                  className="p-2 rounded-full transition-colors shadow-sm bg-slate-100 text-slate-500 hover:bg-green-50 hover:text-green-600"
                  title="Baixar áudio"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Translation (Model Only) */}
          {!isUser && message.translation && (
            <div className="mt-1 ml-1 text-xs text-slate-400 font-medium italic">
              "{message.translation}"
            </div>
          )}

          {/* Feedback (Model Only) */}
          {!isUser && message.feedback && (
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-sm text-yellow-800 flex items-start gap-2 max-w-full">
              <span className="text-lg">💡</span>
              <div>
                <span className="font-bold block text-xs uppercase tracking-wide opacity-70 mb-0.5">Dica:</span>
                {message.feedback}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Dictionary Context Menu */}
      {contextMenu.visible && (
        <div 
          ref={menuRef}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 w-72 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="bg-slate-50 p-3 border-b border-slate-100 flex justify-between items-center">
            <h4 className="font-bold text-slate-700 capitalize">{contextMenu.word}</h4>
            <button 
              onClick={() => setContextMenu(prev => ({ ...prev, visible: false }))}
              className="text-slate-400 hover:text-slate-600"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-4">
            {contextMenu.loading ? (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : contextMenu.data ? (
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Definição</span>
                  <p className="text-slate-800 text-sm mt-0.5 font-medium">{contextMenu.data.portugueseDefinition}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Exemplos</span>
                  <ul className="mt-1 space-y-1.5">
                    {contextMenu.data.examples.map((ex, i) => (
                      <li key={i} className="text-slate-600 text-xs italic bg-slate-50 p-2 rounded border border-slate-100">
                        "{ex}"
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-red-500 text-xs text-center">Não foi possível carregar a definição.</p>
            )}
          </div>
        </div>
      )}
    </>
  );
};