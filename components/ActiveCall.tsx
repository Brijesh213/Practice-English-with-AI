import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, PhoneOff, MessageSquare, Shield } from 'lucide-react';
import AudioVisualizer from './AudioVisualizer';
import { GeminiLiveService } from '../services/geminiLiveService';
import { AppSettings, TranscriptItem } from '../types';
import { AVATAR_URL } from '../constants';

interface Props {
  settings: AppSettings;
  onEndCall: (duration: number, transcripts: TranscriptItem[]) => void;
}

const ActiveCall: React.FC<Props> = ({ settings, onEndCall }) => {
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [status, setStatus] = useState<'Connecting...' | 'Connected' | 'Error'>('Connecting...');
  
  const serviceRef = useRef<GeminiLiveService | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial Connection
  useEffect(() => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      setStatus('Error');
      alert('API Key is missing');
      return;
    }

    const service = new GeminiLiveService(
      apiKey,
      (text, isUser, isFinal) => {
        setTranscripts(prev => {
          // Simplistic logic to append or update last message
          // Ideally, we handle partials more gracefully, but for demo:
          const last = prev[prev.length - 1];
          if (last && last.speaker === (isUser ? 'user' : 'model') && !last.isCorrection) { // isCorrection is just a placeholder logic
             // If we wanted real-time stream update, we'd replace the last one
             // Here we just append finalized chunks or update current
             if (isFinal) {
                 return [...prev.slice(0, -1), { ...last, text: last.text + " " + text }];
             }
             return prev; 
          }
          if (text.trim()) {
              return [...prev, { speaker: isUser ? 'user' : 'model', text, timestamp: Date.now() }];
          }
          return prev;
        });
      },
      (level) => setAudioLevel(level)
    );

    serviceRef.current = service;

    service.connect(settings)
      .then(() => setStatus('Connected'))
      .catch((err) => {
        console.error(err);
        setStatus('Error');
      });

    const timer = setInterval(() => setDuration(d => d + 1), 1000);

    return () => {
      clearInterval(timer);
      service.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once

  // Auto scroll transcript
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts, showTranscript]);

  const handleEndCall = () => {
    serviceRef.current?.disconnect();
    onEndCall(duration, transcripts);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 relative overflow-hidden">
        
      {/* Top Bar */}
      <div className="pt-8 pb-4 px-6 flex justify-between items-center z-10 bg-gradient-to-b from-gray-900/80 to-transparent">
        <div className="flex items-center space-x-3">
           <img src={AVATAR_URL} className="w-10 h-10 rounded-full border border-gray-700" alt="Mevy" />
           <div>
             <h2 className="text-white font-medium text-sm">Mevy</h2>
             <p className="text-green-400 text-xs flex items-center gap-1">
               <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
               {formatTime(duration)}
             </p>
           </div>
        </div>
        <div className="flex items-center space-x-2">
            <button 
                onClick={() => setShowTranscript(!showTranscript)}
                className={`p-2 rounded-full ${showTranscript ? 'bg-white/20 text-white' : 'text-gray-500'}`}
            >
                <MessageSquare size={20} />
            </button>
            <Shield size={16} className="text-gray-600" />
        </div>
      </div>

      {/* Main Visual Area */}
      <div className="flex-1 flex flex-col justify-center items-center relative">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
            <AudioVisualizer 
                audioLevel={audioLevel} 
                isActive={status === 'Connected'} 
            />
        </div>
        
        {/* Transcript Overlay */}
        {showTranscript && (
            <div 
                ref={scrollRef}
                className="absolute bottom-4 left-4 right-4 h-48 overflow-y-auto bg-black/40 backdrop-blur-sm rounded-xl p-4 mask-image-linear-gradient"
                style={{ maskImage: 'linear-gradient(to bottom, transparent, black 20%)' }}
            >
                {transcripts.length === 0 && <p className="text-gray-500 text-center text-sm mt-10">Conversation starting...</p>}
                {transcripts.map((t, i) => (
                    <div key={i} className={`mb-2 text-sm ${t.speaker === 'user' ? 'text-right text-gray-300' : 'text-left text-rose-200'}`}>
                        <span className="font-bold opacity-50 block text-xs mb-0.5">{t.speaker === 'user' ? 'You' : 'Mevy'}</span>
                        {t.text}
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-900 pb-12 pt-6 rounded-t-3xl shadow-2xl">
        <div className="flex justify-center items-center gap-8">
            <button 
                className={`p-4 rounded-full transition-colors ${isMuted ? 'bg-white text-gray-900' : 'bg-gray-800 text-white'}`}
                onClick={() => setIsMuted(!isMuted)}
                // Note: Muting logic would need to suspend the ScriptProcessor or gain node, not implemented in minimal service for brevity
                title="Mute (Visual Only in Demo)"
            >
                {isMuted ? <MicOff size={28}/> : <Mic size={28}/>}
            </button>

            <button 
                onClick={handleEndCall}
                className="p-6 rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition-transform active:scale-95"
            >
                <PhoneOff size={32} fill="currentColor" />
            </button>
        </div>
        <p className="text-center text-gray-500 text-xs mt-6">AI generated voice. Content may be inaccurate.</p>
      </div>
    </div>
  );
};

export default ActiveCall;