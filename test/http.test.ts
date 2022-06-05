import * as jsh from "../src/index";
import * as fakeweb from "node-fakeweb";

it("should throw an error when host does not exist", async () => {
  expect.assertions(3);
  try {
    await http.get("https://unknown.ts");
  } catch (err) {
    expect(err instanceof jsh.HttpRequestError).toBeTruthy();
    if (err instanceof jsh.HttpRequestError) {
      expect(err.request.hostname).toBe("unknown.ts");
      expect(err.message).toBe("getaddrinfo ENOTFOUND unknown.ts");
    }
  }
});

it("should return text", async () => {
  fakeweb.registerUri({ uri: "https://hellofake.ts/", body: "Hello!" });
  const response = await http.get("https://hellofake.ts/");
  expect(response).toBe("Hello!");
});

it("should return parsed JSON object", async () => {
  fakeweb.registerUri({ uri: "https://jsonfake.ts/", body: `{ "text": "Hello 1,2,3", "status": true }` });
  const response = await http.get("https://jsonfake.ts/");
  expect(response).toEqual({ text: "Hello 1,2,3", status: true });
});

it("should throw error on status not in 200 range", async () => {
  expect.assertions(3);
  fakeweb.registerUri({ uri: "http://errorserver.ts/", body: `{ "text": "Error" }`, statusCode: 500 });
  try {
    await http.get("http://errorserver.ts/");
  } catch (err) {
    expect(err instanceof jsh.HttpRequestError).toBeTruthy();
    if (err instanceof jsh.HttpRequestError) {
      expect(err.statusCode).toBe(500);
      expect(err.data).toEqual({ text: "Error" });
    }
  }
});

it("should not throw error when .noThrow is called", async () => {
  expect.assertions(2);
  fakeweb.registerUri({ uri: "http://errorserver.ts/", body: `{ "text": "Error" }`, statusCode: 500 });
  const response = await http.noThrow("GET", "http://errorserver.ts/");
  expect(response.statusCode).toBe(500);
  expect(response.data).toEqual({ text: "Error" });
});

it("should PUT data", async () => {
  fakeweb.registerUri({ uri: "https://putfake.ts/", body: `{ "text": "It worked", "status": true }` });
  const response = await http.put("https://putfake.ts/", { param: "one" });
  expect(response).toEqual({ text: "It worked", status: true });
});
