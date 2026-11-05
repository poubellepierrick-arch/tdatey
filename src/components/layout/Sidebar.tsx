import React, { useEffect, useRef } from "react";
import { 
  Sun, CalendarDays, BarChart4, Flame, Settings, FolderKanban, Trophy, Briefcase, Archive, Sparkles
} from "lucide-react";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  badge?: number;
}

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  newActivitiesCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
}) => {
  const tabsContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = tabsContainerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY * 1.25;
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
    };
  }, []);

  const menuItems: MenuItem[] = [
    { id: "today", label: "Tableau de bord", icon: <Sun size={17} />, color: "hover:bg-yellow-100" },
    { id: "planning", label: "Planification", icon: <CalendarDays size={17} />, color: "hover:bg-sky-100" },
    { id: "projects", label: "Projets", icon: <FolderKanban size={17} />, color: "hover:bg-blue-100" },
    { id: "habits", label: "Habitudes", icon: <Flame size={17} />, color: "hover:bg-green-100" },
    { id: "ranking", label: "Classement", icon: <BarChart4 size={17} />, color: "hover:bg-purple-100" },
    { id: "analytics", label: "Analyses", icon: <BarChart4 size={17} />, color: "hover:bg-indigo-100" },
    { id: "advisor", label: "Conseiller IA", icon: <Sparkles size={17} />, color: "hover:bg-purple-100" },
    { id: "rewards", label: "Boutique", icon: <Trophy size={17} />, color: "hover:bg-amber-100" },
    { id: "suitcase", label: "Valise", icon: <Briefcase size={17} />, color: "hover:bg-yellow-100" },
    { id: "archives", label: "Archives", icon: <Archive size={17} />, color: "hover:bg-slate-100" },
    { id: "settings", label: "Paramètres", icon: <Settings size={17} />, color: "hover:bg-gray-100" },
  ];

  return (
    <div 
      ref={tabsContainerRef} 
      className="bg-white overflow-x-auto overflow-y-hidden select-none no-scrollbar flex scroll-smooth"
    >
      <div className="flex items-stretch min-w-max divide-x-2 divide-black">
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              id={`nav-btn-${item.id}`}
              onClick={() => setCurrentView(item.id)}
              className={`flex items-center gap-2 px-5 py-3.5 font-mono text-xs font-black uppercase transition-all cursor-pointer relative ${item.color} ${
                isActive 
                  ? "bg-black text-white hover:text-white" 
                  : "bg-white text-black text-opacity-85 hover:text-opacity-100 hover:bg-gray-50"
              }`}
            >
              <span className="flex items-center gap-1.5">
                {item.icon}
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;
