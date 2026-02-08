
import React, { useState } from 'react';
import { generateEditorialMeeting, formatGeminiError } from '../services/geminiService';
import { Loader2, ExternalLink, RefreshCw, Clock, Download, ListChecks, Building2, Gavel, Scale, FileText, LayoutList, Info, Globe, Briefcase, FileCode, ShoppingCart, Calendar, PlusCircle, CheckCircle, Database, ChevronDown, X, Zap, Sparkles, AlertTriangle } from 'lucide-react';
import { GroundingSource, TimeRange, EditorialCategory, SavedItem, EditorialItem } from '../types';

interface EditorialMeetingProps {
  onSaveToDashboard: (item: SavedItem) => void;
}

interface ResultModalProps {
  item: EditorialItem;
  onClose: () => void;
}

const ResultModal: React.FC<ResultModalProps> = ({ item, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
           <div>
              <p className="text-xs font-bold text-slate-500 mb-1">{item.date}</p>
              <h3 className="text-xl font-bold text-slate-900 leading-snug">{item.title}</h3>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
             <X className="w-5 h-5 text-slate-500" />
           </button>
        </div>
        <div className="p-6 overflow-y-auto">
           <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
              <h4 className="text-sm font-bold text-slate-700 mb-2">תקציר / פרטים</h4>
              <p className="text-slate-600 leading-relaxed text-base">{item.description}</p>
           </div>
           
           <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                 <span className="text-xs text-slate-400 block mb-1">מידע נוסף (מטא)</span>
                 <p className="font-medium text-slate-800">{item.meta}</p>
              </div>
              {item.link && (
                 <div>
                    <span className="text-xs text-slate-400 block mb-1">מקור</span>
                    <a 
                      href={item.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:underline font-medium break-all"
                    >
                      פתח קישור <ExternalLink className="w-3 h-3" />
                    </a>
                 </div>
              )}
           </div>
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
           <button 
             onClick={onClose}
             className="px-5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium text-sm"
           >
             סגור
           </button>
        </div>
      </div>
    </div>
  );
};

const ITEMS_PER_PAGE = 10;

const EditorialMeeting: React.FC<EditorialMeetingProps> = ({ onSaveToDashboard }) => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<EditorialItem[]>([]);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedItem, setSelectedItem] = useState<EditorialItem | null>(null);
  const [isDeepScan, setIsDeepScan] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [activeCategory, setActiveCategory] = useState<EditorialCategory>('government_decisions');

  const handleGenerate = async () => {
    setLoading(true);
    setItems([]);
    setSources([]);
    setVisibleCount(ITEMS_PER_PAGE);
    setIsSaved(false);
    setError(null);
    try {
      const result = await generateEditorialMeeting(timeRange, activeCategory, isDeepScan);
      setItems(result.items);
      setSources(result.sources);
    } catch (err) {
      console.error(err);
      setError(formatGeminiError(err));
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    setVisibleCount(prev => prev + ITEMS_PER_PAGE);
  };

  const getHeaders = (): {date: string, title: string, description: string, meta: string} => {
    switch (activeCategory) {
      case 'government_decisions':
        return { date: 'תאריך אישור', title: 'נושא ההחלטה', description: 'תמצית', meta: 'מספר החלטה' };
      case 'government_agenda':
        return { date: 'תאריך ישיבה', title: 'הנושא לדיון', description: 'פירוט קצר', meta: 'מס\' סעיף / יוזם' };
      case 'legislation_tazkirim':
        return { date: 'סגירה להערות', title: 'שם התזכיר', description: 'תיאור', meta: 'משרד יוזם' };
      case 'legislation_knesset':
        return { date: 'עדכון אחרון', title: 'שם ההצעה', description: 'סטטוס', meta: 'יוזמים' };
      case 'knesset_agenda':
        return { date: 'מועד', title: 'וועדה', description: 'נושא', meta: 'מיקום/הערות' };
      case 'courts':
        return { date: 'מועד', title: 'הצדדים/נושא', description: 'תקציר', meta: 'הרכב' };
      case 'planning':
        return { date: 'תאריך פרסום', title: 'שם התוכנית', description: 'מהות וסטטוס', meta: 'מספר/מיקום' };
      case 'procurement':
        return { date: 'תאריך פרסום', title: 'נושא', description: 'סוג ופרטים', meta: 'משרד מפרסם' };
      default:
        return { date: 'תאריך', title: 'כותרת', description: 'תיאור', meta: 'מידע נוסף' };
    }
  };

  const headers = getHeaders();

  const createMarkdownTable = () => {
    const h = headers;
    let md = `| ${h.date} | ${h.meta} | ${h.title} | ${h.description} | קישור |\n`;
    md += `|---|---|---|---|---|\n`;
    items.forEach(item => {
      md += `| ${item.date} | ${item.meta} | ${item.title} | ${item.description} | ${item.link ? `[קישור](${item.link})` : '-'} |\n`;
    });
    return md;
  };

  const handleSaveToDashboard = () => {
    if (items.length === 0) return;
    const reportContent = createMarkdownTable();
    const newItem: SavedItem = {
      id: Date.now().toString(),
      category: categories.find(c => c.id === activeCategory)?.label || 'כללי',
      categoryType: activeCategory,
      content: reportContent,
      originalData: items,
      timestamp: new Date(),
      sources: sources
    };
    onSaveToDashboard(newItem);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleExport = () => {
    if (items.length === 0) return;
    const bom = "\uFEFF";
    const headerRow = `${headers.date},${headers.meta},${headers.title},${headers.description},קישור\n`;
    const rows = items.map(item => {
      const clean = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
      return `${clean(item.date)},${clean(item.meta)},${clean(item.title)},${clean(item.description)},${clean(item.link)}`;
    }).join('\n');
    const csvContent = bom + headerRow + rows;
    const element = document.createElement("a");
    const file = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
    element.href = URL.createObjectURL(file);
    element.download = `data-list-${activeCategory}-${timeRange}.csv`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const timeRanges: {id: TimeRange, label: string}[] = [
    { id: '24h_window', label: 'אתמול והיום (72 שעות)' },
    { id: 'week_window', label: 'תחילת שבוע (אחורה וקדימה)' },
    { id: 'month', label: '28 ימים אחרונים' },
  ];

  const categories: {id: EditorialCategory, label: string, icon: any, desc: string, url: string}[] = [
    { id: 'government_decisions', label: 'החלטות ממשלה', icon: Briefcase, desc: 'החלטות שאושרו (28 יום אחורה)', url: 'https://www.gov.il/he/departments/policies' },
    { id: 'government_agenda', label: 'סדר יום הממשלה', icon: Calendar, desc: 'הצעות לדיון בישיבה הקרובה', url: 'https://www.gov.il/he/departments/topics/seder-yom/govil-landing-page' },
    { id: 'knesset_agenda', label: 'סדר יום ועדות', icon: Building2, desc: 'דיונים בכנסת (לו"ז ועדות)', url: 'https://main.knesset.gov.il/Activity/Committees/Pages/AllCommitteesAgenda.aspx' },
    { id: 'legislation_tazkirim', label: 'תזכירי חוק (ממשלתי)', icon: FileText, desc: 'פתוחים להערות באתר תזכירים', url: 'https://www.tazkirim.gov.il/' },
    { id: 'legislation_knesset', label: 'מאגר חקיקה (לאומי)', icon: Gavel, desc: 'הצעות חוק בכנסת (מאגר לאומי)', url: 'https://main.knesset.gov.il/Activity/Legislation/Laws/Pages/LawSuggestionsSearch.aspx' },
    { id: 'procurement', label: 'רכש ומכרזים', icon: ShoppingCart, desc: 'חיפוש הודעות פטור ומכרזים', url: 'https://mr.gov.il/' },
    { id: 'planning', label: 'תכנון (הודעות הפקדה)', icon: LayoutList, desc: 'חיפוש הודעות על תוכניות מחוזיות', url: 'https://mavat.iplan.gov.il/planning-public-information' },
    { id: 'courts', label: 'דיוני בג"ץ', icon: Scale, desc: 'יומן דיונים עתידי', url: 'https://supreme.court.gov.il/Pages/Diary.aspx' },
  ];

  const currentCat = categories.find(c => c.id === activeCategory);
  const visibleItems = items.slice(0, visibleCount);
  const hasMore = items.length > visibleCount;

  return (
    <div className="max-w-7xl mx-auto md:h-[calc(100vh-100px)] flex flex-col gap-6 pb-10 md:pb-0">
      
      {selectedItem && (
        <ResultModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}

      <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <div className="flex gap-2 min-w-max px-2">
         {categories.map((cat) => {
           const Icon = cat.icon;
           const isActive = activeCategory === cat.id;
           return (
             <button
               key={cat.id}
               onClick={() => {
                 setActiveCategory(cat.id);
                 setItems([]);
                 if (['government_decisions', 'procurement', 'legislation_tazkirim'].includes(cat.id)) {
                    setTimeRange('month');
                 } else if (['knesset_agenda', 'courts', 'government_agenda', 'week_window'].includes(cat.id)) {
                    setTimeRange('week_window');
                 } else {
                    setTimeRange('month');
                 }
               }}
               className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                 isActive ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
               }`}
             >
               <Icon className="w-4 h-4" />
               {cat.label}
             </button>
           );
         })}
         </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
        <div className="md:w-72 flex-shrink-0 space-y-4 md:overflow-y-auto custom-scrollbar">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            
            <div className="mb-4 text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
              <h3 className="font-bold text-blue-900 flex items-center justify-center gap-2 mb-1">
                 {currentCat?.icon && <currentCat.icon className="w-5 h-5" />}
                 {currentCat?.label}
              </h3>
              <p className="text-xs text-blue-700">{currentCat?.desc}</p>
            </div>

            <div className="mb-6">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-slate-500" />
                טווח זמנים לחיפוש
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

            {/* Deep Scan Toggle */}
            <div className="mb-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <div className="flex items-center justify-between mb-2">
                 <h3 className="font-bold text-indigo-900 text-xs flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    סריקה מורחבת (יסודית)
                 </h3>
                 <button 
                  onClick={() => setIsDeepScan(!isDeepScan)}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${isDeepScan ? 'bg-indigo-600' : 'bg-slate-300'}`}
                 >
                   <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isDeepScan ? '-translate-x-5' : '-translate-x-1'}`} />
                 </button>
              </div>
              <p className="text-[10px] text-indigo-700 leading-tight">
                מפעיל מודל חשיבה עמוק לחיפוש אינטנסיבי במאגרים. מביא פי 3-4 יותר תוצאות.
              </p>
            </div>
            
            <button
              onClick={handleGenerate}
              disabled={loading}
              className={`w-full mt-2 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-md ${isDeepScan ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isDeepScan ? <Zap className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />)}
              {isDeepScan ? 'בצע סריקת עומק' : 'סרוק מאגר'}
            </button>
            
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-xs text-yellow-800 flex flex-col gap-2">
              <div className="flex gap-2">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>המערכת סורקת דפי אינטרנט והודעות שפורסמו.</p>
              </div>
              {currentCat?.url && (
                <a href={currentCat.url} target="_blank" rel="noopener noreferrer" className="mt-2 w-full flex items-center justify-center gap-2 bg-white border border-yellow-300 text-yellow-800 py-2 rounded font-medium hover:bg-yellow-100 transition-colors">
                  <Globe className="w-3 h-3" /> למאגר הרשמי (כניסה ידנית)
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-[500px] md:min-h-0">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                סורק מאגרים: {currentCat?.label}
                {items.length > 20 && (
                   <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">Deep Scan</span>
                )}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                 <span>טווח זמן: {timeRanges.find(t => t.id === timeRange)?.label}</span>
                 {items.length > 0 && <span>• נמצאו {items.length} רשומות</span>}
              </div>
            </div>
            <div className="flex gap-2">
               {items.length > 0 && (
                 <>
                   <button 
                    onClick={handleSaveToDashboard}
                    disabled={isSaved}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors text-sm font-medium border ${isSaved ? 'bg-green-50 text-green-700 border-green-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'}`}
                  >
                    {isSaved ? <CheckCircle className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                    <span className="hidden sm:inline">{isSaved ? 'נשמר לישיבה' : 'שמור לישיבת מערכת'}</span>
                  </button>
                  <button onClick={handleExport} className="flex items-center gap-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-md transition-colors text-sm font-medium">
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">ייצוא ל-CSV</span>
                  </button>
                 </>
               )}
            </div>
          </div>

          <div className="flex-1 md:overflow-y-auto p-0 custom-scrollbar">
            {loading && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 min-h-[400px]">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                <div className="text-center space-y-1">
                  <p className="font-medium text-slate-600">{isDeepScan ? 'מבצע סריקת עומק יסודית במיוחד...' : 'מבצע סריקה והצלבת נתונים...'}</p>
                  <p className="text-sm">בונה טבלה עבור {currentCat?.label}...</p>
                  {isDeepScan && <p className="text-xs text-indigo-500">זה עשוי לקחת כ-30-40 שניות עקב ריבוי שאילתות</p>}
                </div>
              </div>
            )}

            {!loading && error && (
              <div className="h-full flex flex-col items-center justify-center min-h-[400px] px-6">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-lg text-center">
                  <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                  <h3 className="font-bold text-red-800 mb-2">שגיאה בסריקה</h3>
                  <p className="text-red-700 text-sm whitespace-pre-line">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                  >
                    סגור
                  </button>
                </div>
              </div>
            )}

            {!loading && !error && items.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 min-h-[400px]">
                <Briefcase className="w-16 h-16 opacity-20 mb-4" />
                <p>בחר מאגר מידע מהתפריט ולח על "סרוק מאגר"</p>
              </div>
            )}

            {!loading && items.length > 0 && (
              <div className="flex flex-col h-full">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="p-4 whitespace-nowrap w-24">{headers.date}</th>
                        <th className="p-4 whitespace-nowrap w-32">{headers.meta}</th>
                        <th className="p-4 whitespace-nowrap min-w-[200px]">{headers.title}</th>
                        <th className="p-4 whitespace-nowrap min-w-[300px]">{headers.description}</th>
                        <th className="p-4 whitespace-nowrap w-16">קישור</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {visibleItems.map((item, idx) => (
                        <tr key={idx} onClick={() => setSelectedItem(item)} className="hover:bg-slate-50/80 transition-colors group cursor-pointer">
                          <td className="p-4 text-slate-500 align-top">{item.date}</td>
                          <td className="p-4 text-slate-600 font-medium align-top">{item.meta}</td>
                          <td className="p-4 text-slate-900 font-medium align-top">{item.title}</td>
                          <td className="p-4 text-slate-600 align-top leading-relaxed">{item.description}</td>
                          <td className="p-4 align-top">
                            {item.link ? (
                              <a href={item.link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center justify-center p-2 rounded-full hover:bg-blue-100 text-blue-600 transition-colors">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {hasMore && (
                  <div className="p-6 flex justify-center border-t border-slate-100 mt-auto bg-white/80 backdrop-blur-sm sticky bottom-0">
                    <button onClick={loadMore} className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-300 shadow-sm hover:shadow-md hover:border-slate-400 text-slate-700 font-medium rounded-full transition-all">
                      <ChevronDown className="w-4 h-4" />
                      טען {Math.min(ITEMS_PER_PAGE, items.length - visibleCount)} נוספים
                      <span className="text-xs text-slate-400 mr-1">(מציג {visibleCount} מתוך {items.length})</span>
                    </button>
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
