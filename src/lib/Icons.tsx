import React from 'react';

type IconProps = React.HTMLAttributes<HTMLSpanElement> & {
  title?: string;
};

const createIcon = (emoji: string, defaultAriaLabel: string): React.FC<IconProps> => {
    const IconComponent: React.FC<IconProps> = ({ className, title, ...rest }) => {
        return (
            <span
                role="img"
                aria-label={title || defaultAriaLabel}
                {...rest}
                className={`${className || ''} pointer-events-none select-none`}
            >
                {emoji}
            </span>
        );
    };
    const componentName = defaultAriaLabel.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
    IconComponent.displayName = `${componentName}Icon`;
    return IconComponent;
};

export const PlusIcon = createIcon('➕', 'plus');
export const FireIcon = createIcon('🔥', 'fire');
export const PlanIcon = createIcon('🗓️', 'plan');
export const DelegateIcon = createIcon('👥', 'delegate');
export const TrashIcon = createIcon('🗑️', 'delete');
export const CheckIcon = createIcon('✔️', 'check');
export const MoreIcon = createIcon('…', 'more');
export const CheckCircleIcon = createIcon('✅', 'check circle');
export const PlayCircleIcon = createIcon('▶️', 'play circle');
export const ArrowRightCircleIcon = createIcon('➡️', 'arrow right');
export const PlayIcon = createIcon('▶️', 'play');
export const PauseIcon = createIcon('⏸️', 'pause');
export const StopIcon = createIcon('⏹️', 'stop');
export const ClockIcon = createIcon('⏰', 'clock');
export const RepeatIcon = createIcon('🔁', 'repeat');
export const PlusCircleIcon = createIcon('➕', 'plus circle');
export const MinusCircleIcon = createIcon('➖', 'minus circle');
export const CalendarDaysIcon = createIcon('🗓️', 'calendar');
export const Squares2X2Icon = createIcon('🔲', 'matrix');
export const InboxArrowDownIcon = createIcon('📥', 'inbox');
export const ArrowDownTrayIcon = createIcon('📥', 'download');
export const ArrowUpTrayIcon = createIcon('📤', 'upload');
export const StarIcon = createIcon('⭐', 'star');
export const SunIcon = createIcon('☀️', 'sun');
export const TrophyIcon = createIcon('🏆', 'trophy');
export const ChartBarSquareIcon = createIcon('📊', 'chart');
export const TagIcon = createIcon('🏷️', 'tag');
export const ChartPieIcon = createIcon('🥧', 'pie chart');
export const LightBulbIcon = createIcon('💡', 'idea');
export const ExclamationCircleIcon = createIcon('ℹ️', 'info');
export const XMarkIcon = createIcon('❌', 'close');
export const BookOpenIcon = createIcon('📖', 'book');
export const MoodGreatIcon = createIcon('😄', 'great mood');
export const MoodGoodIcon = createIcon('😊', 'good mood');
export const MoodNeutralIcon = createIcon('😐', 'neutral mood');
export const MoodBadIcon = createIcon('🙁', 'bad mood');
export const MoodTerribleIcon = createIcon('😫', 'terrible mood');
export const BellIcon = createIcon('🔔', 'bell');
export const ForwardIcon = createIcon('⏩', 'forward');
export const ChevronDoubleRightIcon = createIcon('⏩', 'chevron right');
export const RocketLaunchIcon = createIcon('🚀', 'rocket');
export const ClipboardDocumentCheckIcon = createIcon('📋', 'clipboard check');
export const ClipboardDocumentListIcon = createIcon('📋', 'clipboard list');
export const SparklesIcon = createIcon('✨', 'sparkles');
export const ShieldCheckIcon = createIcon('🛡️', 'shield');
export const BoltIcon = createIcon('⚡️', 'bolt');
export const AcademicCapIcon = createIcon('🎓', 'academic cap');
export const PaperClipIcon = createIcon('📎', 'paperclip');
export const CloudIcon = createIcon('☁️', 'cloud');
export const CloudCheckIcon = createIcon('✅', 'cloud check');
export const CloudArrowUpIcon = createIcon('📤', 'upload');
export const CloudArrowDownIcon = createIcon('📥', 'download');
export const ExclamationTriangleIcon = createIcon('⚠️', 'warning');
export const CpuChipIcon = createIcon('🎯', 'focus');
export const Cog6ToothIcon = createIcon('⚙️', 'settings');
export const ServerIcon = createIcon('🖥️', 'server');
export const KeyIcon = createIcon('🔑', 'key');
export const ArrowPathIcon = createIcon('🔄', 'refresh');
export const BeakerIcon = createIcon('🔬', 'analyze');
export const PencilIcon = createIcon('✏️', 'edit');
export const CoffeeIcon = createIcon('☕️', 'coffee');
export const MoonIcon = createIcon('🌙', 'moon');
export const ScrollIcon = createIcon('📜', 'history');
export const ChatIcon = createIcon('💬', 'chat');
export const PaperAirplaneIcon = createIcon('✈️', 'send');
export const BedIcon = createIcon('🛏️', 'bed');
export const DumbbellIcon = createIcon('🏋️', 'dumbbell');
export const GameControllerIcon = createIcon('🎮', 'game controller');
export const ArrowDownIcon = createIcon('⬇️', 'arrow down');
export const PinIcon = createIcon('📌', 'pin');
export const BrainIcon = createIcon('🧠', 'brain');
export const SwitchVerticalIcon = createIcon('⇅', 'ranking');
export const WrenchIcon = createIcon('🛠️', 'difficulty');
export const MicrophoneIcon = createIcon('🎤', 'microphone');
export const Bars3Icon = createIcon('☰', 'menu');
export const FloppyDiskIcon = createIcon('💾', 'floppy disk');
export const StethoscopeIcon = createIcon('🩺', 'stethoscope');
export const ArchiveBoxIcon = createIcon('🗄️', 'archive box');
export const PillIcon = createIcon('💊', 'pill');
export const CompassIcon = createIcon('🧭', 'compass');
export const ChecklistIcon = createIcon('🗒️', 'checklist');
export const ShareIcon = createIcon('🕸️', 'share');

export const defaultIconComponents = {
    plus: { component: PlusIcon, label: 'Plus' },
    sparkles: { component: SparklesIcon, label: 'Étincelles (Ajout Intelligent)' },
    lightBulb: { component: LightBulbIcon, label: 'Ampoule (Suggestion IA)' },
    arrowPath: { component: ArrowPathIcon, label: 'Rafraîchir/Charger' },
    clipboardDocumentList: { component: ClipboardDocumentListIcon, label: 'Presse-papiers (Suivi IA)' },
    moon: { component: MoonIcon, label: 'Lune (Générique)' },
    sun: { component: SunIcon, label: 'Soleil (Générique)' },
    bars3: { component: Bars3Icon, label: 'Menu Mobile' },
    exclamationTriangle: { component: ExclamationTriangleIcon, label: 'Avertissement' },
    xMark: { component: XMarkIcon, label: 'Fermer' },
    bed: { component: BedIcon, label: 'Lit (Sommeil)' },
    dumbbell: { component: DumbbellIcon, label: 'Haltère (Sport)' },
    gameController: { component: GameControllerIcon, label: 'Manette (Jeu)' },
    tag: { component: TagIcon, label: 'Étiquette (Tracker)' },
    checkCircle: { component: CheckCircleIcon, label: 'Coche Circulaire (Générique)' },
    check: { component: CheckIcon, label: 'Coche' },
    bell: { component: BellIcon, label: 'Cloche' },
    trash: { component: TrashIcon, label: 'Corbeille' },
    pencil: { component: PencilIcon, label: 'Crayon (Modifier)' },
    beaker: { component: BeakerIcon, label: 'Bécher (Analyser)' },
    chat: { component: ChatIcon, label: 'Chat' },
    compass: { component: CompassIcon, label: 'Boussole (Tableau de bord)' },
    switchVertical: { component: SwitchVerticalIcon, label: 'Flèches Verticales (Classement)' },
    stethoscope: { component: StethoscopeIcon, label: 'Stéthoscope (Santé)' },
    cog6Tooth: { component: Cog6ToothIcon, label: 'Engrenage (Réglages)' },
    chartBarSquare: { component: ChartBarSquareIcon, label: 'Graphique (Habitudes)' },
    calendarDays: { component: CalendarDaysIcon, label: 'Calendrier (Semaine)' },
    key: { component: KeyIcon, label: 'Clé (API)' },
    arrowDownTray: { component: ArrowDownTrayIcon, label: 'Télécharger' },
    academicCap: { component: AcademicCapIcon, label: 'Diplôme (Icônes)' },
    trophy: { component: TrophyIcon, label: 'Trophée (Générique)' },
    fire: { component: FireIcon, label: 'Feu (Générique)' },
    bolt: { component: BoltIcon, label: 'Éclair (Urgence)' },
    brain: { component: BrainIcon, label: 'Cerveau (Charge Mentale)' },
    stop: { component: StopIcon, label: 'Stop' },
    play: { component: PlayIcon, label: 'Play' },
    clock: { component: ClockIcon, label: 'Horloge (Générique)' },
    plusCircle: { component: PlusCircleIcon, label: 'Plus Circulaire' },
    minusCircle: { component: MinusCircleIcon, label: 'Moins Circulaire' },
    star: { component: StarIcon, label: 'Étoile' },
    repeat: { component: RepeatIcon, label: 'Répéter' },
    scroll: { component: ScrollIcon, label: 'Parchemin (Historique)' },
    paperAirplane: { component: PaperAirplaneIcon, label: 'Envoyer' },
    microphone: { component: MicrophoneIcon, label: 'Microphone' },
    floppyDisk: { component: FloppyDiskIcon, label: 'Disquette (Sauvegarder)' },
    archiveBox: { component: ArchiveBoxIcon, label: 'Archiver' },
    pill: { component: PillIcon, label: 'Pilule (Médicament)' },
    pin: { component: PinIcon, label: 'Épingle' },
    wrench: { component: WrenchIcon, label: 'Clé (Difficulté)' },
    paperClip: { component: PaperClipIcon, label: 'Trombone (Pièce jointe)' },
    shieldCheck: { component: ShieldCheckIcon, label: 'Bouclier (Sécurité)' },
    cloud: { component: CloudIcon, label: 'Nuage (Synchro)' },
    checklist: { component: ChecklistIcon, label: 'Checklist (Préparations)' },
    share: { component: ShareIcon, label: 'Réseau (Mind Map)' },

    // Specific duplicates
    sparklesEasiness: { component: SparklesIcon, label: 'Étincelles (Facilité)' },
    lightBulbCoaching: { component: LightBulbIcon, label: 'Ampoule (Coaching Habitude)' },
    arrowPathSyncing: { component: ArrowPathIcon, label: 'Synchronisation en cours' },
    arrowPathReset: { component: ArrowPathIcon, label: 'Réinitialiser Tâche' },
    moonTheme: { component: MoonIcon, label: 'Lune (Thème Sombre)' },
    moonMelatonin: { component: MoonIcon, label: 'Lune (Mélatonine)' },
    sunTheme: { component: SunIcon, label: 'Soleil (Thème Clair)' },
    sunRitaline: { component: SunIcon, label: 'Soleil (Ritaline)' },
    checkCircleTask: { component: CheckCircleIcon, label: 'Coche (Tâche Terminée)' },
    checkCircleChallenge: { component: CheckCircleIcon, label: 'Coche (Défi Terminé)' },
    trophyScore: { component: TrophyIcon, label: 'Trophée (Meilleur Score)' },
    trophyStreak: { component: TrophyIcon, label: 'Trophée (Meilleure Série)' },
    fireImportance: { component: FireIcon, label: 'Feu (Importance)' },
    fireStreak: { component: FireIcon, label: 'Feu (Série Habitude)' },
    clockTimeLog: { component: ClockIcon, label: 'Horloge (Temps Passé)' },
    clockDeadline: { component: ClockIcon, label: 'Horloge (Échéance)' },
};
