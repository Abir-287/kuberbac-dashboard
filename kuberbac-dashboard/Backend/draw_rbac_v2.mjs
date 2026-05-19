import { createCanvas } from 'canvas';
import fs from 'fs';

const W = 1300, H = 1000;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// ── Background ──────────────────────────────────────────────────────────────
ctx.fillStyle = '#FFFFFF';
ctx.fillRect(0, 0, W, H);

// ── Palette ─────────────────────────────────────────────────────────────────
const ACTOR_BG    = '#D1E8FF';
const ACTOR_BDR   = '#333333';
const LIFE_LINE   = '#AAAAAA';
const PHASE_BG    = '#FFFFFF';
const PHASE_BDR   = '#333333';
const ALT_BG      = '#F5F5F5';
const ALT_TAG_BG  = '#888888';
const SUCCESS_BG  = '#EDFAED';
const FAIL_BG     = '#FDECEA';
const ARROW_CLR   = '#111111';
const ARROW_DASH  = '#555555';
const NOTE_BG     = '#EEF4FF';
const NOTE_BDR    = '#93C5FD';

// ── Participants ─────────────────────────────────────────────────────────────
const PLIST = [
  { label: 'Administrateur',      x: 115,  icon: true  },
  { label: 'Serveur Web\n(Backend)', x: 315,  icon: false },
  { label: 'GitHub',              x: 520,  icon: false },
  { label: 'ArgoCD',              x: 720,  icon: false },
  { label: 'Cluster\nKubernetes', x: 980,  icon: false },
];

const BOX_W = 148, BOX_H = 52;
const BOX_Y_TOP = 80;
const LIFE_Y1   = BOX_Y_TOP + BOX_H;
const LIFE_Y2   = 930;

// ── Draw stick figure ────────────────────────────────────────────────────────
function stickFigure(cx, cy) {
  ctx.strokeStyle = '#333';
  ctx.lineWidth   = 2;
  // head
  ctx.beginPath();
  ctx.arc(cx, cy - 16, 9, 0, Math.PI * 2);
  ctx.stroke();
  // body
  ctx.beginPath(); ctx.moveTo(cx, cy - 7); ctx.lineTo(cx, cy + 12); ctx.stroke();
  // arms
  ctx.beginPath(); ctx.moveTo(cx - 12, cy); ctx.lineTo(cx + 12, cy); ctx.stroke();
  // legs
  ctx.beginPath(); ctx.moveTo(cx, cy + 12); ctx.lineTo(cx - 10, cy + 26); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy + 12); ctx.lineTo(cx + 10, cy + 26); ctx.stroke();
}

// ── Draw actor box ───────────────────────────────────────────────────────────
function actorBox(p, topY) {
  const bx = p.x - BOX_W / 2;
  ctx.fillStyle   = ACTOR_BG;
  ctx.strokeStyle = ACTOR_BDR;
  ctx.lineWidth   = 1.5;
  ctx.fillRect(bx, topY, BOX_W, BOX_H);
  ctx.strokeRect(bx, topY, BOX_W, BOX_H);
  ctx.fillStyle     = '#000';
  ctx.font          = 'bold 15px sans-serif';
  ctx.textAlign     = 'center';
  ctx.textBaseline  = 'middle';
  const lines = p.label.split('\n');
  const lh    = 18;
  const startY = topY + BOX_H / 2 - ((lines.length - 1) * lh) / 2;
  lines.forEach((l, i) => ctx.fillText(l, p.x, startY + i * lh));
}

// ── Draw all actors + lifelines ───────────────────────────────────────────────
PLIST.forEach(p => {
  // Stick figure above top box (only Administrateur)
  if (p.icon) stickFigure(p.x, BOX_Y_TOP - 32);
  actorBox(p, BOX_Y_TOP);
  actorBox(p, LIFE_Y2);
  // Lifeline
  ctx.strokeStyle = LIFE_LINE;
  ctx.lineWidth   = 1;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(p.x, LIFE_Y1);
  ctx.lineTo(p.x, LIFE_Y2);
  ctx.stroke();
  ctx.setLineDash([]);
});

// ── Phase separator (double-line + white pill label) ─────────────────────────
function phaseSep(label, y) {
  // double line
  [y - 2, y + 2].forEach(ly => {
    ctx.strokeStyle = '#555';
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(20, ly);
    ctx.lineTo(W - 20, ly);
    ctx.stroke();
  });
  // pill
  const tw = ctx.measureText(label).width + 40;
  const px  = W / 2 - tw / 2;
  ctx.fillStyle   = PHASE_BG;
  ctx.strokeStyle = PHASE_BDR;
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.roundRect(px, y - 13, tw, 26, 13);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle    = '#000';
  ctx.font         = 'bold 15px sans-serif';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, W / 2, y);
}

// ── Arrow helper ──────────────────────────────────────────────────────────────
let seq = 1;
function arrow(fromP, toP, y, label, dashed = false, color = ARROW_CLR) {
  const x1 = fromP.x, x2 = toP.x;
  const dir = x2 > x1 ? 1 : -1;
  ctx.strokeStyle = dashed ? ARROW_DASH : color;
  ctx.lineWidth   = 1.8;
  ctx.setLineDash(dashed ? [6, 4] : []);
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2 - dir * 11, y);
  ctx.stroke();
  ctx.setLineDash([]);
  // arrowhead
  ctx.fillStyle = dashed ? ARROW_DASH : color;
  ctx.beginPath();
  ctx.moveTo(x2, y);
  ctx.lineTo(x2 - dir * 11, y - 5);
  ctx.lineTo(x2 - dir * 11, y + 5);
  ctx.closePath(); ctx.fill();
  // label
  ctx.fillStyle    = '#222';
  ctx.font         = '14px sans-serif';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(label, (x1 + x2) / 2, y - 5);
  // seq badge
  ctx.fillStyle = '#1E3A5F';
  ctx.beginPath(); ctx.arc(18, y, 11, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle    = '#FFF';
  ctx.font         = 'bold 11px sans-serif';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(seq++, 18, y);
}

// ── Note banner ───────────────────────────────────────────────────────────────
function note(label, p1, p2, y) {
  const x1 = Math.min(p1.x, p2.x) - 20;
  const x2 = Math.max(p1.x, p2.x) + 20;
  ctx.fillStyle   = NOTE_BG;
  ctx.strokeStyle = NOTE_BDR;
  ctx.lineWidth   = 1;
  ctx.fillRect(x1, y - 12, x2 - x1, 24);
  ctx.strokeRect(x1, y - 12, x2 - x1, 24);
  ctx.fillStyle    = '#1D4ED8';
  ctx.font         = 'bold 13px sans-serif';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, (x1 + x2) / 2, y);
}

// ─────────────────────────────────────────────────────────────────────────────
// DIAGRAM CONTENT
// ─────────────────────────────────────────────────────────────────────────────

// Étape 1
phaseSep('Étape 1 : La demande', 168);
arrow(PLIST[0], PLIST[1], 205, "Demande d'ajout ou de suppression de droits");

// ALT block background (success + failure)
const altTop = 230, altBot = 850;
ctx.fillStyle   = SUCCESS_BG;
ctx.strokeStyle = '#888';
ctx.lineWidth   = 1.2;
ctx.fillRect(36, altTop, W - 52, altBot - altTop);
ctx.strokeRect(36, altTop, W - 52, altBot - altTop);

// alt tag
ctx.fillStyle = ALT_TAG_BG;
ctx.fillRect(36, altTop, 36, 22);
ctx.fillStyle    = '#FFF';
ctx.font         = 'bold 12px sans-serif';
ctx.textAlign    = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('alt', 54, altTop + 11);

// Succès label
ctx.fillStyle    = '#166534';
ctx.font         = 'bold 13px sans-serif';
ctx.textAlign    = 'left';
ctx.textBaseline = 'middle';
ctx.fillText('Succès de la préparation', 80, altTop + 14);

// Étape 2
phaseSep('Étape 2 : Sauvegarde', 278);
arrow(PLIST[1], PLIST[2], 318, 'Enregistre le changement dans le fichier de config');

// Étape 3
phaseSep('Étape 3 : Signal de réveil', 375);
arrow(PLIST[1], PLIST[4], 415, 'Envoie une alerte de mise à jour immédiate');
arrow(PLIST[1], PLIST[0], 455, 'Réponse : "Demande enregistrée"', true);

// Étape 4
phaseSep('Étape 4 : Synchronisation', 510);
arrow(PLIST[3], PLIST[2], 548, 'Récupère les dernières modifications');
arrow(PLIST[3], PLIST[4], 592, 'Applique les changements dans le cluster');
arrow(PLIST[4], PLIST[0], 638, 'État mis à jour (Droits actifs)', true, '#166534');

// ── ELSE (failure) zone ───────────────────────────────────────────────────────
const failTop = 680, failBot = 840;
ctx.fillStyle   = FAIL_BG;
ctx.fillRect(38, failTop, W - 56, failBot - failTop);

// dashed separator
ctx.strokeStyle = '#AAA';
ctx.lineWidth   = 1;
ctx.setLineDash([5, 5]);
ctx.beginPath();
ctx.moveTo(38, failTop);
ctx.lineTo(W - 18, failTop);
ctx.stroke();
ctx.setLineDash([]);

// Échec label
ctx.fillStyle    = '#991B1B';
ctx.font         = 'bold 13px sans-serif';
ctx.textAlign    = 'left';
ctx.textBaseline = 'middle';
ctx.fillText('Échec de la préparation', 80, failTop + 16);

arrow(PLIST[1], PLIST[0], 758, 'Erreur : "Impossible de modifier la configuration"', true, '#CC0000');

// ── Save ─────────────────────────────────────────────────────────────────────
const out = '/home/abir/dashboard-rbac/rbac_gitops_diagram_v2.png';
fs.writeFileSync(out, canvas.toBuffer('image/png'));
console.log('Saved: ' + out);
