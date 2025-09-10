#!/usr/bin/env node
// Wrapper to run Vite dev server with proper flags
import { exec } from 'child_process';

const command = 'npx vite --host 0.0.0.0 --port 3000';
console.log(`Running: ${command}`);

const child = exec(command, { stdio: 'inherit' });

child.stdout?.on('data', (data) => {
  console.log(data.toString());
});

child.stderr?.on('data', (data) => {
  console.error(data.toString());
});

child.on('close', (code) => {
  console.log(`Vite dev server exited with code ${code}`);
});