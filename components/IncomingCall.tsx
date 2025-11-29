import React from 'react';
import { Phone, PhoneOff } from 'lucide-react';
import { AVATAR_URL } from '../constants';

interface Props {
  onAccept: () => void;
  onDecline: () => void;
  settings: any;
}

const IncomingCall: React.FC<Props> = ({ onAccept, onDecline, settings }) => {
  return (
    <div className="flex flex-col h-full justify-between items-center py-12 px-6 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-850">
      
      <div className="mt-8 flex flex-col items-center animate-pulse-slow">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-rose-500/30 shadow-[0_0_40px_rgba(244,63,94,0.3)] mb-6">
          <img src={AVATAR_URL} alt="Mevy" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-4xl font-light text-white mb-2 tracking-wide">Mevy</h1>
        <p className="text-rose-200 text-lg font-medium">Incoming Audio Call...</p>
        <div className="mt-2 text-gray-400 text-sm">
           {settings.learningMode} Mode • {settings.voice}
        </div>
      </div>

      <div className="w-full max-w-sm grid grid-cols-2 gap-8 mb-12">
        <div className="flex flex-col items-center space-y-3">
          <button 
            onClick={onDecline}
            className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg transform transition active:scale-95 hover:bg-red-600"
          >
            <PhoneOff size={32} />
          </button>
          <span className="text-gray-400 text-sm font-medium">Decline</span>
        </div>
        
        <div className="flex flex-col items-center space-y-3">
          <button 
            onClick={onAccept}
            className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg animate-bounce-gentle transform transition active:scale-95 hover:bg-green-600"
          >
            <Phone size={32} />
          </button>
          <span className="text-gray-400 text-sm font-medium">Accept</span>
        </div>
      </div>
    </div>
  );
};

export default IncomingCall;