// Skyval Calcul : prête la carte graphique (ou le processeur) de ce PC au tri des mails de Skyval.
// Ollama tourne dans le même conteneur. Le PC s'annonce tout seul à Atlas (le serveur Skyval) par Tailscale et vient
// chercher les calculs : aucun port à ouvrir sur le PC. Interface : http://localhost:8642
import http from "node:http";
import fs from "node:fs/promises";
import { readFileSync } from "node:fs";
import os from "node:os";
import { spawn, execFile } from "node:child_process";

const VERSION = "1.0.0";
const DATA = process.env.DATA || "/data";
const CONFIG = `${DATA}/config.json`;
const OLLAMA = process.env.OLLAMA_URL || "http://127.0.0.1:11434";      // OLLAMA_URL : un Ollama déjà lancé ailleurs (tests)
const PORT = Number(process.env.PORT || 8642);
const NUM_CTX = 2048;                                                    // un mail + la question tiennent dedans, et ça garde de la mémoire
// Du plus léger au plus lourd. memoire = Go de carte graphique (ou de RAM) nécessaires, contexte compris
const MODELES = [
  { nom: "gemma3:1b", taille: 0.8, memoire: 1.5, label: "1b · très léger, se trompe souvent" },
  { nom: "gemma3:4b", taille: 3.3, memoire: 4.5, label: "4b · léger" },
  { nom: "gemma3:12b", taille: 8.1, memoire: 9.5, label: "12b · bon équilibre" },
  { nom: "gemma3:27b", taille: 17, memoire: 19, label: "27b · le plus sûr, très lourd" },
];
const PAGE = readFileSync(new URL("./page.html", import.meta.url), "utf8");

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const DEFAUT = { nom: process.env.NOM_MACHINE || "", cle: process.env.SKYVAL_CLE || "", atlas: process.env.ATLAS_URL || "http://100.95.29.38:4601", demarrage: true, usage: 75, modele: "", bench: null };
let config = { ...DEFAUT };
try { config = { ...DEFAUT, ...JSON.parse(readFileSync(CONFIG, "utf8")) }; } catch {}
const sauver = () => fs.mkdir(DATA, { recursive: true }).then(() => fs.writeFile(CONFIG, JSON.stringify(config, null, 2)));

let actif = config.demarrage;                                            // « disponible » maintenant (au démarrage : le réglage)
let atlas = { etat: "attente", erreur: null, vu: 0 };                    // connecte · injoignable · cle_refusee · a_configurer
let reserve = null;                                                      // Atlas nous a réservé pour un mail : réglages bloqués
let enCalcul = false, benchEnCours = false;
const stats = { calculs: 0, dernier: null, secondes: null };
const telechargements = {};                                              // modèle → { fait, total, statut, erreur }
let installes = [];                                                      // modèles présents dans Ollama
let materiel = null;

// ---------- Ollama (dans le même conteneur, jamais exposé dehors) ----------
function lancerOllama() {
  const p = spawn("ollama", ["serve"], { env: { ...process.env, OLLAMA_HOST: "127.0.0.1:11434", OLLAMA_MODELS: `${DATA}/modeles`, OLLAMA_NUM_PARALLEL: "1", OLLAMA_MAX_LOADED_MODELS: "1" }, stdio: "ignore" });
  p.on("exit", (code) => { console.log(`Ollama arrêté (${code}), relance dans 5 s`); setTimeout(lancerOllama, 5000); });
}
async function ollama(chemin, corps, ms = 300000) {
  const r = await fetch(`${OLLAMA}${chemin}`, { method: corps ? "POST" : "GET", body: corps ? JSON.stringify(corps) : undefined, signal: AbortSignal.timeout(ms) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.error) throw new Error(d.error || `Ollama HTTP ${r.status}`);
  return d;
}
async function lireModeles() {
  try { installes = (await ollama("/api/tags", null, 5000)).models.map((m) => m.name); } catch {}
  return installes;
}
const pret = () => Boolean(config.modele && installes.includes(config.modele));
const threads = () => Math.max(1, Math.round(os.cpus().length * config.usage / 100));

async function generer(prompt, options = {}) {
  const d = await ollama("/api/generate", { model: config.modele, prompt, stream: false, keep_alive: "5m", options: { ...options, num_ctx: NUM_CTX, num_thread: threads() } });
  return d.response;
}

// ---------- Matériel et banc d'essai ----------
const exec = (cmd, args) => new Promise((ok) => execFile(cmd, args, { timeout: 10000 }, (e, out) => ok(e ? "" : String(out))));
async function detecter() {
  let gpu = null;
  for (const cmd of ["nvidia-smi", "/usr/lib/wsl/lib/nvidia-smi"]) {     // Linux, puis Windows (Docker Desktop + WSL2)
    const l = (await exec(cmd, ["--query-gpu=name,memory.total", "--format=csv,noheader,nounits"])).trim().split("\n")[0];
    if (l) { const [nom, mo] = l.split(",").map((s) => s.trim()); gpu = { nom, vram: Math.round(Number(mo) / 102.4) / 10 }; break; }
  }
  return { gpu, ram: Math.round(os.totalmem() / 1e8) / 10, cpus: os.cpus().length, cpu: os.cpus()[0]?.model?.trim() || "" };
}
// Mémoire autorisée = carte graphique (ou moitié de la RAM sans carte) × curseur d'utilisation
const budget = (m) => Math.round((m.gpu ? m.gpu.vram : m.ram / 2) * config.usage / 10) / 10;
function conseiller(m) {
  const b = budget(m);
  const possibles = MODELES.filter((x) => x.memoire <= b && (m.gpu || x.taille < 4));   // sans carte graphique : 4b au plus, sinon trop lent
  return possibles.at(-1)?.nom || null;
}
const VOTE_TEST = `Un commerçant répond à un mail de Skyval qui lui propose un site web.
Veut-il avancer avec Skyval ? Réponds par UN seul mot : OUI ou NON

Message du commerçant :
"""
Bonjour, merci pour la démo, elle est vraiment réussie. Combien ça coûterait pour la mettre en ligne ?
"""
Ton mot :`;
async function bencher() {
  benchEnCours = true;
  try {
    materiel = await detecter();
    let secondes = null;
    if (pret()) {
      await generer(VOTE_TEST, { num_predict: 4 });                        // chargement du modèle, pas compté
      const debut = Date.now();
      for (let i = 0; i < 3; i++) await generer(VOTE_TEST, { temperature: 0.7, num_predict: 8 });
      secondes = Math.round((Date.now() - debut) / 300) / 10;
    }
    config.bench = { le: new Date().toISOString(), ...materiel, usage: config.usage, budget: budget(materiel), conseille: conseiller(materiel), modele: pret() ? config.modele : null, secondes };
    await sauver();
  } finally { benchEnCours = false; }
}

async function installer(nom) {
  if (telechargements[nom]?.statut === "en_cours") return;
  telechargements[nom] = { fait: 0, total: 0, statut: "en_cours" };
  try {
    const r = await fetch(`${OLLAMA}/api/pull`, { method: "POST", body: JSON.stringify({ model: nom, name: nom, stream: true }) });   // « model » (Ollama récent), « name » (ancien)
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `Ollama HTTP ${r.status}`);
    let reste = "";
    for await (const morceau of r.body) {
      reste += Buffer.from(morceau).toString();
      const lignes = reste.split("\n"); reste = lignes.pop();
      for (const l of lignes.filter(Boolean)) {
        const d = JSON.parse(l);
        if (d.error) throw new Error(d.error);
        if (d.total) Object.assign(telechargements[nom], { fait: d.completed || 0, total: d.total });
      }
    }
    if (reste.trim()) { const d = JSON.parse(reste); if (d.error) throw new Error(d.error); }   // dernière ligne sans retour à la ligne
    telechargements[nom] = { statut: "fini" };
    await lireModeles();
    if (!pret()) { config.modele = nom; await sauver(); }                  // premier modèle installé : on l'utilise
  } catch (e) { telechargements[nom] = { statut: "erreur", erreur: e.message }; }
}

// ---------- Atlas : on s'annonce et on attend un calcul (attente longue, 25 s max côté Atlas) ----------
const annonce = () => ({ nom: config.nom, version: VERSION, actif: actif && pret(), modele: config.modele || null, usage: config.usage, gpu: config.bench?.gpu?.nom || materiel?.gpu?.nom || null, vram: config.bench?.gpu?.vram || materiel?.gpu?.vram || null, secondes: config.bench?.modele === config.modele ? config.bench.secondes : null, calculs: stats.calculs, reserve: Boolean(reserve) });
async function atlasPost(chemin, corps, ms, signal) {
  return fetch(`${config.atlas.replace(/\/$/, "")}${chemin}`, { method: "POST", headers: { "Content-Type": "application/json", "X-Calcul-Cle": config.cle }, body: JSON.stringify(corps), signal: signal ? AbortSignal.any([AbortSignal.timeout(ms), signal]) : AbortSignal.timeout(ms) });
}
// Un réglage change (disponible, modèle…) : on coupe l'attente en cours pour qu'Atlas le sache tout de suite
let attenteEnCours = null, reveil = null;
const reannoncer = () => { attenteEnCours?.abort(); reveil?.(); };
const somme = (ms) => new Promise((r) => { const t = setTimeout(r, ms); reveil = () => { clearTimeout(t); r(); }; });
async function boucleAtlas() {
  for (;;) {
    if (!config.cle || !config.nom) { atlas = { etat: "a_configurer", erreur: null, vu: 0 }; reserve = null; await dormir(2000); continue; }
    const debut = Date.now(), coupe = new AbortController();
    attenteEnCours = coupe;
    try {
      const r = await atlasPost("/calcul/attendre", annonce(), 40000, coupe.signal);
      if (r.status === 401) { atlas = { etat: "cle_refusee", erreur: "Clé refusée par Atlas", vu: 0 }; reserve = null; await dormir(30000); continue; }
      if (!r.ok) throw new Error(`Atlas HTTP ${r.status}`);
      const d = await r.json();
      atlas = { etat: "connecte", erreur: null, vu: Date.now() };
      reserve = d.reserve || null;
      if (d.travail) await calculer(d.travail);
      else if (!annonce().actif) await somme(10000);                       // indisponible : on donne juste des nouvelles
      else if (Date.now() - debut < 1000) await dormir(1000);              // jamais de boucle folle si Atlas répond tout de suite
    } catch (e) {
      if (coupe.signal.aborted) continue;
      atlas = { etat: "injoignable", erreur: e.message, vu: atlas.vu }; reserve = null;
      await dormir(10000);
    }
  }
}
async function calculer(t) {
  enCalcul = true;
  const debut = Date.now();
  let resultat;
  try {
    if (!annonce().actif) throw new Error("PC rendu indisponible");        // rendu indisponible juste avant que le calcul arrive
    resultat = { id: t.id, texte: await generer(t.prompt, t.options) };
  }
  catch (e) { resultat = { id: t.id, erreur: e.message }; }
  const duree = Date.now() - debut;
  stats.calculs++; stats.dernier = new Date().toISOString(); stats.secondes = Math.round(duree / 100) / 10;
  await atlasPost("/calcul/resultat", resultat, 15000).catch(() => {});
  enCalcul = false;
  // Curseur d'utilisation : à 50 %, le PC se repose autant qu'il a calculé (30 s max)
  const pause = Math.min(30000, duree * (100 - config.usage) / config.usage);
  if (pause > 200) await dormir(pause);
}

// ---------- Interface web (http://localhost:8642) ----------
const json = (res, code, d) => { res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" }); res.end(JSON.stringify(d)); };
const lireCorps = (req) => new Promise((ok) => { let s = ""; req.on("data", (c) => { s += c; }); req.on("end", () => { try { ok(JSON.parse(s || "{}")); } catch { ok({}); } }); });
function etat() {
  return { version: VERSION, config: { ...config, cle: config.cle ? `${config.cle.slice(0, 6)}…` : "" }, actif, atlas, reserve: Boolean(reserve), enCalcul, benchEnCours, stats, materiel, installes, telechargements,
    modeles: MODELES.map((m) => ({ ...m, installe: installes.includes(m.nom), possible: materiel ? m.memoire <= budget(materiel) : null })) };
}
http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://x");
    if (req.method === "GET" && url.pathname === "/") { res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); return res.end(PAGE); }
    if (req.method === "GET" && /^\/fonts\/[a-z0-9-]+\.woff2$/.test(url.pathname)) {   // polices de l'interface (app/fonts), marche hors ligne
      const f = await fs.readFile(new URL(`.${url.pathname}`, import.meta.url)).catch(() => null);
      if (!f) return json(res, 404, { erreur: "Introuvable" });
      res.writeHead(200, { "Content-Type": "font/woff2", "Cache-Control": "max-age=86400" }); return res.end(f);
    }
    if (req.method === "GET" && url.pathname === "/api/etat") return json(res, 200, etat());
    if (req.method !== "POST") return json(res, 404, { erreur: "Introuvable" });
    const c = await lireCorps(req);
    // Pendant qu'Atlas nous a réservé pour un mail, rien ne bouge (sinon le modèle changerait au milieu d'un vote)
    if (reserve && url.pathname !== "/api/connexion") return json(res, 409, { erreur: "Calcul en cours pour Skyval : réessaie dans un instant." });
    if (url.pathname === "/api/connexion") {
      for (const k of ["nom", "atlas"]) if (typeof c[k] === "string" && c[k].trim()) config[k] = c[k].trim();
      if (typeof c.cle === "string" && c.cle.trim()) config.cle = c.cle.trim();
      await sauver(); reannoncer(); return json(res, 200, etat());
    }
    if (url.pathname === "/api/reglages") {
      if (typeof c.actif === "boolean") actif = c.actif;
      if (typeof c.demarrage === "boolean") config.demarrage = c.demarrage;
      if (Number.isFinite(c.usage)) config.usage = Math.min(100, Math.max(10, Math.round(c.usage / 5) * 5));
      await sauver(); reannoncer(); return json(res, 200, etat());
    }
    if (url.pathname === "/api/bench") { if (!benchEnCours) bencher().catch((e) => { config.bench = { erreur: e.message }; }); return json(res, 202, etat()); }
    if (url.pathname === "/api/modele") {
      const m = MODELES.find((x) => x.nom === c.nom);
      if (!m) return json(res, 400, { erreur: "Modèle inconnu" });
      if (c.action === "installer") installer(m.nom);
      else if (c.action === "utiliser") { if (!installes.includes(m.nom)) return json(res, 400, { erreur: "Installe-le d'abord" }); config.modele = m.nom; await sauver(); }
      else if (c.action === "supprimer") { await ollama("/api/delete", { model: m.nom, name: m.nom }).catch(() => {}); if (config.modele === m.nom) config.modele = ""; await sauver(); await lireModeles(); }
      reannoncer(); return json(res, 200, etat());
    }
    json(res, 404, { erreur: "Introuvable" });
  } catch (e) { json(res, 500, { erreur: e.message }); }
}).listen(PORT, "0.0.0.0", () => console.log(`Skyval Calcul ${VERSION} : interface sur http://localhost:${PORT}`));

if (!process.env.OLLAMA_URL) lancerOllama();
(async () => {
  for (let i = 0; i < 30 && !(await lireModeles()).length && !(await fetch(OLLAMA).then((r) => r.ok).catch(() => false)); i++) await dormir(1000);
  materiel = await detecter();
  setInterval(lireModeles, 30000);
  boucleAtlas();
})();
