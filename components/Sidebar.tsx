
import React from 'react';
import { Newspaper, LayoutDashboard, Search, Image as ImageIcon, Database } from 'lucide-react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isMobileOpen, setIsMobileOpen }) => {
  const menuItems = [
    { id: AppView.DASHBOARD, label: 'דף הבית', icon: LayoutDashboard },
    { id: AppView.DAILY_BRIEF, label: 'דו"ח מודיעין (סריקה)', icon: Newspaper },
    { id: AppView.EDITORIAL_MEETING, label: 'מאגרי מידע (רשימות)', icon: Database },
    { id: AppView.MONITOR, label: 'סריקת רשת והתראות', icon: Search },
    { id: AppView.IMAGE_EDITOR, label: 'עורך תמונות AI', icon: ImageIcon },
  ];

  const sidebarClasses = `
    fixed inset-y-0 right-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
    ${isMobileOpen ? 'translate-x-0' : 'translate-x-full'}
    md:translate-x-0 md:static md:inset-auto
  `;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <div className={sidebarClasses}>
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Newspaper className="w-8 h-8 text-blue-400" />
            JournalistAI
          </h1>
          <p className="text-slate-400 text-sm mt-1">כלי עזר לעיתונאים</p>
        </div>

        <nav className="mt-6 px-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onChangeView(item.id);
                  setIsMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-6 border-t border-slate-800">
          <div className="text-xs text-slate-500 text-center">
             מופעל ע"י Gemini 2.5
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
