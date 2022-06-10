#!/usr/bin/env node
import * as jsh from "jsh";
import * as path from "path";
usage(`\
Usage: jsh <script> [args]\
`);

args.assertCount(1);

let scriptPath = process.argv[2];
if (!scriptPath.startsWith("/")) {
  // Relative path so join with current working directory
  scriptPath = path.join(process.cwd(), scriptPath);
}

jsh.setEntryScriptPath(scriptPath);
jsh.setupArguments(process.argv.slice(3));

await import(scriptPath);
