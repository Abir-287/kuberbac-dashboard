import { createCanvas } from 'canvas';
import fs from 'fs';

const W = 1200;
const H = 920;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// Background
ctx.fillStyle = '#FFFFFF';
ctx.fillRect(0, 0, W, H);

// Colors
const COL_BLUE   = '#2563EB';
const COL_GREEN  = '#16A34A';
const COL_RED    = '#DC2626';
const COL_GREY   = '#6B7280';
const COL_BG_GREEN = '#ECFDF5';
const COL_BG_RED   = '#FEF2F2';
const COL_BG_BLUE  = '#EFF6FF';
const COL_LINE   = '#CBD5E1';
const COL_BOX    = '#1E293B';

// Participants
const participants = [
  { label: 'Administrateur',         x: 110 },
  { label: 'Serveur Web\n(Backend)', x: 310 },
  { label: 'Coffre\nGitHub',         x: 510 },
  { label: 'Robot\nArgoCD',          x: 710 },
  { label: 'Système\nKubernetes',    x: 950 },
];

const LIFE_TOP  = 120;
const LIFE_BOT  = 870;
const BOX_W     = 140;
const BOX_H     = 52;
const BOX_Y     = 30;
const FONT_PART = 'bold 16px sans-serif';
const FONT_MSG  = '15px sans-serif';
const FONT_NOTE = 'bold 14px sans-serif';

// Helper: draw wrapped text centered
function wrapText(ctx, text, x, y, maxW, lineH) {
  const lines = text.split('\n');
  const totalH = lines.length * lineH;
  let startY = y - totalH / 2 + lineH / 2;
  for (const line of lines) {
    ctx.fillText(line, x, startY);
    startY += lineH;
  }
}

// Draw lifelines
participants.forEach(p => {
  ctx.strokeStyle = COL_LINE;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(p.x, LIFE_TOP);
  ctx.lineTo(p.x, LIFE_BOT);
  ctx.stroke();
  ctx.setLineDash([]);
});

// Draw participant boxes TOP
participants.forEach(p => {
  const bx = p.x - BOX_W / 2;
  const by = BOX_Y;

  // Shadow
  ctx.fillStyle = '#D1D5DB';
  ctx.fillRect(bx + 3, by + 3, BOX_W, BOX_H);

  ctx.fillStyle = COL_BOX;
  ctx.fillRect(bx, by, BOX_W, BOX_H);
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(bx, by, BOX_W, BOX_H);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = FONT_PART;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  wrapText(ctx, p.label, p.x, by + BOX_H / 2, BOX_W - 10, 18);
});

// Draw participant boxes BOTTOM
participants.forEach(p => {
  const bx = p.x - BOX_W / 2;
  const by = LIFE_BOT;

  ctx.fillStyle = '#D1D5DB';
  ctx.fillRect(bx + 3, by + 3, BOX_W, BOX_H);

  ctx.fillStyle = COL_BOX;
  ctx.fillRect(bx, by, BOX_W, BOX_H);
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(bx, by, BOX_W, BOX_H);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = FONT_PART;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  wrapText(ctx, p.label, p.x, by + BOX_H / 2, BOX_W - 10, 18);
});

// Arrow helper
function arrow(fromX, toX, y, label, color = COL_BOX, dashed = false) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  if (dashed) ctx.setLineDash([5, 4]);
  else ctx.setLineDash([]);

  const dir = toX > fromX ? 1 : -1;
  ctx.beginPath();
  ctx.moveTo(fromX, y);
  ctx.lineTo(toX - dir * 10, y);
  ctx.stroke();

  // Arrowhead
  ctx.setLineDash([]);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(toX, y);
  ctx.lineTo(toX - dir * 10, y - 5);
  ctx.lineTo(toX - dir * 10, y + 5);
  ctx.closePath();
  ctx.fill();

  // Label
  ctx.fillStyle = color;
  ctx.font = FONT_MSG;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(label, (fromX + toX) / 2, y - 4);
}

// Note banner
function noteBanner(label, fromX, toX, y) {
  const pad = 10;
  const bx = Math.min(fromX, toX) - pad;
  const bw = Math.abs(toX - fromX) + pad * 2;
  ctx.fillStyle = COL_BG_BLUE;
  ctx.strokeStyle = '#93C5FD';
  ctx.lineWidth = 1;
  ctx.fillRect(bx, y - 11, bw, 22);
  ctx.strokeRect(bx, y - 11, bw, 22);
  ctx.fillStyle = '#1D4ED8';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, (fromX + toX) / 2, y);
}

// Colored rect region
function colorRect(x1, x2, y1, y2, bg, borderColor, label) {
  const pad = 18;
  ctx.fillStyle = bg;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1.5;
  ctx.fillRect(x1 - pad, y1, x2 - x1 + pad * 2, y2 - y1);
  ctx.strokeRect(x1 - pad, y1, x2 - x1 + pad * 2, y2 - y1);

  // Alt label tag
  ctx.fillStyle = borderColor;
  ctx.fillRect(x1 - pad, y1, 40, 20);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x1 - pad + 20, y1 + 10);
}

// ------ DRAW DIAGRAM ------

// ÉTAPE 1
noteBanner('ÉTAPE 1 : LA DEMANDE', participants[0].x, participants[1].x, 155);
arrow(participants[0].x, participants[1].x, 185, "Demande d'ajout ou suppression de droits");

// ALT SUCCESS region
colorRect(participants[1].x, participants[4].x, 210, 690, COL_BG_GREEN, '#16A34A', 'alt');

// Success label
ctx.fillStyle = COL_GREEN;
ctx.font = 'bold 13px sans-serif';
ctx.textAlign = 'left';
ctx.textBaseline = 'middle';
ctx.fillText('✔  Succès de la préparation', participants[1].x - 10, 225);

// ÉTAPE 2
noteBanner('ÉTAPE 2 : SAUVEGARDE', participants[1].x, participants[2].x, 250);
arrow(participants[1].x, participants[2].x, 278, 'Enregistre le changement (Fichier YAML)');

// ÉTAPE 3
noteBanner('ÉTAPE 3 : SIGNAL DE RÉVEIL', participants[1].x, participants[4].x, 330);
arrow(participants[1].x, participants[4].x, 360, 'Envoie une alerte de mise à jour immédiate');
arrow(participants[1].x, participants[0].x, 400, 'Réponse : "Demande enregistrée"', COL_GREY, true);

// ÉTAPE 4
noteBanner('ÉTAPE 4 : SYNCHRONISATION', participants[3].x, participants[4].x, 450);
arrow(participants[3].x, participants[2].x, 480, 'Récupère les dernières modifications', COL_BOX, false);
arrow(participants[3].x, participants[4].x, 525, 'Applique les changements dans le cluster');
arrow(participants[4].x, participants[0].x, 570, 'État mis à jour (Droits actifs)', COL_GREEN, true);

// Separator dashed line
ctx.strokeStyle = '#94A3B8';
ctx.lineWidth = 1;
ctx.setLineDash([6, 4]);
ctx.beginPath();
ctx.moveTo(participants[1].x - 30, 610);
ctx.lineTo(participants[4].x + 30, 610);
ctx.stroke();
ctx.setLineDash([]);

// ELSE region - failure
colorRect(participants[1].x, participants[4].x, 618, 700, COL_BG_RED, '#DC2626', 'else');

ctx.fillStyle = COL_RED;
ctx.font = 'bold 13px sans-serif';
ctx.textAlign = 'left';
ctx.textBaseline = 'middle';
ctx.fillText('✖  Échec de la préparation', participants[1].x - 10, 635);

arrow(participants[1].x, participants[0].x, 665, 'Erreur : "Impossible de modifier la configuration"', COL_RED, true);

// Auto-number labels on the left
const steps = [185, 278, 360, 400, 480, 525, 570, 665];
steps.forEach((y, i) => {
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.beginPath();
  ctx.arc(22, y, 10, 0, Math.PI * 2);
  ctx.fillStyle = '#334155';
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillText(i + 1, 22, y);
});

// TITLE
ctx.fillStyle = '#0F172A';
ctx.font = 'bold 20px sans-serif';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('Diagramme de Séquence — Gestion des Droits (RBAC GitOps)', W / 2, 12);

// Save
const out = '/home/abir/dashboard-rbac/rbac_gitops_diagram.png';
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(out, buffer);
console.log('Image saved at ' + out);
