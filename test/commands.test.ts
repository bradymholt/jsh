import * as jsh from "../src/index";
import * as child_process from "child_process";

it("should return the output of a command", () => {
  const [file, text] = ["/tmp/temp.txt", "hello there"];
  writeFile(file, text);
  expect(readFile(file)).toEqual(text);
});

it("should trim leading and trailing newline characters", () => {
  let currentDirectory = $(`pwd`);
  expect(currentDirectory).toEqual(process.cwd());
});

it("should throw an error with non zero exit code", () => {
  expect(() => {
    $("unknown_command");
  }).toThrow(jsh.CommandError);
});

it("writes to stderr when there is an error", () => {
  let result = child_process.spawnSync("test/fixtures/run-fixture.sh", ["test/fixtures/error-exit-code.ts"]);
  expect(result.stderr.toString()).toEqual("This script returns an error status code\n");
});

it("should return CommandError with expected values", () => {
  let commandError: jsh.CommandError = null;
  try {
    $("unknown_command");
  } catch (err) {
    commandError = err;
  }

  expect(commandError.message).toContain("not found");
  expect(commandError.command).toEqual("unknown_command");
  expect(commandError.stderr).toContain("not found");
  expect(commandError.stdout).toEqual("");
  expect(commandError.status).toEqual(127);
});

it("$.noThrow should not throw with non zero exit code", () => {
  expect($.noThrow("unknown_command")).toContain("not found");
});

it("$.retry should retry when first call results in error", () => {
  const spawnSyncSpy = jest.spyOn(child_process, "spawnSync");
  const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});

  try {
    spawnSyncSpy.mockImplementationOnce(() => {
      throw new Error("error!");
    });
    expect($.retry("echo 'test'", 5, 500)).toEqual("test");
    expect(spawnSyncSpy).toBeCalledTimes(2);
    expect(consoleLogSpy).toBeCalledTimes(4);
  } finally {
    spawnSyncSpy.mockRestore();
    consoleLogSpy.mockRestore();
  }
});
