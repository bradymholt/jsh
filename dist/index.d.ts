/// <reference types="node" />
import * as stream from "stream";
import * as path from "path";
export declare function setEntryScriptPath(scriptPath: string): void;
/**
 * Echos error message and then exists with the specified exit code (defaults to 1)
 * @param errorMessage
 * @param exitCode
 */
declare const _error: (errorMessage: string, exitCode?: number) => never;
declare const _usage: {
    (message: string, printAndExitIfHelpArgumentSpecified?: boolean): void;
    /**
     * Prints the usage message and then exists with the specified exit code (defaults to 1)
     * @param additionalMessage
     * @param exitCode
     */
    printAndExit: (additionalMessage?: string | undefined, exitCode?: number) => void;
};
declare type Arguments = Array<string> & {
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
export declare function setupArguments(passedInArguments: Array<string>): void;
declare const _env: {
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
/**
 * Prints content to stdout with newline. Multiple arguments can be passed, with the first used as the primary message and all additional used as substitution values
 * @param content
 * @param optionalArgs
 */
declare const _echo: {
    (content: string, ...optionalArgs: any[]): void;
    /**
     * Prints yellow colored content to stdout with newline. Multiple arguments can be passed, with the first used as the primary message and all additional used as substitution values
     * @param content
     * @param optionalArgs
     */
    yellow(content: string): void;
    /**
     * Prints green colored content to stdout with newline. Multiple arguments can be passed, with the first used as the primary message and all additional used as substitution values
     * @param content
     * @param optionalArgs
     */
    green(content: string): void;
    /**
     * Prints red colored content to stdout with newline. Multiple arguments can be passed, with the first used as the primary message and all additional used as substitution values
     * @param content
     * @param optionalArgs
     */
    red(content: string): void;
};
declare const _printf: (content: string) => boolean;
/**
 * Sleeps synchronously for the specified number of milliseconds
 * @param ms
 */
declare const _sleep: (ms: number) => void;
export declare class CommandError extends Error {
    command: string;
    stdout: string;
    stderr: string;
    status: number;
    constructor(command: string, stdout: string, stderr: string, status: number);
    toString(): string;
}
/**
 * Runs a command and returns the stdout
 * @param command The command to run.
 * @param echoStdout If true will echo stdout of the command as it runs and not capture its output
 * @param echoCommand If true will echo the command before running it
 * @returns
 */
declare const _$: {
    (command: string, echoStdout?: boolean, echoCommand?: boolean): string;
    /**
     * Runs a command and echo its stdout as it executes.  Stdout from the command is not captured.
     * @param command The command to run.
     * @param echoStdout If true will echo stdout of the command as it runs and not capture its output
     * @param echoCommand If true will echo the command before running it
     * @returns void
     */
    echo(command: string, echoCommand?: boolean): void;
    /**
     * Runs a command and will not throw if the command returns a non-zero exit code.  Instead the stderr (or stdout if stderr is empty) will be returned.
     * @param command
     * @param pipe
     * @param echoCommand
     * @returns
     */
    noThrow(command: string, pipe?: boolean, echoCommand?: boolean): string;
    /**
     * Runs a command without echoing it
     * @param command
     * @param pipe
     * @returns
     */
    quiet(command: string, pipe?: boolean): string;
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
    retry(cmd: string, maxTries?: number, waitMillisecondsBeforeRetry?: number, echoFailures?: boolean, pipe?: boolean, echoCommand?: boolean): string;
    shell: string | null;
    maxBuffer: number;
};
export declare type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export declare type HttpData = object | stream.Readable | null;
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
export declare class HttpRequestError<T> extends Error {
    request: IHttpRequestOptions;
    response: IHttpResponse<T> | null;
    constructor(message: string, request: IHttpRequestOptions, response?: IHttpResponse<T> | null);
    get data(): T | undefined;
    get statusCode(): number | undefined;
    get statusMessage(): string | undefined;
}
/**
 * Makes an asynchronous HTTP request and returns the response.   Will reject with an error if the response status code is not 2xx.
 * @param method
 * @param url
 * @param data
 * @param headers
 * @returns IHttpResponse<T>
 */
declare const _http: {
    <T>(method: HttpMethod, url: string, data?: HttpData, headers?: any): Promise<IHttpResponse<T>>;
    timeout: number;
    /**
     * Makes a synchronous HTTP request and returns the response.   Will not throw an error if the response status code is not 2xx.
     * @param method
     * @param url
     * @param data
     * @param headers
     * @returns
     */
    noThrow<T_1>(method: HttpMethod, url: string, data?: HttpData, headers?: any): Promise<IHttpResponse<T_1>>;
    /**
     * Makes a HTTP request and returns the response.   Will retry up to maxTries if an error is thrown because the status code is not 2xx.
     * @param method
     * @param url
     * @param data
     * @param headers
     * @param maxTries
     * @param waitMillisecondsBeforeRetry
     * @param echoFailures
     * @returns
     */
    retry<T_2>(method: HttpMethod, url: string, data?: HttpData, headers?: any, maxTries?: number, waitMillisecondsBeforeRetry?: number, echoFailures?: boolean): Promise<IHttpResponse<T_2>>;
    /**
     * Makes a GET HTTP request and returns the response data.  Will throw an error if the response status code is not 2xx.
     * @param url
     * @param headers
     * @returns
     */
    get<T_3>(url: string, headers?: any): Promise<T_3>;
    /**
     * Makes a POST HTTP request and returns the response data.  Will throw an error if the response status code is not 2xx.
     * @param url
     * @param headers
     * @returns
     */
    post<T_4>(url: string, data: HttpData, headers?: any): Promise<T_4>;
    /**
     * Makes a PUT HTTP request and returns the response data.  Will throw an error if the response status code is not 2xx.
     * @param url
     * @param headers
     * @returns
     */
    put<T_5>(url: string, data: HttpData, headers?: any): Promise<T_5>;
    /**
     * Makes a PATCH HTTP request and returns the response data.  Will throw an error if the response status code is not 2xx.
     * @param url
     * @param headers
     * @returns
     */
    patch<T_6>(url: string, data: any, headers?: any): Promise<T_6>;
    /**
     * Makes a DELETE HTTP request and returns the response data.  Will throw an error if the response status code is not 2xx.
     * @param url
     * @param headers
     * @returns
     */
    delete<T_7>(url: string, data: HttpData, headers?: any): Promise<T_7>;
};
/**
 * Returns `true` if the path exists, `false` otherwise.
 * @param path
 * @returns
 */
declare const _exists: (path: string) => boolean;
/**
 * Returns `true` if the path exists and it is a directory, `false` otherwise.
 * @param path
 * @returns
 */
declare const _dirExists: (path: string) => boolean;
/**
 * Create a directory if it does not exist.
 * @param path
 */
declare const _mkDir: (path: string) => void;
/**
 * Removes a file or directory if it exists.
 * @param path
 * @param recursive
 */
declare const _rm: (path: string, recursive?: boolean) => void;
/**
 * Reads a file and returns its contents.
 * @param path
 * @param encoding
 * @returns
 */
declare const _readFile: (path: string, encoding?: BufferEncoding) => string;
/**
 * Writes contents to a file, replacing the file if it exists.
 * @param path
 * @param contents
 * @param encoding
 */
declare const _writeFile: (path: string, contents: string, encoding?: BufferEncoding) => void;
declare global {
    var __filename: string;
    var __dirname: string;
    var dirname: typeof path.dirname;
    var exit: typeof process.exit;
    var error: typeof _error;
    var printf: typeof _printf;
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
export {};
