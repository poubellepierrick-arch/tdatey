import React, { useState, useMemo } from 'react';
import type { AppDatabase, Task } from '../../types';
import { 
  CheckCircle2, RotateCcw, Trash2, Search, Calendar, Clock, 
  ChevronDown, ChevronUp, Check, Tag, Archive, Coins
} from 'lucide-react';
import GoogleSheetsExportButton from '../dashboard/GoogleSheetsExportButton';

interface CompletedTasksTabProps {
  db: AppDatabase;
  updateDb: (newDb: AppDatabase) => void;
  onShowToast: (msg: string) => void;
}

type DateFilter = 'all' | 'today' | '7days' | '30days';
type SortOption = 'completed_desc' | 'completed_asc' | 'title_asc' | 'time_desc' | 'coins_desc';

export const CompletedTasksTab: React.FC<CompletedTasksTabProps> = ({ db, updateDb, onShowToast }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('completed_desc');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const todayStr = useMemo(() => {
    return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
  }, []);

  // 1. Liste de toutes les tâches terminées (exclut les routines de planification)
  const completedTasks = useMemo(() => {
    return (db.tasks || []).filter(
      (t) => (t.isCompleted || t.status === 'done' || t.planningStatus === 'done') && t.type !== "routine" && !t.isPlanningOnly
    );
  }, [db.tasks]);

  // 2. Extraire tous les tags uniques des tâches terminées
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    completedTasks.forEach((t) => {
      if (t.tags && Array.isArray(t.tags)) {
        t.tags.forEach((tag) => {
          if (tag.trim()) tagsSet.add(tag.trim());
        });
      }
    });
    return Array.from(tagsSet);
  }, [completedTasks]);

  // 3. Filtrage des tâches terminées
  const filteredTasks = useMemo(() => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 86400000;
    const thirtyDaysAgo = now - 30 * 86400000;

    return completedTasks.filter((t) => {
      // Filtre de recherche texte
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = t.title.toLowerCase().includes(q);
        const descMatch = (t.description || '').toLowerCase().includes(q);
        const tagsMatch = (t.tags || []).some((tag) => tag.toLowerCase().includes(q));
        if (!titleMatch && !descMatch && !tagsMatch) return false;
      }

      // Filtre par tag
      if (selectedTag) {
        if (!t.tags || !t.tags.includes(selectedTag)) return false;
      }

      // Filtre temporel
      if (dateFilter !== 'all') {
        const compDateStr = t.completedAt ? t.completedAt.split('T')[0] : '';
        const compTime = t.completedAt ? new Date(t.completedAt).getTime() : 0;

        if (dateFilter === 'today') {
          if (compDateStr !== todayStr) return false;
        } else if (dateFilter === '7days') {
          if (compTime < sevenDaysAgo) return false;
        } else if (dateFilter === '30days') {
          if (compTime < thirtyDaysAgo) return false;
        }
      }

      return true;
    });
  }, [completedTasks, searchQuery, selectedTag, dateFilter, todayStr]);

  // 4. Tri des tâches terminées
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      if (sortOption === 'completed_desc') {
        const dateA = a.completedAt ? new Date(a.completedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const dateB = b.completedAt ? new Date(b.completedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return dateB - dateA;
      }
      if (sortOption === 'completed_asc') {
        const dateA = a.completedAt ? new Date(a.completedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const dateB = b.completedAt ? new Date(b.completedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return dateA - dateB;
      }
      if (sortOption === 'title_asc') {
        return a.title.localeCompare(b.title);
      }
      if (sortOption === 'time_desc') {
        const timeA = a.timeSpentSeconds || a.accumulatedTime || 0;
        const timeB = b.timeSpentSeconds || b.accumulatedTime || 0;
        return timeB - timeA;
      }
      if (sortOption === 'coins_desc') {
        const coinsA = a.rewardValue !== undefined ? a.rewardValue : 15;
        const coinsB = b.rewardValue !== undefined ? b.rewardValue : 15;
        return coinsB - coinsA;
      }
      return 0;
    });
  }, [filteredTasks, sortOption]);

  // 5. Statistiques globales des tâches terminées
  const stats = useMemo(() => {
    let totalSec = 0;
    let totalCoins = 0;
    completedTasks.forEach((t) => {
      totalSec += t.timeSpentSeconds || t.accumulatedTime || 0;
      totalCoins += t.rewardValue !== undefined ? t.rewardValue : 15;
    });
    return {
      count: completedTasks.length,
      totalMinutes: Math.floor(totalSec / 60),
      totalCoins,
    };
  }, [completedTasks]);

  // --- RESTAURATION DE LA TÂCHE ---
  const handleRestoreTask = (task: Task) => {
    const updatedTasks = db.tasks.map((t) => {
      if (t.id === task.id) {
        return {
          ...t,
          isCompleted: false,
          status: 'todo' as const,
          planningStatus: t.scheduledTime ? ('scheduled' as const) : ('backlog' as const),
          completedAt: undefined,
          isArchived: false,
          archivedAt: undefined,
          isPaused: true,
          lastResumeTime: undefined,
        };
      }
      // Si la tâche a des sous-tâches, les restaurer également
      if (t.parentId === task.id || t.parentTaskId === task.id) {
        return {
          ...t,
          isCompleted: false,
          status: 'todo' as const,
          planningStatus: 'backlog' as const,
          completedAt: undefined,
          isArchived: false,
          archivedAt: undefined,
        };
      }
      return t;
    });

    updateDb({
      ...db,
      tasks: updatedTasks,
    });

    onShowToast(`"${task.title}" restaurée avec succès`);
  };

  // --- SUPPRESSION DÉFINITIVE ---
  const handlePermanentDelete = (taskId: string, title: string) => {
    const updatedTasks = db.tasks.filter((t) => t.id !== taskId && t.parentId !== taskId && t.parentTaskId !== taskId);
    updateDb({
      ...db,
      tasks: updatedTasks,
    });
    setConfirmDeleteId(null);
    onShowToast(`"${title}" définitivement supprimée`);
  };

  // --- ARCHIVAGE / DÉSARCHIVAGE ---
  const handleToggleArchive = (task: Task) => {
    const nextArchived = !task.isArchived;
    const updatedTasks = db.tasks.map((t) => {
      if (t.id === task.id) {
        return {
          ...t,
          isArchived: nextArchived,
          archivedAt: nextArchived ? new Date().toISOString() : undefined,
        };
      }
      return t;
    });
    updateDb({ ...db, tasks: updatedTasks });
    onShowToast(nextArchived ? `"${task.title}" archivée` : `"${task.title}" désarchivée`);
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return 'Date inconnue';
    try {
      const d = new Date(isoStr);
      return isNaN(d.getTime())
        ? 'Date inconnue'
        : d.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
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
    <div className="space-y-4">
      {/* Panneau supérieur de contrôle */}
      <div className="bg-white border-4 border-black p-4 sm:p-6 shadow-[6px_6px_0px_#000]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider flex items-center gap-2.5">
              <CheckCircle2 className="text-emerald-600" size={26} />
              <span>Tâches Terminées</span>
            </h1>
            <p className="text-xs text-gray-600 font-bold mt-1">
              Consultez l'historique complet de vos tâches accomplies et restaurez-les en un clic.
            </p>
          </div>

          {/* Résumé compact */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-black">
            <span className="bg-emerald-100 border-2 border-black px-2.5 py-1 text-emerald-900">
              {stats.count} tâche{stats.count > 1 ? 's' : ''}
            </span>
            {stats.totalMinutes > 0 && (
              <span className="bg-indigo-100 border-2 border-black px-2.5 py-1 text-indigo-900 flex items-center gap-1">
                <Clock size={12} />
                {stats.totalMinutes} min travaillées
              </span>
            )}
            <span className="bg-amber-100 border-2 border-black px-2.5 py-1 text-amber-900 flex items-center gap-1">
              <Coins size={12} />
              +{stats.totalCoins} CS
            </span>
            <GoogleSheetsExportButton db={db} variant="compact" />
          </div>
        </div>

        {/* Filtres, Tri et Recherche */}
        <div className="mt-4 pt-4 border-t-2 border-black flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Filtres de date */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] font-black uppercase text-gray-500 mr-1">Période :</span>
            <button
              onClick={() => setDateFilter('all')}
              className={`px-2.5 py-1 text-xs font-black uppercase border-2 border-black cursor-pointer transition-all ${
                dateFilter === 'all'
                  ? 'bg-black text-white shadow-[2px_2px_0px_#000]'
                  : 'bg-white hover:bg-gray-100'
              }`}
            >
              Toutes ({completedTasks.length})
            </button>
            <button
              onClick={() => setDateFilter('today')}
              className={`px-2.5 py-1 text-xs font-black uppercase border-2 border-black cursor-pointer transition-all ${
                dateFilter === 'today'
                  ? 'bg-black text-white shadow-[2px_2px_0px_#000]'
                  : 'bg-white hover:bg-gray-100'
              }`}
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => setDateFilter('7days')}
              className={`px-2.5 py-1 text-xs font-black uppercase border-2 border-black cursor-pointer transition-all ${
                dateFilter === '7days'
                  ? 'bg-black text-white shadow-[2px_2px_0px_#000]'
                  : 'bg-white hover:bg-gray-100'
              }`}
            >
              7 jours
            </button>
            <button
              onClick={() => setDateFilter('30days')}
              className={`px-2.5 py-1 text-xs font-black uppercase border-2 border-black cursor-pointer transition-all ${
                dateFilter === '30days'
                  ? 'bg-black text-white shadow-[2px_2px_0px_#000]'
                  : 'bg-white hover:bg-gray-100'
              }`}
            >
              30 jours
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Tri */}
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="px-2 py-1 text-xs font-black border-2 border-black bg-white focus:outline-none focus:bg-amber-50 cursor-pointer"
            >
              <option value="completed_desc">Fin : Récente d'abord</option>
              <option value="completed_asc">Fin : Ancienne d'abord</option>
              <option value="title_asc">Titre (A-Z)</option>
              <option value="time_desc">Temps passé</option>
              <option value="coins_desc">Gains en CS</option>
            </select>

            {/* Barre de recherche */}
            <div className="relative min-w-[200px]">
              <Search className="absolute left-2.5 top-2 text-gray-500" size={14} />
              <input
                type="text"
                placeholder="Rechercher tâche ou tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1 text-xs border-2 border-black bg-white focus:outline-none focus:bg-amber-50"
              />
            </div>
          </div>
        </div>

        {/* Filtres de tags si présents */}
        {allTags.length > 0 && (
          <div className="mt-3 pt-3 border-t border-dashed border-gray-300 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-black uppercase text-gray-500 flex items-center gap-1">
              <Tag size={10} /> Tags :
            </span>
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-2 py-0.5 text-[10px] font-black uppercase border border-black cursor-pointer ${
                selectedTag === null ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Tous
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-2 py-0.5 text-[10px] font-bold border border-black cursor-pointer ${
                  selectedTag === tag ? 'bg-indigo-600 text-white' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Liste des tâches terminées */}
      {sortedTasks.length === 0 ? (
        <div className="bg-white border-4 border-black p-12 text-center shadow-[4px_4px_0px_#000]">
          <CheckCircle2 size={40} className="mx-auto text-gray-400 mb-3" />
          <p className="font-black text-sm uppercase text-gray-700">Aucune tâche terminée trouvée</p>
          <p className="text-xs text-gray-500 font-bold mt-1">
            {searchQuery || selectedTag || dateFilter !== 'all'
              ? 'Aucun élément ne correspond aux filtres appliqués.'
              : 'Toutes les tâches complétées dans votre application apparaîtront ici.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedTasks.map((t) => {
            const isExpanded = expandedTaskId === t.id;
            const isConfirmingDelete = confirmDeleteId === t.id;
            const totalWorkSec = t.timeSpentSeconds || t.accumulatedTime || 0;
            const workDaysCount = Object.keys(t.workHistory || {}).length;
            const rewardCoins = t.rewardValue !== undefined ? t.rewardValue : 15;

            // Sous-tâches associées
            const subtasks = (db.tasks || []).filter(
              (st) => st.parentId === t.id || st.parentTaskId === t.id
            );
            const completedSubCount = subtasks.filter(
              (st) => st.isCompleted || st.status === 'done'
            ).length;

            return (
              <div
                key={t.id}
                className="bg-white border-3 border-black shadow-[4px_4px_0px_#000] p-3.5 transition-all hover:shadow-[5px_5px_0px_#000]"
              >
                {/* Ligne principale */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5 flex-grow min-w-0">
                    {/* Icône de la tâche */}
                    <span className="text-lg shrink-0 mt-0.5 select-none">
                      {t.icon
                        ? typeof t.icon === 'string'
                          ? t.icon
                          : t.icon.content
                        : '✅'}
                    </span>

                    <div className="min-w-0 flex-grow">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-sm uppercase text-slate-800 line-through truncate">
                          {t.title}
                        </h3>

                        <span className="bg-emerald-100 text-emerald-900 border border-emerald-500 text-[8px] font-black px-1.5 py-0.2 uppercase">
                          Terminée
                        </span>

                        {t.isArchived && (
                          <span className="bg-gray-200 text-gray-700 border border-black text-[8px] font-black px-1.5 py-0.2 uppercase flex items-center gap-0.5">
                            <Archive size={8} /> Archivée
                          </span>
                        )}

                        {subtasks.length > 0 && (
                          <span className="bg-indigo-50 text-indigo-700 border border-indigo-300 text-[9px] font-bold px-1.5 py-0.2">
                            Sous-tâches : {completedSubCount}/{subtasks.length}
                          </span>
                        )}
                      </div>

                      {t.description && (
                        <p className="text-xs text-gray-500 font-normal line-clamp-1 mt-0.5">
                          {t.description}
                        </p>
                      )}

                      {/* Métadonnées */}
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[10px] text-gray-500 font-bold">
                        <span className="flex items-center gap-1 text-emerald-800">
                          <Calendar size={11} />
                          Terminée le : {formatDate(t.completedAt || t.createdAt)}
                        </span>

                        {totalWorkSec > 0 && (
                          <span className="flex items-center gap-1 text-indigo-700">
                            <Clock size={11} />
                            Temps : {formatSeconds(totalWorkSec)}
                          </span>
                        )}

                        <span className="flex items-center gap-1 text-amber-700 font-black">
                          <Coins size={11} />
                          +{rewardCoins} CS
                        </span>

                        {t.tags && t.tags.length > 0 && (
                          <div className="flex items-center gap-1">
                            {t.tags.map((tag) => (
                              <span key={tag} className="text-indigo-600 font-bold">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Inline */}
                  <div className="flex items-center gap-2 shrink-0 justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-dashed border-gray-200">
                    {/* Bouton Détails / Historique */}
                    <button
                      onClick={() => setExpandedTaskId(isExpanded ? null : t.id)}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 border border-black font-black text-[10px] uppercase flex items-center gap-1 cursor-pointer"
                      title="Afficher les détails et historiques"
                    >
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      Détails
                    </button>

                    {/* Bouton Restaurer */}
                    <button
                      onClick={() => handleRestoreTask(t)}
                      className="px-3 py-1 bg-[#24B27F] hover:bg-emerald-600 text-white border border-black font-black text-[10px] uppercase shadow-[2px_2px_0px_#000] flex items-center gap-1.5 cursor-pointer active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                      title="Restaurer cette tâche et la remettre dans les tâches actives"
                    >
                      <RotateCcw size={12} />
                      Restaurer
                    </button>

                    {/* Bouton Archiver / Désarchiver */}
                    <button
                      onClick={() => handleToggleArchive(t)}
                      className={`px-2 py-1 border border-black font-black text-[10px] uppercase shadow-[1.5px_1.5px_0px_#000] flex items-center gap-1 cursor-pointer ${
                        t.isArchived ? 'bg-amber-300 hover:bg-amber-400' : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                      title={t.isArchived ? 'Désarchiver' : 'Archiver'}
                    >
                      <Archive size={11} />
                    </button>

                    {/* Suppression définitive avec confirmation inline */}
                    {isConfirmingDelete ? (
                      <div className="flex items-center gap-1 bg-red-100 p-1 border border-red-500">
                        <span className="text-[9px] font-black text-red-700 uppercase">Supprimer ?</span>
                        <button
                          onClick={() => handlePermanentDelete(t.id, t.title)}
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
                        onClick={() => setConfirmDeleteId(t.id)}
                        className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white border border-black font-black text-[10px] uppercase shadow-[1.5px_1.5px_0px_#000] flex items-center gap-1 cursor-pointer active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                        title="Supprimer définitivement"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Tiroir d'expansion / détails */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t-2 border-dashed border-black bg-emerald-50/50 p-3 border border-black text-xs space-y-3">
                    <div className="flex items-center justify-between font-black uppercase text-[10px] text-slate-800 border-b border-black/20 pb-1">
                      <span>Détails de la tâche terminée</span>
                      <span className="font-mono text-gray-500">ID: {t.id}</span>
                    </div>

                    {/* Grille de scores et métadonnées */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="bg-white p-2 border border-black">
                        <span className="text-[9px] font-bold text-gray-500 block uppercase">Importance</span>
                        <span className="font-black text-xs text-slate-800">{t.importance ?? 5} / 10</span>
                      </div>
                      <div className="bg-white p-2 border border-black">
                        <span className="text-[9px] font-bold text-gray-500 block uppercase">Urgence</span>
                        <span className="font-black text-xs text-slate-800">{t.urgency ?? 5} / 10</span>
                      </div>
                      <div className="bg-white p-2 border border-black">
                        <span className="text-[9px] font-bold text-gray-500 block uppercase">Charge mentale</span>
                        <span className="font-black text-xs text-slate-800">{t.mentalLoad ?? 5} / 10</span>
                      </div>
                      <div className="bg-white p-2 border border-black">
                        <span className="text-[9px] font-bold text-gray-500 block uppercase">Facilité</span>
                        <span className="font-black text-xs text-slate-800">{t.easiness ?? 5} / 10</span>
                      </div>
                    </div>

                    {/* Liste des sous-tâches */}
                    {subtasks.length > 0 && (
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-800 block mb-1">
                          Sous-tâches associées ({completedSubCount}/{subtasks.length}) :
                        </span>
                        <div className="space-y-1 bg-white p-2 border border-black">
                          {subtasks.map((st) => {
                            const isDone = st.isCompleted || st.status === 'done';
                            return (
                              <div
                                key={st.id}
                                className="flex items-center gap-2 text-xs py-0.5"
                              >
                                <span className={isDone ? 'text-emerald-600 font-bold' : 'text-gray-400'}>
                                  {isDone ? '☑' : '☐'}
                                </span>
                                <span className={isDone ? 'line-through text-gray-500 font-bold' : 'text-black'}>
                                  {st.title}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Historique des sessions de travail (workHistory) */}
                    {t.workHistory && Object.keys(t.workHistory).length > 0 && (
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-800 block mb-1">
                          Historique de travail par date :
                        </span>
                        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                          {Object.entries(t.workHistory)
                            .sort(([a], [b]) => b.localeCompare(a))
                            .map(([date, sec]) => (
                              <div
                                key={date}
                                className="bg-white px-2 py-1 border border-black text-[10px] font-mono flex items-center gap-1.5"
                              >
                                <span className="font-bold text-slate-700">{date}</span>
                                <span className="text-indigo-600 font-black">{formatSeconds(Number(sec) || 0)}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* TimeLog spécifique */}
                    {t.timeLog && t.timeLog.length > 0 && (
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-800 block mb-1">
                          Sessions enregistrées (TimeLogs) :
                        </span>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {t.timeLog.map((log) => (
                            <div
                              key={log.id}
                              className="bg-white p-1.5 border border-black text-[10px] flex justify-between items-center"
                            >
                              <span className="font-bold text-gray-700">{formatDate(log.date)}</span>
                              <span className="font-black text-indigo-600">{log.duration} min</span>
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
    </div>
  );
};

export default CompletedTasksTab;
