import React, { useState } from 'react';
import { CallState, AppSettings, LearningMode, VoiceName, CallSummaryData } from './types';
import IncomingCall from './components/IncomingCall';
import ActiveCall from './components/ActiveCall';
import CallSummary from './components/CallSummary';
import { Settings, Play, User } from 'lucide-react';

const DEFAULT_SETTINGS: AppSettings = {
  userName: 'User',
  voice: VoiceName.KORE,
  learningMode: LearningMode.CASUAL,
  is18Plus: false,
  saveRecordings: false,
};

function App() {
  const [callState, setCallState] = useState<CallState>(CallState.IDLE);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [lastCallData, setLastCallData] = useState<CallSummaryData | null>(null);

  // --- Handlers ---

  const startCallFlow = () => {
    // Simulate network delay before "ringing"
    setCallState(CallState.INCOMING);
  };

  const acceptCall = () => {
    setCallState(CallState.ACTIVE);
  };

  const declineCall = () => {
    setCallState(CallState.IDLE);
  };

  const endCall = (durationSeconds: number, transcripts: any[]) => {
    setLastCallData({
      durationSeconds,
      transcripts,
      corrections: [] // Mocked in summary component for now
    });
    setCallState(CallState.SUMMARY);
  };

  // --- Renders ---

  if (callState === CallState.INCOMING) {
    return (
      <div className="h-screen w-full max-w-md mx-auto bg-gray-900 overflow-hidden shadow-2xl relative">
        <IncomingCall 
          onAccept={acceptCall} 
          onDecline={declineCall} 
          settings={settings}
        />
      </div>
    );
  }

  if (callState === CallState.ACTIVE) {
    return (
      <div className="h-screen w-full max-w-md mx-auto bg-gray-900 overflow-hidden shadow-2xl relative">
        <ActiveCall settings={settings} onEndCall={endCall} />
      </div>
    );
  }

  if (callState === CallState.SUMMARY && lastCallData) {
    return (
      <div className="h-screen w-full max-w-md mx-auto bg-white overflow-hidden shadow-2xl relative">
        <CallSummary 
            data={lastCallData} 
            onRestart={startCallFlow} 
            onHome={() => setCallState(CallState.IDLE)} 
        />
      </div>
    );
  }

  // IDLE / DASHBOARD STATE
  return (
    <div className="h-screen w-full max-w-md mx-auto bg-gray-50 flex flex-col shadow-2xl overflow-y-auto">
      {/* Header */}
      <header className="p-6 bg-white border-b border-gray-100">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Mevy</h1>
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-500">
                <User size={18} />
            </div>
        </div>
        <p className="text-gray-500 text-sm mt-1">Your AI Language Partner</p>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 space-y-6">
        
        {/* Call Card */}
        <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
            <h2 className="text-xl font-bold mb-2">Practice Speaking</h2>
            <p className="text-rose-100 text-sm mb-6 max-w-[80%]">Ready for a conversation? Mevy is online and ready to help.</p>
            <button 
                onClick={startCallFlow}
                className="w-full bg-white text-rose-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform"
            >
                <Play size={20} fill="currentColor" /> Start Call
            </button>
        </div>

        {/* Settings Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4 text-gray-800 font-semibold">
                <Settings size={20} className="text-gray-400" /> Session Settings
            </div>

            {/* Mode Selection */}
            <div className="mb-4">
                <label className="block text-xs font-medium text-gray-400 uppercase mb-2">Learning Mode</label>
                <div className="grid grid-cols-3 gap-2">
                    {Object.values(LearningMode).map(mode => (
                        <button
                            key={mode}
                            onClick={() => setSettings({...settings, learningMode: mode})}
                            className={`py-2 px-1 rounded-lg text-xs font-medium border transition-colors ${
                                settings.learningMode === mode 
                                ? 'bg-rose-50 border-rose-200 text-rose-600' 
                                : 'border-gray-100 text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                            {mode.charAt(0) + mode.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Voice Selection */}
            <div className="mb-4">
                <label className="block text-xs font-medium text-gray-400 uppercase mb-2">Voice Persona</label>
                <select 
                    value={settings.voice}
                    onChange={(e) => setSettings({...settings, voice: e.target.value as VoiceName})}
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-200"
                >
                    {Object.values(VoiceName).map(v => (
                        <option key={v} value={v}>{v}</option>
                    ))}
                </select>
            </div>

            {/* 18+ Toggle */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-50">
                <span className="text-sm text-gray-600">Romantic Tone (18+)</span>
                <button 
                    onClick={() => setSettings(s => ({...s, is18Plus: !s.is18Plus}))}
                    className={`w-12 h-6 rounded-full transition-colors relative ${settings.is18Plus ? 'bg-rose-500' : 'bg-gray-200'}`}
                >
                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.is18Plus ? 'translate-x-6' : ''}`} />
                </button>
            </div>
        </div>

        <p className="text-xs text-center text-gray-400 px-4">
            By starting a call, you agree to our <span className="underline cursor-pointer">Privacy Policy</span>. Audio is processed for the duration of the session.
        </p>

      </main>
    </div>
  );
}

export default App;