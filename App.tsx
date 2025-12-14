
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import DailyBrief from './components/DailyBrief';
import Monitor from './components/Monitor';
import ImageEditor from './components/ImageEditor';
import EditorialMeeting from './components/EditorialMeeting';
import { AppView } from './types';
import { Menu } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard onChangeView={setCurrentView} />;
      case AppView.DAILY_BRIEF:
        return <DailyBrief />;
      case AppView.EDITORIAL_MEETING:
        return <EditorialMeeting />;
      case AppView.MONITOR:
        return <Monitor />;
      case AppView.IMAGE_EDITOR:
        return <ImageEditor />;
      default:
        return <Dashboard onChangeView={setCurrentView} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <h1 className="font-bold text-lg text-slate-800">JournalistAI</h1>
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
