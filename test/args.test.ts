import "../src/index";
import * as child_process from "child_process";

it("$0 should return the file name of the current script", () => {
  const result = child_process.spawnSync("./node_modules/ts-node/dist/bin-esm.js", ["test/fixtures/echo-$0.ts"]);
  expect(result.stdout.toString()).toEqual("echo-$0.ts\n");
});

it("$1 through $10 should be declared but undefined", () => {
  for (let i = 1; i <= 10; i++) {
    expect(global[`$${i}`]).toBeUndefined();
  }
});

it("$11 should be undeclared", () => {
  for (let i = 1; i <= 10; i++) {
    expect(global.$11).toBeUndefined();
  }
});

it("assert 1 argument", () => {
  const result = child_process.spawnSync("./node_modules/ts-node/dist/bin-esm.js", [
    "test/fixtures/assert-arg-count-1.ts",
  ]);
  expect(result.stderr.toString()).toEqual(`\
Usage: assert-arg-count-1.ts

1 argument was expected but none were provided
`);
});

it("assert 2 arguments when 1 is provided", () => {
  const result = child_process.spawnSync("./node_modules/ts-node/dist/bin-esm.js", [
    "test/fixtures/assert-arg-count-2.ts",
    "--one",
  ]);
  expect(result.stderr.toString()).toEqual(`\
Usage: assert-arg-count-2.ts

2 arguments were expected but 1 was provided
`);
});

it("assert 2 arguments", () => {
  const result = child_process.spawnSync("./node_modules/ts-node/dist/bin-esm.js", [
    "test/fixtures/assert-arg-count-2.ts",
    "--one",
    "--two",
  ]);
  expect(result.stdout.toString()).toEqual(`\
First: --one
Second: --two
`);
});

it("assert arguments with custom error message", () => {
  const result = child_process.spawnSync("./node_modules/ts-node/dist/bin-esm.js", [
    "test/fixtures/assert-arg-count-3-error.ts",
    "--one",
  ]);
  expect(result.stderr.toString()).toEqual(`\
Usage: assert-arg-count-3-error.ts

Not enough arguments!
`);
});

it("parses args correctly", () => {
  const result = child_process.spawnSync("./node_modules/ts-node/dist/bin-esm.js", [
    "test/fixtures/reflect-args.ts",
    "a",
    "b",
    "--foo",
    "--hello=world",
  ]);
  expect(result.stdout.toString()).toEqual(`\
First four argument values:
a
b
--foo
--hello=world
JSON.stringify(args):
["a","b","--foo","--hello=world"]
args.foo: true
args.hello: world
`);
});
