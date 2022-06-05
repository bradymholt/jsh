import "../src/index";

it("echo", () => {
  const testText = "testing 1, 2, 3";
  echo(testText);
  expect(console.log).toBeCalledWith(testText);
});

it("echo.yellow", () => {
  const testText = "testing 1, 2, 3";
  echo.yellow(testText);
  expect(console.log).toHaveBeenNthCalledWith(1, "\x1b[33m%s\x1b[0m", testText);
});

it("echo.green", () => {
  const testText = "testing 1, 2, 3";
  echo.green(testText);
  expect(console.log).toHaveBeenNthCalledWith(1, "\x1b[32m%s\x1b[0m", testText);
});

it("echo.red", () => {
  const testText = "testing 1, 2, 3";
  echo.red(testText);
  expect(console.log).toHaveBeenNthCalledWith(1, "\x1b[31m%s\x1b[0m", testText);
});

let consoleLogSpy = null;

beforeEach(() => {
  consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
});

afterEach(() => {
  consoleLogSpy.mockRestore();
});
