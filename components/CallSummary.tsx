import React from 'react';
import { CallSummaryData } from '../types';
import { RefreshCw, Home } from 'lucide-react';

interface Props {
  data: CallSummaryData;
  onRestart: () => void;
  onHome: () => void;
}

const CallSummary: React.FC<Props> = ({ data, onRestart, onHome }) => {
  // Derive some fake "insights" if transcripts are sparse, 
  // as obtaining a structured summary requires another LLM call which we simulate here or rely on transcripts.
  
  const userTurns = data.transcripts.filter(t => t.speaker === 'user').length;
  const wordCount = data.transcripts.reduce((acc, t) => acc + t.text.split(' ').length, 0);

  return (
    <div className="h-full flex flex-col bg-gray-50 p-6 overflow-y-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Call Summary</h2>
      
      <div className="bg-white rounded-xl p-6 shadow-sm mb-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Session Stats</h3>
        <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-rose-50 rounded-lg">
                <p className="text-2xl font-bold text-rose-600">{Math.floor(data.durationSeconds / 60)}m {data.durationSeconds % 60}s</p>
                <p className="text-xs text-rose-800 font-medium">Duration</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{userTurns}</p>
                <p className="text-xs text-blue-800 font-medium">Your Turns</p>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm mb-6 flex-1">
         <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Mevy's Notes</h3>
         {wordCount < 10 ? (
             <p className="text-gray-500 italic">Call was too short for detailed feedback. Try speaking more next time!</p>
         ) : (
             <ul className="space-y-4">
                 <li className="flex items-start">
                     <span className="inline-block w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                     <span className="text-gray-700">Good job maintaining the flow! You spoke about {Math.floor(wordCount / 2)} words.</span>
                 </li>
                 <li className="flex items-start">
                     <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                     <span className="text-gray-700">Suggestion: Try using more complex sentence structures in the next Tutor Mode session.</span>
                 </li>
                 {/* This would be populated by actual detected errors in a full backend implementation */}
                 <li className="flex items-start">
                     <span className="inline-block w-2 h-2 bg-rose-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                     <span className="text-gray-700">Vocabulary tip: Remember to clearly enunciate ending consonants.</span>
                 </li>
             </ul>
         )}
      </div>

      <div className="flex gap-4">
        <button onClick={onHome} className="flex-1 py-4 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold flex items-center justify-center gap-2 hover:bg-gray-100">
            <Home size={20}/> Home
        </button>
        <button onClick={onRestart} className="flex-1 py-4 rounded-xl bg-rose-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg hover:bg-rose-600">
            <RefreshCw size={20}/> Call Again
        </button>
      </div>
    </div>
  );
};

export default CallSummary;