import React from 'react';
import { Newspaper, LayoutDashboard, Search, Database, ListChecks, Sparkles } from 'lucide-react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
  savedItemsCount: number;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isMobileOpen, setIsMobileOpen, savedItemsCount }) => {
  
  const menuItems = [
    { id: AppView.MEETING_DASHBOARD, label: 'ישיבת מערכת', icon: LayoutDashboard, badge: savedItemsCount > 0 ? savedItemsCount : null },
    { id: AppView.DATABASE_SCANNER, label: 'סורק מאגרים', icon: Database },
    { id: AppView.MONITOR, label: 'מוניטור', icon: Search },
    { id: AppView.AI_STUDIO, label: 'סטודיו AI', icon: Sparkles },
  ];

  const sidebarClasses = `
    fixed inset-y-0 right-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
    ${isMobileOpen ? 'translate-x-0' : 'translate-x-full'}
    md:translate-x-0 md:inset-auto flex flex-col shadow-2xl
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
        <div className="p-6 border-b border-slate-800 bg-slate-950">
          <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
            <Newspaper className="w-7 h-7 text-blue-500" />
            JournalistAI
          </h1>
          <p className="text-slate-400 text-xs mt-1 pr-9 opacity-80">מערכת תחקיר חכמה</p>
        </div>

        <nav className="flex-1 mt-6 px-3 space-y-2">
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
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20 translate-x-[-4px]' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {item.badge && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="font-medium tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2 text-xs text-slate-500 justify-center opacity-60">
             <span>v3.0.0</span> • <span>Gemini Pro</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
