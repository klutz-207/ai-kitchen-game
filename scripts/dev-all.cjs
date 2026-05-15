const { spawn } = require('node:child_process');

const commands = [
  {
    name: 'api',
    command: 'npm',
    args: ['run', 'dev:api'],
    cwd: process.cwd(),
  },
  {
    name: 'demo',
    command: 'npm',
    args: ['run', 'dev'],
    cwd: `${process.cwd()}\\demo`,
  },
];

const children = [];

function start({ name, command, args, cwd }) {
  const child = spawn(command, args, {
    cwd,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  });

  child.stdout.on('data', (chunk) => {
    process.stdout.write(`[${name}] ${chunk}`);
  });

  child.stderr.on('data', (chunk) => {
    process.stderr.write(`[${name}] ${chunk}`);
  });

  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      process.exitCode = code;
    }
  });

  children.push(child);
}

function stop() {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
}

process.on('SIGINT', () => {
  stop();
  process.exit();
});

process.on('SIGTERM', () => {
  stop();
  process.exit();
});

console.log('Starting AI Kitchen local workspace...');
console.log('API  : http://127.0.0.1:3001');
console.log('Demo : http://127.0.0.1:5174\n');

for (const command of commands) {
  start(command);
}
