#!bin/shebang-local.mjs
import "../dist/mjs/index.mjs";

usage(`\
Usage: ${$0}

This script prefixes the source file ./index.js with the version.  This helps identify which version is
being used when users pull down the source script manually and use it.
`);

cd(`${__dirname}/../`);

// Prefix source with jsh - v0.0.0
const packageJson = JSON.parse(readFile("./package.json"));
const prefix = (sourceFile) => {
  const content = readFile(sourceFile);
  writeFile(
    sourceFile,
    `\
// ${packageJson.name} - v${packageJson.version}
// ${packageJson.homepage}

${content}`
  );
};

prefix(packageJson.exports["."].require);
prefix(packageJson.exports["."].import);
