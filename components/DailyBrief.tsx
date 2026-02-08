import React, { useState } from 'react';
import { generateDailyBrief, formatGeminiError } from '../services/geminiService';
import { FileText, Loader2, ExternalLink, RefreshCw, Filter, Download, CheckSquare, Square, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { GroundingSource, TimeRange, BriefCategory } from '../types';

const DailyBrief: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  
  const [filters, setFilters] = useState<Record<BriefCategory, boolean>>({
    knesset: true,
    legislation: true,
    planning: true,
    procurement: true,
    news: true
  });

  const toggleFilter = (key: BriefCategory) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isAnyCategorySelected = Object.values(filters).some(Boolean);

  const handleGenerate = async () => {
    const activeCategories = (Object.keys(filters) as BriefCategory[]).filter(key => filters[key]);
    
    if (activeCategories.length === 0) {
      return;
    }

    setLoading(true);
    setReport(null);
    setSources([]);
    try {
      const result = await generateDailyBrief(activeCategories, timeRange);
      setReport(result.text);
      setSources(result.sources);
      setLastUpdated(new Date());
    } catch (error) {
      setReport(`שגיאה: ${formatGeminiError(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!report) return;
    const element = document.createElement("a");
    const file = new Blob([report + "\n\n--- מקורות ---\n" + sources.map(s => `${s.title}: ${s.uri}`).join('\n')], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `daily-brief-${timeRange}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const categoriesConfig: {id: BriefCategory, label: string}[] = [
    { id: 'knesset', label: 'כנסת ופעילות פרלמנטרית' },
    { id: 'legislation', label: 'הצעות חוק (תזכירים)' },
    { id: 'planning', label: 'תכנון ובנייה (התנגדויות)' },
    { id: 'procurement', label: 'מכרזים ופטורים (רכש)' },
    { id: 'news', label: 'חדשות וחשיפות' },
  ];

  const timeRanges: {id: TimeRange, label: string}[] = [
    { id: '12h', label: '12 שעות אחרונות' },
    { id: '24h', label: 'יממה אחרונה' },
    { id: '48h', label: '48 שעות (יומיים)' },
    { id: '72h', label: '72 שעות (3 ימים)' },
  ];

  return (
    <div className="max-w-6xl mx-auto md:h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6 pb-10 md:pb-0">
      
      {/* Sidebar Filters */}
      <div className="md:w-72 flex-shrink-0 space-y-4 md:overflow-y-auto custom-scrollbar">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          
          {/* Time Range Selector */}
          <div className="mb-6">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-slate-500" />
              טווח זמן לחיפוש
            </h3>
            <div className="space-y-1">
              {timeRanges.map((range) => (
                <button
                  key={range.id}
                  onClick={() => setTimeRange(range.id)}
                  className={`w-full text-right px-3 py-2 text-xs rounded-md transition-all border ${
                    timeRange === range.id
                      ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold'
                      : 'bg-white border-transparent text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 my-4"></div>

          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
            <Filter className="w-4 h-4 text-slate-500" />
            סינון מקורות
          </h3>
          <div className="space-y-3">
            {categoriesConfig.map((cat) => (
              <button
                key={cat.id}
                onClick={() => toggleFilter(cat.id)}
                className="flex items-start gap-3 w-full text-right hover:bg-slate-50 p-1 rounded transition-colors"
              >
                {filters[cat.id] ? 
                  <CheckSquare className="w-5 h-5 text-blue-600 flex-shrink-0" /> : 
                  <Square className="w-5 h-5 text-slate-300 flex-shrink-0" />
                }
                <span className={`text-sm ${filters[cat.id] ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
          
          <button
            onClick={handleGenerate}
            disabled={loading || !isAnyCategorySelected}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            צור דו"ח {timeRanges.find(t => t.id === timeRange)?.label.replace('אחרונות', '')}
          </button>
          {!isAnyCategorySelected && (
            <p className="text-xs text-red-500 text-center mt-2 font-medium">
              נא לבחור לפחות קטגוריה אחת
            </p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-[500px] md:min-h-0">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              דו"ח מודיעין ({timeRanges.find(t => t.id === timeRange)?.label})
            </h2>
            {lastUpdated && (
              <p className="text-xs text-slate-500 mt-1">
                עודכן: {lastUpdated.toLocaleTimeString('he-IL')}
              </p>
            )}
          </div>
          {report && (
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-md transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              שמור דו"ח
            </button>
          )}
        </div>

        <div className="flex-1 md:overflow-y-auto p-8 custom-scrollbar">
          {loading && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
              <div className="text-center space-y-1">
                <p className="font-medium text-slate-600">סורק מאגרי מידע ממשלתיים...</p>
                <p className="text-sm">מחפש מידע מ-{timeRanges.find(t => t.id === timeRange)?.label}</p>
              </div>
            </div>
          )}

          {!report && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <FileText className="w-16 h-16 opacity-20 mb-4" />
              <p>בחר קטגוריות וטווח זמן, ולח על "צור דו"ח"</p>
            </div>
          )}

          {report && !loading && (
            <div className="max-w-3xl mx-auto">
              <div className="prose prose-slate prose-headings:text-slate-800 prose-p:text-slate-600 prose-a:text-blue-600 max-w-none">
                 <ReactMarkdown>{report}</ReactMarkdown>
              </div>

              {sources.length > 0 && (
                <div className="mt-12 pt-6 border-t border-dashed border-slate-200">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">מקורות וסימוכין</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {sources.map((source, idx) => (
                      <a 
                        key={idx}
                        href={source.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded hover:bg-blue-50 hover:text-blue-700 transition-colors text-xs text-slate-600 truncate group"
                      >
                        <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-50 group-hover:opacity-100" />
                        <span className="truncate" dir="auto">{source.title}</span>
                      </a>
                    ))}
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

export default DailyBrief;