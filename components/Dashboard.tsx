
import React from 'react';
import { Newspaper, Search, Image as ImageIcon, ArrowLeft, CalendarDays } from 'lucide-react';
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
          פלטפורמת העבודה החכמה לעיתונאים. השתמש בבינה מלאכותית לסריקת מידע, תכנון לו"ז מערכת, ועריכת תמונות.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Daily Brief Card */}
        <div 
          onClick={() => onChangeView(AppView.DAILY_BRIEF)}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group flex flex-col"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 text-blue-600 group-hover:scale-110 transition-transform">
            <Newspaper className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold mb-2 text-slate-800">דו"ח מודיעין</h3>
          <p className="text-slate-500 text-sm mb-4 leading-relaxed flex-1">
            סיכום פריטים שפתוחים להערות (חקיקה/תכנון) ועדכונים מהיממה האחרונה.
          </p>
          <div className="flex items-center text-blue-600 font-medium text-xs group-hover:gap-2 transition-all mt-auto">
            לסיכום היומי <ArrowLeft className="w-3 h-3 mr-1" />
          </div>
        </div>

        {/* Editorial Meeting Card (New) */}
        <div 
          onClick={() => onChangeView(AppView.EDITORIAL_MEETING)}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group flex flex-col"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 text-purple-600 group-hover:scale-110 transition-transform">
            <CalendarDays className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold mb-2 text-slate-800">ישיבת מערכת</h3>
          <p className="text-slate-500 text-sm mb-4 leading-relaxed flex-1">
            תכנון עתידי: ועדות כנסת, דיונים בבתי משפט ואירועים צפויים לשבוע הקרוב.
          </p>
          <div className="flex items-center text-purple-600 font-medium text-xs group-hover:gap-2 transition-all mt-auto">
            לתכנון הלו"ז <ArrowLeft className="w-3 h-3 mr-1" />
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
          <h3 className="text-lg font-bold mb-2 text-slate-800">סריקה והתראות</h3>
          <p className="text-slate-500 text-sm mb-4 leading-relaxed flex-1">
            הגדר נושאי מעקב וקבל עדכונים בזמן אמת מאתרי חדשות ומקורות ממשלתיים.
          </p>
          <div className="flex items-center text-amber-600 font-medium text-xs group-hover:gap-2 transition-all mt-auto">
            התחל לסרוק <ArrowLeft className="w-3 h-3 mr-1" />
          </div>
        </div>

        {/* Image Editor Card */}
        <div 
          onClick={() => onChangeView(AppView.IMAGE_EDITOR)}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-pink-300 transition-all cursor-pointer group flex flex-col"
        >
          <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-4 text-pink-600 group-hover:scale-110 transition-transform">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold mb-2 text-slate-800">עורך תמונות AI</h3>
          <p className="text-slate-500 text-sm mb-4 leading-relaxed flex-1">
            ערוך תמונות באמצעות פקודות טקסט פשוטות. הסר אובייקטים או שנה סגנון.
          </p>
          <div className="flex items-center text-pink-600 font-medium text-xs group-hover:gap-2 transition-all mt-auto">
            פתח עורך <ArrowLeft className="w-3 h-3 mr-1" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
