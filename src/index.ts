import { spawnSync } from "child_process";
import * as stream from "stream";
import * as os from "os";
import * as nodePath from "node:path";
import * as http from "http";
import * as https from "https";
import { URL } from "node:url";
import * as zlib from "zlib";
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
setEntryScriptPath(nodePath.resolve(process.argv[1] ?? ""));

const ECHO_YELLOW_FORMAT = "\x1b[33m%s\x1b[0m";
const ECHO_GREEN_FORMAT = "\x1b[32m%s\x1b[0m";
const ECHO_RED_FORMAT = "\x1b[31m%s\x1b[0m";

global.dirname = path.dirname;
global.exit = process.exit;
/**
 * Echos error message to stdout and then exits with the specified exit code (defaults to 1)
 * @param error The error message string or Error object to print
 * @param exitCode
 */
const _error = (error: string | Error, exitCode: number = 1) => {
  console.error(ECHO_RED_FORMAT, error); // Will print to stderr
  exit(exitCode);
};
global.error = _error;

// Usage
let defaultUsageMessage: string = `Usage: ${$0}`;
const _printUsageAndExit = (exitCode = 1, additionalMessage?: string): void => {
  if (exitCode == 0) {
    // If exit code is 0, we'll simply print usage message (along with additional message if supplied) to stdout
    echo(`${defaultUsageMessage}${!!additionalMessage ? `\n\n${additionalMessage}` : ""}`);
  } else {
    // If exit code is <> 0, we'll print usage message (along with red colored additional message if supplied) to stderr
    console.error(defaultUsageMessage);
    if (additionalMessage) {
      console.error(`\n${ECHO_RED_FORMAT}`, additionalMessage);
    }
  }

  exit(exitCode);
};

const _usage = (message: string, printAndExitIfHelpArgumentSpecified = true) => {
  defaultUsageMessage = message?.replace(/\n+$/, ""); // Trailing newlines will be handled internally so remove them if present

  if (printAndExitIfHelpArgumentSpecified && (process.argv.includes("--help") || process.argv.includes("-h"))) {
    _printUsageAndExit(0);
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
  assertCount(argCount: number, errorMessage?: string, exitCode?: number): string[];
} & {
  [argName: string]: string | boolean;
};
export function setupArguments(passedInArguments: Array<string>) {
  const _args: Arguments = passedInArguments as any;
  _args.assertCount = (argCount: number, errorMessage?: string, exitCode = 1): string[] => {
    if (_args.length < argCount) {
      const argErrorMessage =
        errorMessage ??
        `${argCount} argument${argCount == 1 ? "" : "s"} ${argCount == 1 ? "was" : "were"} expected but ${
          _args.length == 0 ? "none" : _args.length
        } ${_args.length == 1 ? "was" : "were"} provided`;

      usage.printAndExit(exitCode, argErrorMessage);
      // We'll never get here
      return [];
    } else {
      return passedInArguments.slice(0, argCount);
    }
  };
  // Parse arguments and add properties to args object
  for (let i = 0; i < _args.length; i++) {
    const currentArgValue = _args[i];
    if (currentArgValue.startsWith("-") && currentArgValue.length >= 2) {
      const match = currentArgValue.match(/\-\-?(?<name>\w+)=?(?<value>\w*)/);
      if (match?.groups?.name) {
        if (match?.groups?.value) {
          // `--argument_name=value` format - will be accessible as args.argument_name == "value"
          _args[match.groups.name] = match.groups.value;
        } else {
          // `--argument_name` format - will be accessible as args.argument_name == true
          _args[match.groups.name] = true;
        }
      }
    }
  }

  global.args = _args;

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
type Environment = {
  [envVar: string]: string;
} & {
  /**
   * Returns environment variable value and throws an error and exits if it is undefined
   * @param argCount
   * @param errorMessage
   * @param exitCode
   * @returns
   */
  assert(envVarName: string, throwIfEmpty?: boolean, exitCode?: number): string;
  assert(envVarName: string[], throwIfEmpty?: boolean, exitCode?: number): string[];
};
function envVarAssert(envVars: string, throwIfEmpty?: boolean, exitCode?: number): string;
function envVarAssert(envVars: string[], throwIfEmpty?: boolean, exitCode?: number): string[];
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
      exitCode,
      `Environment variable${missingVars.length > 1 ? "s" : ""} must be set: ${missingVars.join(", ")}`
    );
  } else if (!envVarsIsArray) {
    return envVarValues[0];
  }

  return envVarValues;
}
const _env: Environment = { ...process.env } as any;
_env.assert = envVarAssert;
global.env = _env;
// Environmental variables prefixed with $
for (let p of Object.getOwnPropertyNames(process.env)) {
  (<any>global)[`$${p}`] = process.env[p];
}

// Echoing
/**
 * Prints content to stdout with a trailing newline. Multiple arguments can be passed, with the first used as the primary message and all additional used as substitution values
 * @param content
 * @param optionalArgs
 */
const _echo = (content: string | Error, ...optionalArgs: any[]) => {
  console.log(content, ...optionalArgs);
};
/**
 * Prints yellow colored content to stdout with a trailing newline. Multiple arguments can be passed, with the first used as the primary message and all additional used as substitution values
 * @param content
 * @param optionalArgs
 */
_echo.yellow = (content: string | Error, ...optionalArgs: any[]) => {
  echo(ECHO_YELLOW_FORMAT, content, ...optionalArgs);
};
/**
 * Prints green colored content to stdout with a trailing newline. Multiple arguments can be passed, with the first used as the primary message and all additional used as substitution values
 * @param content
 * @param optionalArgs
 */
_echo.green = (content: string | Error, ...optionalArgs: any[]) => {
  echo(ECHO_GREEN_FORMAT, content, ...optionalArgs);
};
/**
 * Prints red colored content to stdout with a trailing newline. Multiple arguments can be passed, with the first used as the primary message and all additional used as substitution values
 * @param content
 * @param optionalArgs
 */
_echo.red = (content: string | Error, ...optionalArgs: any[]) => {
  echo(ECHO_RED_FORMAT, content, ...optionalArgs);
};

/**
 * Prints content *without* a trailing newline.
 * @param content
 * @returns
 */
const _printf = function (content: string) {
  return process.stdout.write(content, "utf8");
};

global.echo = _echo;
global.printf = _printf;

/**
 * Prints a text prompt, waits for user input, and returns the input.
 * @param prompt A string or function that prompts the user for input.
 *   If a string is provided, echo() will be called with it.
 *   If a function is provided, the function will be called before prompting the user
 
*    Examples:
       const name = prompt("What's your name?");
       const name = prompt(() => { printf("What's your name? "); });
       const name = prompt(() => { echo.yellow("What's your name? "); });
});
 */
const _prompt = function (prompt: string | (() => void)): string {
  const promptShellCommand =
    os.platform() == "win32" ? "cmd /V:ON /C set /p RESPONSE= && echo !RESPONSE!'" : "read RESPONSE; echo $RESPONSE";

  if (typeof prompt === "function") {
    prompt();
  } else {
    echo(prompt);
  }

  const output = $(promptShellCommand, { echoCommand: false });
  return output;
};

global.prompt = _prompt;
global.read = _prompt;

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

export interface ICommandOptions {
  /**
   * If true will capture stdout from command and return it.  If false, stdout will not be captured but only printed to the console.  Default: true
   */
  captureStdout?: boolean;
  /**
   * If true will echo the command itself before running it
   */
  echoCommand?: boolean;
  /**
   * If set to true, will not throw if the command returns a non-zero exit code
   */
  noThrow?: boolean;
  /**
   *  In milliseconds the maximum amount of time the process is allowed to run
   */
  timeout?: number;
  shell?: string | boolean | undefined;
  maxBuffer?: number;
}
export class CommandError extends Error {
  public command: string;
  public stdout: string;
  public stderr: string;
  public status: number;

  constructor(command: string, stdout: string, stderr: string, status: number) {
    super(stderr || stdout);

    this.command = command;
    this.stdout = stdout;
    this.stderr = stderr;
    this.status = status;
  }
}
/**
 * Runs a command and returns the stdout
 * @param command The command to run.
 * @param options
 * @returns
 */
const _$ = (command: string, options: ICommandOptions = {}): string => {
  // Set default options for those not provided
  options = Object.assign(
    {
      captureStdout: true,
      echoCommand: true,
      noThrow: false,
      shell: true,
      maxBuffer: 1024 * 1024 * 256 /* 256MB */,
    } as ICommandOptions,
    options
  );

  if (options.echoCommand) {
    echo(command);
  }

  let result = spawnSync(command, [], {
    stdio: [0, options.captureStdout ? "pipe" : "inherit", options.captureStdout ? "pipe" : "inherit"],
    shell: options.shell,
    windowsHide: true,
    maxBuffer: options.maxBuffer,
    encoding: "utf-8",
    timeout: options.timeout,
  });

  const scrubOutput = (output: string) => {
    return output?.replace("/bin/sh: ", "").replace(/^\n|\n$/g, "") ?? "";
  };
  const stdout = scrubOutput(result.stdout);
  const stderr = scrubOutput(result.stderr);
  const status = result.status ?? 0;

  if (status != 0) {
    if (options.noThrow === true) {
      return stderr || stdout;
    } else {
      throw new CommandError(command, stdout, stderr, status);
    }
  } else {
    return stdout;
  }
};
type IExecCommandOptions = Omit<ICommandOptions, "echoStdout">;
/**
 * Runs a command and echos its stdout as it executes.  Stdout from the command is not captured.
 * @param command The command to run
 * @param options
 * @returns void
 */
const _exec = (command: string, options: IExecCommandOptions = {}): void => {
  _$(command, Object.assign({ captureStdout: false } as ICommandOptions, options) as ICommandOptions);
};

global.$ = _$;
global.exec = _exec;

// HTTP
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type HttpData = object | stream.Readable | null;
export interface IHttpRawRequestOptions {
  protocol: string;
  hostname: string;
  port: number;
  path: string;
  url: string;
  method: string;
  headers?: NodeJS.Dict<string | string[]>;
  /**
   * The number of milliseconds of inactivity before a socket is presumed to have timed out.
   */
  timeout?: number;
}
export type IHttpRequestOptions = Pick<Partial<IHttpRawRequestOptions>, "headers" | "timeout"> & {
  /**
   * If set to true, will not throw if the response status code is not 2xx
   */
  noThrow?: boolean;
};
export interface IHttpResponse<T> {
  data: T;
  body: string;
  headers: NodeJS.Dict<string | string[]>;
  statusCode: number | undefined;
  statusMessage: string | undefined;
  requestOptions: IHttpRawRequestOptions;
}
export class HttpRequestError<T> extends Error {
  public request: IHttpRawRequestOptions;
  public response: IHttpResponse<T> | null;

  constructor(message: string, request: IHttpRawRequestOptions, response: IHttpResponse<T> | null = null) {
    const errorMessage = !!response
      ? `${response.statusCode} ${response.statusMessage}\n${request.method} ${request.url}`
      : `${message}\n${request.method} ${request.url}`;
    super(errorMessage);
    this.request = request;
    this.response = response;
  }

  get data() {
    return this.response?.data;
  }

  get body() {
    return this.response?.body;
  }

  get statusCode() {
    return this.response?.statusCode;
  }

  get statusMessage() {
    return this.response?.statusMessage;
  }
}

/**
 * Makes an asynchronous HTTP request and returns the response.   Will reject with an error if the response status code is not 2xx.
 * @param method
 * @param url
 * @param data
 * @param headers
 * @returns IHttpResponse<T>
 */
const _http = <T>(
  method: HttpMethod,
  url: string,
  data: HttpData = null,
  options: IHttpRequestOptions = {}
): Promise<IHttpResponse<T>> => {
  const parsedUrl = new URL(url);
  const isHTTPS = parsedUrl.protocol.startsWith("https");

  const rawRequestOptions: IHttpRawRequestOptions = Object.assign(
    {
      protocol: parsedUrl.protocol,
      hostname: parsedUrl.hostname,
      port: !!parsedUrl.port ? Number(parsedUrl.port) : isHTTPS ? 443 : 80,
      path: parsedUrl.pathname + parsedUrl.search,
      url,
      method,
      headers: {},
      timeout: 120000 /* 2 minutes */,
    },
    options
  );

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

  if (!!options.headers) {
    options.headers["Accept"] = options.headers["Accept"] || "*/*";
    options.headers["Accept-Encoding"] = options.headers["Accept-Encoding"] || "gzip";
    options.headers["Connection"] = options.headers["Connection"] || "close";
    options.headers["User-Agent"] = options.headers["User-Agent"] || "jsh";
    options.headers["Host"] = options.headers["Host"] || `${rawRequestOptions.hostname}:${rawRequestOptions.port}`;
  }

  let requestBodyData = data ?? "";

  if (!(data instanceof stream.Readable) && typeof data == "object") {
    // Add JSON headers if needed
    if (!!options.headers) {
      options.headers["Content-Type"] = options.headers["Content-Type"] || "application/json; charset=utf-8";
      options.headers["Accept"] = options.headers["Accept"] || "application/json";
    }

    requestBodyData = JSON.stringify(data);
  }

  let request = http.request;
  if (isHTTPS) {
    request = https.request;
  }

  return new Promise<IHttpResponse<T>>((resolve, reject) => {
    const onRequestError = (errorMessage: string) => {
      reject(new HttpRequestError<T>(errorMessage, rawRequestOptions));
    };

    const req = request(rawRequestOptions, (res) => {
      let responseBody: any = "";

      const onResponseEnd = () => {
        const jsonData = tryParseJson(responseBody);
        const responseData = jsonData || responseBody;

        const response: IHttpResponse<T> = {
          data: responseData,
          body: responseBody,
          headers: res.headers,
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          requestOptions: rawRequestOptions,
        };

        if (!response.statusCode?.toString().startsWith("2")) {
          if (options.noThrow === true) {
            resolve(response);
          } else {
            const errorMessage = response.statusMessage ?? "Request Error";
            reject(new HttpRequestError<T>(errorMessage, rawRequestOptions, response));
          }
        } else {
          resolve(response);
        }
      };

      if (res.headers["content-encoding"]?.includes("gzip")) {
        // Response is gzipped so decompress it
        const gunzip = zlib.createGunzip();
        res.pipe(gunzip);

        gunzip
          .on("data", function (chunk) {
            responseBody += chunk;
          })
          .on("end", () => {
            onResponseEnd();
          })
          .on("error", (err) => {
            onRequestError(err.message);
          })
          .on("timeout", () => {
            onRequestError("Timeout");
          });
      } else {
        // Response is not gzipped
        res
          .on("data", (chunk) => {
            responseBody += chunk;
          })
          .on("end", () => {
            onResponseEnd();
          });
      }
    })
      .on("error", (err) => {
        onRequestError(err.message);
      })
      .on("timeout", () => {
        onRequestError("Timeout");
      });

    if (data instanceof stream.Readable) {
      data.pipe(req);
    } else {
      req.write(requestBodyData);
      req.end();
    }
  });
};
global.http = _http;

/**
 * Makes a GET HTTP request and returns the response data.  Will throw an error if the response status code is not 2xx.
 * @param url
 * @param headers
 * @returns
 */
_http.get = async <T>(url: string, headers: { [name: string]: string } = {}) => {
  const response = await _http<T>("GET", url, null, { headers });
  return response.data;
};
/**
 * Makes a POST HTTP request and returns the response data.  Will throw an error if the response status code is not 2xx.
 * @param url
 * @param headers
 * @returns
 */
_http.post = async <T>(url: string, data: HttpData, headers: { [name: string]: string } = {}) => {
  const response = await _http<T>("POST", url, data, { headers });
  return response.data;
};
/**
 * Makes a PUT HTTP request and returns the response data.  Will throw an error if the response status code is not 2xx.
 * @param url
 * @param headers
 * @returns
 */
_http.put = async <T>(url: string, data: HttpData, headers: { [name: string]: string } = {}) => {
  const response = await _http<T>("PUT", url, data, { headers });
  return response.data;
};
/**
 * Makes a PATCH HTTP request and returns the response data.  Will throw an error if the response status code is not 2xx.
 * @param url
 * @param headers
 * @returns
 */
_http.patch = async <T>(url: string, data: HttpData, headers: { [name: string]: string } = {}) => {
  const response = await _http<T>("PATCH", url, data, { headers });
  return response.data;
};
/**
 * Makes a DELETE HTTP request and returns the response data.  Will throw an error if the response status code is not 2xx.
 * @param url
 * @param headers
 * @returns
 */
_http.delete = async <T>(url: string, data: HttpData, headers: { [name: string]: string } = {}) => {
  const response = await _http<T>("DELETE", url, data, { headers });
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
global.mkdir = _mkDir;

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
global.rmdir = _rm;

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
  error(err, err instanceof CommandError ? err.status : 1);
};
process.on("unhandledRejection", handleUnhandledError);
process.on("uncaughtException", handleUnhandledError);

declare global {
  var __filename: string;
  var __dirname: string;
  var dirname: typeof path.dirname;
  var exit: typeof process.exit;
  var error: typeof _error;
  var echo: typeof _echo;
  var printf: typeof _printf;
  var prompt: typeof _prompt;
  var read: typeof _prompt;
  var sleep: typeof _sleep;
  var $: typeof _$;
  var exec: typeof _exec;
  var http: typeof _http;
  var cd: typeof process.chdir;
  var exists: typeof _exists;
  var dirExists: typeof _dirExists;
  var mkDir: typeof _mkDir;
  var mkdir: typeof _mkDir;
  var rm: typeof _rm;
  var rmDir: typeof _rm;
  var rmdir: typeof _rm;
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
