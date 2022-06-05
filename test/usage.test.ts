import "../src/index";
import * as child_process from "child_process";

it("prints usage correctly", () => {
  const result = child_process.spawnSync("./node_modules/ts-node/dist/bin-esm.js", ["test/fixtures/print-usage.ts"]);
  expect(result.stderr.toString()).toEqual(`\
print-usage.ts

1 argument was expected but none were provided
`);
});
