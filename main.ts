// HEATWAVE: Coral Vista — gta6-01 entry runner (Node 22, standard library only)
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const ROOT_DIR = fileURLToPath(new URL('.', import.meta.url));
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const GATE_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function packageEntry(): void {
  const outGame = join(OUTPUT_DIR, 'game');
  const outShots = join(OUTPUT_DIR, 'screenshots');

  mkdirSync(OUTPUT_DIR, { recursive: true });
  if (existsSync(outGame)) rmSync(outGame, { recursive: true, force: true });
  if (existsSync(outShots)) rmSync(outShots, { recursive: true, force: true });

  cpSync(join(ROOT_DIR, 'game'), outGame, { recursive: true });
  mkdirSync(outShots, { recursive: true });
  const srcShots = join(ROOT_DIR, 'screenshots');
  if (existsSync(srcShots)) {
    cpSync(srcShots, outShots, { recursive: true });
  }

  const dossierBytes = buildDossier(OUTPUT_DIR, GATE_CAPS);
  writeFileSync(join(OUTPUT_DIR, 'dossier.json'), dossierBytes);
}

packageEntry();
