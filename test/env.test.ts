import "../src/index";

it("should return environment variable value", () => {
  expect((<any>global).$HOME).toEqual(process.env.HOME);
});

it("assert returns environment variable value", () => {
  expect(env.assert("HOME")).toEqual(process.env.HOME);
});

it("calls printUsageAndExit when asserting env that does not exist", () => {
  const exitSpy = jest.spyOn<any, any>(global, "exit").mockImplementation(() => {});
  const printAndExitSpy = jest.spyOn<any, any>(usage, "printAndExit").mockImplementation();
  try {
    env.assert("DOES_NOT_EXIST");
    expect(usage.printAndExit).toHaveBeenNthCalledWith(1, "Environment variable DOES_NOT_EXIST is not set", 1);
  } finally {
    exitSpy.mockRestore();
    printAndExitSpy.mockRestore();
  }
});
