import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const game = readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');

test('page loads the game module and includes essential controls', () => {
  assert.match(html, /<script type="module" src="\.\/game\.js"><\/script>/);
  for (const id of ['game', 'startScreen', 'playButton', 'minimap', 'objectiveText', 'mode', 'speed', 'interactButton', 'cameraButton', 'brakeButton']) {
    assert.ok(html.includes(`id="${id}"`), `Missing required element: ${id}`);
  }
});

test('Update 1 contains its core city and gameplay systems', () => {
  for (const feature of ['function movePlayer', 'function updateCamera', 'function walkNPCs', 'function moveTraffic', 'function interact', 'const playerCar', 'const routes', 'const roadLoop']) {
    assert.ok(game.includes(feature), `Missing expected game feature: ${feature}`);
  }
  assert.match(game, /for\(let i=0;i<20;i\+\+\)/);
  assert.match(game, /for\(let i=0;i<7;i\+\+\)/);
});

test('README documents browser play and test commands', () => {
  assert.match(readme, /The Living City/);
  assert.match(readme, /npm test/);
  assert.match(readme, /npm run check/);
  assert.match(readme, /fictional/);
});