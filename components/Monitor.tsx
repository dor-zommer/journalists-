import React, { useState } from 'react';
import { monitorTopics } from '../services/geminiService';
import { Search, Loader2, Plus, X, Bell, ShieldAlert, FileText, Building2, Gavel, Mail, Smartphone, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { GroundingSource } from '../types';

const Monitor: React.FC = () => {
  const [topics, setTopics] = useState<string[]>(['רפורמה משפטית', 'דיור ותכנון']);
  const [newTopic, setNewTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ text: string; sources: GroundingSource[] } | null>(null);
  
  // Notification State Mock
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const addTopic = () => {
    if (newTopic.trim() && !topics.includes(newTopic.trim())) {
      setTopics([...topics, newTopic.trim()]);
      setNewTopic('');
    }
  };

  const removeTopic = (tToRemove: string) => {
    setTopics(topics.filter(t => t !== tToRemove));
  };

  const runMonitor = async () => {
    if (topics.length === 0) return;
    setLoading(true);
    setResults(null);
    try {
      const data = await monitorTopics(topics);
      setResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
    if (!notificationsEnabled) {
      alert("התראות הופעלו! (הדגמה: במערכת אמיתית תקבל עדכונים במייל וב-SMS)");
    }
  };

  return (
    <div className="max-w-6xl mx-auto lg:h-[calc(100vh-100px)] flex flex-col lg:flex-row gap-6 pb-10 lg:pb-0">
      
      {/* Configuration Panel */}
      <div className="lg:w-80 flex-shrink-0 space-y-4 lg:overflow-y-auto custom-scrollbar">
        
        {/* Keywords Section */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800">
            <Search className="w-5 h-5 text-amber-500" />
            נושאי מעקב
          </h3>
          
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700">הגדר מילות מפתח</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTopic()}
                placeholder="הוסף נושא..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button 
                onClick={addTopic}
                className="bg-amber-100 text-amber-700 p-2 rounded-lg hover:bg-amber-200 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
              {topics.map(topic => (
                <div key={topic} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-md border border-slate-100 group">
                  <span className="text-sm font-medium text-slate-700">{topic}</span>
                  <button 
                    onClick={() => removeTopic(topic)}
                    className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {topics.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4 border-2 border-dashed border-slate-100 rounded-lg">
                  לא הוגדרו נושאים
                </p>
              )}
            </div>

            <button
            onClick={runMonitor}
            disabled={loading || topics.length === 0}
            className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm shadow-amber-200"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            סרוק כעת
          </button>
          </div>
        </div>

        {/* Notifications Settings Mockup */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
           <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-slate-800">
             <Bell className="w-4 h-4 text-slate-500" />
             הגדרות התראה (דמו)
           </h3>
           <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <input 
                  type="checkbox" 
                  checked={notificationsEnabled}
                  onChange={toggleNotifications}
                  className="rounded text-amber-500 focus:ring-amber-500"
                />
                <span>הפעל התראות בזמן אמת</span>
              </div>
              
              <div className={`space-y-3 transition-opacity ${notificationsEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <div>
                   <label className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                     <Mail className="w-3 h-3" /> אימייל
                   </label>
                   <input 
                     type="email" 
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     placeholder="your@email.com"
                     className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:border-amber-500 focus:outline-none"
                   />
                </div>
                <div>
                   <label className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                     <Smartphone className="w-3 h-3" /> נייד (SMS)
                   </label>
                   <input 
                     type="tel" 
                     value={phone}
                     onChange={(e) => setPhone(e.target.value)}
                     placeholder="050-0000000"
                     className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:border-amber-500 focus:outline-none"
                   />
                </div>
                <button className="w-full text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 py-2 rounded flex items-center justify-center gap-1">
                  <Save className="w-3 h-3" /> שמור העדפות
                </button>
              </div>
           </div>
        </div>
      </div>

      {/* Results Feed */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 lg:overflow-hidden flex flex-col min-h-[500px] lg:min-h-0">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
           <h3 className="font-bold text-slate-800">פיד התראות ועדכונים</h3>
           <div className="flex gap-2">
              <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100 flex items-center gap-1">
                 <Building2 className="w-3 h-3" /> תכנון
              </span>
              <span className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded-full border border-red-100 flex items-center gap-1">
                 <ShieldAlert className="w-3 h-3" /> רכש
              </span>
              <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full border border-green-100 flex items-center gap-1">
                 <Gavel className="w-3 h-3" /> חקיקה
              </span>
           </div>
        </div>
        
        <div className="flex-1 lg:overflow-y-auto p-6 custom-scrollbar">
          {!results && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Search className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>הגדר מילות מפתח ולח על "סרוק כעת"</p>
            </div>
          )}

          {loading && (
            <div className="space-y-6 animate-pulse p-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4">
                  <div className="w-2 h-24 bg-slate-200 rounded-full"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {results && !loading && (
            <div className="space-y-8">
              <div className="prose prose-sm prose-amber max-w-none">
                <ReactMarkdown>{results.text}</ReactMarkdown>
              </div>

              {results.sources.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mt-6">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">קישורים ישירים</h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {results.sources.map((source, i) => (
                      <li key={i}>
                        <a 
                          href={source.uri} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-blue-600 hover:underline text-xs flex items-center gap-2 truncate"
                        >
                          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0"></span>
                          <span className="truncate">{source.title}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Monitor;