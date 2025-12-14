import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Monitor from './components/Monitor';
import EditorialMeeting from './components/EditorialMeeting'; // Acts as Scanner now
import MeetingDashboard from './components/MeetingDashboard'; // New Dashboard
import SmartEditor from './components/SmartEditor'; // New AI Studio
import { AppView, SavedItem } from './types';
import { Menu } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.MEETING_DASHBOARD);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // State for items saved to the editorial meeting dashboard
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);

  const addToDashboard = (item: SavedItem) => {
    setSavedItems(prev => [item, ...prev]);
  };

  const removeFromDashboard = (id: string) => {
    setSavedItems(prev => prev.filter(item => item.id !== id));
  };

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard onChangeView={setCurrentView} />;
      case AppView.MEETING_DASHBOARD:
        return (
          <MeetingDashboard 
            savedItems={savedItems} 
            onRemoveItem={removeFromDashboard} 
            onChangeView={setCurrentView}
          />
        );
      case AppView.DATABASE_SCANNER:
        return <EditorialMeeting onSaveToDashboard={addToDashboard} />;
      case AppView.MONITOR:
        return <Monitor onSaveToDashboard={addToDashboard} />;
      case AppView.AI_STUDIO:
        return <SmartEditor />;
      default:
        return <MeetingDashboard 
            savedItems={savedItems} 
            onRemoveItem={removeFromDashboard} 
            onChangeView={setCurrentView}
          />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        savedItemsCount={savedItems.length}
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
