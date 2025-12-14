import React, { useState } from 'react';
import { processTextWithGemini } from '../services/geminiService';
import { Sparkles, Copy, Loader2, Check, PenTool, FileText, Type, Quote, Radio } from 'lucide-react';

const SmartEditor: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleProcess = async (task: 'proofread' | 'summarize' | 'headlines' | 'quotes' | 'to_news') => {
    if (!inputText.trim()) return;
    setLoading(true);
    setActiveTask(task);
    setOutputText('');
    try {
      const result = await processTextWithGemini(inputText, task);
      setOutputText(result);
    } catch (error) {
      console.error(error);
      setOutputText("אירעה שגיאה. נסה שנית.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tools = [
    { id: 'proofread', label: 'עריכה לשונית', icon: PenTool, color: 'text-blue-600', bg: 'bg-blue-50 hover:bg-blue-100' },
    { id: 'summarize', label: 'תקציר מנהלים', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50 hover:bg-purple-100' },
    { id: 'headlines', label: 'הצעת כותרות', icon: Type, color: 'text-pink-600', bg: 'bg-pink-50 hover:bg-pink-100' },
    { id: 'quotes', label: 'חילוץ ציטוטים', icon: Quote, color: 'text-orange-600', bg: 'bg-orange-50 hover:bg-orange-100' },
    { id: 'to_news', label: 'הפוך למבזק חדשות', icon: Radio, color: 'text-red-600', bg: 'bg-red-50 hover:bg-red-100' },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col gap-6 pb-10">
      <div className="flex items-center justify-between">
         <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900">
               <Sparkles className="w-6 h-6 text-indigo-500" />
               סטודיו AI
            </h1>
            <p className="text-slate-500 text-sm mt-1">
               כלי עזר חכם לעריכה, סיכום ושכתוב טקסטים גולמיים
            </p>
         </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        
        {/* Input Column */}
        <div className="flex flex-col gap-4">
           <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="הדבק כאן טקסט גולמי (הודעה לעיתונות, פרוטוקול, טיוטה)..."
                className="flex-1 w-full p-4 text-slate-700 placeholder:text-slate-300 outline-none resize-none text-base leading-relaxed"
                dir="rtl"
              />
              <div className="mt-2 text-xs text-slate-400 text-left px-2">
                {inputText.length} תווים
              </div>
           </div>

           {/* Toolbar */}
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {tools.map((tool) => {
                 const Icon = tool.icon;
                 const isActive = activeTask === tool.id;
                 return (
                   <button
                     key={tool.id}
                     onClick={() => handleProcess(tool.id)}
                     disabled={loading || !inputText}
                     className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl transition-all border ${
                       isActive 
                         ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-sm' 
                         : 'border-transparent'
                     } ${tool.bg} ${!inputText ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                   >
                     <Icon className={`w-5 h-5 ${tool.color}`} />
                     <span className={`text-xs font-bold ${tool.color}`}>{tool.label}</span>
                   </button>
                 );
              })}
           </div>
        </div>

        {/* Output Column */}
        <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 flex flex-col overflow-hidden relative">
           
           <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <span className="text-slate-400 text-sm font-medium flex items-center gap-2">
                 {loading ? <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> : <Sparkles className="w-4 h-4 text-indigo-400" />}
                 {loading ? 'מעבד נתונים...' : 'תוצאה'}
              </span>
              
              {outputText && (
                <button 
                  onClick={copyToClipboard}
                  className="text-xs flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg"
                >
                  {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'הועתק!' : 'העתק'}
                </button>
              )}
           </div>

           <div className="flex-1 p-6 overflow-y-auto custom-scrollbar relative">
              {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                  <div className="w-16 h-16 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                  <p className="animate-pulse">Gemini חושב...</p>
                </div>
              ) : outputText ? (
                <div className="prose prose-invert max-w-none leading-loose whitespace-pre-wrap text-slate-300">
                   {outputText}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-700 opacity-50">
                   <Sparkles className="w-16 h-16 mb-4" />
                   <p>התוצאה תופיע כאן</p>
                </div>
              )}
           </div>
        </div>

      </div>
    </div>
  );
};

export default SmartEditor;
