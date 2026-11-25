/* Fiche d'évaluation individuelle – repères de construction et savoir-faire techniques.
   Chaque critère : on coche ce qui est observé, et on évalue la maîtrise (toile d'araignée). */
window.FE_FICHES = {
  "p10": {
    titre: "Pistolet 10 m précision",
    categories: [
      { nom: "Repères des éléments de la construction", court: "Construction", items: [
        { l: "Placement par rapport à la cible", a: "Placement", o: ["Soigné", "Succinct", "Non réalisé"] },
        { l: "Allure générale de la position", a: "Allure", o: ["Droite", "Cambrée", "En arrière"] },
        { l: "Style de position", a: "Style", o: ["Profil", "Sept-huitième", "Trois-quarts"] },
        { l: "Écartement des pieds", a: "Pieds", o: ["Faible", "Moyen", "Important"] },
        { l: "Vérification des axes (pieds, bassin, épaules)", a: "Axes", o: ["Empilés", "Une rotation", "Deux rotations"] },
        { l: "Équilibre du bassin", a: "Bassin", o: ["Rétroversé", "Équilibré", "Antéversé"] },
        { l: "Position de la tête", a: "Tête", o: ["Droite", "En avant", "En appui", "En arrière"] },
        { l: "Position des épaules", a: "Épaules", o: ["Arrière basse", "Arrière haute", "Avant basse", "Avant haute"] }
      ]},
      { nom: "Repères des savoir-faire techniques", court: "Savoir-faire", items: [
        { l: "Contrôle de la prise en main", a: "Prise en main", o: ["Oui", "Partiel", "Non"] },
        { l: "Verrouillage du poignet", a: "Poignet", o: ["Axe en bas", "Axe avec appui", "Axe en haut", "Non"] },
        { l: "Prise de la ligne de mire", a: "Ligne de mire", o: ["Rien ne bouge", "La tête bouge", "Contraction du poignet"] },
        { l: "Tassement (temps d'arrêt avec le bras en haut)", a: "Tassement", o: ["Long", "Moyen", "Non"] },
        { l: "Approche de la cible", a: "Approche", o: ["Par le haut", "Haut et bas", "Directe", "Régulière"] },
        { l: "Travail de l'index (déplacement visible ou non)", a: "Index", o: ["Doux", "Franc", "Type action-réaction"] },
        { l: "Coordination visée-lâcher (assez rapide, ou priorité à la visée)", a: "Coordination", o: ["Moins de 5 s", "Environ 8 s", "Plus de 11 s"] },
        { l: "Tenue au et après le départ du coup (les actions engagées avant le départ continuent après)", a: "Tenue", o: ["Oui", "Partielle", "Non"] }
      ]}
    ]
  },
  "c10": {
    titre: "Carabine 10 m debout",
    categories: [
      { nom: "Repères des éléments de la construction", court: "Construction", items: [
        { l: "Placement par rapport à la cible", a: "Placement", o: ["Soigné", "Succinct", "Non réalisé"] },
        { l: "Allure générale de la position", a: "Allure", o: ["Droite", "Cambrée", "En arrière"] },
        { l: "Position de la carabine par rapport au buste", a: "Carabine / buste", o: ["Basse", "Moyenne", "Haute"] },
        { l: "Position de la tête sur l'appui-joue", a: "Tête", o: ["Droite", "Inclinée", "Très inclinée"] },
        { l: "Écartement des pieds", a: "Pieds", o: ["Faible", "Moyen", "Important"] },
        { l: "Vérification des axes (pieds, bassin, épaules)", a: "Axes", o: ["Empilés", "Une rotation", "Deux rotations"] },
        { l: "Angle poignet / main porteuse sous le fût", a: "Main porteuse", o: ["Axé", "Angle faible", "Angle important"] },
        { l: "Orientation du bassin par rapport à l'axe des cibles", a: "Orientation", o: ["Dans l'axe", "Ouvert", "Très ouvert"] },
        { l: "Équilibration du bassin", a: "Bassin", o: ["Rétroversé", "Équilibré", "Antéversé"] },
        { l: "Position des épaules", a: "Épaules", o: ["En avant", "Arrière basse", "Arrière haute", "Avant basse"] }
      ]},
      { nom: "Repères des savoir-faire techniques", court: "Savoir-faire", items: [
        { l: "Contrôle de l'épaulé (visuel, carabine en appui sur la table de tir ou le trépied)", a: "Épaulé", o: ["Oui", "Partiel", "Non"] },
        { l: "Contrôle de la position de la main porteuse sous le fût", a: "Main porteuse", o: ["Oui", "Partiel", "Non"] },
        { l: "Pré-visée (phase de tassement tête haute)", a: "Pré-visée", o: ["Oui", "Partielle", "Non"] },
        { l: "Pose de la tête sur l'appui-joue / ligne de mire (la carabine reste stable à la descente de la tête)", a: "Pose de la tête", o: ["Oui", "Partielle", "Non"] },
        { l: "Travail de l'index (déplacement visible ou non)", a: "Index", o: ["Doux", "Franc", "Type action-réaction"] },
        { l: "Coordination visée-lâcher (assez rapide, ou priorité à la visée)", a: "Coordination", o: ["Moins de 7 s", "Environ 10 s", "Plus de 13 s"] },
        { l: "Tenue au et après le départ du coup (les actions engagées avant le départ continuent après)", a: "Tenue", o: ["Oui", "Partielle", "Non"] }
      ]}
    ]
  }
};
window.FE_NIVEAUX = ["Non évalué", "À travailler", "En cours", "Acquis", "Maîtrisé"];
