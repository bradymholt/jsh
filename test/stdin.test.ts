import "../src/index";
import * as child_process from "child_process";

it("should read stdin", () => {
  let result = child_process.spawnSync("test/fixtures/run-fixture.sh", ["test/fixtures/echo-stdin.ts"], {
    input: "Test 123",
  });
  expect(result.stdout.toString()).toEqual("Test 123\n");
});
