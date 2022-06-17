import "../src/index";

it("should return environment variable value", () => {
  expect((<any>global).$HOME).toEqual(process.env.HOME);
});

it("assert returns environment variable value", () => {
  expect(env.assert("HOME")).toEqual(process.env.HOME);
});

it("asserts an array of variables", () => {
  expect(env.assert(["HOME"])).toEqual(expect.arrayContaining([process.env.HOME]));
});

it("allows accessing vars from env object", () => {
  expect(env["HOME"]).toEqual(process.env.HOME);
  expect(env.HOME).toEqual(process.env.HOME);
});

it("calls printUsageAndExit when asserting env that does not exist", () => {
  const exitSpy = jest.spyOn<any, any>(global, "exit").mockImplementation(() => {});
  const printAndExitSpy = jest.spyOn<any, any>(usage, "printAndExit").mockImplementation();
  try {
    env.assert("DOES_NOT_EXIST");
    expect(usage.printAndExit).toHaveBeenNthCalledWith(1, "Environment variable must be set: DOES_NOT_EXIST", 1);
  } finally {
    exitSpy.mockRestore();
    printAndExitSpy.mockRestore();
  }
});
