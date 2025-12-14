import React, { useState } from 'react';
import { AppView, SavedItem, EditorialItem } from '../types';
import { generateConsolidatedReport } from '../services/geminiService';
import { LayoutDashboard, Trash2, FileText, Wand2, Download, ExternalLink, ArrowRight, Database, Loader2, X, Maximize2, Building2, Gavel, Scale, ShoppingCart, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MeetingDashboardProps {
  savedItems: SavedItem[];
  onRemoveItem: (id: string) => void;
  onChangeView: (view: AppView) => void;
}

interface ItemModalProps {
  item: SavedItem;
  onClose: () => void;
}

const ItemModal: React.FC<ItemModalProps> = ({ item, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full mb-1 inline-block">{item.category}</span>
            <h2 className="text-xl font-bold text-slate-900">נתונים גולמיים שנשמרו</h2>
            <p className="text-sm text-slate-500">נשמר בתאריך: {item.timestamp.toLocaleString('he-IL')}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-0 custom-scrollbar">
          {item.originalData && item.originalData.length > 0 ? (
             <table className="w-full text-sm text-right">
                <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="p-4 whitespace-nowrap w-32 border-b border-slate-200">תאריך</th>
                    <th className="p-4 whitespace-nowrap w-32 border-b border-slate-200">מטא</th>
                    <th className="p-4 whitespace-nowrap border-b border-slate-200">כותרת</th>
                    <th className="p-4 whitespace-nowrap border-b border-slate-200">תיאור</th>
                    <th className="p-4 whitespace-nowrap w-20 border-b border-slate-200">קישור</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {item.originalData.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-4 text-slate-500 align-top">{row.date}</td>
                      <td className="p-4 text-slate-600 font-medium align-top">{row.meta}</td>
                      <td className="p-4 text-slate-900 font-medium align-top">{row.title}</td>
                      <td className="p-4 text-slate-600 align-top">{row.description}</td>
                      <td className="p-4 align-top">
                        {row.link && (
                          <a href={row.link} target="_blank" rel="noreferrer" className="text-blue-600 hover:bg-blue-50 p-1 rounded inline-block">
                             <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          ) : (
            <div className="p-8 prose max-w-none dir-rtl">
               <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.content}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{label: string, value: number, icon: any, color: string}> = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
    <div>
      <p className="text-slate-500 text-xs font-medium mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
  </div>
);

const MeetingDashboard: React.FC<MeetingDashboardProps> = ({ savedItems, onRemoveItem, onChangeView }) => {
  const [loading, setLoading] = useState(false);
  const [finalReport, setFinalReport] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<SavedItem | null>(null);

  const handleGenerateReport = async () => {
    if (savedItems.length === 0) return;
    setLoading(true);
    try {
      const contents = savedItems.map(item => `קטגוריה: ${item.category}\n\n${item.content}`);
      const report = await generateConsolidatedReport(contents);
      setFinalReport(report);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!finalReport) return;
    const element = document.createElement("a");
    const file = new Blob([finalReport], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `editorial-meeting-summary-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Stats calculation
  const legislationCount = savedItems.filter(i => i.category.includes('חוק') || i.category.includes('כנסת')).length;
  const planningCount = savedItems.filter(i => i.category.includes('תכנון')).length;
  const procurementCount = savedItems.filter(i => i.category.includes('רכש') || i.category.includes('מכרז')).length;
  const otherCount = savedItems.length - (legislationCount + planningCount + procurementCount);

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col gap-8 pb-10">
      
      {selectedItem && <ItemModal item={selectedItem} onClose={() => setSelectedItem(null)} />}

      {/* Header & Stats */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8 text-indigo-600" />
              דשבורד ישיבת מערכת
            </h1>
            <p className="text-slate-500 mt-2 text-lg">
              ריכוז ממצאים, סטטוסים ותכנון סדר יום
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => onChangeView(AppView.DATABASE_SCANNER)}
              className="flex items-center gap-2 text-slate-700 bg-white hover:bg-slate-50 px-5 py-2.5 rounded-xl border border-slate-300 transition-all font-medium shadow-sm hover:shadow"
            >
              <Database className="w-4 h-4" />
              סריקת מאגרים חדשה
            </button>
            <button 
              onClick={handleGenerateReport}
              disabled={savedItems.length === 0 || loading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 hover:translate-y-[-2px]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              ייצור סיכום מנהלים
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <StatCard label="הליכי חקיקה" value={legislationCount} icon={Gavel} color="bg-purple-500" />
           <StatCard label="תכנון ובנייה" value={planningCount} icon={Building2} color="bg-orange-500" />
           <StatCard label="מכרזים ורכש" value={procurementCount} icon={ShoppingCart} color="bg-teal-500" />
           <StatCard label="שונות/כללי" value={otherCount} icon={FileText} color="bg-blue-500" />
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
        
        {/* Left Column: Saved Items Grid (Inputs) */}
        <div className="lg:col-span-7 flex flex-col min-h-0">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-500" />
              מאגר ממצאים שנשמרו
            </h3>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{savedItems.length} פריטים</span>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
            {savedItems.length === 0 ? (
              <div className="h-64 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400">
                <Database className="w-12 h-12 mb-3 opacity-20" />
                <p>טרם נשמרו נתונים.</p>
                <button 
                  onClick={() => onChangeView(AppView.DATABASE_SCANNER)}
                  className="text-indigo-600 hover:underline font-medium mt-2"
                >
                  עבור לסורק המאגרים
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedItems.map((item) => (
                  <div key={item.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group flex flex-col relative overflow-hidden">
                     {/* Top Bar */}
                     <div className="p-4 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                        <div>
                          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md inline-block mb-1">
                            {item.category}
                          </span>
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.timestamp.toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onRemoveItem(item.id); }}
                          className="text-slate-300 hover:text-red-500 transition-colors p-1"
                          title="הסר"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                     </div>

                     {/* Content Preview */}
                     <div className="p-4 flex-1">
                        <div className="text-sm text-slate-600 line-clamp-3 mb-4">
                           {item.originalData ? (
                             <ul className="list-disc list-inside space-y-1">
                               {item.originalData.slice(0, 3).map((row, i) => (
                                 <li key={i}>{row.title}</li>
                               ))}
                               {item.originalData.length > 3 && <li className="text-xs text-slate-400 italic">ועוד {item.originalData.length - 3} פריטים...</li>}
                             </ul>
                           ) : (
                             "תוכן טקסטואלי..."
                           )}
                        </div>
                     </div>

                     {/* Footer Action */}
                     <button 
                       onClick={() => setSelectedItem(item)}
                       className="w-full bg-slate-50 hover:bg-indigo-50 text-indigo-600 text-xs font-bold py-3 flex items-center justify-center gap-1 transition-colors border-t border-slate-100"
                     >
                       <Maximize2 className="w-3 h-3" />
                       הצג נתונים מלאים
                     </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Report (Output) */}
        <div className="lg:col-span-5 flex flex-col min-h-0">
           <div className="mb-4 flex justify-between items-center">
             <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
               <FileText className="w-5 h-5 text-emerald-500" />
               סיכום ישיבה (AI)
             </h3>
             {finalReport && (
               <button 
                 onClick={handleExport}
                 className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1"
               >
                 <Download className="w-3 h-3" /> שמור קובץ
               </button>
             )}
           </div>

           <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col relative">
             {/* Paper Effect */}
             <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-b from-slate-100 to-transparent z-10"></div>
             
             <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-white">
                {!finalReport && !loading && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-4">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                         <Wand2 className="w-8 h-8 opacity-20" />
                      </div>
                      <p className="font-medium text-slate-600 mb-1">הדף ריק עדיין...</p>
                      <p className="text-sm max-w-xs mx-auto">
                        אסוף נתונים מהסורק, שמור אותם לדשבורד, ולחץ על "ייצור סיכום מנהלים".
                      </p>
                  </div>
                )}

                {loading && (
                  <div className="h-full flex flex-col items-center justify-center p-4">
                    <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
                    <p className="text-slate-800 font-medium">ה-AI מנתח את הנתונים...</p>
                    <p className="text-xs text-slate-500 mt-2 text-center max-w-xs">
                      מצליב בין חוקים, מכרזים והחלטות ממשלה ליצירת תמונת מצב עיתונאית.
                    </p>
                  </div>
                )}

                {finalReport && (
                  <article className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-headings:font-bold prose-p:text-slate-700 prose-li:text-slate-700 prose-strong:text-indigo-800 prose-a:text-indigo-600">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {finalReport}
                    </ReactMarkdown>
                  </article>
                )}
             </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default MeetingDashboard;