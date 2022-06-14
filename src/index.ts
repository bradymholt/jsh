import { spawnSync } from "child_process";
import * as nodePath from "node:path";
import * as http from "http";
import * as https from "https";
import { URL } from "node:url";
import * as fs from "fs";
import * as path from "path";

export function setEntryScriptPath(scriptPath: string) {
  let scriptAbsolutePath = null;
  if (!scriptPath.startsWith("/")) {
    // scriptPath is a relative path so join with cwd to get absolute path
    scriptAbsolutePath = path.join(process.cwd(), scriptPath);
  } else {
    scriptAbsolutePath = scriptPath;
  }

  global.__filename = scriptAbsolutePath;
  global.$0 = path.basename(scriptAbsolutePath); // Set $0 to the name of the current script
  global.__dirname = nodePath.dirname(scriptAbsolutePath);
}
// By default, we will expect the entry script to be specified in second argument (`node myscript.js`).
setEntryScriptPath(nodePath.resolve(process.argv[1]));

global.dirname = path.dirname;
global.exit = process.exit;
/**
 * Echos error message and then exists with the specified exit code (defaults to 1)
 * @param errorMessage
 * @param exitCode
 */
const _error = (errorMessage: string, exitCode: number = 1) => {
  process.stderr.write(errorMessage + "\n");
  exit(exitCode);
};
global.error = _error;

// Usage
let defaultUsageMessage: string = `Usage: ${$0}`;
const _printUsageAndExit = (additionalMessage?: string, exitCode = 1): void => {
  error(`${defaultUsageMessage}${!!additionalMessage ? `\n\n${additionalMessage}` : ""}`, exitCode);
};

const _usage = (message: string, printAndExitIfHelpArgumentSpecified = true) => {
  defaultUsageMessage = message;

  if (printAndExitIfHelpArgumentSpecified && (process.argv.includes("--help") || process.argv.includes("-h"))) {
    _printUsageAndExit();
  }
};
/**
 * Prints the usage message and then exists with the specified exit code (defaults to 1)
 * @param additionalMessage
 * @param exitCode
 */
_usage.printAndExit = _printUsageAndExit;
global.usage = _usage;

// Arguments
type Arguments = Array<string> & {
  /**
   * Returns args as array (that can be destructured) and throws an error and exits if less than number of arguments specified were supplied
   * @param argCount
   * @param errorMessage
   * @param exitCode
   * @returns
   */
  assertCount(argCount: number, errorMessage?: string, exitCode?: boolean): string[];
} & {
  [argName: string]: string | boolean;
};
export function setupArguments(passedInArguments: Array<string>) {
  let _argsAny: any = passedInArguments;
  _argsAny.assertCount = (argCount: number, errorMessage?: string, exitCode = 1): string[] => {
    if (_argsAny.length < argCount) {
      const argErrorMessage =
        errorMessage ??
        `${argCount} argument${argCount == 1 ? "" : "s"} ${argCount == 1 ? "was" : "were"} expected but ${
          _argsAny.length == 0 ? "none" : _argsAny.length
        } ${_argsAny.length == 1 ? "was" : "were"} provided`;

      usage.printAndExit(argErrorMessage, exitCode);
      // We'll never get here
      return [];
    } else {
      return passedInArguments.slice(0, argCount);
    }
  };
  // Parse arguments and add properties to args object
  for (let i = 0; i < _argsAny.length; i++) {
    const currentArgValue = _argsAny[i];
    if (currentArgValue.startsWith("--") && currentArgValue.length > 2) {
      const match = currentArgValue.match(/\-\-(?<name>\w+)=?(?<value>\w*)/);
      if (match?.groups?.name) {
        if (match?.groups?.value) {
          // `--argument_name=value` format - will be accessible as args.argument_name == "value"
          _argsAny[match.groups.name] = match.groups.value;
        } else {
          // `--argument_name` format - will be accessible as args.argument_name == true
          _argsAny[match.groups.name] = true;
        }
      }
    }
  }

  global.args = _argsAny;

  // Alias arguments as $1, $2, etc.
  for (let i = 1; i <= Math.max(10, args.length); i++) {
    // $1 through $10, at a minimum, will be declared and have argument value or be set to undefined if not specified
    if (args.length >= i) {
      (<any>global)[`$${i}`] = args[i - 1];
    } else {
      (<any>global)[`$${i}`] = undefined;
    }
  }
}
// By default, we will expect the passed arguments to begin with process.argv[2] (`node myscript.js arg1 arg2`)
setupArguments(process.argv.slice(2));

// Environment variables
let _envAny: any = Object.getOwnPropertyNames(process.env).map((e) => process.env[e]);
function envVarAssert(envVars: string, throwIfEmpty: boolean, exitCode: number): string;
function envVarAssert(envVars: string[], throwIfEmpty: boolean, exitCode: number): string[];
function envVarAssert(
  envVars: string | string[],
  throwIfEmpty: boolean = false,
  exitCode: number = 1
): string | string[] {
  let envVarsIsArray = true;
  if (!Array.isArray(envVars)) {
    envVarsIsArray = false;
    envVars = [envVars];
  }
  const envVarValues: Array<string> = [];

  let missingVars: string[] = [];
  for (let envVar of envVars) {
    const val = process.env[envVar];
    if (val === undefined || (throwIfEmpty && val.length === 0)) {
      missingVars.push(envVar);
      continue;
    }

    envVarValues.push(val);
  }

  if (missingVars.length > 0) {
    usage.printAndExit(
      `Environment variable${missingVars.length > 1 ? "s" : ""} must be set: ${missingVars.join(", ")}`,
      exitCode
    );
  } else if (!envVarsIsArray) {
    return envVarValues[0]
  }

  return envVarValues;
}

_envAny.assert = envVarAssert;
const _env: {
  [envVar: string]: string;
} & {
  /**
   * Returns environment variable value and throws an error and exits if it is undefined
   * @param argCount
   * @param errorMessage
   * @param exitCode
   * @returns
   */
  assert(envVarName: string, exitCode?: number, throwIfEmpty?: boolean): string;
  assert(envVarName: string[], exitCode?: number, throwIfEmpty?: boolean): string[];
} = _envAny;
global.env = _env;
// Environmental variables prefixed with $
for (let p of Object.getOwnPropertyNames(process.env)) {
  (<any>global)[`$${p}`] = process.env[p];
}

// Echoing
/**
 * Prints content to stdout with newline. Multiple arguments can be passed, with the first used as the primary message and all additional used as substitution values
 * @param content
 * @param optionalArgs
 */
const _echo = (content: string, ...optionalArgs: any[]) => {
  console.log(content, ...optionalArgs);
};
/**
 * Prints yellow colored content to stdout with newline. Multiple arguments can be passed, with the first used as the primary message and all additional used as substitution values
 * @param content
 * @param optionalArgs
 */
_echo.yellow = (content: string) => {
  echo("\x1b[33m%s\x1b[0m", content);
};
/**
 * Prints green colored content to stdout with newline. Multiple arguments can be passed, with the first used as the primary message and all additional used as substitution values
 * @param content
 * @param optionalArgs
 */
_echo.green = (content: string) => {
  echo("\x1b[32m%s\x1b[0m", content);
};
/**
 * Prints red colored content to stdout with newline. Multiple arguments can be passed, with the first used as the primary message and all additional used as substitution values
 * @param content
 * @param optionalArgs
 */
_echo.red = (content: string) => {
  echo("\x1b[31m%s\x1b[0m", content);
};

global.echo = _echo;
global.printf = process.stdout.write;

/**
 * Sleeps synchronously for the specified number of milliseconds
 * @param ms
 */
const _sleep = (ms: number) => {
  const startPoint = new Date().getTime();
  while (new Date().getTime() - startPoint <= ms) {
    /* wait here */
  }
};
global.sleep = _sleep;

// Command execution
export class CommandError extends Error {
  public command: string;
  public stdout: string;
  public stderr: string;
  public status: number;

  constructor(command: string, stdout: string, stderr: string, status: number) {
    super(`Error running command: \`${command}\``);

    this.command = command;
    this.stdout = stdout;
    this.stderr = stderr;
    this.status = status;
  }

  toString(): string {
    return `${this.message}\n${this.stderr || this.stdout}`;
  }
}
/**
 * Runs a command and returns the stdout
 * @param command The command to run.
 * @param echoStdout If true will echo stdout of the command as it runs and not capture its output
 * @param echoCommand If true will echo the command before running it
 * @returns
 */
const _$ = (command: string, echoStdout: boolean = false, echoCommand = true): string => {
  if (echoCommand) {
    echo(command);
  }

  let result = spawnSync(command, [], {
    stdio: [0, echoStdout ? "inherit" : "pipe", echoStdout ? "inherit" : "pipe"],
    shell: $.shell ?? true,
    windowsHide: true,
    maxBuffer: $.maxBuffer,
    encoding: "utf-8",
  });

  const scrubOutput = (output: string) => {
    return output?.replace("/bin/sh: ", "").replace(/^\n|\n$/g, "") ?? "";
  };
  const stdout = scrubOutput(result.stdout);
  const stderr = scrubOutput(result.stderr);
  const status = result.status ?? 0;

  if (status != 0) {
    throw new CommandError(command, stdout, stderr, status);
  }

  return stdout;
};
/**
 * Runs a command and echo its stdout as it executes.  Stdout from the command is not captured.
 * @param command The command to run.
 * @param echoStdout If true will echo stdout of the command as it runs and not capture its output
 * @param echoCommand If true will echo the command before running it
 * @returns void
 */
_$.echo = (command: string, echoCommand = true): void => {
  _$(command, true, echoCommand);
};
/**
 * Runs a command and will not throw if the command returns a non-zero exit code.  Instead the stderr (or stdout if stderr is empty) will be returned.
 * @param command
 * @param pipe
 * @param echoCommand
 * @returns
 */
_$.noThrow = (command: string, pipe: boolean = false, echoCommand = true) => {
  try {
    return _$(command, pipe, echoCommand);
  } catch (err) {
    if (err instanceof CommandError) {
      return err.stderr || err.stdout;
    } else {
      // Unknown error so rethrow
      throw err;
    }
  }
};
/**
 * Runs a command without echoing it
 * @param command
 * @param pipe
 * @returns
 */
_$.quiet = (command: string, pipe: boolean = false) => {
  return _$(command, pipe, false);
};
/**
 * Runs a command and will retry up to maxTries if the command returns a non-zero exit code
 * @param cmd
 * @param maxTries
 * @param waitMillisecondsBeforeRetry
 * @param echoFailures
 * @param pipe
 * @param echoCommand
 * @returns
 */
_$.retry = (
  cmd: string,
  maxTries = 5,
  waitMillisecondsBeforeRetry = 5000,
  echoFailures = true,
  pipe: boolean = false,
  echoCommand = true
) => {
  return _retry<string>(() => _$(cmd, pipe, echoCommand), maxTries, waitMillisecondsBeforeRetry, echoFailures);
};
// Options
_$.shell = true;
_$.maxBuffer = 1024 * 1024 * 256 /* 256MB */;
global.$ = _$;
global.exec = _$.echo;

// HTTP
export interface IHttpRequestOptions {
  protocol: string;
  hostname: string;
  port: number;
  path: string;
  method: string;
  headers: NodeJS.Dict<string | string[]>;
  timeout: number;
}
export interface IHttpResponse<T> {
  data: T;
  headers: NodeJS.Dict<string | string[]>;
  statusCode: number | undefined;
  statusMessage: string | undefined;
  requestOptions: IHttpRequestOptions;
}
export class HttpRequestError<T> extends Error {
  public request: IHttpRequestOptions;
  public response: IHttpResponse<T> | null;

  constructor(message: string, request: IHttpRequestOptions, response: IHttpResponse<T> | null = null) {
    super(message);
    this.request = request;
    this.response = response;
  }

  get data() {
    return this.response?.data;
  }

  get statusCode() {
    return this.response?.statusCode;
  }

  get statusMessage() {
    return this.response?.statusMessage;
  }
}

export type HTTPMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Makes an asynchronous HTTP request and returns the response.   Will reject with an error if the response status code is not 2xx.
 * @param method
 * @param url
 * @param requestBody
 * @param headers
 * @returns IHttpResponse<T>
 */
const _http = <T>(
  method: HTTPMethod,
  url: string,
  requestBody: any = null,
  headers: any = {}
): Promise<IHttpResponse<T>> => {
  const parsedUrl = new URL(url);
  const isHTTPS = parsedUrl.protocol.startsWith("https");
  const requestOptions: IHttpRequestOptions = {
    protocol: parsedUrl.protocol,
    hostname: parsedUrl.hostname,
    port: !!parsedUrl.port ? Number(parsedUrl.port) : isHTTPS ? 443 : 80,
    path: parsedUrl.pathname,
    method,
    headers,
    timeout: _http.timeout,
  };

  const tryParseJson = (data: string) => {
    // Tries to parse JSON and returns parsed object if successful.  If not, returns false.
    if (!data) {
      return false;
    }

    try {
      return JSON.parse(data);
    } catch {
      return false;
    }
  };

  let requestBodyData = requestBody ?? "";
  if (typeof requestBody == "object") {
    // Add JSON headers if needed
    headers["Content-Type"] = headers["Content-Type"] || "application/json; charset=utf-8";
    headers["Accept"] = headers["Accept"] || "application/json";

    requestBodyData = JSON.stringify(requestBody);
  }

  let request = http.request;
  if (isHTTPS) {
    request = https.request;
  }

  return new Promise<IHttpResponse<T>>((resolve, reject) => {
    const req = request(requestOptions, (res) => {
      let responseBody: any = "";

      res.on("data", (chunk) => {
        responseBody += chunk;
      });

      res.on("end", () => {
        const jsonData = tryParseJson(responseBody);
        const responseData = jsonData || responseBody;

        const response: IHttpResponse<T> = {
          data: responseData,
          headers: res.headers,
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          requestOptions: requestOptions,
        };

        if (!response.statusCode?.toString().startsWith("2")) {
          const errorMessage = response.statusMessage ?? "Request Error";
          reject(new HttpRequestError<T>(errorMessage, response.requestOptions, response));
        } else {
          resolve(response);
        }
      });
    }).on("error", (err) => {
      reject(new HttpRequestError<T>(err.message, requestOptions));
    });

    req.write(requestBodyData);
    req.end();
  });
};
_http.timeout = 120000; // 2 minutes
global.http = _http;

/**
 * Makes a synchronous HTTP request and returns the response.   Will not throw an error if the response status code is not 2xx.
 * @param method
 * @param url
 * @param requestBody
 * @param headers
 * @returns
 */
_http.noThrow = async <T>(
  method: HTTPMethod,
  url: string,
  requestBody: any = null,
  headers: any = {}
): Promise<IHttpResponse<T>> => {
  try {
    return await _http<T>(method, url, requestBody, headers);
  } catch (err) {
    if (err instanceof HttpRequestError) {
      return err.response as IHttpResponse<T>;
    } else {
      // Unknown error so rethrow
      throw err;
    }
  }
};
/**
 * Makes a HTTP request and returns the response.   Will retry up to maxTries if an error is thrown because the status code is not 2xx.
 * @param method
 * @param url
 * @param requestBody
 * @param headers
 * @param maxTries
 * @param waitMillisecondsBeforeRetry
 * @param echoFailures
 * @returns
 */
_http.retry = async <T>(
  method: HTTPMethod,
  url: string,
  requestBody: any = null,
  headers: any = {},
  maxTries = 5,
  waitMillisecondsBeforeRetry = 5000,
  echoFailures = true
) => {
  return _retry<Promise<IHttpResponse<T>>>(
    () => _http<T>(method, url, requestBody, headers),
    maxTries,
    waitMillisecondsBeforeRetry,
    echoFailures
  );
};

/**
 * Makes a GET HTTP request and returns the response data.  Will throw an error if the response status code is not 2xx.
 * @param url
 * @param headers
 * @returns
 */
_http.get = async <T>(url: string, headers: any = {}) => {
  const response = await _http<T>("GET", url, null, headers);
  return response.data;
};
/**
 * Makes a POST HTTP request and returns the response data.  Will throw an error if the response status code is not 2xx.
 * @param url
 * @param headers
 * @returns
 */
_http.post = async <T>(url: string, data: any, headers: any = {}) => {
  const response = await _http<T>("POST", url, data, headers);
  return response.data;
};
/**
 * Makes a PUT HTTP request and returns the response data.  Will throw an error if the response status code is not 2xx.
 * @param url
 * @param headers
 * @returns
 */
_http.put = async <T>(url: string, data: any, headers: any = {}) => {
  const response = await _http<T>("PUT", url, data, headers);
  return response.data;
};
/**
 * Makes a PATCH HTTP request and returns the response data.  Will throw an error if the response status code is not 2xx.
 * @param url
 * @param headers
 * @returns
 */
 _http.patch = async <T>(url: string, data: any, headers: any = {}) => {
  const response = await _http<T>("PATCH", url, data, headers);
  return response.data;
};
/**
 * Makes a DELETE HTTP request and returns the response data.  Will throw an error if the response status code is not 2xx.
 * @param url
 * @param headers
 * @returns
 */
_http.delete = async <T>(url: string, data: any, headers: any = {}) => {
  const response = await _http<T>("DELETE", url, data, headers);
  return response.data;
};
global.http = _http;

// File system
global.cd = process.chdir;

/**
 * Returns `true` if the path exists, `false` otherwise.
 * @param path
 * @returns
 */
const _exists = (path: string) => {
  return fs.existsSync(path);
};
global.exists = _exists;

/**
 * Returns `true` if the path exists and it is a directory, `false` otherwise.
 * @param path
 * @returns
 */
const _dirExists = (path: string) => {
  return exists(path) && fs.statSync(path).isDirectory();
};
global.dirExists = _dirExists;

/**
 * Create a directory if it does not exist.
 * @param path
 */
const _mkDir = (path: string) => {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  }
};
global.mkDir = _mkDir;

/**
 * Removes a file or directory if it exists.
 * @param path
 * @param recursive
 */
const _rm = (path: string, recursive: boolean = true) => {
  if (fs.existsSync(path)) {
    fs.rmSync(path, { recursive });
  }
};
global.rm = _rm;
global.rmDir = _rm;

/**
 * Reads a file and returns its contents.
 * @param path
 * @param encoding
 * @returns
 */
const _readFile = (path: string, encoding: BufferEncoding = "utf-8") => {
  return fs.readFileSync(path, { encoding });
};
global.readFile = _readFile;
global.cat = _readFile;

/**
 * Writes contents to a file, replacing the file if it exists.
 * @param path
 * @param contents
 * @param encoding
 */
const _writeFile = (path: string, contents: string, encoding: BufferEncoding = "utf-8") => {
  fs.writeFileSync(path, contents, { encoding });
};
global.writeFile = _writeFile;

// Error handling
const handleUnhandledError = (err: Error) => {
  process.stderr.write(err.message + "\n");
  if (err instanceof CommandError) {
    exit(err.status ?? 1);
  }
};
process.on("unhandledRejection", handleUnhandledError);
process.on("uncaughtException", handleUnhandledError);

const _retry = <T>(tryFunction: () => T, maxTries = 5, waitMillisecondsBeforeRetry = 5000, echoFailures = true): T => {
  try {
    return tryFunction();
  } catch (e: any) {
    if (echoFailures) {
      echo(e);
      echo(`Will retry in ${waitMillisecondsBeforeRetry} milliseconds...`);
    }

    if (maxTries > 0) {
      sleep(waitMillisecondsBeforeRetry);

      return _retry(tryFunction, maxTries - 1);
    }
    throw e;
  }
};

declare global {
  var __filename: string;
  var __dirname: string;
  var dirname: typeof path.dirname;
  var exit: typeof process.exit;
  var error: typeof _error;
  var printf: typeof process.stdout.write;
  var sleep: typeof _sleep;
  var echo: typeof _echo;
  var $: typeof _$;
  var exec: typeof _$.echo;
  var http: typeof _http;
  var cd: typeof process.chdir;
  var exists: typeof _exists;
  var dirExists: typeof _dirExists;
  var mkDir: typeof _mkDir;
  var rm: typeof _rm;
  var rmDir: typeof _rm;
  var readFile: typeof _readFile;
  var cat: typeof _readFile;
  var writeFile: typeof _writeFile;
  var env: typeof _env;
  var args: Arguments;
  var $0: string;
  var $1: string;
  var $2: string;
  var $3: string;
  var $4: string;
  var $5: string;
  var $6: string;
  var $7: string;
  var $8: string;
  var $9: string;
  var $10: string;
  var usage: typeof _usage;
}
