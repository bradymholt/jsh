import "../src/index";
import * as child_process from "child_process";
import { red } from "./helpers/color";

it("prints usage to stderr correctly when not enough arguments are provided", () => {
  const result = child_process.spawnSync("test/fixtures/run-fixture.sh", ["test/fixtures/print-usage.ts"]);
  expect(result.stderr.toString()).toContain("Usage: print-usage.ts\n");
  expect(result.stderr.toString()).toContain(red("1 argument was expected but none were provided"));
});

it("prints usage to stdout when --help argument is specified", () => {
  const result = child_process.spawnSync("test/fixtures/run-fixture.sh", ["test/fixtures/print-usage.ts", "--help"]);
  expect(result.stdout.toString()).toEqual("Usage: print-usage.ts\n");  
});
