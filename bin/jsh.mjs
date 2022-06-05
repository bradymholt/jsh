#!/usr/bin/env node

import * as path from "path";
global.jsh_shebang = true;

let scriptPath = path.join(process.argv[2]);

if (!process.argv[2].startsWith("/")) {
  // Relative path so join with current working directory
  scriptPath = path.join(process.cwd(), process.argv[2]);
}

global.jsh_scriptName = path.basename(scriptPath);

import "jsh";
await import(scriptPath);
