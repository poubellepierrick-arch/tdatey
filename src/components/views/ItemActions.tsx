
import React, { useState } from 'react';
import type { Task, Habit, RecurringTask } from '../../types';
import { useIcons } from '../../lib/IconContext';
import { Copy } from 'lucide-react';

interface ItemActionsProps {
  item: Task | Habit | RecurringTask;
  onEdit?: (item: Task | Habit | RecurringTask) => void;
  onDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
  onDuplicate?: (item: Task | Habit | RecurringTask) => void;
  onAnalyze?: (item: Task | Habit) => void;
  onStartChat?: (item: Task | Habit) => void;
  onOpenAIAssistant?: (id: string) => void;
  showAIAssistant?: boolean;
  onGetCoachingTip?: (habit: Habit) => void;
  onConvert?: () => void;
  convertLabel?: string;
}

export const ItemActions: React.FC<ItemActionsProps> = ({ item, onEdit, onDelete, onArchive, onDuplicate, onConvert, convertLabel }) => {
  const { getIcon } = useIcons();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirmingDelete(true);
  };
  
  const confirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(item.id);
    setIsConfirmingDelete(false);
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirmingDelete(false);
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    onArchive?.(item.id);
    setIsConfirmingDelete(false);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(item);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicate?.(item);
  };

  const handleConvert = (e: React.MouseEvent) => {
      e.stopPropagation();
      onConvert?.();
  };

  if (isConfirmingDelete) {
    return (
        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
           {onArchive && (
             <button 
               onClick={handleArchive} 
               className="text-xs font-semibold px-2 py-1 rounded-md bg-sky-400 text-black hover:bg-sky-500 shadow-[1px_1px_0px_#000]"
               title="Archiver"
             >
               Archiver
             </button>
           )}
           <button 
             onClick={confirmDelete} 
             className="text-xs font-semibold px-2 py-1 rounded-md bg-rose-500 text-white hover:bg-rose-600 shadow-[1px_1px_0px_#000]"
             title="Supprimer définitivement"
           >
             Supprimer
           </button>
           <button 
             onClick={cancelDelete} 
             className="text-xs font-semibold px-2 py-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600"
             title="Annuler"
           >
             Annuler
           </button>
        </div>
    );
  }

  return (
    <>
      {onConvert && (
          <button onClick={handleConvert} className="p-2 rounded-full hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-500" title={convertLabel || "Convertir"}>
              {getIcon('switchVertical', { className: "w-5 h-5" })}
          </button>
      )}
      {onDuplicate && (
        <button onClick={handleDuplicate} className="p-2 rounded-full hover:bg-yellow-100 dark:hover:bg-yellow-900/50 text-slate-700 dark:text-slate-200" title="Dupliquer">
            <Copy className="w-5 h-5" />
        </button>
      )}
      {onDelete && (
        <button onClick={handleDelete} className="p-2 rounded-full hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-500" title="Supprimer">
            {getIcon('trash', { className: "w-5 h-5" })}
        </button>
      )}
      {onEdit && (
        <button onClick={handleEdit} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500" title="Modifier">
            {getIcon('pencil', { className: "w-5 h-5" })}
        </button>
      )}
    </>
  );
};
