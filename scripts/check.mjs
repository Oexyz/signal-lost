import { spawnSync } from 'node:child_process';

const checks = [
  ['lint'],
  ['typecheck'],
  ['test'],
  ['scenario:validate'],
  ['build'],
  ['legal:check'],
  ['privacy:check'],
  ['assets:check'],
  ['brand:check'],
  ['smoke:server'],
];

for (const args of checks) {
  console.log(`\n> pnpm ${args.join(' ')}`);
  const command = process.platform === 'win32'
    ? (process.env.ComSpec ?? 'cmd.exe')
    : 'pnpm';
  const commandArguments = process.platform === 'win32'
    ? ['/d', '/s', '/c', `pnpm ${args.join(' ')}`]
    : args;
  const result = spawnSync(command, commandArguments, {
    shell: false,
    stdio: 'inherit',
  });

  if (result.error) {
    console.error(`Could not start pnpm ${args.join(' ')}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log('\nAll foundation checks passed.');
