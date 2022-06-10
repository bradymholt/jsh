#!/usr/bin/env node
import * as jsh from "../dist/index.mjs";

const scriptPath = `${process.cwd()}/${process.argv[2]}`;

jsh.setEntryScriptPath(scriptPath);
jsh.setupArguments(process.argv.slice(3));

await import(scriptPath);
