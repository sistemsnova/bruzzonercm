
import React from 'react';
import { X } from 'lucide-react';
import { MODULE_METADATA } from '../App';

interface TabBarProps {
  openTabs: string[];
  activeTabId: string;
  setActiveTabId: (id: string) => void;
  onCloseTab: (id: string) => void;
}

const TabBar: React.FC<TabBarProps> = ({ openTabs, activeTabId, setActiveTabId, onCloseTab }) => {
  return (
    <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-2 overflow-x-auto no-scrollbar shadow-sm z-30">
      {openTabs.map((tabId) => {
        const metadata = MODULE_METADATA[tabId] || { label: tabId, icon: null };
        const isActive = activeTabId === tabId;
        const Icon = metadata.icon;

        return (
          <div
            key={tabId}
            className={`group relative flex items-center gap-2 px-5 py-2.5 rounded-2xl cursor-pointer transition-all border-2 ${
              isActive 
                ? 'bg-orange-50 border-orange-500 text-orange-600 shadow-md shadow-orange-500/10' 
                : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100 hover:text-slate-600'
            }`}
            onClick={() => setActiveTabId(tabId)}
          >
            {Icon && <Icon className={`w-4 h-4 ${isActive ? 'text-orange-600' : 'text-slate-400 group-hover:text-slate-600'}`} />}
            <span className={`text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors`}>
              {metadata.label}
            </span>
            
            {tabId !== 'dashboard' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tabId);
                }}
                className={`ml-1 p-0.5 rounded-md hover:bg-orange-200 hover:text-orange-800 transition-all ${
                  isActive ? 'opacity-100 text-orange-400' : 'opacity-0 group-hover:opacity-100 text-slate-400'
                }`}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TabBar;
