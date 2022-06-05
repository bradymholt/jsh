#!/usr/bin/env node

import * as path from "path";
global.jsh_shebang = true;

const scriptPath = `${process.cwd()}/${process.argv[2]}`;
global.jsh_scriptName = path.basename(scriptPath);

import "../dist/mjs/index.mjs";
await import(scriptPath);
