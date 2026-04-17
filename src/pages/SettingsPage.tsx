import React from 'react';
import { Shield, Bell, Eye, LogOut, Download, CreditCard, ChevronRight } from 'lucide-react';

export function SettingsPage({ onLogout }: { onLogout: () => void }) {
  const sections = [
    {
      title: "Privacy & Anonymous Identity",
      icon: Shield,
      items: [
        { label: "Profile Visibility", value: "Anonymous Mode" },
        { label: "Data Encryption", value: "Enabled" },
        { label: "Blocked Connections", value: "None" }
      ]
    },
    {
      title: "Atmosphere",
      icon: Eye,
      items: [
        { label: "Theme", value: "Midnight Abyss" },
        { label: "Typography Weight", value: "Editorial" },
        { label: "Ambient Motion", value: "Subtle" }
      ]
    },
    {
      title: "Notifications",
      icon: Bell,
      items: [
        { label: "High Resonance Alerts", value: "On" },
        { label: "New Matches", value: "Daily Summary" },
        { label: "Weekly Reflections", value: "Email & Push" }
      ]
    }
  ];

  return (
    <div className="h-full overflow-y-auto pb-24">
      <div className="w-full max-w-3xl mx-auto px-6 py-12">
        <header className="mb-12">
          <h1 className="font-serif text-4xl font-light text-white mb-2">Preferences</h1>
          <p className="text-[#e1e3ed]/50 text-xs uppercase tracking-widest font-medium">Control your echo chamber.</p>
        </header>

        <div className="space-y-12">
          {sections.map((section, idx) => (
            <div key={idx} className="relative">
              <div className="flex items-center gap-3 mb-6">
                <section.icon className="w-4 h-4 text-[#8e84ad]" />
                <h2 className="text-sm font-medium tracking-wide text-white uppercase">{section.title}</h2>
              </div>
              
              <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-[24px] overflow-hidden">
                {section.items.map((item, i) => (
                  <button 
                    key={i}
                    className="w-full flex items-center justify-between px-6 py-5 border-b border-[rgba(255,255,255,0.03)] last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors group"
                  >
                    <span className="text-sm font-light text-[#e1e3ed]/80">{item.label}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs uppercase tracking-widest text-[#e1e3ed]/40 group-hover:text-white transition-colors">{item.value}</span>
                      <ChevronRight className="w-4 h-4 text-[#e1e3ed]/20 group-hover:text-[#e1e3ed]/60 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Danger Zone */}
          <div className="pt-12 border-t border-[rgba(255,255,255,0.05)]">
            <h2 className="text-sm font-medium tracking-wide text-[#b08d97] uppercase mb-6">Account Control</h2>
            
            <div className="flex flex-col gap-4">
               <button className="w-full flex justify-between items-center px-6 py-5 rounded-[24px] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.05)] transition-colors text-left group">
                 <div className="flex items-center gap-3">
                   <Download className="w-4 h-4 text-[#e1e3ed]/40 group-hover:text-white transition-colors" />
                   <span className="text-sm font-light text-[#e1e3ed]/80">Export all emotional data</span>
                 </div>
               </button>
               
               <button className="w-full flex justify-between items-center px-6 py-5 rounded-[24px] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.05)] transition-colors text-left group">
                 <div className="flex items-center gap-3">
                   <CreditCard className="w-4 h-4 text-[#e1e3ed]/40 group-hover:text-white transition-colors" />
                   <span className="text-sm font-light text-[#e1e3ed]/80">Manage ECHO Premium</span>
                 </div>
               </button>

               <button 
                 onClick={onLogout}
                 className="w-full flex justify-between items-center px-6 py-5 rounded-[24px] bg-[rgba(176,141,151,0.1)] hover:bg-[rgba(176,141,151,0.15)] border border-[rgba(176,141,151,0.2)] transition-colors text-left group mt-4"
               >
                 <div className="flex items-center gap-3">
                   <LogOut className="w-4 h-4 text-[#b08d97]" />
                   <span className="text-sm font-light text-[#b08d97]">Leave Sanctuary (Sign Out)</span>
                 </div>
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
