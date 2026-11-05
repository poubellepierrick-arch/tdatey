
import React, { useState, useMemo, useEffect } from 'react';

export const EMOJI_WITH_TAGS: Record<string, { icon: string; tags: string[] }[]> = {
    '⭐ Habitudes & Quotidien': [
        { icon: '🎯', tags: ['cible', 'objectif', 'focus', 'tâche', 'priorité'] },
        { icon: '⚡', tags: ['énergie', 'rapide', 'éclair', 'vitalité', 'boost'] },
        { icon: '🏋️', tags: ['sport', 'muscu', 'gym', 'mouvement', 'musculation', 'fitness', 'entraînement'] },
        { icon: '💧', tags: ['eau', 'boire', 'verre', 'hydratation', 'santé'] },
        { icon: '🧹', tags: ['ménage', 'nettoyer', 'ranger', 'balai', 'propre', 'tâche ménagère'] },
        { icon: '📚', tags: ['livre', 'lecture', 'étudier', 'lire', 'apprentissage'] },
        { icon: '🧘', tags: ['méditation', 'zen', 'calme', 'respiration', 'yoga', 'détente'] },
        { icon: '💻', tags: ['code', 'travail', 'dev', 'ordi', 'informatique', 'bureau'] },
        { icon: '🌙', tags: ['sommeil', 'dormir', 'lit', 'coucher', 'nuit', 'repos'] },
        { icon: '💊', tags: ['médicament', 'pilule', 'traitement', 'santé', 'pharmacie', 'soin'] },
        { icon: '❤️', tags: ['ami', 'famille', 'amour', 'proche', 'relation', 'contacter'] },
        { icon: '📱', tags: ['téléphone', 'sms', 'répondre', 'appeler', 'message', 'mobile'] },
        { icon: '📧', tags: ['mail', 'email', 'courrier', 'écrire', 'inbox'] },
        { icon: '💶', tags: ['argent', 'facture', 'budget', 'banque', 'payer', 'impôt', 'comptabilité'] },
        { icon: '🚗', tags: ['voiture', 'conduire', 'trajet', 'transport', 'route'] },
        { icon: '🏃', tags: ['courir', 'course', 'jogging', 'cardio', 'endurance'] },
        { icon: '🚶', tags: ['marche', 'pas', 'promenade', 'balade', 'extérieur'] },
        { icon: '🚿', tags: ['douche', 'laver', 'propre', 'hygiène', 'corps'] },
        { icon: '🧼', tags: ['savon', 'mains', 'hygiène', 'propre'] },
        { icon: '🪒', tags: ['rasoir', 'barbe', 'raser', 'soin'] },
        { icon: '💇', tags: ['cheveux', 'coiffeur', 'coupe', 'beauté'] },
        { icon: '🦷', tags: ['dents', 'brosser', 'dentiste', 'hygiène'] },
        { icon: '🥗', tags: ['repas', 'salade', 'manger', 'nutrition', 'légumes', 'santé'] },
        { icon: '☕', tags: ['café', 'matin', 'pause', 'tasse', 'expresso'] },
        { icon: '🍵', tags: ['thé', 'infusion', 'tisane', 'boisson chaude'] },
        { icon: '⏰', tags: ['réveil', 'horloge', 'heure', 'matin', 'chrono', 'temps'] },
        { icon: '📝', tags: ['note', 'écrire', 'journal', 'liste', 'mémo'] },
        { icon: '🧺', tags: ['linge', 'lessive', 'panier', 'vêtements'] },
        { icon: '🍎', tags: ['pomme', 'fruit', 'goûter', 'collation', 'santé'] },
        { icon: '🥑', tags: ['avocat', 'aliment', 'cuisine', 'nutrition'] },
        { icon: '🍳', tags: ['cuisiner', 'cuisine', 'petit-déjeuner', 'repas', 'oeuf'] },
        { icon: '🐶', tags: ['chien', 'promenade', 'animal', 'compagnie'] },
        { icon: '🐱', tags: ['chat', 'litière', 'animal', 'compagnie'] },
        { icon: '🪴', tags: ['plante', 'arroser', 'fleur', 'nature', 'jardin'] },
        { icon: '🎨', tags: ['art', 'dessin', 'peinture', 'créativité', 'loisir'] },
        { icon: '🎵', tags: ['musique', 'écouter', 'son', 'chanson'] },
        { icon: '🎸', tags: ['guitare', 'instrument', 'jouer', 'pratique'] },
        { icon: '🎹', tags: ['piano', 'instrument', 'musique', 'pratique'] },
        { icon: '🛠️', tags: ['bricolage', 'réparation', 'outils', 'travaux'] },
        { icon: '📏', tags: ['mesurer', 'plan', 'devis', 'précision'] },
        { icon: '🎭', tags: ['théâtre', 'impro', 'jeu', 'spectacle', 'divertissement'] },
        { icon: '🎲', tags: ['jeu', 'détente', 'loisir', 'société'] },
        { icon: '🎮', tags: ['jeux vidéo', 'gaming', 'console', 'détente'] },
        { icon: '🛒', tags: ['courses', 'supermarché', 'achats', 'magasin'] },
        { icon: '🧾', tags: ['facture', 'ticket', 'reçu', 'dépense', 'compta'] },
        { icon: '📦', tags: ['colis', 'livraison', 'carton', 'réception'] },
        { icon: '📬', tags: ['courrier', 'lettre', 'poste', 'boîte aux lettres'] },
        { icon: '🏊', tags: ['natation', 'piscine', 'nager', 'bassin'] },
        { icon: '🚴', tags: ['vélo', 'cyclisme', 'balade', 'trajet'] },
        { icon: '🧎', tags: ['étirement', 'stretching', 'souplesse', 'genoux'] },
        { icon: '🧘‍♀️', tags: ['yoga', 'posture', 'méditer', 'bien-être'] },
        { icon: '🧴', tags: ['crème', 'soin de la peau', 'hydrater', 'lotion'] },
        { icon: '🛏️', tags: ['faire le lit', 'chambre', 'repos', 'sieste'] },
    ],
    'Visages & Émotions': [
        { icon: '😀', tags: ['sourire', 'content', 'heureux', 'joie', 'visage'] },
        { icon: '😁', tags: ['grand sourire', 'dents', 'heureux', 'joie'] },
        { icon: '😂', tags: ['rire', 'larmes', 'joie', 'drôle', 'mdr', 'lol'] },
        { icon: '🤣', tags: ['rouler par terre de rire', 'lol', 'mdr', 'drôle'] },
        { icon: '😃', tags: ['sourire', 'yeux ouverts', 'content'] },
        { icon: '😄', tags: ['sourire', 'yeux plissés', 'heureux'] },
        { icon: '😅', tags: ['sourire', 'sueur froide', 'gêné', 'ouf'] },
        { icon: '😆', tags: ['rire', 'yeux fermés', 'satisfait'] },
        { icon: '😉', tags: ['clin d\'œil', 'blague', 'charme', 'secret'] },
        { icon: '😊', tags: ['sourire rougissant', 'timide', 'heureux', 'content'] },
        { icon: '😋', tags: ['gourmand', 'délicieux', 'langue', 'savoureux'] },
        { icon: '😎', tags: ['cool', 'lunettes de soleil', 'détendu', 'classe'] },
        { icon: '😍', tags: ['amour', 'coeur', 'yeux', 'admiration', 'passion'] },
        { icon: '😘', tags: ['bisou', 'baiser', 'cœur', 'affection'] },
        { icon: '🥰', tags: ['amoureux', 'cœurs', 'heureux', 'adoration'] },
        { icon: '😗', tags: ['bisou', 'sifflement', 'innocent'] },
        { icon: '😙', tags: ['bisou', 'yeux souriants', 'affectueux'] },
        { icon: '😚', tags: ['bisou', 'yeux fermés', 'tendre'] },
        { icon: '🙂', tags: ['sourire léger', 'neutre', 'ok'] },
        { icon: '🤗', tags: ['câlin', 'étreinte', 'affection', 'reconfort'] },
        { icon: '🤩', tags: ['étoiles', 'impressionné', 'star', 'wow'] },
        { icon: '🤔', tags: ['réflexion', 'penser', 'interrogation', 'doute'] },
        { icon: '🤨', tags: ['sceptique', 'sourcil levé', 'doute'] },
        { icon: '😐', tags: ['neutre', 'sans expression', 'poker face'] },
        { icon: '😑', tags: ['sans expression', 'blasé', 'fatigué'] },
        { icon: '😶', tags: ['silence', 'bouche cousue', 'secret'] },
        { icon: '🙄', tags: ['yeux au ciel', 'exaspéré', 'sarcasme'] },
        { icon: '😏', tags: ['sourire en coin', 'malice', 'satisfaction'] },
        { icon: '😣', tags: ['persévérance', 'difficulté', 'effort'] },
        { icon: '😥', tags: ['triste', 'déçu', 'sueur'] },
        { icon: '😮', tags: ['surprise', 'bouche bée', 'choc'] },
        { icon: '🤐', tags: ['fermeture éclair', 'secret', 'silence'] },
        { icon: '😯', tags: ['étonné', 'silencieux'] },
        { icon: '😪', tags: ['sommeil', 'fatigué', 'bulle'] },
        { icon: '😫', tags: ['fatigué', 'épuisé', 'souffrance'] },
        { icon: '🥱', tags: ['bâillement', 'fatigue', 'ennui'] },
        { icon: '😴', tags: ['dormir', 'sommeil', 'nuit'] },
        { icon: '😌', tags: ['soulagé', 'détendu', 'satisfait'] },
        { icon: '😛', tags: ['langue tirée', 'blague', 'taquinerie'] },
        { icon: '😜', tags: ['clin d\'œil langue', 'blague', 'folie'] },
        { icon: '😝', tags: ['grimace', 'dégoût', 'blague'] },
        { icon: '🤤', tags: ['bave', 'envie', 'faim', 'désir'] },
        { icon: '😒', tags: ['pas amusé', 'mécontent', 'sceptique'] },
        { icon: '😓', tags: ['sueur', 'stress', 'anxiété'] },
        { icon: '😔', tags: ['pensif', 'triste', 'mélancolique'] },
        { icon: '😕', tags: ['confus', 'perplexe', 'incertain'] },
        { icon: '🙃', tags: ['renversé', 'sarcasme', 'ironie'] },
        { icon: '🤑', tags: ['argent', 'riche', 'dollar', 'paiement', 'facture'] },
        { icon: '😲', tags: ['stupéfait', 'choc', 'surprise'] },
        { icon: '☹️', tags: ['froncement de sourcils', 'triste', 'mécontent'] },
        { icon: '😤', tags: ['frustration', 'colère', 'vapeur'] },
        { icon: '😢', tags: ['tristesse', 'pleurer', 'chagrin', 'peine'] },
        { icon: '😭', tags: ['pleurer', 'sanglots', 'grande tristesse'] },
        { icon: '😦', tags: ['bouche ouverte', 'surprise', 'inquiétude'] },
        { icon: '😧', tags: ['angoissé', 'peur', 'choc'] },
        { icon: '😨', tags: ['peur', 'effrayé', 'horreur'] },
        { icon: '😩', tags: ['épuisé', 'fatigue extrême', 'désespoir'] },
        { icon: '🤯', tags: ['tête qui explose', 'choqué', 'surprise', 'impressionnant'] },
        { icon: '😬', tags: ['grimace', 'gêné', 'nerveux'] },
        { icon: '😰', tags: ['anxiété', 'sueur froide', 'peur'] },
        { icon: '😱', tags: ['cri', 'peur', 'horreur', 'choc'] },
        { icon: '🥵', tags: ['chaud', 'canicule', 'rouge'] },
        { icon: '🥶', tags: ['froid', 'gelé', 'glaçon'] },
        { icon: '😳', tags: ['gêné', 'rougissant', 'honte'] },
        { icon: '🤪', tags: ['fou', 'dingue', 'blague'] },
        { icon: '😵', tags: ['étourdi', 'vertige', 'mort'] },
        { icon: '🥴', tags: ['ivre', 'groggy', 'confus'] },
        { icon: '😠', tags: ['colère', 'fâché', 'énervé', 'rage'] },
        { icon: '😡', tags: ['rage', 'colère intense', 'rouge'] },
        { icon: '🤬', tags: ['juron', 'insulte', 'colère'] },
        { icon: '😷', tags: ['masque', 'malade', 'docteur', 'covid'] },
        { icon: '🤒', tags: ['fièvre', 'thermomètre', 'malade'] },
        { icon: '🤕', tags: ['blessé', 'bandage', 'tête'] },
        { icon: '🤢', tags: ['nausée', 'malade', 'vert'] },
        { icon: '🤮', tags: ['vomir', 'malade'] },
        { icon: '🤧', tags: ['éternuement', 'rhume', 'allergie'] },
        { icon: '😇', tags: ['ange', 'innocent', 'auréole'] },
        { icon: '🥳', tags: ['fête', 'célébration', 'chapeau', 'confetti'] },
        { icon: '🥺', tags: ['supplication', 'triste', 'mignon', 'yeux doux'] },
        { icon: '🤠', tags: ['cowboy', 'chapeau'] },
        { icon: '🤡', tags: ['clown', 'cirque'] },
        { icon: '🤥', tags: ['menteur', 'nez long', 'pinocchio'] },
        { icon: '🤫', tags: ['chut', 'secret', 'silence'] },
        { icon: '🤭', tags: ['hocher la tête', 'rire discret', 'gêne'] },
        { icon: '🧐', tags: ['monocle', 'inspection', 'intelligent'] },
        { icon: '🤓', tags: ['nerd', 'geek', 'intelligent', 'lunettes', 'code', 'dev'] },
        { icon: '😈', tags: ['diable', 'malice', 'sourire'] },
        { icon: '👿', tags: ['diable en colère', 'démon'] },
        { icon: '👹', tags: ['ogre', 'monstre', 'japon'] },
        { icon: '👺', tags: ['gobelin', 'japon'] },
        { icon: '💀', tags: ['crâne', 'mort', 'danger'] },
        { icon: '☠️', tags: ['crâne et os', 'mort', 'danger', 'pirate'] },
        { icon: '👻', tags: ['fantôme', 'halloween', 'peur'] },
        { icon: '👽', tags: ['extraterrestre', 'alien', 'ovni', 'espace'] },
        { icon: '👾', tags: ['monstre alien', 'jeu vidéo', 'espace'] },
        { icon: '🤖', tags: ['robot', 'technologie', 'futur'] },
        { icon: '💩', tags: ['caca', 'crotte', 'sourire'] },
        { icon: '🫶', tags: ['mains coeur', 'amour', 'soutien'] },
        { icon: '👍', tags: ['pouce levé', 'ok', 'd\'accord', 'approbation', 'like'] },
        { icon: '👎', tags: ['pouce baissé', 'non', 'désaccord', 'mauvais', 'dislike'] },
        { icon: '🙏', tags: ['prière', 'merci', 'espoir', 's\'il te plaît', 'gratitude'] },
    ],
    'Personnes & Rôles': [
        { icon: '🧑', tags: ['personne', 'adulte', 'neutre'] },
        { icon: '👩', tags: ['femme', 'fille'] },
        { icon: '👨', tags: ['homme', 'garçon'] },
        { icon: '👶', tags: ['bébé', 'enfant', 'naissance'] },
        { icon: '🧒', tags: ['enfant', 'jeune'] },
        { icon: '👦', tags: ['garçon', 'jeune'] },
        { icon: '👧', tags: ['fille', 'jeune'] },
        { icon: '🧓', tags: ['personne âgée', 'vieux'] },
        { icon: '👴', tags: ['vieil homme', 'grand-père'] },
        { icon: '👵', tags: ['vieille femme', 'grand-mère'] },
        { icon: '👮', tags: ['policier', 'police', 'agent', 'sécurité'] },
        { icon: '👷', tags: ['ouvrier', 'construction', 'chantier', 'casque'] },
        { icon: '🕵️', tags: ['détective', 'espion', 'enquête', 'loupe'] },
        { icon: '🧑‍⚕️', tags: ['docteur', 'médecin', 'santé', 'soin', 'hôpital', 'rdv'] },
        { icon: '🧑‍🌾', tags: ['fermier', 'agriculteur', 'campagne', 'champ'] },
        { icon: '🧑‍🍳', tags: ['cuisinier', 'chef', 'cuisine', 'restaurant', 'repas'] },
        { icon: '🧑‍🎓', tags: ['étudiant', 'diplômé', 'école', 'université', 'étude', 'apprendre'] },
        { icon: '🧑‍🎤', tags: ['chanteur', 'star', 'musique', 'micro'] },
        { icon: '🧑‍🏫', tags: ['professeur', 'enseignant', 'école', 'cours', 'éducation'] },
        { icon: '🧑‍🏭', tags: ['ouvrier d\'usine', 'industrie', 'travail'] },
        { icon: '🧑‍💻', tags: ['code', 'programmation', 'développeur', 'tech', 'ordinateur', 'télétravail'] },
        { icon: '🧑‍💼', tags: ['employé de bureau', 'costume', 'travail', 'business', 'réunion'] },
        { icon: '🧑‍🔧', tags: ['mécanicien', 'réparation', 'outil', 'garage'] },
        { icon: '🧑‍🔬', tags: ['scientifique', 'recherche', 'laboratoire'] },
        { icon: '🧑‍🎨', tags: ['artiste', 'peintre', 'créateur', 'art'] },
        { icon: '🧑‍🚒', tags: ['pompier', 'feu', 'camion'] },
        { icon: '🧑‍✈️', tags: ['pilote', 'avion', 'vol'] },
        { icon: '🧑‍🚀', tags: ['astronaute', 'espace', 'fusée'] },
        { icon: '🧑‍⚖️', tags: ['juge', 'loi', 'justice', 'tribunal', 'avocat'] },
        { icon: '🦸', tags: ['super-héros', 'héros', 'cape', 'pouvoir'] },
        { icon: '🦹', tags: ['super-vilain', 'méchant', 'cape'] },
        { icon: '🧙', tags: ['sorcier', 'magicien', 'magie'] },
        { icon: '🧚', tags: ['fée', 'magie', 'ailes'] },
        { icon: '🧛', tags: ['vampire', 'dracula', 'sang'] },
        { icon: '🧜', tags: ['sirène', 'mer', 'poisson'] },
        { icon: '🧝', tags: ['elfe', 'fantaisie', 'magie'] },
        { icon: '🧞', tags: ['génie', 'lampe', 'souhait'] },
        { icon: '🧟', tags: ['zombie', 'mort-vivant', 'horreur'] },
        { icon: '🤴', tags: ['prince', 'roi', 'royal'] },
        { icon: '👸', tags: ['princesse', 'reine', 'royal'] },
        { icon: '🤵', tags: ['marié', 'costume', 'mariage'] },
        { icon: '👰', tags: ['mariée', 'robe', 'mariage'] },
        { icon: '🤰', tags: ['femme enceinte', 'grossesse', 'bébé'] },
        { icon: '🤱', tags: ['allaitement', 'bébé', 'mère'] },
        { icon: '🎅', tags: ['père noël', 'noël', 'fête'] },
        { icon: '🤶', tags: ['mère noël', 'noël', 'fête'] },
        { icon: '💂', tags: ['garde', 'soldat', 'angleterre'] },
        { icon: '🥷', tags: ['ninja', 'furtif', 'japon'] },
        { icon: '👪', tags: ['famille', 'parents', 'enfants', 'proches', 'relation'] },
        { icon: '🧑‍🤝‍🧑', tags: ['amis', 'relation', 'social', 'sortie', 'personnes'] },
        { icon: '👥', tags: ['groupe', 'équipe', 'personnes', 'collaboration', 'réunion'] },
        { icon: '👤', tags: ['silhouette', 'personne', 'utilisateur'] },
    ],
    'Animaux & Nature': [
        { icon: '🐶', tags: ['chien', 'animal de compagnie', 'promenade', 'soin'] },
        { icon: '🐱', tags: ['chat', 'animal de compagnie', 'soin', 'litière'] },
        { icon: '🐭', tags: ['souris', 'animal'] },
        { icon: '🐹', tags: ['hamster', 'animal'] },
        { icon: '🐰', tags: ['lapin', 'animal'] },
        { icon: '🦊', tags: ['renard', 'animal', 'malin', 'sauvage'] },
        { icon: '🐻', tags: ['ours', 'animal', 'fort', 'sauvage'] },
        { icon: '🐼', tags: ['panda', 'animal', 'chine'] },
        { icon: '🐨', tags: ['koala', 'animal', 'australie'] },
        { icon: '🐯', tags: ['tigre', 'félin', 'animal'] },
        { icon: '🦁', tags: ['lion', 'roi', 'félin', 'animal'] },
        { icon: '🐮', tags: ['vache', 'animal', 'ferme'] },
        { icon: '🐷', tags: ['cochon', 'animal', 'ferme'] },
        { icon: '🐸', tags: ['grenouille', 'animal', 'amphibien'] },
        { icon: '🐵', tags: ['singe', 'animal', 'primate'] },
        { icon: '🐔', tags: ['poulet', 'oiseau', 'ferme'] },
        { icon: '🐧', tags: ['pingouin', 'oiseau', 'froid'] },
        { icon: '🐦', tags: ['oiseau', 'voler', 'ciel'] },
        { icon: '🐤', tags: ['poussin', 'oiseau', 'bébé'] },
        { icon: '🦆', tags: ['canard', 'oiseau', 'eau'] },
        { icon: '🦅', tags: ['aigle', 'oiseau', 'rapace'] },
        { icon: '🦉', tags: ['hibou', 'chouette', 'nuit', 'oiseau'] },
        { icon: '🦇', tags: ['chauve-souris', 'nuit', 'animal'] },
        { icon: '🐺', tags: ['loup', 'animal', 'meute'] },
        { icon: '🐗', tags: ['sanglier', 'animal', 'forêt'] },
        { icon: '🐴', tags: ['cheval', 'équitation', 'animal'] },
        { icon: '🦄', tags: ['licorne', 'fantaisie', 'magie'] },
        { icon: '🐝', tags: ['abeille', 'miel', 'insecte'] },
        { icon: '🐛', tags: ['chenille', 'insecte', 'papillon'] },
        { icon: '🦋', tags: ['papillon', 'insecte', 'beauté', 'transformation'] },
        { icon: '🐌', tags: ['escargot', 'lent', 'animal'] },
        { icon: '🐞', tags: ['coccinelle', 'insecte', 'chance', 'nature'] },
        { icon: '🐜', tags: ['fourmi', 'insecte', 'colonie'] },
        { icon: '🦗', tags: ['criquet', 'insecte'] },
        { icon: '🕷️', tags: ['araignée', 'insecte', 'peur'] },
        { icon: '🦂', tags: ['scorpion', 'insecte', 'danger'] },
        { icon: '🐢', tags: ['tortue', 'animal', 'lent', 'sage', 'mer'] },
        { icon: '🐍', tags: ['serpent', 'reptile', 'danger'] },
        { icon: '🦎', tags: ['lézard', 'reptile'] },
        { icon: '🦖', tags: ['dinosaure', 't-rex', 'préhistoire'] },
        { icon: '🦕', tags: ['sauropode', 'dinosaure', 'préhistoire'] },
        { icon: '🐙', tags: ['poulpe', 'mer', 'tentacules'] },
        { icon: '🦑', tags: ['calamar', 'mer'] },
        { icon: '🦐', tags: ['crevette', 'fruit de mer'] },
        { icon: '🦞', tags: ['homard', 'fruit de mer'] },
        { icon: '🦀', tags: ['crabe', 'fruit de mer', 'plage'] },
        { icon: '🐡', tags: ['poisson-globe', 'poisson', 'mer'] },
        { icon: '🐠', tags: ['poisson tropical', 'poisson', 'mer'] },
        { icon: '🐟', tags: ['poisson', 'mer', 'pêche'] },
        { icon: '🐬', tags: ['dauphin', 'mer', 'intelligent'] },
        { icon: '🐳', tags: ['baleine', 'océan', 'mer', 'mammifère', 'géant'] },
        { icon: '🐋', tags: ['baleine à bosse', 'océan'] },
        { icon: '🦈', tags: ['requin', 'mer', 'danger'] },
        { icon: '🐊', tags: ['crocodile', 'reptile', 'danger'] },
        { icon: '🐅', tags: ['tigre', 'animal'] },
        { icon: '🐆', tags: ['léopard', 'animal'] },
        { icon: '🦓', tags: ['zèbre', 'animal', 'savane'] },
        { icon: '🦍', tags: ['gorille', 'primate', 'animal'] },
        { icon: '🦧', tags: ['orang-outan', 'primate', 'animal'] },
        { icon: '🐘', tags: ['éléphant', 'animal', 'savane'] },
        { icon: '🦛', tags: ['hippopotame', 'animal'] },
        { icon: '🦏', tags: ['rhinocéros', 'animal'] },
        { icon: '🐪', tags: ['chameau', 'désert', 'animal'] },
        { icon: '🐫', tags: ['dromadaire', 'désert', 'animal'] },
        { icon: '🦒', tags: ['girafe', 'animal', 'savane'] },
        { icon: '🦘', tags: ['kangourou', 'australie', 'animal'] },
        { icon: '🐃', tags: ['buffle', 'animal'] },
        { icon: '🐂', tags: ['bœuf', 'animal'] },
        { icon: '🐄', tags: ['vache', 'animal'] },
        { icon: '🐎', tags: ['cheval de course', 'vitesse'] },
        { icon: '🐖', tags: ['cochon', 'animal'] },
        { icon: '🐏', tags: ['bélier', 'animal'] },
        { icon: '🐑', tags: ['mouton', 'animal'] },
        { icon: '🐐', tags: ['chèvre', 'animal'] },
        { icon: '🦌', tags: ['cerf', 'animal', 'forêt'] },
        { icon: '🐕', tags: ['chien', 'animal'] },
        { icon: '🐩', tags: ['caniche', 'chien'] },
        { icon: '🦮', tags: ['chien guide', 'aide', 'aveugle'] },
        { icon: '🐕‍🦺', tags: ['chien d\'assistance', 'aide'] },
        { icon: '🐈', tags: ['chat', 'animal'] },
        { icon: '🐈‍⬛', tags: ['chat noir', 'animal'] },
        { icon: '🐓', tags: ['coq', 'ferme', 'oiseau'] },
        { icon: '🦃', tags: ['dinde', 'oiseau'] },
        { icon: '🦚', tags: ['paon', 'oiseau', 'beauté'] },
        { icon: '🦜', tags: ['perroquet', 'oiseau', 'parler'] },
        { icon: '🦢', tags: ['cygne', 'oiseau', 'lac'] },
        { icon: '🦩', tags: ['flamant rose', 'oiseau'] },
        { icon: '🕊️', tags: ['colombe', 'paix', 'oiseau'] },
        { icon: '🐇', tags: ['lapin', 'animal'] },
        { icon: '🦝', tags: ['raton laveur', 'animal'] },
        { icon: '🦨', tags: ['moufette', 'animal'] },
        { icon: '🦡', tags: ['blaireau', 'animal'] },
        { icon: '🦦', tags: ['loutre', 'animal', 'eau'] },
        { icon: '🦥', tags: ['paresseux', 'lent', 'animal'] },
        { icon: '🐁', tags: ['souris', 'animal'] },
        { icon: '🐀', tags: ['rat', 'animal'] },
        { icon: '🐿️', tags: ['écureuil', 'animal', 'noix'] },
        { icon: '🦔', tags: ['hérisson', 'animal'] },
        { icon: '🐾', tags: ['animal', 'chien', 'chat', 'patte', 'compagnie'] },
        { icon: '🌲', tags: ['arbre', 'forêt', 'sapin', 'nature', 'conifère'] },
        { icon: '🌳', tags: ['arbre feuillu', 'parc', 'nature', 'forêt'] },
        { icon: '🌴', tags: ['palmier', 'plage', 'vacances'] },
        { icon: '🌵', tags: ['cactus', 'désert', 'plante'] },
        { icon: '🌾', tags: ['blé', 'champ', 'agriculture'] },
        { icon: '🌿', tags: ['herbe', 'plante', 'nature'] },
        { icon: '☘️', tags: ['trèfle', 'chance', 'irlande'] },
        { icon: '🍀', tags: ['trèfle à quatre feuilles', 'chance'] },
        { icon: '🍁', tags: ['feuille d\'érable', 'canada', 'automne'] },
        { icon: '🍂', tags: ['feuille', 'automne', 'saison', 'chute'] },
        { icon: '🍃', tags: ['feuille au vent', 'nature', 'vent'] },
        { icon: '🍄', tags: ['champignon', 'forêt', 'nature'] },
        { icon: '🐚', tags: ['coquillage', 'plage', 'mer'] },
        { icon: '🕸️', tags: ['toile d\'araignée', 'halloween'] },
        { icon: '🌎', tags: ['globe', 'amériques', 'terre'] },
        { icon: '🌍', tags: ['globe', 'europe', 'afrique', 'terre'] },
        { icon: '🌏', tags: ['globe', 'asie', 'australie', 'terre'] },
        { icon: '🌕', tags: ['pleine lune', 'nuit'] },
        { icon: '🌖', tags: ['lune gibbeuse décroissante'] },
        { icon: '🌗', tags: ['dernier quartier de lune'] },
        { icon: '🌘', tags: ['dernier croissant de lune'] },
        { icon: '🌑', tags: ['nouvelle lune'] },
        { icon: '🌒', tags: ['premier croissant de lune'] },
        { icon: '🌓', tags: ['premier quartier de lune'] },
        { icon: '🌔', tags: ['lune gibbeuse croissante'] },
        { icon: '🌙', tags: ['lune', 'nuit', 'croissant', 'ciel'] },
        { icon: '☀️', tags: ['soleil', 'jour', 'lumière'] },
        { icon: '🌟', tags: ['étoile brillante', 'magie'] },
        { icon: '🌠', tags: ['étoile filante', 'souhait'] },
        { icon: '🌌', tags: ['voie lactée', 'espace', 'galaxie'] },
        { icon: '☁️', tags: ['nuage', 'ciel', 'météo'] },
        { icon: '🔥', tags: ['feu', 'chaud', 'flamme'] },
        { icon: '💧', tags: ['goutte', 'eau', 'pluie', 'hydratation', 'boire'] },
        { icon: '🌊', tags: ['vague', 'mer', 'océan', 'eau', 'surf'] },
    ],
    'Nourriture & Boisson': [
        { icon: '🍇', tags: ['raisin', 'fruit', 'vin'] },
        { icon: '🍈', tags: ['melon', 'fruit'] },
        { icon: '🍉', tags: ['pastèque', 'fruit', 'été'] },
        { icon: '🍊', tags: ['mandarine', 'orange', 'fruit'] },
        { icon: '🍋', tags: ['citron', 'fruit', 'acide'] },
        { icon: '🍌', tags: ['banane', 'fruit'] },
        { icon: '🍍', tags: ['ananas', 'fruit', 'tropical'] },
        { icon: '🥭', tags: ['mangue', 'fruit', 'tropical'] },
        { icon: '🍎', tags: ['pomme', 'fruit', 'santé', 'collation'] },
        { icon: '🍏', tags: ['pomme verte', 'fruit'] },
        { icon: '🍐', tags: ['poire', 'fruit'] },
        { icon: '🍑', tags: ['pêche', 'fruit'] },
        { icon: '🍒', tags: ['cerise', 'fruit'] },
        { icon: '🍓', tags: ['fraise', 'fruit', 'rouge'] },
        { icon: '🥝', tags: ['kiwi', 'fruit'] },
        { icon: '🍅', tags: ['tomate', 'légume', 'fruit', 'cuisine'] },
        { icon: '🥥', tags: ['noix de coco', 'fruit', 'tropical'] },
        { icon: '🥑', tags: ['avocat', 'santé', 'guacamole', 'fruit'] },
        { icon: '🍆', tags: ['aubergine', 'légume', 'cuisine'] },
        { icon: '🥔', tags: ['pomme de terre', 'légume', 'cuisine'] },
        { icon: '🥕', tags: ['carotte', 'légume', 'cuisine'] },
        { icon: '🌽', tags: ['maïs', 'légume', 'épi'] },
        { icon: '🌶️', tags: ['piment', 'épicé', 'chaud', 'cuisine'] },
        { icon: '🥒', tags: ['concombre', 'légume', 'salade'] },
        { icon: '🥬', tags: ['légume feuille', 'salade', 'chou'] },
        { icon: '🥦', tags: ['brocoli', 'légume', 'vert', 'santé'] },
        { icon: '🧄', tags: ['ail', 'cuisine', 'assaisonnement'] },
        { icon: '🧅', tags: ['oignon', 'cuisine', 'légume'] },
        { icon: '🍄', tags: ['champignon', 'cuisine'] },
        { icon: '🥜', tags: ['cacahuètes', 'arachide', 'apéro'] },
        { icon: '🌰', tags: ['châtaigne', 'marron'] },
        { icon: '🍞', tags: ['pain', 'boulangerie', 'sandwich', 'toast'] },
        { icon: '🥐', tags: ['croissant', 'petit-déjeuner', 'boulangerie', 'viennoiserie'] },
        { icon: '🥖', tags: ['baguette', 'pain', 'france'] },
        { icon: '🥨', tags: ['bretzel', 'allemagne', 'apéro'] },
        { icon: '🥯', tags: ['bagel', 'petit-déjeuner'] },
        { icon: '🥞', tags: ['pancakes', 'crêpes', 'petit-déjeuner'] },
        { icon: '🧇', tags: ['gaufre', 'dessert'] },
        { icon: '🧀', tags: ['fromage', 'laitage', 'apéro'] },
        { icon: '🍖', tags: ['viande', 'os', 'côtelette', 'barbecue'] },
        { icon: '🍗', tags: ['cuisse de poulet', 'volaille', 'repas'] },
        { icon: '🥩', tags: ['steak', 'viande rouge', 'bœuf', 'barbecue'] },
        { icon: '🥓', tags: ['bacon', 'lard', 'petit-déjeuner'] },
        { icon: '🍔', tags: ['burger', 'fast-food', 'sandwich', 'repas'] },
        { icon: '🍟', tags: ['frites', 'pomme de terre', 'fast-food'] },
        { icon: '🍕', tags: ['pizza', 'italien', 'repas', 'partage'] },
        { icon: '🌭', tags: ['hot-dog', 'saucisse', 'snack'] },
        { icon: '🥪', tags: ['sandwich', 'repas', 'déjeuner'] },
        { icon: '🌮', tags: ['taco', 'mexicain', 'repas'] },
        { icon: '🌯', tags: ['burrito', 'mexicain'] },
        { icon: '🥙', tags: ['kebab', 'pita'] },
        { icon: '🧆', tags: ['falafel', 'végétarien'] },
        { icon: '🥚', tags: ['œuf', 'petit-déjeuner', 'cuisine'] },
        { icon: '🍳', tags: ['cuisine', 'cuisiner', 'repas', 'oeuf', 'nourriture', 'recette'] },
        { icon: '🥘', tags: ['paella', 'plat', 'espagne', 'cuisine'] },
        { icon: '🍲', tags: ['soupe', 'potage', 'bol', 'repas'] },
        { icon: '🥣', tags: ['bol', 'céréales', 'soupe', 'petit-déjeuner'] },
        { icon: '🥗', tags: ['salade', 'nourriture saine', 'régime', 'végétarien', 'légumes', 'repas'] },
        { icon: '🍿', tags: ['popcorn', 'cinéma', 'film', 'snack'] },
        { icon: '🧈', tags: ['beurre', 'laitage', 'cuisine'] },
        { icon: '🧂', tags: ['sel', 'assaisonnement', 'cuisine'] },
        { icon: '🥫', tags: ['conserve', 'boîte', 'tomate'] },
        { icon: '🍱', tags: ['bento', 'japonais', 'boîte repas', 'déjeuner'] },
        { icon: '🍘', tags: ['biscuit de riz', 'japonais'] },
        { icon: '🍙', tags: ['onigiri', 'japonais', 'riz'] },
        { icon: '🍚', tags: ['riz', 'bol', 'asiatique'] },
        { icon: '🍛', tags: ['curry', 'riz', 'indien', 'épicé'] },
        { icon: '🍜', tags: ['ramen', 'nouilles', 'japonais', 'soupe', 'bol'] },
        { icon: '🍝', tags: ['spaghetti', 'pâtes', 'italien', 'repas'] },
        { icon: '🍠', tags: ['patate douce'] },
        { icon: '🍣', tags: ['sushi', 'japonais', 'poisson', 'repas'] },
        { icon: '🍤', tags: ['crevette frite', 'tempura'] },
        { icon: '🍥', tags: ['naruto', 'gâteau de poisson'] },
        { icon: '🥮', tags: ['gâteau de lune', 'chinois'] },
        { icon: '🍡', tags: ['dango', 'japonais', 'sucré'] },
        { icon: '🥟', tags: ['dumpling', 'ravioli', 'chinois'] },
        { icon: '🥠', tags: ['fortune cookie', 'chinois'] },
        { icon: '🥡', tags: ['boîte à emporter', 'chinois', 'livraison'] },
        { icon: '🍦', tags: ['glace', 'dessert', 'sucré', 'cornet'] },
        { icon: '🍧', tags: ['glace pilée', 'dessert'] },
        { icon: '🍨', tags: ['coupe de glace', 'dessert'] },
        { icon: '🍩', tags: ['donut', 'beignet', 'dessert', 'sucré'] },
        { icon: '🍪', tags: ['cookie', 'biscuit', 'dessert', 'goûter'] },
        { icon: '🎂', tags: ['gâteau', 'anniversaire', 'dessert', 'célébration', 'pâtisserie'] },
        { icon: '🍰', tags: ['part de gâteau', 'dessert', 'pâtisserie'] },
        { icon: '🧁', tags: ['cupcake', 'dessert', 'pâtisserie'] },
        { icon: '🥧', tags: ['tarte', 'dessert', 'cuisine'] },
        { icon: '🍫', tags: ['chocolat', 'sucré', 'snack'] },
        { icon: '🍬', tags: ['bonbon', 'sucré', 'friandise'] },
        { icon: '🍭', tags: ['sucette', 'bonbon', 'sucré'] },
        { icon: '🍮', tags: ['crème caramel', 'dessert', 'flan'] },
        { icon: '🍯', tags: ['miel', 'pot', 'sucré'] },
        { icon: '🍼', tags: ['biberon', 'bébé', 'lait'] },
        { icon: '🥛', tags: ['verre de lait', 'boisson', 'calcium'] },
        { icon: '☕', tags: ['café', 'boisson chaude', 'matin', 'pause', 'tasse', 'expresso'] },
        { icon: '🍵', tags: ['thé', 'infusion', 'boisson chaude', 'détente'] },
        { icon: '🍶', tags: ['saké', 'japonais', 'alcool'] },
        { icon: '🍾', tags: ['champagne', 'fête', 'célébration', 'alcool'] },
        { icon: '🍷', tags: ['vin', 'alcool', 'boisson', 'soirée', 'verre', 'dégustation'] },
        { icon: '🍸', tags: ['cocktail', 'alcool', 'soirée', 'verre', 'bar'] },
        { icon: '🍹', tags: ['cocktail tropical', 'boisson', 'été'] },
        { icon: '🍺', tags: ['bière', 'alcool', 'soirée', 'apéro', 'chope'] },
        { icon: '🍻', tags: ['trinquer', 'bière', 'fête', 'amis'] },
        { icon: '🥂', tags: ['trinquer', 'champagne', 'fête', 'célébration'] },
        { icon: '🥃', tags: ['whisky', 'alcool', 'verre', 'digestif'] },
        { icon: '🥤', tags: ['gobelet', 'soda', 'boisson', 'paille'] },
        { icon: '🧋', tags: ['bubble tea', 'boisson'] },
        { icon: '🧃', tags: ['brique de jus', 'boisson', 'enfant'] },
        { icon: '🧉', tags: ['maté', 'boisson'] },
        { icon: '🧊', tags: ['glaçon', 'froid'] },
        { icon: '🥢', tags: ['baguettes', 'asiatique', 'cuisine'] },
        { icon: '🍽️', tags: ['manger', 'repas', 'restaurant', 'assiette', 'couverts', 'dîner'] },
        { icon: '🍴', tags: ['fourchette et couteau', 'repas', 'restaurant'] },
        { icon: '🥄', tags: ['cuillère', 'repas', 'soupe'] },
    ],
    'Activités, Sports & Loisirs': [
        { icon: '🎨', tags: ['art', 'peinture', 'dessin', 'créativité', 'palette', 'loisir'] },
        { icon: '🎵', tags: ['musique', 'note', 'son', 'écouter', 'chanson', 'mélodie'] },
        { icon: '🎮', tags: ['jeu vidéo', 'manette', 'gaming', 'console', 'divertissement', 'jouer'] },
        { icon: '🎬', tags: ['cinéma', 'film', 'vidéo', 'tournage', 'clap', 'séance'] },
        { icon: '🎉', tags: ['fête', 'célébration', 'anniversaire', 'événement', 'cotillon', 'soirée'] },
        { icon: '🎁', tags: ['cadeau', 'surprise', 'présent', 'boîte', 'anniversaire', 'noël'] },
        { icon: '📷', tags: ['photo', 'photographie', 'image', 'caméra', 'souvenir'] },
        { icon: '🎭', tags: ['théâtre', 'spectacle', 'drame', 'comédie', 'masque', 'culture'] },
        { icon: '🎲', tags: ['jeu de société', 'dé', 'hasard', 'chance', 'loisir', 'amis'] },
        { icon: '🧩', tags: ['puzzle', 'casse-tête', 'réflexion', 'jeu', 'loisir'] },
        { icon: '🎸', tags: ['guitare', 'musique', 'instrument', 'jouer', 'rock'] },
        { icon: '🎹', tags: ['piano', 'clavier', 'musique', 'instrument', 'classique'] },
        { icon: '🎤', tags: ['micro', 'chanter', 'podcast', 'enregistrement', 'voix', 'karaoké'] },
        { icon: '🎧', tags: ['casque', 'musique', 'audio', 'écouter', 'podcast'] },
        { icon: '📖', tags: ['livre ouvert', 'lecture', 'histoire', 'roman', 'connaissance', 'étudier'] },
        { icon: '🖌️', tags: ['pinceau', 'peinture', 'dessin', 'art', 'création'] },
        { icon: '🏛️', tags: ['musée', 'culture', 'histoire', 'art', 'exposition'] },
        { icon: '🔭', tags: ['télescope', 'astronomie', 'espace', 'étoile', 'science'] },
        { icon: '🏋️', tags: ['musculation', 'poids', 'gym', 'fitness', 'haltère', 'sport', 'entraînement'] },
        { icon: '🏃', tags: ['course', 'courir', 'jogging', 'cardio', 'endurance', 'sport'] },
        { icon: '🧘', tags: ['méditation', 'yoga', 'détente', 'calme', 'zen', 'relaxation'] },
        { icon: '🚲', tags: ['vélo', 'cyclisme', 'transport', 'sport', 'balade'] },
        { icon: '🏊', tags: ['natation', 'piscine', 'nager', 'eau', 'sport'] },
        { icon: '🚶', tags: ['marche', 'promenade', 'pas', 'randonnée', 'extérieur'] },
        { icon: '🏞️', tags: ['randonnée', 'nature', 'montagne', 'paysage', 'parc', 'balade'] },
        { icon: '⚽', tags: ['football', 'foot', 'ballon', 'match', 'sport'] },
        { icon: '🏀', tags: ['basketball', 'basket', 'ballon', 'match', 'sport'] },
        { icon: '🎾', tags: ['tennis', 'raquette', 'balle', 'match', 'sport'] },
        { icon: '🥊', tags: ['boxe', 'gants', 'combat', 'entraînement', 'sport'] },
        { icon: '🥋', tags: ['arts martiaux', 'judo', 'karaté', 'ceinture', 'sport'] },
        { icon: '🧖', tags: ['spa', 'sauna', 'hammam', 'détente', 'relaxation', 'bien-être'] },
        { icon: '🧗', tags: ['escalade', 'mur', 'rocher'] },
        { icon: '🏇', tags: ['équitation', 'cheval', 'course'] },
        { icon: '🏂', tags: ['snowboard', 'neige', 'hiver', 'sport'] },
        { icon: '🎿', tags: ['ski', 'neige', 'hiver', 'sport'] },
        { icon: '🏄', tags: ['surf', 'vague', 'mer', 'sport'] },
        { icon: '🚣', tags: ['aviron', 'bateau', 'eau', 'sport'] },
        { icon: '🤽', tags: ['water-polo', 'eau', 'sport'] },
        { icon: '🤾', tags: ['handball', 'sport'] },
        { icon: '🤺', tags: ['escrime', 'épée', 'sport'] },
        { icon: '🤸', tags: ['gymnastique', 'souplesse', 'sport'] },
        { icon: '🤼', tags: ['lutte', 'combat', 'sport'] },
        { icon: '🎯', tags: ['cible', 'fléchettes', 'objectif', 'jeu'] },
        { icon: '🎳', tags: ['bowling', 'quilles', 'boule', 'jeu'] },
        { icon: '🎣', tags: ['pêche', 'poisson', 'canne', 'détente'] },
        { icon: '🎽', tags: ['médaille', 'course', 'compétition', 'sport'] },
        { icon: '⛸️', tags: ['patinage', 'glace', 'hiver', 'sport'] },
        { icon: '🛷', tags: ['luge', 'neige', 'hiver'] },
        { icon: '🛹', tags: ['skateboard', 'planche', 'roues', 'sport'] },
        { icon: '🛼', tags: ['roller', 'patin à roulettes', 'sport'] },
        { icon: '🎱', tags: ['billard', 'boule 8', 'jeu'] },
        { icon: '♟️', tags: ['échecs', 'pion', 'jeu de stratégie'] },
        { icon: '🪀', tags: ['yo-yo', 'jouet'] },
        { icon: '🪁', tags: ['cerf-volant', 'vent', 'jouet'] },
        { icon: '🎟️', tags: ['ticket', 'entrée', 'cinéma', 'concert'] },
        { icon: '🎪', tags: ['cirque', 'tente', 'spectacle'] },
        { icon: '🎢', tags: ['montagnes russes', 'parc d\'attractions'] },
        { icon: '🎡', tags: ['grande roue', 'parc d\'attractions'] },
        { icon: '🎠', tags: ['carrousel', 'manège', 'cheval de bois'] },
        { icon: '🧹', tags: ['ménage', 'nettoyer', 'balai', 'propre', 'tâche ménagère'] },
        { icon: '🧼', tags: ['savon', 'laver', 'propre', 'douche', 'bain'] },
        { icon: '🧽', tags: ['éponge', 'nettoyer', 'vaisselle', 'ménage'] },
        { icon: '🧺', tags: ['panier', 'linge', 'lessive', 'vêtements'] },
        { icon: '🛒', tags: ['caddie', 'courses', 'supermarché', 'shopping', 'acheter'] },
    ],
    'Voyage & Lieux': [
        { icon: '🚗', tags: ['voiture', 'transport', 'conduire', 'trajet', 'automobile', 'route'] },
        { icon: '✈️', tags: ['voyage', 'avion', 'vacances', 'aéroport', 'départ'] },
        { icon: '🚂', tags: ['train', 'transport', 'voyage', 'gare', 'rail'] },
        { icon: '🚌', tags: ['bus', 'transport', 'ville', 'arrêt'] },
        { icon: '🚇', tags: ['métro', 'souterrain', 'transport', 'ville', 'RATP'] },
        { icon: '🚕', tags: ['taxi', 'voiture', 'transport', 'VTC'] },
        { icon: '🚢', tags: ['bateau', 'croisière', 'mer', 'port', 'ferry'] },
        { icon: '🗺️', tags: ['carte', 'plan', 'géographie', 'direction', 'itinéraire', 'voyage'] },
        { icon: '🧭', tags: ['boussole', 'direction', 'orientation', 'exploration', 'navigation'] },
        { icon: '🏨', tags: ['hôtel', 'logement', 'hébergement', 'voyage', 'réservation'] },
        { icon: '🏕️', tags: ['camping', 'tente', 'nature', 'aventure', 'randonnée'] },
        { icon: '🏖️', tags: ['plage', 'mer', 'sable', 'vacances', 'soleil'] },
        { icon: '⛰️', tags: ['montagne', 'escalade', 'randonnée', 'alpinisme', 'sommet'] },
        { icon: '🌍', tags: ['globe', 'monde', 'terre', 'international', 'planète'] },
        { icon: '⛽', tags: ['essence', 'carburant', 'station-service', 'pompe'] },
        { icon: '🚦', tags: ['feu de circulation', 'route', 'conduite', 'signalisation'] },
        { icon: '🗽', tags: ['statue de la liberté', 'new york', 'usa', 'voyage'] },
        { icon: '🗼', tags: ['tour eiffel', 'paris', 'france', 'voyage'] },
        { icon: '🏰', tags: ['château', 'histoire', 'fort'] },
        { icon: '🏯', tags: ['château japonais', 'japon'] },
        { icon: '🏟️', tags: ['stade', 'sport', 'match'] },
        { icon: '🏠', tags: ['maison', 'domicile', 'chez soi'] },
        { icon: '🏡', tags: ['maison avec jardin', 'banlieue', 'domicile'] },
        { icon: '🏢', tags: ['immeuble de bureaux', 'travail', 'ville'] },
        { icon: '🏣', tags: ['bureau de poste', 'courrier'] },
        { icon: '🏥', tags: ['hôpital', 'santé', 'médecin', 'urgence'] },
        { icon: '🏦', tags: ['banque', 'argent', 'finance'] },
        { icon: '🏪', tags: ['supérette', 'magasin', '24/7', 'courses'] },
        { icon: '🏫', tags: ['école', 'éducation', 'cours'] },
        { icon: '🏬', tags: ['grand magasin', 'shopping', 'courses'] },
        { icon: '🏭', tags: ['usine', 'industrie'] },
        { icon: '🏛️', tags: ['bâtiment classique', 'musée', 'gouvernement'] },
        { icon: '💒', tags: ['mariage', 'chapelle'] },
        { icon: '⛲', tags: ['fontaine', 'eau', 'parc'] },
        { icon: '⛺', tags: ['tente', 'camping'] },
        { icon: '🌁', tags: ['brouillard', 'ville', 'pont'] },
        { icon: '🌃', tags: ['nuit', 'ville', 'étoiles'] },
        { icon: '🏙️', tags: ['ville', 'gratte-ciel'] },
        { icon: '🌄', tags: ['lever de soleil', 'montagne', 'matin'] },
        { icon: '🌅', tags: ['lever de soleil', 'océan', 'matin'] },
        { icon: '🌆', tags: ['coucher de soleil', 'ville', 'soir'] },
        { icon: '🌇', tags: ['coucher de soleil', 'soir'] },
        { icon: '🌉', tags: ['pont de nuit', 'lumières'] },
        { icon: '♨️', tags: ['source chaude', 'japon', 'onsen', 'détente'] },
        { icon: '🌌', tags: ['voie lactée', 'espace'] },
    ],
    'Objets': [
        { icon: '📱', tags: ['téléphone', 'mobile', 'smartphone', 'application', 'portable', 'appel'] },
        { icon: '💻', tags: ['ordinateur', 'portable', 'travail', 'internet'] },
        { icon: '🖥️', tags: ['ordinateur de bureau', 'écran', 'travail'] },
        { icon: '🖱️', tags: ['souris', 'ordinateur'] },
        { icon: '⌨️', tags: ['clavier', 'ordinateur', 'taper', 'écrire'] },
        { icon: '⌚', tags: ['montre', 'heure', 'temps', 'horloge'] },
        { icon: '👓', tags: ['lunettes', 'vue', 'lire', 'vision'] },
        { icon: '🕶️', tags: ['lunettes de soleil', 'soleil'] },
        { icon: '💡', tags: ['ampoule', 'électricité', 'lumière', 'idée', 'innovation'] },
        { icon: '🔦', tags: ['lampe de poche', 'lumière'] },
        { icon: '📚', tags: ['livres', 'lecture', 'étude', 'bibliothèque'] },
        { icon: '📖', tags: ['livre ouvert', 'lecture'] },
        { icon: '📝', tags: ['note', 'écrire', 'liste', 'papier', 'mémo'] },
        { icon: '✏️', tags: ['crayon', 'écrire', 'dessiner'] },
        { icon: '✒️', tags: ['plume', 'écriture', 'signature'] },
        { icon: '🎨', tags: ['palette', 'peinture', 'art'] },
        { icon: '🎵', tags: ['musique', 'note', 'son'] },
        { icon: '🎸', tags: ['guitare', 'instrument', 'musique'] },
        { icon: '🎹', tags: ['piano', 'instrument', 'musique'] },
        { icon: '🎺', tags: ['trompette', 'instrument', 'musique'] },
        { icon: '🎻', tags: ['violon', 'instrument', 'musique'] },
        { icon: '🥁', tags: ['tambour', 'instrument', 'musique'] },
        { icon: '📷', tags: ['appareil photo', 'photographie', 'souvenir'] },
        { icon: '📹', tags: ['caméra vidéo', 'film'] },
        { icon: '📺', tags: ['télévision', 'écran', 'TV', 'série'] },
        { icon: '📻', tags: ['radio', 'musique', 'fréquence', 'infos'] },
        { icon: '📞', tags: ['téléphone fixe', 'appel'] },
        { icon: '💰', tags: ['sac d\'argent', 'finance', 'richesse'] },
        { icon: '💵', tags: ['billet de dollar', 'argent', 'cash'] },
        { icon: '💴', tags: ['billet de yen', 'argent'] },
        { icon: '💶', tags: ['billet d\'euro', 'argent', 'cash'] },
        { icon: '💷', tags: ['billet de livre', 'argent'] },
        { icon: '💳', tags: ['carte de crédit', 'paiement', 'achat', 'finance', 'banque', 'dépense'] },
        { icon: '💎', tags: ['diamant', 'bijou', 'précieux'] },
        { icon: '⚖️', tags: ['balance', 'justice', 'loi'] },
        { icon: '🔧', tags: ['clé anglaise', 'réparation', 'outil', 'bricolage', 'maintenance'] },
        { icon: '🔨', tags: ['marteau', 'outil', 'bricolage'] },
        { icon: '🛠️', tags: ['marteau et clé', 'outils', 'bricolage', 'réparer'] },
        { icon: '⛏️', tags: ['pioche', 'outil', 'miner'] },
        { icon: '🔩', tags: ['boulon', 'vis', 'écrou'] },
        { icon: '⚙️', tags: ['engrenage', 'mécanisme', 'réglages', 'paramètres'] },
        { icon: '⛓️', tags: ['chaînes', 'lien'] },
        { icon: '🔫', tags: ['pistolet', 'arme'] },
        { icon: '💣', tags: ['bombe', 'explosion'] },
        { icon: '🔪', tags: ['couteau', 'cuisine', 'arme', 'couper'] },
        { icon: '🛡️', tags: ['bouclier', 'protection', 'sécurité'] },
        { icon: '🚬', tags: ['cigarette', 'fumer'] },
        { icon: '⚰️', tags: ['cercueil', 'mort', 'funérailles'] },
        { icon: '⚱️', tags: ['urne funéraire', 'mort'] },
        { icon: '🏺', tags: ['amphore', 'antiquité', 'pot'] },
        { icon: '🔮', tags: ['boule de cristal', 'magie', 'avenir'] },
        { icon: '📿', tags: ['chapelet', 'prière', 'religion'] },
        { icon: '🧿', tags: ['nazar', 'mauvais œil', 'amulette'] },
        { icon: '💈', tags: ['barbier', 'coiffeur'] },
        { icon: '🔬', tags: ['microscope', 'science', 'recherche'] },
        { icon: '🔭', tags: ['télescope', 'astronomie', 'espace'] },
        { icon: '💊', tags: ['pilule', 'médicament', 'santé', 'pharmacie'] },
        { icon: '💉', tags: ['seringue', 'vaccin', 'sang', 'médecin'] },
        { icon: '🩸', tags: ['goutte de sang', 'médecine'] },
        { icon: '🩹', tags: ['pansement', 'blessure', 'soin'] },
        { icon: '🩺', tags: ['stéthoscope', 'médecin', 'santé', 'auscultation'] },
        { icon: '🚪', tags: ['porte', 'entrée', 'sortie'] },
        { icon: '🛏️', tags: ['lit', 'dormir', 'chambre', 'repos'] },
        { icon: '🛋️', tags: ['canapé', 'salon', 'détente'] },
        { icon: '🚽', tags: ['toilettes', 'WC'] },
        { icon: '🚿', tags: ['douche', 'bain', 'propre'] },
        { icon: '🛁', tags: ['baignoire', 'bain', 'détente'] },
        { icon: '🔑', tags: ['clé', 'serrure', 'accès', 'sécurité'] },
        { icon: '🪑', tags: ['chaise', 's\'asseoir'] },
        { icon: '🎈', tags: ['ballon', 'fête', 'anniversaire', 'célébration'] },
        { icon: '🎀', tags: ['ruban', 'cadeau', 'décoration', 'noeud'] },
        { icon: '🏷️', tags: ['étiquette', 'tag', 'prix', 'nom', 'marque'] },
    ],
    'Symboles': [
        { icon: '❤️', tags: ['coeur', 'amour', 'rouge'] },
        { icon: '🧡', tags: ['coeur', 'orange'] },
        { icon: '💛', tags: ['coeur', 'jaune'] },
        { icon: '💚', tags: ['coeur', 'vert'] },
        { icon: '💙', tags: ['coeur', 'bleu'] },
        { icon: '💜', tags: ['coeur', 'violet'] },
        { icon: '🖤', tags: ['coeur', 'noir'] },
        { icon: '🤍', tags: ['coeur', 'blanc'] },
        { icon: '🤎', tags: ['coeur', 'marron'] },
        { icon: '💔', tags: ['coeur brisé', 'tristesse', 'rupture'] },
        { icon: '❣️', tags: ['point d\'exclamation coeur'] },
        { icon: '💕', tags: ['deux coeurs', 'amour'] },
        { icon: '💞', tags: ['coeurs tournants', 'amour'] },
        { icon: '💓', tags: ['coeur battant', 'amour'] },
        { icon: '💗', tags: ['coeur grandissant', 'amour'] },
        { icon: '💖', tags: ['coeur étincelant', 'amour'] },
        { icon: '💘', tags: ['coeur avec flèche', 'cupidon'] },
        { icon: '💝', tags: ['coeur avec ruban', 'cadeau'] },
        { icon: '💟', tags: ['décoration coeur'] },
        { icon: '☮️', tags: ['paix', 'peace and love'] },
        { icon: '✝️', tags: ['croix latine', 'chrétien', 'religion'] },
        { icon: '☪️', tags: ['croissant et étoile', 'islam', 'religion'] },
        { icon: '🕉️', tags: ['om', 'hindouisme', 'religion'] },
        { icon: '☸️', tags: ['roue du dharma', 'bouddhisme', 'religion'] },
        { icon: '✡️', tags: ['étoile de David', 'judaïsme', 'religion'] },
        { icon: '☯️', tags: ['yin yang', 'équilibre'] },
        { icon: '☦️', tags: ['croix orthodoxe', 'religion'] },
        { icon: '🛐', tags: ['lieu de culte', 'prière'] },
        { icon: '⛎', tags: ['ophiuchus', 'zodiaque'] },
        { icon: '♈', tags: ['bélier', 'zodiaque'] },
        { icon: '♉', tags: ['taureau', 'zodiaque'] },
        { icon: '♊', tags: ['gémeaux', 'zodiaque'] },
        { icon: '♋', tags: ['cancer', 'zodiaque'] },
        { icon: '♌', tags: ['lion', 'zodiaque'] },
        { icon: '♍', tags: ['vierge', 'zodiaque'] },
        { icon: '♎', tags: ['balance', 'zodiaque'] },
        { icon: '♏', tags: ['scorpion', 'zodiaque'] },
        { icon: '♐', tags: ['sagittaire', 'zodiaque'] },
        { icon: '♑', tags: ['capricorne', 'zodiaque'] },
        { icon: '♒', tags: ['verseau', 'zodiaque'] },
        { icon: '♓', tags: ['poissons', 'zodiaque'] },
        { icon: '🆔', tags: ['identité', 'ID'] },
        { icon: '⚛️', tags: ['atome', 'science'] },
        { icon: '🉑', tags: ['japonais', 'acceptable'] },
        { icon: '☢️', tags: ['radioactif', 'danger'] },
        { icon: '☣️', tags: ['biohazard', 'danger'] },
        { icon: '📴', tags: ['téléphone éteint'] },
        { icon: '📳', tags: ['vibreur'] },
        { icon: '🈶', tags: ['japonais', 'payant'] },
        { icon: '🈚', tags: ['japonais', 'gratuit'] },
        { icon: '🈸', tags: ['japonais', 'demande'] },
        { icon: '🈺', tags: ['japonais', 'ouvert'] },
        { icon: '🈷️', tags: ['japonais', 'mensuel'] },
        { icon: '✴️', tags: ['étoile à huit branches'] },
        { icon: '🆚', tags: ['versus', 'vs', 'contre'] },
        { icon: '💮', tags: ['fleur blanche', 'tampon'] },
        { icon: '🉐', tags: ['japonais', 'bonne affaire'] },
        { icon: '㊙️', tags: ['japonais', 'secret'] },
        { icon: '㊗️', tags: ['japonais', 'félicitations'] },
        { icon: '🈴', tags: ['japonais', 'réussite'] },
        { icon: '🈵', tags: ['japonais', 'complet'] },
        { icon: '🈹', tags: ['japonais', 'réduction'] },
        { icon: '🈲', tags: ['japonais', 'interdit'] },
        { icon: '🅰️', tags: ['groupe sanguin A'] },
        { icon: '🅱️', tags: ['groupe sanguin B'] },
        { icon: '🆎', tags: ['groupe sanguin AB'] },
        { icon: '🅾️', tags: ['groupe sanguin O'] },
        { icon: '🆘', tags: ['SOS', 'aide', 'urgence'] },
        { icon: '⛔', tags: ['interdit', 'sens interdit'] },
        { icon: '📛', tags: ['badge nominatif'] },
        { icon: '🚫', tags: ['interdiction', 'non'] },
        { icon: '❌', tags: ['croix', 'non', 'erreur'] },
        { icon: '⭕', tags: ['cercle', 'oui', 'correct'] },
        { icon: '💯', tags: ['cent points', 'parfait', 'score'] },
        { icon: '♨️', tags: ['source chaude'] },
        { icon: '💈', tags: ['barbier'] },
        { icon: '🕛', tags: ['minuit', 'midi'] },
        { icon: '✅', tags: ['coche', 'validation', 'ok'] },
        { icon: '✔️', tags: ['coche épaisse', 'ok'] },
        { icon: '☑️', tags: ['case cochée'] },
        { icon: '🔘', tags: ['bouton radio'] },
        { icon: '🔗', tags: ['lien', 'chaîne'] },
        { icon: '➰', tags: ['boucle'] },
        { icon: '〰️', tags: ['tiret ondulé'] },
        { icon: '〽️', tags: ['marque d\'alternance'] },
        { icon: '🔱', tags: ['trident', 'emblème'] },
        { icon: '⚜️', tags: ['fleur de lys'] },
        { icon: '🔰', tags: ['débutant', 'japonais'] },
        { icon: '♻️', tags: ['recyclage', 'écologie'] },
        { icon: '➡️', tags: ['flèche droite'] },
        { icon: '⬅️', tags: ['flèche gauche'] },
        { icon: '⬆️', tags: ['flèche haut'] },
        { icon: '⬇️', tags: ['flèche bas'] },
        { icon: '🔄', tags: ['rafraîchir', 'recharger', 'sync'] },
        { icon: '🔙', tags: ['retour'] },
        { icon: '🔚', tags: ['fin'] },
        { icon: '🔛', tags: ['marche/arrêt'] },
        { icon: '🔜', tags: ['bientôt'] },
        { icon: '🔝', tags: ['haut'] },
    ],
    'Drapeaux': [
        { icon: '🏁', tags: ['drapeau', 'arrivée', 'course', 'damier'] },
        { icon: '🚩', tags: ['drapeau triangulaire', 'alerte', 'golf'] },
        { icon: '🎌', tags: ['drapeaux croisés', 'japon'] },
        { icon: '🏴', tags: ['drapeau noir', 'pirate'] },
        { icon: '🏳️', tags: ['drapeau blanc', 'paix', 'reddition'] },
        { icon: '🏳️‍🌈', tags: ['drapeau arc-en-ciel', 'lgbt', 'pride'] },
        { icon: '🏳️‍⚧️', tags: ['drapeau transgenre', 'trans'] },
        { icon: '🏴‍☠️', tags: ['drapeau pirate', 'jolly roger'] },
        { icon: '🇫🇷', tags: ['drapeau', 'france', 'français'] },
        { icon: '🇺🇸', tags: ['drapeau', 'états-unis', 'usa', 'amérique'] },
        { icon: '🇬🇧', tags: ['drapeau', 'royaume-uni', 'uk', 'anglais'] },
        { icon: '🇩🇪', tags: ['drapeau', 'allemagne', 'allemand'] },
        { icon: '🇪🇸', tags: ['drapeau', 'espagne', 'espagnol'] },
        { icon: '🇮🇹', tags: ['drapeau', 'italie', 'italien'] },
        { icon: '🇯🇵', tags: ['drapeau', 'japon', 'japonais'] },
        { icon: '🇨🇳', tags: ['drapeau', 'chine', 'chinois'] },
        { icon: '🇷🇺', tags: ['drapeau', 'russie', 'russe'] },
        { icon: '🇧🇷', tags: ['drapeau', 'brésil', 'brésilien'] },
        { icon: '🇨🇦', tags: ['drapeau', 'canada', 'canadien'] },
        { icon: '🇦🇺', tags: ['drapeau', 'australie', 'australien'] },
        { icon: '🇮🇳', tags: ['drapeau', 'inde', 'indien'] },
        { icon: '🇧🇪', tags: ['drapeau', 'belgique', 'belge'] },
        { icon: '🇨🇭', tags: ['drapeau', 'suisse'] },
        { icon: '🇵🇹', tags: ['drapeau', 'portugal', 'portugais'] },
        { icon: '🇪🇺', tags: ['drapeau', 'union européenne', 'europe'] },
    ]
};

export interface IconPickerProps {
    onSelect: (icon: string) => void;
    onClose?: () => void;
    inline?: boolean;
    title?: string;
}

export const IconPicker: React.FC<IconPickerProps> = ({ 
    onSelect, 
    onClose, 
    inline = false,
    title = "Choisir une icône"
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) {
            return EMOJI_WITH_TAGS;
        }

        const lowerCaseSearch = searchTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const results: Record<string, { icon: string; tags: string[] }[]> = {};

        for (const category in EMOJI_WITH_TAGS) {
            const matchingEmojis = EMOJI_WITH_TAGS[category].filter(emoji => 
                emoji.icon.includes(lowerCaseSearch) ||
                emoji.tags.some(tag => tag.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(lowerCaseSearch))
            );
            if (matchingEmojis.length > 0) {
                results[category] = matchingEmojis;
            }
        }
        return results;
    }, [searchTerm]);

    const isSearching = searchTerm.trim().length > 0;

    const allMatchingResults = useMemo(() => {
        if (!isSearching) return [];
        const seen = new Set<string>();
        const list: string[] = [];
        for (const cat of Object.keys(filteredData)) {
            for (const item of filteredData[cat]) {
                if (!seen.has(item.icon)) {
                    seen.add(item.icon);
                    list.push(item.icon);
                }
            }
        }
        return list;
    }, [filteredData, isSearching]);

    const categories = useMemo(() => Object.keys(filteredData), [filteredData]);
    const [activeCategory, setActiveCategory] = useState(categories[0] || '');

    useEffect(() => {
        if (!categories.includes(activeCategory) && categories.length > 0) {
            setActiveCategory(categories[0]);
        } else if (categories.length === 0) {
            setActiveCategory('');
        }
    }, [categories, activeCategory]);

    const content = (
        <div className={`bg-white border-2 border-black font-mono flex flex-col ${inline ? 'w-full shadow-[3px_3px_0px_#000]' : 'w-full max-w-sm sm:max-w-md shadow-[4px_4px_0px_#000] max-h-[380px]'}`}>
            {/* Entête */}
            <div className="p-2 border-b-2 border-black bg-yellow-300 flex justify-between items-center text-xs font-black text-black">
                <span className="uppercase tracking-wider truncate">{title}</span>
                {onClose && (
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-1.5 py-0.5 border border-black bg-white hover:bg-rose-200 text-black font-black text-[10px] uppercase shadow-[1px_1px_0px_#000] cursor-pointer"
                    >
                        Fermer
                    </button>
                )}
            </div>

            {/* Barre de recherche */}
            <div className="p-2 border-b border-black bg-yellow-50">
                <input
                    type="text"
                    placeholder="🔍 Recherche globale (ex: sport, eau, balai, voiture, livre...)"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full p-1.5 text-xs bg-white border border-black font-bold focus:outline-none focus:bg-amber-50"
                />
            </div>

            {/* Sélecteur de catégorie (Bandeau horizontal à défilement) si non recherche ou pour filtrer */}
            {!isSearching ? (
                <div className="flex overflow-x-auto border-b border-black bg-slate-100 p-1 gap-1 shrink-0 no-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => setActiveCategory(cat)}
                            className={`text-[10px] font-black px-2 py-1 border border-black shrink-0 whitespace-nowrap cursor-pointer transition-colors ${
                                activeCategory === cat 
                                    ? 'bg-black text-white' 
                                    : 'bg-white text-black hover:bg-yellow-200'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                    {categories.length === 0 && (
                        <span className="text-[10px] text-gray-500 italic p-1">Aucune icône correspondante</span>
                    )}
                </div>
            ) : (
                <div className="border-b border-black bg-amber-100 px-2 py-1 text-[10px] font-black text-black flex justify-between items-center">
                    <span>{allMatchingResults.length} RÉSULTAT{allMatchingResults.length > 1 ? 'S' : ''} TROUVÉ{allMatchingResults.length > 1 ? 'S' : ''} (TOUTES CATÉGORIES)</span>
                    <button 
                        type="button" 
                        onClick={() => setSearchTerm('')}
                        className="text-[9px] underline uppercase hover:text-red-700"
                    >
                        Effacer
                    </button>
                </div>
            )}

            {/* Grille d'émojis */}
            <div className="p-2 overflow-y-auto max-h-48 flex-grow">
                {isSearching ? (
                    allMatchingResults.length > 0 ? (
                        <div className="grid grid-cols-7 sm:grid-cols-9 gap-1.5">
                            {allMatchingResults.map((icon) => (
                                <button
                                    key={icon}
                                    type="button"
                                    onClick={() => {
                                        onSelect(icon);
                                        if (onClose) onClose();
                                    }}
                                    className="w-8 h-8 text-lg border border-black/30 hover:border-black hover:bg-yellow-200 active:scale-95 flex items-center justify-center bg-white transition-all cursor-pointer"
                                    title={icon}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="py-6 text-center text-xs font-bold text-gray-500">
                            Aucun emoji trouvé pour &quot;{searchTerm}&quot;
                        </div>
                    )
                ) : (
                    activeCategory && filteredData[activeCategory] && (
                        <div className="grid grid-cols-7 sm:grid-cols-9 gap-1.5">
                            {filteredData[activeCategory].map(({ icon }) => (
                                <button
                                    key={icon}
                                    type="button"
                                    onClick={() => {
                                        onSelect(icon);
                                        if (onClose) onClose();
                                    }}
                                    className="w-8 h-8 text-lg border border-black/30 hover:border-black hover:bg-yellow-200 active:scale-95 flex items-center justify-center bg-white transition-all cursor-pointer"
                                    title={icon}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
    );

    if (inline) {
        return content;
    }

    return (
        <div className="relative z-50 my-1">
            {content}
        </div>
    );
};
