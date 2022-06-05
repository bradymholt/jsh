#!/usr/bin/env node

import * as path from "path";
global.jsh_shebang = true;

const scriptPath =  path.join(process.argv[2]);
global.jsh_scriptName = path.basename(scriptPath);

import "jsh";
await import(scriptPath);
