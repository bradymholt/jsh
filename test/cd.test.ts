import "../src/index";
import * as path from "path";

it("cd changes the directory", () => {
  const currentCwd = process.cwd();
  const newCwd = path.resolve(currentCwd, "test/fixtures");
  try {
    cd(newCwd);
    expect(process.cwd()).toEqual(newCwd);
  } finally {
    cd(currentCwd);
  }
});
