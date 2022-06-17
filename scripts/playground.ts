#!./node_modules/ts-node/dist/bin-esm.js
import "../src/index.js";

usage(`\
Usage: ${$0}

This is a jsh playground for experimentation.`);

const foo = prompt(() => {
  echo.noNewLine("Hey, what's your name?: ");
});
echo.yellow(`Hello, ${foo}!`);
