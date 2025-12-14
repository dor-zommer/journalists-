

import React from 'react';
import { LayoutDashboard, Search, ArrowLeft, Database } from 'lucide-react';
import { AppView } from '../types';

interface DashboardProps {
  onChangeView: (view: AppView) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onChangeView }) => {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">ברוכים הבאים ל-JournalistAI</h2>
        <p className="text-slate-500 max-w-2xl mx-auto">
          פלטפורמת העבודה החכמה לעיתונאים. השתמש בבינה מלאכותית לסריקת מידע, תכנון לו"ז מערכת, ומעקב אחר נושאים.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Editorial Meeting Dashboard Card */}
        <div 
          onClick={() => onChangeView(AppView.MEETING_DASHBOARD)}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group flex flex-col"
        >
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 text-indigo-600 group-hover:scale-110 transition-transform">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold mb-2 text-slate-800">ישיבת מערכת</h3>
          <p className="text-slate-500 text-sm mb-4 leading-relaxed flex-1">
            דשבורד המרכז את כל הממצאים שנשמרו ומייצר סדר יום עיתונאי מסודר.
          </p>
          <div className="flex items-center text-indigo-600 font-medium text-xs group-hover:gap-2 transition-all mt-auto">
            לדשבורד <ArrowLeft className="w-3 h-3 mr-1" />
          </div>
        </div>

        {/* Database Scanner Card */}
        <div 
          onClick={() => onChangeView(AppView.DATABASE_SCANNER)}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group flex flex-col"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 text-blue-600 group-hover:scale-110 transition-transform">
            <Database className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold mb-2 text-slate-800">סורק המאגרים</h3>
          <p className="text-slate-500 text-sm mb-4 leading-relaxed flex-1">
            גישה ישירה למאגרי ממשלה: חקיקה, רכש, החלטות ממשלה, תכנון ועוד.
          </p>
          <div className="flex items-center text-blue-600 font-medium text-xs group-hover:gap-2 transition-all mt-auto">
            התחל לסרוק <ArrowLeft className="w-3 h-3 mr-1" />
          </div>
        </div>

        {/* Monitor Card */}
        <div 
          onClick={() => onChangeView(AppView.MONITOR)}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group flex flex-col"
        >
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4 text-amber-600 group-hover:scale-110 transition-transform">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold mb-2 text-slate-800">מוניטור רשת</h3>
          <p className="text-slate-500 text-sm mb-4 leading-relaxed flex-1">
            "פיטבול עיתונאי": סריקת רשת אגרסיבית לאיתור ניגודי עניינים וקשרים נסתרים.
          </p>
          <div className="flex items-center text-amber-600 font-medium text-xs group-hover:gap-2 transition-all mt-auto">
            פתח מוניטור <ArrowLeft className="w-3 h-3 mr-1" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
