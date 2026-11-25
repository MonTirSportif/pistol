/* Fiche d'observation pistolet – contenu des deux fiches (10 m précision, 25 m vitesse).
   type : "choix" (cases à cocher), "texte" (réponse libre), "temps" (durées en secondes) */
window.FO_FICHES = {
  "10m": {
    titre: "Pistolet 10 m précision",
    sousTitre: "Pistolet précision debout",
    categories: [
      { nom: "Position", items: [
        { l: "Allure générale de position", o: ["Droite", "Cambrée", "Arrière"] },
        { l: "Style de position", o: ["Profil", "7/8", "3/4"] },
        { l: "Écartement des pieds", o: ["Moyen", "Grand", "Serré"] },
        { l: "Équilibration du bassin", o: ["Rétroversé", "Équilibré", "Antéversé"] },
        { l: "Axes pieds, bassin, épaules", o: ["Empilés", "1 vrille", "2 vrilles"] },
        { l: "Position épaule arrière", o: ["Basse", "Haute"] },
        { l: "Position épaule avant", o: ["Basse", "Haute"] },
        { l: "Position de la tête", o: ["Droite", "Penchée", "Arrière"] },
        { l: "Prise en main de l'arme", o: ["Académique et appliquée", "Approximative"] },
        { l: "Serrage de crosse", o: ["Intense", "Ferme", "Relâché"] },
        { l: "Gainage du poignet / bras", o: ["Axe en bas", "Axe en haut", "Aucun"] },
        { l: "Position du doigt sur la queue de détente", o: ["Académique", "Basse", "Autre (préciser)"] },
        { l: "Stabilité", o: ["Bonne", "Oscillation du corps", "Bouge le bras", "Bouge le guidon"] }
      ]},
      { nom: "Visée", items: [
        { l: "Tassement (temps d'arrêt bras haut), pistolet calme", o: ["Pas vraiment", "Moyen", "Long"] },
        { l: "Entrée en cible", o: ["Directe (attaque)", "Par le haut", "Régularité du geste"] },
        { l: "Prise de ligne de mire", o: ["Rien ne bouge", "Mouvement de tête", "Contraction du poignet"] }
      ]},
      { nom: "Lâcher", items: [
        { l: "Prise du point dur", o: ["En bas, à 45°", "Au-dessus / en descente", "Dessous"] },
        { l: "Travail de l'index", o: ["Doux", "Franc", "Action-réaction"] },
        { l: "Réaction de l'arme au départ du coup", o: ["Systématique", "Parfois", "Aucune"] }
      ]},
      { nom: "Coordination", items: [
        { l: "Coordination lâcher-visée", o: ["De 0 à 5 secondes", "De 6 à 9 secondes", "10 secondes et plus"] },
        { l: "Tenue au et après le départ", o: ["Oui", "À moitié", "Non"] }
      ]},
      { nom: "Tactique", items: [
        { l: "Aménagement du poste de tir (boîte de plombs, tournevis, bouteille d'eau…)", o: ["Bon", "Un peu", "Aucun"] },
        { l: "Échauffement physique et spécifique", o: ["Oui", "Non"] },
        { l: "Pauses en cours de séance ou de match", t: "texte" },
        { l: "Respect des règles de sécurité (orientation de l'arme, drapeau…)", t: "texte" }
      ]},
      { nom: "Séquence de tir", items: [
        { l: "Régularité de la phase de tir : départ du bras → départ du coup", t: "temps" }
      ]},
      { nom: "Matériel", items: [
        { l: "Adaptation du pistolet", o: ["Non", "Crosse", "Contrepoids", "Autre (préciser)"] },
        { l: "Réglage de la détente", o: ["Précourse longue / courte", "Point dur franc", "Backlash"] },
        { l: "Réglage cran de mire / guidon", o: ["Guidon fin / large", "Largeur du cran de mire, lumières"] }
      ]},
      { nom: "Divers et discussion", items: [
        { l: "Niveau cibles couleur", t: "texte" },
        { l: "Niveau en compétition", t: "texte" },
        { l: "Score habituel en match / réalisé pendant l'observation", t: "texte" },
        { l: "Prise de l'ADV (aire de visée)", t: "texte" },
        { l: "Perception de la marge de blanc", t: "texte" },
        { l: "Autres", t: "texte" }
      ]}
    ]
  },
  "25m": {
    titre: "Pistolet 25 m vitesse",
    sousTitre: "Pistolet vitesse debout",
    categories: [
      { nom: "Position générale", items: [
        { l: "Allure générale de position", o: ["Droite", "Cambrée", "Arrière"] },
        { l: "Style de position", o: ["Profil", "7/8", "3/4"] },
        { l: "Écartement des pieds", o: ["Moyen", "Grand", "Serré"] },
        { l: "Équilibration du bassin", o: ["Rétroversé", "Équilibré", "Antéversé"] },
        { l: "Axes pieds, bassin, épaules", o: ["Empilés", "1 vrille", "2 vrilles"] },
        { l: "Position épaule arrière", o: ["Basse", "Haute"] },
        { l: "Position épaule avant", o: ["Basse", "Haute"] },
        { l: "Position de la tête", o: ["Droite", "Penchée", "Arrière"] },
        { l: "Prise en main de l'arme", o: ["Académique et appliquée", "Approximative"] },
        { l: "Serrage de crosse", o: ["Intense", "Ferme", "Relâché"] },
        { l: "Position du doigt sur la queue de détente", o: ["Académique", "Basse", "Autre (préciser)"] }
      ]},
      { nom: "Position spécifique", items: [
        { l: "Stabilité en position prêt", o: ["Bonne", "Oscillation du corps", "Bouge bras / épaule", "Bouge la tête", "Bouge le poignet"] },
        { l: "Réaction à l'ouverture de la cible / au signal", o: ["Rapide", "Moyenne", "Panique / retard"] },
        { l: "Montée du bras sur le geste d'attaque", o: ["Droite et contrôlée", "Incontrôlée (bras jeté)", "Lente et régulière"] },
        { l: "Gainage du poignet / bras sur l'attaque", o: ["Ferme", "Souple", "Aucun"] }
      ]},
      { nom: "Visée", items: [
        { l: "Entrée en cible (pré-visée)", o: ["Directe (attaque)", "Par le haut", "Régularité du geste"] },
        { l: "Prise en compte de l'ADV (demander et contrôler le ralentissement du bras)", o: ["Bas du visuel / de la cible", "Bas de la ciblerie / sol", "Autre"] },
        { l: "Tenue après le départ", o: ["Bonne", "Presque", "Non"] },
        { l: "Regard (demander et contrôler les mouvements des yeux)", o: ["Fixe dans la zone cible", "Suit le bras"] }
      ]},
      { nom: "Lâcher", items: [
        { l: "Prise du point dur", o: ["En bas, à 45°", "Lors de la montée du bras", "En zone de visée"] },
        { l: "Départ du coup", o: ["À l'arrivée en zone de visée", "Après la visée", "Provoqué / coup de doigt", "Hors temps"] },
        { l: "Réaction de l'arme au départ du coup", o: ["Bien contrôlée dans l'axe vertical", "Mal contrôlée"] },
        { l: "Reprise du point dur (3/7)", o: ["En haut", "En bas, à 45°", "Idem 1re prise"] }
      ]},
      { nom: "Tactique", items: [
        { l: "Aménagement du poste de tir (boîte de munitions, tournevis, bouteille d'eau…)", o: ["Bon", "Un peu", "Aucun"] },
        { l: "Échauffement physique et spécifique", o: ["Oui", "Non"] },
        { l: "Pauses en cours de séance ou de match", t: "texte" },
        { l: "Respect des règles de sécurité (orientation de l'arme, drapeau…)", t: "texte" }
      ]},
      { nom: "Séquence de tir", items: [
        { l: "Régularité de la phase de tir : départ du bras → départ du coup", t: "temps" }
      ]},
      { nom: "Matériel", items: [
        { l: "Adaptation du pistolet", o: ["Non", "Crosse", "Contrepoids", "Autre (préciser)"] },
        { l: "Réglage de la détente", o: ["Précourse longue / courte", "Point dur franc", "Backlash"] },
        { l: "Réglage cran de mire / guidon", o: ["Guidon fin / large", "Largeur du cran de mire, lumières"] }
      ]},
      { nom: "Divers et discussion", items: [
        { l: "Niveau cibles couleur", t: "texte" },
        { l: "Niveau en compétition", t: "texte" },
        { l: "Score habituel en match / réalisé pendant l'observation", t: "texte" },
        { l: "Prise de l'ADV (aire de visée)", t: "texte" },
        { l: "Perception de la marge de blanc", t: "texte" },
        { l: "Autres", t: "texte" }
      ]}
    ]
  }
};
