#!./node_modules/ts-node/dist/bin-esm.js
import "../../src/index.js";
const [first, second] = args.assertCount(2);
echo(`First: ${first}`)
echo(`Second: ${second}`)
