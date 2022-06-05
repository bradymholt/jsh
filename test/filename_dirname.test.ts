import "../src/index";
import * as child_process from "child_process";
import * as path from "path";

it("__filename is defined", () => {
  expect(__filename).toBeDefined();
});

it("__filename is absolute path", () => {
  const result = child_process.spawnSync("./node_modules/ts-node/dist/bin-esm.js", [
    "test/fixtures/echo-__filename.ts",
  ]);
  expect(result.stdout.toString()).toEqual(`${path.join(process.cwd(), "test/fixtures/echo-__filename.ts")}\n`);
});

it("__dirname is defined", () => {
  expect(__dirname).toBeDefined();
});

it("__dirname is absolute path", () => {
  const result = child_process.spawnSync("./node_modules/ts-node/dist/bin-esm.js", ["test/fixtures/echo-__dirname.ts"]);
  expect(result.stdout.toString()).toEqual(`${path.join(process.cwd(), "test/fixtures")}\n`);
});
