import "../src/index";

it("readFile reads a file", () => {
  const contents = readFile("test/fixtures/text.txt");
  expect(contents).toEqual("This is some text");
});

it("readFile throws an error when file does not exist", () => {
  expect(() => {
    readFile("test/fixtures/does_not_exist.txt");
  }).toThrow();
});

it("writeFile writes to a file", () => {
  const filePath = "/tmp/temp.txt";
  const contentToWrite = "This is some content";
  writeFile(filePath, contentToWrite);
  const contents = readFile(filePath);
  expect(contents).toEqual("This is some content");
});

it("writeFile overwrites a file each time", () => {
  const filePath = "/tmp/temp-2.txt";
  const contentToWrite = "This is some content";
  // Write to a file twice
  try {
    writeFile(filePath, contentToWrite);
    writeFile(filePath, contentToWrite);

    const contents = readFile(filePath);
    expect(contents).toEqual("This is some content");
  } finally {
    rm(filePath);
  }
});

it("exists finds a file", () => {
  expect(exists("test/fixtures/text.txt")).toBe(true);
});

it("exists does not find a file", () => {
  expect(exists("test/fixtures/does-not-exist.txt")).toBe(false);
});

it("dirExists finds a directory", () => {
  expect(exists("test/fixtures")).toBe(true);
});

it("dirExists does not find a directory", () => {
  expect(exists("test/does-not-exist")).toBe(false);
});

it("mkDir works", () => {
  const dirPath = "/tmp/new-dir";
  expect(dirExists(dirPath)).toBe(false);
  try {
    expect(mkDir(dirPath)).toBe(void 0);
    expect(dirExists(dirPath)).toBe(true);
  } finally {
    rmDir(dirPath);
  }
});
