import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Clear previous build artifacts if present
if (existsSync(join(outputDir, 'game'))) {
  rmSync(join(outputDir, 'game'), { recursive: true, force: true });
}
if (existsSync(join(outputDir, 'screenshots'))) {
  rmSync(join(outputDir, 'screenshots'), { recursive: true, force: true });
}

mkdirSync(outputDir, { recursive: true });
cpSync(join(rootDir, 'game'), join(outputDir, 'game'), { recursive: true });

const targetScreenshotsDir = join(outputDir, 'screenshots');
mkdirSync(targetScreenshotsDir, { recursive: true });
const sourceScreenshotsDir = join(rootDir, 'screenshots');
if (existsSync(sourceScreenshotsDir)) {
  cpSync(sourceScreenshotsDir, targetScreenshotsDir, { recursive: true });
}

const dossierPayload = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});

writeFileSync(join(outputDir, 'dossier.json'), dossierPayload);
