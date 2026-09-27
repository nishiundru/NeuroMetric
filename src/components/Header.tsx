import React, { useState } from 'react';
import { Plus, Play, Menu, X, Layers, Sliders, BarChart2, Activity } from 'lucide-react';

interface HeaderProps {
  activeTab: 'experiments' | 'builder' | 'runner' | 'analytics' | 'calibration';
  setActiveTab: (tab: 'experiments' | 'builder' | 'runner' | 'analytics' | 'calibration') => void;
  onNewExperiment: () => void;
  onQuickRun: () => void;
  activeExperimentTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onNewExperiment,
  onQuickRun,
  activeExperimentTitle,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const navItems = [
    { id: 'experiments', label: 'Studies', icon: Layers },
    { id: 'builder', label: 'Protocol Builder', icon: Sliders },
    { id: 'runner', label: 'Lab Runner', icon: Play },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'calibration', label: 'Timing Calibration', icon: Activity },
  ] as const;

  const handleSelectTab = (tab: 'experiments' | 'builder' | 'runner' | 'analytics' | 'calibration') => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="border-b border-[#e2e2e2] bg-white/95 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Brand wordmark */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => handleSelectTab('experiments')}
            className="text-base sm:text-lg font-bold tracking-tight text-[#3f3f3f] hover:text-[#007fd7] transition-colors flex items-center gap-2"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#007fd7] shrink-0" />
            <span>NeuroMetric</span>
          </button>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-7 text-sm font-medium">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`transition-colors pb-1 border-b-2 whitespace-nowrap ${
                activeTab === item.id
                  ? 'border-[#007fd7] text-[#007fd7]'
                  : 'border-transparent text-[#6b7280] hover:text-[#3f3f3f]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Primary actions */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <button
            onClick={onQuickRun}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-[#007fd7] bg-[#007fd7]/8 border border-[#007fd7]/25 rounded hover:bg-[#007fd7]/15 transition-colors whitespace-nowrap"
            title="Launch test session in high-precision mode"
          >
            <Play className="w-3.5 h-3.5 fill-[#007fd7] text-[#007fd7] shrink-0" />
            <span className="hidden sm:inline">Launch Participant View</span>
            <span className="sm:hidden">Launch</span>
          </button>

          <button
            onClick={onNewExperiment}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-white bg-[#007fd7] rounded hover:bg-[#006db9] transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">New Study</span>
            <span className="sm:hidden">New</span>
          </button>

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-[#6b7280] hover:text-[#3f3f3f] rounded hover:bg-[#f8f9fa] border border-[#e2e2e2] transition-colors ml-0.5"
            aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#e2e2e2] bg-white px-4 py-3 space-y-1 shadow-sm">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-[#007fd7]/10 text-[#007fd7] font-semibold'
                    : 'text-[#6b7280] hover:bg-[#f8f9fa] hover:text-[#3f3f3f]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#007fd7]' : 'text-[#6b7280]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
