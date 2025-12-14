import React, { useState } from 'react';
import { generateEditorialMeeting } from '../services/geminiService';
import { CalendarDays, Loader2, ExternalLink, RefreshCw, Clock, Download, ListChecks, Building2, Gavel, Scale, FileText, LayoutList, Info, Globe } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { GroundingSource, TimeRange, EditorialCategory } from '../types';

const EditorialMeeting: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [activeCategory, setActiveCategory] = useState<EditorialCategory>('knesset');
  
  const handleGenerate = async () => {
    setLoading(true);
    setReport(null);
    setSources([]);
    try {
      const result = await generateEditorialMeeting(timeRange, activeCategory);
      setReport(result.text);
      setSources(result.sources);
    } catch (error) {
      setReport("אירעה שגיאה בייצור רשימת הנתונים. אנא נסה שנית.");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!report) return;
    const element = document.createElement("a");
    const file = new Blob([report + "\n\n--- מקורות ---\n" + sources.map(s => `${s.title}: ${s.uri}`).join('\n')], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `data-list-${activeCategory}-${timeRange}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const timeRanges: {id: TimeRange, label: string}[] = [
    { id: '12h', label: '12 שעות קדימה' },
    { id: '24h', label: 'יממה קרובה (מחר)' },
    { id: '48h', label: 'יומיים קדימה' },
    { id: '72h', label: '3 ימים קדימה' },
    { id: 'week', label: 'השבוע הקרוב' },
  ];

  const categories: {id: EditorialCategory, label: string, icon: any, desc: string, url: string}[] = [
    { 
      id: 'knesset', 
      label: 'לו"ז כנסת', 
      icon: Building2, 
      desc: 'רשימת כל הדיונים בוועדות ובמליאה',
      url: 'https://main.knesset.gov.il/Activity/Committees/Pages/AllCommitteesAgenda.aspx'
    },
    { 
      id: 'legislation', 
      label: 'מאגר חקיקה', 
      icon: Gavel, 
      desc: 'כל תזכירי החוק הפתוחים להערות (רשימה מלאה)',
      url: 'https://www.tazkirim.gov.il/'
    },
    { 
      id: 'planning', 
      label: 'תכנון ובנייה', 
      icon: LayoutList, 
      desc: 'כל התוכניות הפתוחות להתנגדויות',
      url: 'https://mavat.iplan.gov.il/planning-public-information'
    },
    { 
      id: 'courts', 
      label: 'בג"ץ ומשפט', 
      icon: Scale, 
      desc: 'יומן דיונים עתידי בבית המשפט העליון',
      url: 'https://supreme.court.gov.il/Pages/Diary.aspx'
    },
    { 
      id: 'research', 
      label: 'מחקר (ממ"מ)', 
      icon: FileText, 
      desc: 'דוחות חדשים של מרכז המחקר והמידע',
      url: 'https://knesset.gov.il/mmm/heb/AllDocs.asp'
    },
  ];

  const currentCat = categories.find(c => c.id === activeCategory);

  return (
    <div className="max-w-6xl mx-auto md:h-[calc(100vh-100px)] flex flex-col gap-6 pb-10 md:pb-0">
      
      {/* Top Navigation Tabs */}
      <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-2 justify-center md:justify-start">
         {categories.map((cat) => {
           const Icon = cat.icon;
           const isActive = activeCategory === cat.id;
           return (
             <button
               key={cat.id}
               onClick={() => {
                 setActiveCategory(cat.id);
                 setReport(null);
               }}
               className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                 isActive 
                   ? 'bg-blue-600 text-white shadow-md' 
                   : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
               }`}
             >
               <Icon className="w-4 h-4" />
               {cat.label}
             </button>
           );
         })}
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
        {/* Sidebar Configuration */}
        <div className="md:w-72 flex-shrink-0 space-y-4 md:overflow-y-auto custom-scrollbar">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            
            <div className="mb-4 text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
              <h3 className="font-bold text-blue-900 flex items-center justify-center gap-2 mb-1">
                 {currentCat?.icon && <currentCat.icon className="w-5 h-5" />}
                 {currentCat?.label}
              </h3>
              <p className="text-xs text-blue-700">{currentCat?.desc}</p>
            </div>

            {/* Time Range Selector */}
            <div className="mb-6">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-slate-500" />
                טווח זמנים לסריקה
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
            
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              סרוק והוצא רשימה מלאה
            </button>
            
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-xs text-yellow-800 flex flex-col gap-2">
              <div className="flex gap-2">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>
                  המערכת משתמשת בסריקת Google לאיתור מסמכים. ייתכן והמידע יהיה חלקי בגלל חסימות באתרי ממשלה.
                </p>
              </div>
              
              {currentCat?.url && (
                <a 
                  href={currentCat.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 w-full flex items-center justify-center gap-2 bg-white border border-yellow-300 text-yellow-800 py-2 rounded font-medium hover:bg-yellow-100 transition-colors"
                >
                  <Globe className="w-3 h-3" />
                  למאגר הרשמי ({currentCat.label})
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-[500px] md:min-h-0">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-blue-600" />
                תוצאות סריקה: {currentCat?.label}
              </h2>
            </div>
            <div className="flex gap-2">
               {currentCat?.url && (
                  <a 
                    href={currentCat.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-md transition-colors text-sm font-medium border border-transparent hover:border-blue-100"
                  >
                    <Globe className="w-4 h-4" />
                    <span className="hidden sm:inline">לאתר הרשמי</span>
                  </a>
               )}
               {report && (
                  <button 
                    onClick={handleExport}
                    className="flex items-center gap-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-md transition-colors text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">ייצוא לקובץ</span>
                  </button>
               )}
            </div>
          </div>

          <div className="flex-1 md:overflow-y-auto p-8 custom-scrollbar">
            {loading && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                <div className="text-center space-y-1">
                  <p className="font-medium text-slate-600">מבצע סריקת עומק...</p>
                  <p className="text-sm">שואב את כל הנתונים מ{currentCat?.label}. זה עשוי לקחת מספר שניות.</p>
                </div>
              </div>
            )}

            {!report && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <ListChecks className="w-16 h-16 opacity-20 mb-4" />
                <p>בחר קטגוריה וטווח זמן, ולח על "סרוק והוצא רשימה מלאה"</p>
              </div>
            )}

            {report && !loading && (
              <div className="max-w-4xl mx-auto">
                <div className="prose prose-slate prose-headings:text-slate-800 prose-p:text-slate-600 prose-a:text-blue-600 max-w-none">
                   <ReactMarkdown>{report}</ReactMarkdown>
                </div>

                {sources.length > 0 && (
                  <div className="mt-12 pt-6 border-t border-dashed border-slate-200">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">מקורות מידע</h3>
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
    </div>
  );
};

export default EditorialMeeting;