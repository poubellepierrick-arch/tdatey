import React, { useState, useMemo } from 'react';
import type { AppDatabase, Task, Habit, RecurringTask } from '../../types';
import { Archive, RotateCcw, Trash2, Search, CheckCircle2, Flame, Clock, Calendar, Check, AlertCircle, ChevronDown, ChevronUp, Award } from 'lucide-react';
import DailyAccomplishmentsHistory from './DailyAccomplishmentsHistory';
import CompletedTasksTab from './CompletedTasksTab';

interface ArchivesViewProps {
  db: AppDatabase;
  updateDb: (newDb: AppDatabase) => void;
}

type ArchiveFilterType = 'all' | 'task' | 'habit' | 'recurring';
type ArchiveSubTab = 'accomplishments' | 'completed_tasks' | 'items';

export const ArchivesView: React.FC<ArchivesViewProps> = ({ db, updateDb }) => {
  const [activeSubTab, setActiveSubTab] = useState<ArchiveSubTab>('accomplishments');
  const [filterType, setFilterType] = useState<ArchiveFilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // 1. Tâches terminées (exclut les routines de planification)
  const completedTasks = useMemo(() => {
    return (db.tasks || []).filter(
      (t) => (t.isCompleted || t.status === 'done' || t.planningStatus === 'done') && t.type !== "routine" && !t.isPlanningOnly
    );
  }, [db.tasks]);

  // 2. Éléments archivés
  const archivedTasks = useMemo(() => (db.tasks || []).filter(t => t.isArchived && t.type !== "routine" && !t.isPlanningOnly), [db.tasks]);
  const archivedHabits = useMemo(() => (db.habits || []).filter(h => h.isArchived), [db.habits]);
  const archivedRecurring = useMemo(() => (db.recurringTasks || []).filter(rt => rt.isArchived), [db.recurringTasks]);

  // Tous les éléments avec type unifié
  const allArchived = useMemo(() => {
    const list: Array<
      | { kind: 'task'; data: Task }
      | { kind: 'habit'; data: Habit }
      | { kind: 'recurring'; data: RecurringTask }
    > = [];

    archivedTasks.forEach(t => list.push({ kind: 'task', data: t }));
    archivedHabits.forEach(h => list.push({ kind: 'habit', data: h }));
    archivedRecurring.forEach(rt => list.push({ kind: 'recurring', data: rt }));

    return list.sort((a, b) => {
      const dateA = a.data.archivedAt ? new Date(a.data.archivedAt).getTime() : 0;
      const dateB = b.data.archivedAt ? new Date(b.data.archivedAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [archivedTasks, archivedHabits, archivedRecurring]);

  // Filtrage par type et recherche
  const filteredArchived = useMemo(() => {
    return allArchived.filter(item => {
      if (filterType !== 'all' && item.kind !== filterType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = item.data.title.toLowerCase().includes(q);
        const descMatch = (item.data.description || '').toLowerCase().includes(q);
        return titleMatch || descMatch;
      }
      return true;
    });
  }, [allArchived, filterType, searchQuery]);

  // --- ACTIONS DE RESTAURATION ---
  const handleRestore = (item: { kind: 'task' | 'habit' | 'recurring'; data: { id: string; title: string } }) => {
    if (item.kind === 'task') {
      const updated = db.tasks.map(t => t.id === item.data.id ? { ...t, isArchived: false, archivedAt: undefined } : t);
      updateDb({ ...db, tasks: updated });
    } else if (item.kind === 'habit') {
      const updated = db.habits.map(h => h.id === item.data.id ? { ...h, isArchived: false, archivedAt: undefined } : h);
      updateDb({ ...db, habits: updated });
    } else if (item.kind === 'recurring') {
      const updated = (db.recurringTasks || []).map(rt => rt.id === item.data.id ? { ...rt, isArchived: false, archivedAt: undefined } : rt);
      updateDb({ ...db, recurringTasks: updated });
    }
    showToast(`"${item.data.title}" restauré(e) avec succès`);
  };

  // --- ACTIONS DE SUPPRESSION DÉFINITIVE ---
  const handlePermanentDelete = (item: { kind: 'task' | 'habit' | 'recurring'; data: { id: string; title: string } }) => {
    if (item.kind === 'task') {
      const updated = db.tasks.filter(t => t.id !== item.data.id);
      updateDb({ ...db, tasks: updated });
    } else if (item.kind === 'habit') {
      const updated = db.habits.filter(h => h.id !== item.data.id);
      updateDb({ ...db, habits: updated });
    } else if (item.kind === 'recurring') {
      const updated = (db.recurringTasks || []).filter(rt => rt.id !== item.data.id);
      updateDb({ ...db, recurringTasks: updated });
    }
    setConfirmDeleteId(null);
    showToast(`"${item.data.title}" définitivement supprimé(e)`);
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return 'Date inconnue';
    try {
      const d = new Date(isoStr);
      return isNaN(d.getTime()) ? 'Date inconnue' : d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Date inconnue';
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins % 60}min`;
    }
    return `${mins} min`;
  };

  return (
    <div className="font-mono text-black space-y-6 max-w-6xl mx-auto pb-12 select-none">
      {/* Toast inline */}
      {toastMessage && (
        <div className="bg-emerald-400 text-black border-3 border-black p-3 font-black text-xs shadow-[3px_3px_0px_#000] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check size={16} />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="font-bold text-xs hover:underline cursor-pointer">
            Fermer
          </button>
        </div>
      )}

      {/* Barre de navigation des Sous-Onglets d'Archives */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveSubTab('accomplishments')}
          className={`flex-1 min-w-[180px] py-2.5 px-3 font-black text-xs uppercase border-3 border-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'accomplishments'
              ? 'bg-[#24B27F] text-white shadow-[4px_4px_0px_#000]'
              : 'bg-white hover:bg-emerald-50 text-black shadow-[2px_2px_0px_#000]'
          }`}
        >
          <Award size={16} />
          <span>🏆 Historique des Accomplissements</span>
        </button>

        <button
          onClick={() => setActiveSubTab('completed_tasks')}
          className={`flex-1 min-w-[180px] py-2.5 px-3 font-black text-xs uppercase border-3 border-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'completed_tasks'
              ? 'bg-emerald-600 text-white shadow-[4px_4px_0px_#000]'
              : 'bg-white hover:bg-emerald-50 text-black shadow-[2px_2px_0px_#000]'
          }`}
        >
          <CheckCircle2 size={16} />
          <span>✅ Tâches Terminées ({completedTasks.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('items')}
          className={`flex-1 min-w-[180px] py-2.5 px-3 font-black text-xs uppercase border-3 border-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'items'
              ? 'bg-black text-white shadow-[4px_4px_0px_#000]'
              : 'bg-white hover:bg-gray-100 text-black shadow-[2px_2px_0px_#000]'
          }`}
        >
          <Archive size={16} />
          <span>📦 Éléments Archivés ({allArchived.length})</span>
        </button>
      </div>

      {activeSubTab === 'accomplishments' && (
        <DailyAccomplishmentsHistory db={db} />
      )}

      {activeSubTab === 'completed_tasks' && (
        <CompletedTasksTab db={db} updateDb={updateDb} onShowToast={showToast} />
      )}

      {activeSubTab === 'items' && (
        <>
          {/* En-tête */}
          <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_#000]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black uppercase tracking-wider flex items-center gap-2.5">
                  <Archive className="text-slate-800" size={26} />
                  <span>Archives</span>
                </h1>
                <p className="text-xs text-gray-600 font-bold mt-1">
                  Consultez tous vos éléments archivés avec leurs historiques associés. Vous pouvez les restaurer ou les supprimer définitivement.
                </p>
              </div>

              <div className="flex items-center gap-2 font-black text-xs">
                <span className="bg-slate-100 border-2 border-black px-2.5 py-1">
                  {allArchived.length} élément{allArchived.length > 1 ? 's' : ''} au total
                </span>
              </div>
            </div>

        {/* Barre de contrôles & filtres */}
        <div className="mt-6 pt-4 border-t-2 border-black flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Onglets Filtres */}
          <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs font-black uppercase border-2 border-black cursor-pointer transition-all ${
                filterType === 'all'
                  ? 'bg-black text-white shadow-[2px_2px_0px_#000]'
                  : 'bg-white hover:bg-gray-100'
              }`}
            >
              Tout ({allArchived.length})
            </button>
            <button
              onClick={() => setFilterType('task')}
              className={`px-3 py-1.5 text-xs font-black uppercase border-2 border-black cursor-pointer transition-all ${
                filterType === 'task'
                  ? 'bg-black text-white shadow-[2px_2px_0px_#000]'
                  : 'bg-white hover:bg-gray-100'
              }`}
            >
              Tâches ({archivedTasks.length})
            </button>
            <button
              onClick={() => setFilterType('habit')}
              className={`px-3 py-1.5 text-xs font-black uppercase border-2 border-black cursor-pointer transition-all ${
                filterType === 'habit'
                  ? 'bg-black text-white shadow-[2px_2px_0px_#000]'
                  : 'bg-white hover:bg-gray-100'
              }`}
            >
              Habitudes ({archivedHabits.length})
            </button>
            <button
              onClick={() => setFilterType('recurring')}
              className={`px-3 py-1.5 text-xs font-black uppercase border-2 border-black cursor-pointer transition-all ${
                filterType === 'recurring'
                  ? 'bg-black text-white shadow-[2px_2px_0px_#000]'
                  : 'bg-white hover:bg-gray-100'
              }`}
            >
              Récurrentes ({archivedRecurring.length})
            </button>
          </div>

          {/* Recherche */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2 text-gray-500" size={14} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs border-2 border-black bg-white focus:outline-none focus:bg-amber-50"
            />
          </div>
        </div>
      </div>

      {/* Liste des éléments archivés */}
      {filteredArchived.length === 0 ? (
        <div className="bg-white border-4 border-black p-12 text-center shadow-[4px_4px_0px_#000]">
          <Archive size={40} className="mx-auto text-gray-400 mb-3" />
          <p className="font-black text-sm uppercase text-gray-700">Aucun élément dans les archives</p>
          <p className="text-xs text-gray-500 font-bold mt-1">
            {searchQuery
              ? 'Aucun résultat ne correspond à votre recherche.'
              : 'Les tâches, habitudes ou récurrences archivées apparaîtront ici avec l\'ensemble de leurs historiques.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredArchived.map((item) => {
            const isExpanded = expandedItemId === item.data.id;
            const isConfirmingDelete = confirmDeleteId === item.data.id;

            // Déterminer les métadonnées spécifiques au type
            let typeBadge = { label: 'TÂCHE', bg: 'bg-amber-300', text: 'text-black' };
            let totalWorkSeconds = 0;
            let workHistoryDays = 0;
            let totalCompletions = 0;

            if (item.kind === 'task') {
              typeBadge = { label: 'TÂCHE', bg: 'bg-amber-300', text: 'text-black' };
              totalWorkSeconds = item.data.timeSpentSeconds || item.data.accumulatedTime || 0;
              workHistoryDays = Object.keys(item.data.workHistory || {}).length;
            } else if (item.kind === 'habit') {
              typeBadge = { label: 'HABITUDE', bg: 'bg-emerald-300', text: 'text-black' };
              totalWorkSeconds = item.data.timeSpentSeconds || item.data.accumulatedTime || 0;
              workHistoryDays = Object.keys(item.data.workHistory || {}).length;
              totalCompletions = Object.values(item.data.history || {}).reduce<number>((acc, v) => acc + (Number(v) > 0 ? 1 : 0), 0);
            } else if (item.kind === 'recurring') {
              typeBadge = { label: 'RÉCURRENCE', bg: 'bg-sky-300', text: 'text-black' };
              totalWorkSeconds = item.data.timeSpentSeconds || item.data.accumulatedTime || 0;
              workHistoryDays = Object.keys(item.data.workHistory || {}).length;
              totalCompletions = Object.values(item.data.history || {}).reduce<number>((acc, v) => acc + (Number(v) > 0 ? 1 : 0), 0);
            }

            return (
              <div
                key={`${item.kind}-${item.data.id}`}
                className="bg-white border-3 border-black shadow-[4px_4px_0px_#000] p-4 transition-all"
              >
                {/* Ligne principale */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 flex-grow min-w-0">
                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase border border-black shrink-0 ${typeBadge.bg} ${typeBadge.text}`}>
                      {typeBadge.label}
                    </span>

                    <div className="min-w-0 flex-grow">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-sm uppercase text-slate-900 truncate">
                          {item.data.title}
                        </h3>
                        {item.data.isCompleted && (
                          <span className="bg-gray-200 text-gray-700 text-[8px] font-black px-1.5 py-0.2 border border-black uppercase">
                            Accomplie
                          </span>
                        )}
                      </div>

                      {item.data.description && (
                        <p className="text-xs text-gray-600 font-normal line-clamp-1 mt-0.5">
                          {item.data.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[10px] text-gray-500 font-bold">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} /> Archivé le : {formatDate(item.data.archivedAt)}
                        </span>
                        {totalWorkSeconds > 0 && (
                          <span className="flex items-center gap-1 text-indigo-700">
                            <Clock size={11} /> Temps cumulé : {formatSeconds(totalWorkSeconds)}
                          </span>
                        )}
                        {totalCompletions > 0 && (
                          <span className="flex items-center gap-1 text-emerald-700">
                            <CheckCircle2 size={11} /> Réalisations : {totalCompletions}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-dashed border-gray-300">
                    {/* Bouton Détails / Historique */}
                    <button
                      onClick={() => setExpandedItemId(isExpanded ? null : item.data.id)}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 border border-black font-black text-[10px] uppercase flex items-center gap-1 cursor-pointer"
                      title="Voir l'historique associé"
                    >
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      Historique
                    </button>

                    {/* Bouton Restaurer */}
                    <button
                      onClick={() => handleRestore(item)}
                      className="px-2.5 py-1 bg-emerald-400 hover:bg-emerald-500 text-black border border-black font-black text-[10px] uppercase shadow-[1.5px_1.5px_0px_#000] flex items-center gap-1 cursor-pointer active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                      title="Restaurer cet élément"
                    >
                      <RotateCcw size={12} />
                      Restaurer
                    </button>

                    {/* Suppression définitive avec confirmation inline */}
                    {isConfirmingDelete ? (
                      <div className="flex items-center gap-1 bg-red-100 p-1 border border-red-500">
                        <span className="text-[9px] font-black text-red-700 uppercase">Supprimer ?</span>
                        <button
                          onClick={() => handlePermanentDelete(item)}
                          className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white font-black text-[9px] border border-black cursor-pointer shadow-[1px_1px_0px_#000]"
                        >
                          Oui
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-1.5 py-0.5 bg-white hover:bg-gray-100 text-black font-black text-[9px] border border-black cursor-pointer"
                        >
                          Non
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(item.data.id)}
                        className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white border border-black font-black text-[10px] uppercase shadow-[1.5px_1.5px_0px_#000] flex items-center gap-1 cursor-pointer active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                        title="Supprimer définitivement"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Tiroir d'historique expansible */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t-2 border-dashed border-black bg-amber-50/60 p-3 border border-black text-xs space-y-3">
                    <div className="flex items-center justify-between font-black uppercase text-[10px] text-slate-800 border-b border-black/20 pb-1">
                      <span>Détails & Historiques enregistrés</span>
                      <span className="font-mono text-gray-500">ID: {item.data.id}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="bg-white p-2 border border-black">
                        <span className="text-[9px] font-bold text-gray-500 block uppercase">Temps total passé</span>
                        <span className="font-black text-sm text-indigo-700">
                          {formatSeconds(totalWorkSeconds)}
                        </span>
                      </div>
                      <div className="bg-white p-2 border border-black">
                        <span className="text-[9px] font-bold text-gray-500 block uppercase">Jours avec activité</span>
                        <span className="font-black text-sm text-slate-800">
                          {workHistoryDays} jour{workHistoryDays > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="bg-white p-2 border border-black">
                        <span className="text-[9px] font-bold text-gray-500 block uppercase">Créé le</span>
                        <span className="font-bold text-xs text-slate-700">
                          {formatDate(item.data.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Historique de travail journalier (workHistory) */}
                    {item.data.workHistory && Object.keys(item.data.workHistory).length > 0 && (
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-800 block mb-1">
                          Historique des sessions par date :
                        </span>
                        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                          {Object.entries(item.data.workHistory)
                            .sort(([a], [b]) => b.localeCompare(a))
                            .map(([date, sec]) => (
                              <div key={date} className="bg-white px-2 py-1 border border-black text-[10px] font-mono flex items-center gap-1.5">
                                <span className="font-bold text-slate-700">{date}</span>
                                <span className="text-indigo-600 font-black">{formatSeconds(Number(sec) || 0)}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Historique de validation (pour habitudes/récurrences) */}
                    {'history' in item.data && item.data.history && Object.keys(item.data.history).length > 0 && (
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-800 block mb-1">
                          Historique des validations :
                        </span>
                        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                          {Object.entries(item.data.history)
                            .filter(([, val]) => Number(val) > 0)
                            .sort(([a], [b]) => b.localeCompare(a))
                            .map(([date, val]) => (
                              <div key={date} className="bg-emerald-100 px-2 py-0.5 border border-emerald-600 text-[10px] font-mono text-emerald-900 font-bold flex items-center gap-1">
                                <Check size={10} />
                                <span>{date} ({String(val)})</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* TimeLog spécifique (tâches) */}
                    {'timeLog' in item.data && item.data.timeLog && item.data.timeLog.length > 0 && (
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-800 block mb-1">
                          Journal des sessions (TimeLogs) :
                        </span>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {item.data.timeLog.map((log) => (
                            <div key={log.id} className="bg-white p-1.5 border border-black text-[10px] flex justify-between items-center">
                              <span className="font-bold text-gray-700">{formatDate(log.date)}</span>
                              <span className="font-black text-indigo-600">{log.durationMinutes} min</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default ArchivesView;
