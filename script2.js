'use strict';

/* ============================================================
   Siam — logique de jeu
   Plateau : 7 lignes × 5 colonnes
     ligne 0     : banc des Rhinocéros (rouge)
     lignes 1-5  : zone de jeu 5×5
     ligne 6     : banc des Éléphants (bleu)
   Orientations : 0 = haut, 90 = droite, 180 = bas, 270 = gauche
   ============================================================ */

const N = 5;
const DIRS = { 0: [-1, 0], 90: [0, 1], 180: [1, 0], 270: [0, -1] };
const CAMPS = {
    bleu:  { nom: 'Éléphants',  face: 0,   asset: 'Bleu'  },
    rouge: { nom: 'Rhinocéros', face: 180, asset: 'Rouge' },
};
// Cases marquées d’une croix : interdites pendant les 2 premiers coups de chaque joueur
const BLOQUEES = [[0, 2], [4, 2]];

const $ = (sel) => document.querySelector(sel);

let S;        // état de la partie
let cases;    // éléments DOM des 35 cases

/* ---------- Utilitaires ---------- */

const dansPlateau = (r, c) => r >= 0 && r < N && c >= 0 && c < N;
const surBord = (r, c) => r === 0 || r === N - 1 || c === 0 || c === N - 1;
const bloquee = (r, c) => S.coups < 4 && BLOQUEES.some(([a, b]) => a === r && b === c);
const autre = (camp) => (camp === 'bleu' ? 'rouge' : 'bleu');
const dire = (texte) => { $('#message').textContent = texte; };

// Direction de poussée à l’entrée par une case de bord (null pour un coin)
function directionEntree(r, c) {
    const haut = r === 0, bas = r === N - 1, gauche = c === 0, droite = c === N - 1;
    if ((haut || bas) && (gauche || droite)) return null;
    return haut ? 180 : bas ? 0 : gauche ? 90 : 270;
}

// Tourne un animal par le chemin le plus court (angle cumulé pour l’animation CSS)
function orienterPiece(p, d) {
    let diff = (((d - p.dir) % 360) + 360) % 360;
    if (diff > 180) diff -= 360;
    p.angle += diff;
    p.dir = d;
}

function versBanc(p) {
    orienterPiece(p, CAMPS[p.camp].face);
    S.banc[p.camp][p.id] = p;
}

/* ---------- Poussées ---------- */

// Cases occupées consécutives à partir de (r, c) dans la direction d
function ligne(r, c, d) {
    const [dr, dc] = DIRS[d];
    const cellules = [];
    while (dansPlateau(r, c) && S.grille[r][c]) {
        cellules.push([r, c]);
        r += dr;
        c += dc;
    }
    return cellules;
}

// Force = animaux dans le sens de la poussée − animaux qui lui font face (le pousseur compte pour 1).
// Il faut une force d’au moins 1, et au moins égale au nombre de rochers.
function poussable(cellules, d) {
    let force = 1, rochers = 0;
    for (const [r, c] of cellules) {
        const p = S.grille[r][c];
        if (p.k === 'c') rochers++;
        else if (p.dir === d) force++;
        else if (p.dir === (d + 180) % 360) force--;
    }
    return force >= 1 && force >= rochers;
}

// `depart` : case du pousseur sur le plateau, ou null s’il entre depuis son banc
function appliquerPoussee(pousseur, depart, d, cellules) {
    const [dr, dc] = DIRS[d];
    const chaine = [pousseur, ...cellules.map(([r, c]) => S.grille[r][c])];
    const positions = [depart, ...cellules];
    const derniere = positions[positions.length - 1];
    const arrivees = [...cellules, [derniere[0] + dr, derniere[1] + dc]];

    // Rocher éjecté : gagne le joueur dont l’animal, orienté dans le sens de la poussée,
    // est le plus proche du rocher
    if (!dansPlateau(...arrivees[arrivees.length - 1]) && chaine[chaine.length - 1].k === 'c') {
        for (let i = chaine.length - 1; i >= 0; i--) {
            if (chaine[i].k === 'a' && chaine[i].dir === d) { S.fin = chaine[i].camp; break; }
        }
    }

    if (depart) S.grille[depart[0]][depart[1]] = null;
    chaine.forEach((p, i) => {
        const [r, c] = arrivees[i];
        if (dansPlateau(r, c)) S.grille[r][c] = p;
        else if (p.k === 'a') versBanc(p);
    });
}

/* ---------- Coups possibles ---------- */

function cibles() {
    const liste = [];
    const s = S.sel;
    if (!s || S.action) return liste;

    if (s.pos) {
        const [r, c] = s.pos;
        for (const d of [0, 90, 180, 270]) {
            const nr = r + DIRS[d][0], nc = c + DIRS[d][1];
            if (!dansPlateau(nr, nc)) continue;
            if (!S.grille[nr][nc]) liste.push({ r: nr, c: nc, type: 'deplace' });
            else if (s.piece.dir === d && poussable(ligne(nr, nc, d), d)) liste.push({ r: nr, c: nc, type: 'pousse', d });
        }
    } else {
        for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
                if (!surBord(r, c) || bloquee(r, c)) continue;
                if (!S.grille[r][c]) {
                    liste.push({ r, c, type: 'deplace' });
                } else {
                    const d = directionEntree(r, c);
                    if (d !== null && poussable(ligne(r, c, d), d)) liste.push({ r, c, type: 'pousse', d });
                }
            }
        }
    }
    return liste;
}

/* ---------- Actions ---------- */

function finDeTour() {
    if (S.fin) return;
    S.coups++;
    S.tour = autre(S.tour);
    S.sel = null;
    S.action = null;
    dire('Sélectionnez un de vos animaux.');
}

function jouer(cible) {
    const { piece, pos } = S.sel;
    if (cible.type === 'deplace') {
        if (pos) S.grille[pos[0]][pos[1]] = null;
        else S.banc[piece.camp][piece.id] = null;
        S.grille[cible.r][cible.c] = piece;
        S.sel.pos = [cible.r, cible.c];
        S.action = 'deplace';
        dire('Réglez l’orientation avec les flèches, puis terminez le tour.');
    } else {
        const cellules = ligne(cible.r, cible.c, cible.d);
        if (!pos) {
            S.banc[piece.camp][piece.id] = null;
            orienterPiece(piece, cible.d);
        }
        appliquerPoussee(piece, pos, cible.d, cellules);
        finDeTour();
    }
    render();
}

function orienter(d) {
    if (S.fin) return;
    if (!S.sel) return dire('Sélectionnez d’abord un de vos animaux.');
    if (!S.sel.pos) return dire('Placez d’abord l’animal sur le plateau.');
    orienterPiece(S.sel.piece, d);
    if (!S.action) S.action = 'tourne';
    dire('Terminez le tour pour valider.');
    render();
}

function sortir() {
    const s = S.sel;
    if (S.fin) return;
    if (!s || !s.pos || S.action || !surBord(...s.pos)) {
        return dire('Sélectionnez un de vos animaux placé sur le bord pour le sortir.');
    }
    S.grille[s.pos[0]][s.pos[1]] = null;
    versBanc(s.piece);
    finDeTour();
    render();
}

function surCase(i) {
    if (S.fin) return;
    const gr = Math.floor(i / N), c = i % N, r = gr - 1;
    const banc = gr === 0 ? 'rouge' : gr === N + 1 ? 'bleu' : null;
    const piece = banc ? S.banc[banc][c] : S.grille[r][c];

    if (!banc) {
        const cible = cibles().find((t) => t.r === r && t.c === c);
        if (cible) return jouer(cible);
    }

    if (piece && piece.k === 'a') {
        if (piece.camp !== S.tour) return dire(`C’est au tour des ${CAMPS[S.tour].nom}.`);
        if (S.action) return dire('Réglez l’orientation, puis terminez le tour.');
        S.sel = S.sel && S.sel.piece === piece ? null : { piece, pos: banc ? null : [r, c] };
        dire(!S.sel ? 'Sélectionnez un de vos animaux.'
            : banc ? 'Choisissez une case de bord pour entrer.'
            : 'Choisissez une destination, une poussée ou une orientation.');
    } else if (S.sel && !S.action) {
        dire('Coup impossible : cette case n’est pas accessible.');
    }
    render();
}

/* ---------- Affichage ---------- */

function elementPiece(p) {
    if (!p.el) {
        p.el = document.createElement('div');
        p.el.className = 'piece';
        const fichier = p.k === 'c' ? `Caillou${p.id}` : `${CAMPS[p.camp].asset}${p.id}`;
        p.el.style.backgroundImage = `url('assets/${fichier}.png')`;
    }
    p.el.style.transform = p.k === 'a' ? `rotate(${p.angle}deg)` : '';
    return p.el;
}

function render() {
    const liste = cibles();
    cases.forEach((cell, i) => {
        const gr = Math.floor(i / N), c = i % N, r = gr - 1;
        const enJeu = gr >= 1 && gr <= N;
        const p = gr === 0 ? S.banc.rouge[c] : gr === N + 1 ? S.banc.bleu[c] : S.grille[r][c];
        const cible = enJeu && liste.find((t) => t.r === r && t.c === c);

        const classes = ['case'];
        if (p && S.sel && S.sel.piece === p) classes.push('selectionnee');
        if (p && p.k === 'a' && p.camp === S.tour && !S.action) classes.push('jouable');
        if (cible) classes.push(cible.type === 'deplace' ? 'cible' : 'poussee');
        if (enJeu && bloquee(r, c)) classes.push('bloquee');
        cell.className = classes.join(' ');

        const actuel = cell.firstChild;
        if (p) {
            const el = elementPiece(p);
            if (actuel !== el) cell.replaceChildren(el);
        } else if (actuel) {
            cell.replaceChildren();
        }
    });

    document.body.dataset.tour = S.tour;
    $('#tour-texte').textContent = `Au tour des ${CAMPS[S.tour].nom}`;
    $('#fin').hidden = !S.fin;
    if (S.fin) $('#fin-texte').textContent = `Victoire des ${CAMPS[S.fin].nom}`;
}

/* ---------- Initialisation ---------- */

function nouvellePartie() {
    S = {
        grille: Array.from({ length: N }, () => Array(N).fill(null)),
        banc: { bleu: [], rouge: [] },
        tour: 'bleu',     // les Éléphants commencent
        coups: 0,
        sel: null,        // { piece, pos } — pos = null si l’animal est sur son banc
        action: null,     // 'deplace' | 'tourne' une fois l’action du tour jouée
        fin: null,        // camp vainqueur
    };
    for (const camp of Object.keys(CAMPS)) {
        for (let id = 0; id < N; id++) {
            const face = CAMPS[camp].face;
            S.banc[camp][id] = { k: 'a', camp, id, dir: face, angle: face };
        }
    }
    for (let c = 1; c <= 3; c++) {
        S.grille[2][c] = { k: 'c', id: 1 + Math.floor(Math.random() * 4), dir: 0, angle: 0 };
    }
    dire('Sélectionnez un de vos animaux.');
    render();
}

document.addEventListener('DOMContentLoaded', () => {
    const conteneur = $('#cases-container');
    for (let i = 0; i < (N + 2) * N; i++) {
        const cell = document.createElement('div');
        cell.addEventListener('click', () => surCase(i));
        conteneur.append(cell);
    }
    cases = Array.from(conteneur.children);

    document.querySelectorAll('[data-dir]').forEach((b) => {
        b.addEventListener('click', () => orienter(Number(b.dataset.dir)));
    });
    $('#sortir').addEventListener('click', sortir);
    $('#terminer').addEventListener('click', () => { if (!S.fin) { finDeTour(); render(); } });
    $('#rejouer').addEventListener('click', nouvellePartie);
    $('#fin-rejouer').addEventListener('click', nouvellePartie);

    nouvellePartie();
});