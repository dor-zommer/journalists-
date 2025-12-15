import React, { useState, useEffect } from 'react';
import { monitorTopics } from '../services/geminiService';
import { Search, Loader2, Plus, X, Globe, Calendar, AlertTriangle, ExternalLink, Clock, Building, Link as LinkIcon, Download, Share2, Mail, MessageCircle, Save, History, CheckCircle, Database, RotateCcw } from 'lucide-react';
import { MonitorResult, TimeRange, MonitorEntity, MonitorResponse, SavedItem, ArchivedScan } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface MonitorProps {
  onSaveToDashboard?: (item: SavedItem) => void;
}

interface RecentSearch {
  id: string;
  topics: string[];
  entities: MonitorEntity[];
  timestamp: Date;
}

const Monitor: React.FC<MonitorProps> = ({ onSaveToDashboard }) => {
  // --- State ---
  const [activeTab, setActiveTab] = useState<'search' | 'history'>('search');
  
  // Search Configuration
  const [topics, setTopics] = useState<string[]>(['רפורמה משפטית', 'דיור ותכנון']);
  const [newTopic, setNewTopic] = useState('');
  
  const [entities, setEntities] = useState<MonitorEntity[]>([]);
  const [newEntityName, setNewEntityName] = useState('');
  const [newEntityUrl, setNewEntityUrl] = useState('');

  const [timeRange, setTimeRange] = useState<TimeRange>('week_window');

  // Recent Searches
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  // Results
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<MonitorResponse | null>(null);

  // History / Archive
  const [archive, setArchive] = useState<ArchivedScan[]>([]);
  const [isSavedToDashboard, setIsSavedToDashboard] = useState(false);

  // --- Effects ---
  useEffect(() => {
    // Load recent searches from local storage
    const savedHistory = localStorage.getItem('journalist_monitor_history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setRecentSearches(parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
      } catch (e) {
        console.error('Failed to load history', e);
      }
    }
  }, []);

  // --- Handlers ---

  const addTopic = () => {
    if (newTopic.trim() && !topics.includes(newTopic.trim())) {
      setTopics([...topics, newTopic.trim()]);
      setNewTopic('');
    }
  };

  const removeTopic = (tToRemove: string) => {
    setTopics(topics.filter(t => t !== tToRemove));
  };

  const addEntity = () => {
    if (newEntityName.trim()) {
      const newEntity: MonitorEntity = {
        id: uuidv4(),
        name: newEntityName.trim(),
        url: newEntityUrl.trim() || undefined,
        type: 'body'
      };
      setEntities([...entities, newEntity]);
      setNewEntityName('');
      setNewEntityUrl('');
    }
  };

  const removeEntity = (id: string) => {
    setEntities(entities.filter(e => e.id !== id));
  };

  const saveToHistory = () => {
    const newSearch: RecentSearch = {
      id: uuidv4(),
      topics: [...topics],
      entities: [...entities],
      timestamp: new Date()
    };

    setRecentSearches(prev => {
      // Avoid duplicates at the top of the list
      if (prev.length > 0) {
        const last = prev[0];
        const isTopicsSame = JSON.stringify(last.topics.sort()) === JSON.stringify(topics.sort());
        const isEntitiesSame = JSON.stringify(last.entities) === JSON.stringify(entities);
        if (isTopicsSame && isEntitiesSame) return prev;
      }

      const updated = [newSearch, ...prev].slice(0, 5); // Keep last 5
      localStorage.setItem('journalist_monitor_history', JSON.stringify(updated));
      return updated;
    });
  };

  const restoreSearch = (search: RecentSearch) => {
    setTopics([...search.topics]);
    setEntities([...search.entities]);
  };

  const runMonitor = async () => {
    if (topics.length === 0 && entities.length === 0) return;
    
    saveToHistory();
    
    setLoading(true);
    setResponse(null);
    setIsSavedToDashboard(false);
    try {
      const data = await monitorTopics(topics, entities, timeRange);
      setResponse(data);
    } catch (e) {
      console.error(e);
      // Fallback
      setResponse({ executiveSummary: [], results: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToArchive = () => {
    if (!response) return;
    const newScan: ArchivedScan = {
      id: uuidv4(),
      date: new Date(),
      topics: [...topics],
      data: response
    };
    setArchive([newScan, ...archive]);
    setActiveTab('history');
  };

  const handleSaveToDashboard = () => {
    if (!response || !onSaveToDashboard) return;
    
    // Convert to Markdown
    let md = `## דו"ח מוניטור: ${topics.join(', ')}\n`;
    md += `**טווח זמן:** ${timeRanges.find(t => t.id === timeRange)?.label}\n\n`;
    
    if (response.executiveSummary.length > 0) {
      md += `### תקציר מנהלים\n`;
      response.executiveSummary.forEach(point => md += `* ${point}\n`);
      md += `\n`;
    }

    md += `### ממצאים עיקריים\n`;
    md += `| תאריך | כותרת | מקור | רלוונטיות |\n|---|---|---|---|\n`;
    response.results.forEach(r => {
      md += `| ${r.date} | [${r.title}](${r.url}) | ${r.source} | ${r.relevanceScore}/10 |\n`;
    });

    const newItem: SavedItem = {
      id: Date.now().toString(),
      category: 'מוניטור רשת',
      categoryType: 'government_agenda', // fallback type for icon
      content: md,
      timestamp: new Date(),
      sources: response.results.map(r => ({ title: r.title, uri: r.url }))
    };

    onSaveToDashboard(newItem);
    setIsSavedToDashboard(true);
  };

  const handleShare = (platform: 'whatsapp' | 'email') => {
    if (!response) return;
    const text = `דו"ח מוניטור (${new Date().toLocaleDateString()}):
    ${response.executiveSummary.join('\n- ')}
    
    קישור למערכת JournalistAI`;
    
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    } else {
      window.open(`mailto:?subject=דו"ח מוניטור חדש&body=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const handleDownload = () => {
    if (!response) return;
    const content = JSON.stringify(response, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monitor-report-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const timeRanges: {id: TimeRange, label: string}[] = [
    { id: '24h_window', label: 'אתמול והיום (72 שעות)' },
    { id: 'week_window', label: 'פרזנט פרוגרסיב (שבוע עבר+עתיד)' },
    { id: 'current_month', label: 'החודש הנוכחי (קלנדרי)' },
  ];

  return (
    <div className="max-w-7xl mx-auto lg:h-[calc(100vh-100px)] flex flex-col gap-4 pb-10 lg:pb-0">
      
      {/* Top Bar Navigation */}
      <div className="flex justify-between items-center bg-white p-2 rounded-xl shadow-sm border border-slate-200">
         <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('search')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'search' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Search className="w-4 h-4" />
              מוניטור פעיל
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'history' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <History className="w-4 h-4" />
              ארכיון דוחות ({archive.length})
            </button>
         </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        
        {/* Configuration Panel (Left) */}
        {activeTab === 'search' && (
          <div className="lg:w-80 flex-shrink-0 flex flex-col gap-4 lg:overflow-y-auto custom-scrollbar">
            
            {/* Time Range */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
               <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-slate-800">
                <Clock className="w-4 h-4 text-slate-500" />
                טווח זמנים
              </h3>
              <div className="space-y-1">
                {timeRanges.map((range) => (
                  <button
                    key={range.id}
                    onClick={() => setTimeRange(range.id)}
                    className={`w-full text-right px-3 py-2 text-xs rounded-md transition-all border ${
                      timeRange === range.id
                        ? 'bg-amber-50 border-amber-200 text-amber-700 font-bold'
                        : 'bg-white border-transparent text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Keywords */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-slate-800">
                <Search className="w-4 h-4 text-slate-500" />
                מילות מפתח
              </h3>
              
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTopic()}
                  placeholder="הוסף נושא..."
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button onClick={addTopic} className="bg-slate-100 text-slate-700 p-2 rounded-lg hover:bg-slate-200">
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {topics.map(topic => (
                  <div key={topic} className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-200 text-xs text-slate-700">
                    <span>{topic}</span>
                    <button onClick={() => removeTopic(topic)} className="text-slate-400 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Entities */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex-1">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-slate-800">
                <Building className="w-4 h-4 text-slate-500" />
                גופים ועמותות (Entities)
              </h3>
              
              <div className="space-y-2 mb-3">
                 <input
                  type="text"
                  value={newEntityName}
                  onChange={(e) => setNewEntityName(e.target.value)}
                  placeholder="שם הגוף / עמותה"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <div className="flex gap-2">
                   <input
                    type="text"
                    value={newEntityUrl}
                    onChange={(e) => setNewEntityUrl(e.target.value)}
                    placeholder="קישור (אופציונלי)"
                    dir="ltr"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-right"
                  />
                  <button onClick={addEntity} className="bg-amber-100 text-amber-700 px-3 rounded-lg hover:bg-amber-200 font-medium text-sm">
                    הוסף
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                 {entities.map(entity => (
                   <div key={entity.id} className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-200">
                      <div className="flex items-center gap-2 overflow-hidden">
                         <div className={`w-2 h-2 rounded-full ${entity.url ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                         <span className="text-xs font-medium truncate" title={entity.name}>{entity.name}</span>
                         {entity.url && <a href={entity.url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline"><LinkIcon className="w-3 h-3"/></a>}
                      </div>
                      <button onClick={() => removeEntity(entity.id)} className="text-slate-400 hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                   </div>
                 ))}
              </div>

              <button
                onClick={runMonitor}
                disabled={loading || (topics.length === 0 && entities.length === 0)}
                className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-md"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                בצע סריקת עומק
              </button>

              {/* Recent Searches Section */}
              {recentSearches.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-200">
                  <h3 className="font-bold text-sm mb-3 text-slate-400 flex items-center gap-2">
                    <History className="w-4 h-4" />
                    חיפושים אחרונים
                  </h3>
                  <div className="space-y-2">
                    {recentSearches.map(search => (
                      <button
                        key={search.id}
                        onClick={() => restoreSearch(search)}
                        className="w-full text-right bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-300 p-2.5 rounded-lg group transition-all"
                        title="לחץ לשחזור חיפוש זה"
                      >
                        <div className="flex items-center justify-between mb-1">
                           <span className="text-[10px] text-slate-400">{search.timestamp.toLocaleDateString('he-IL')} {search.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                           <RotateCcw className="w-3 h-3 text-slate-400 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-xs text-slate-700 font-medium truncate">
                          {search.topics.join(', ')}
                        </div>
                        {search.entities.length > 0 && (
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">
                            + {search.entities.length} גופים
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results Area (Right) */}
        <div className="flex-1 bg-transparent flex flex-col min-h-[500px] lg:min-h-0">
          
          {/* History View */}
          {activeTab === 'history' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:overflow-y-auto custom-scrollbar p-1">
                {archive.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center text-slate-400 h-64">
                    <History className="w-12 h-12 opacity-20 mb-3"/>
                    <p>ארכיון הדוחות ריק</p>
                  </div>
                ) : (
                  archive.map(scan => (
                     <div key={scan.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:border-slate-300 transition-all cursor-pointer">
                        <div className="flex justify-between items-start mb-2">
                           <span className="text-xs text-slate-500">{scan.date.toLocaleDateString()}</span>
                           <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px]">{scan.topics.length} נושאים</span>
                        </div>
                        <h4 className="font-bold text-slate-800 mb-2 truncate">{scan.topics.join(', ')}</h4>
                        <div className="text-xs text-slate-500 line-clamp-3 bg-slate-50 p-2 rounded">
                           {scan.data.executiveSummary[0] || 'אין תקציר'}
                        </div>
                        <button 
                          onClick={() => {
                             setResponse(scan.data);
                             setTopics(scan.topics);
                             setActiveTab('search');
                          }}
                          className="w-full mt-3 text-xs bg-white border border-slate-300 py-2 rounded text-slate-700 hover:bg-slate-50"
                        >
                          טען דוח זה
                        </button>
                     </div>
                  ))
                )}
             </div>
          )}

          {/* Search View */}
          {activeTab === 'search' && (
            <div className="flex-1 lg:overflow-y-auto custom-scrollbar p-1">
              {!response && !loading && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <Search className="w-16 h-16 mx-auto mb-4 opacity-10" />
                  <p>הגדר מילות מפתח, גופים וזמנים ולחץ על סריקה</p>
                </div>
              )}

              {loading && (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
                  <p className="text-slate-600 font-medium">סורק את הרשת (מבצע הצלבות מידע)...</p>
                </div>
              )}

              {response && (
                <div className="space-y-6">
                  
                  {/* Executive Summary Section */}
                  <div className="bg-gradient-to-br from-white to-amber-50/50 rounded-xl p-6 shadow-sm border border-amber-100 relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-10">
                        <AlertTriangle className="w-24 h-24 text-amber-500" />
                     </div>
                     <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                           <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                              <AlertTriangle className="w-5 h-5 text-amber-600" />
                              תקציר מנהלים - התפתחויות קריטיות
                           </h2>
                           
                           {/* Actions Toolbar */}
                           <div className="flex gap-2">
                              <button onClick={() => handleShare('whatsapp')} title="שתף בוואטסאפ" className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><MessageCircle className="w-4 h-4"/></button>
                              <button onClick={() => handleShare('email')} title="שלח במייל" className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><Mail className="w-4 h-4"/></button>
                              <button onClick={handleDownload} title="הורד קובץ" className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100"><Download className="w-4 h-4"/></button>
                              <div className="w-px bg-slate-200 mx-1 h-8"></div>
                              <button 
                                onClick={handleSaveToDashboard} 
                                disabled={isSavedToDashboard}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isSavedToDashboard ? 'bg-green-100 text-green-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                              >
                                {isSavedToDashboard ? <CheckCircle className="w-4 h-4"/> : <Database className="w-4 h-4"/>}
                                {isSavedToDashboard ? 'נשמר' : 'שמור לדשבורד'}
                              </button>
                              <button 
                                onClick={handleSaveToArchive}
                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300"
                              >
                                <Save className="w-4 h-4"/>
                                ארכב דוח
                              </button>
                           </div>
                        </div>

                        {response.executiveSummary.length > 0 ? (
                           <ul className="space-y-3">
                              {response.executiveSummary.map((point, i) => (
                                 <li key={i} className="flex items-start gap-3 bg-white/60 p-3 rounded-lg border border-amber-100/50">
                                    <span className="flex-shrink-0 w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-bold text-xs mt-0.5">{i+1}</span>
                                    <span className="text-slate-800 font-medium leading-relaxed">{point}</span>
                                 </li>
                              ))}
                           </ul>
                        ) : (
                           <p className="text-slate-500 italic">לא נמצאו התפתחויות דרמטיות לסיכום.</p>
                        )}
                     </div>
                  </div>

                  {/* Detailed Results Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {response.results.length === 0 ? (
                      <div className="col-span-full text-center py-10 text-slate-500">
                        לא נמצאו תוצאות מפורטות.
                      </div>
                    ) : (
                      response.results.map((item, idx) => (
                        <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow flex flex-col">
                          <div className="flex items-center justify-between mb-3 text-xs">
                             <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded font-bold border ${item.relevanceScore >= 8 ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                  ציון {item.relevanceScore}
                                </span>
                                <span className="text-slate-500">{item.date}</span>
                             </div>
                             <span className="text-slate-500 font-medium truncate max-w-[120px]">{item.source}</span>
                          </div>

                          <h3 className="font-bold text-base text-slate-900 leading-snug mb-2">
                            {item.title}
                          </h3>

                          <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-1">
                            {item.summary}
                          </p>

                          {item.relevanceReason && (
                             <div className="mb-4 text-xs text-slate-500 bg-slate-50 p-2 rounded">
                                <strong>למה זה חשוב?</strong> {item.relevanceReason}
                             </div>
                          )}

                          <div className="mt-auto pt-3 border-t border-slate-100 flex justify-end">
                             {item.url && (
                               <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium">
                                 למקור <ExternalLink className="w-3 h-3" />
                               </a>
                             )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
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