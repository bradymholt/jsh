# jsh

[![Build](https://github.com/bradymholt/jsh/actions/workflows/build.yml/badge.svg)](https://github.com/bradymholt/jsh/actions/workflows/build.yml) [![NPM Package](https://img.shields.io/npm/v/jsh.svg)](https://www.npmjs.com/package/jsh)

Helpers for Bash like shell scripting in JavaScript

<p align="center">
<img alt="jsh" src="https://user-images.githubusercontent.com/759811/173114308-11919402-b3d2-4bd7-9f35-fb34906941b2.png">
</p>

jsh, pronounced "j shell", is a small JavaScript library (with no dependencies!) that provides helper aliases and functions that are similar to Bash syntax, allowing you to write shell scripts in JavaScript / Node.js that are simple and familiar.

**Requirement**: Node.js >=16

## Quick Start

Create a file called script.js:

```
#!/usr/bin/env npx jsh

echo("Hello jsh")
```

Make the file executable, run it, and you should see "Hello jsh" printed:

```
chmod +x ./script.js && ./script.js

> Hello jsh
```

## Helpers

You can refer to the [definition file](https://github.com/bradymholt/jsh/blob/main/dist/index.d.ts) for a full list of the helpers and JSDoc documentation for arguments and usage.  Below is a summarized list of the available helpers.


**General Scripting**
|     | Description |
| --- | --- |
| `echo("Hello")` | Print text to console with trailing newline |
| `echo.yellow("Hello")` | Print yellow colored text to console with trailing newline |
| `echo.green("Hello")` | Print green colored text to console with trailing newline |
| `echo.red("Hello")` | Print red colored text to console with trailing newline |
| `printf("one\ntwo")` | Print text to console with no trailing newline |
| `exit(1)` | Halt the script and return an exit code |
| `error("An error", 1)` | Echo an error and halt the script with an exit code |
| `usage("Usage: myscript.js [--verbose]")` | Define a usage message |
| `usage.printAndExit()` | Print the usage message and then exit with an error exit code.  If `usage()` was not previously called to define a usage message, a default one will be used. |
| `sleep(2000)` | Sleep (synchronously) for specified number of milliseconds. |

**Arguments and Environment**
|     | Description |
| --- | --- |
| `args[0], args[1], ...` | Access arguments that have been passed in from args array |
| `$1, $2, $3, ...` | Access arguments that have been passed by numeric order |
| `args.source_file` | Access arguments prefixed with "--".<br/>If argument is in format `--source_file=input.txt` the value of `args.source_file` will be `"input.txt"`.<br/>If argument is in format `--source_file` the value of `args.source_file` will be `true`. |
| `const [source_file, target_file] = args.assertCount(2)` | Return arg values as array or call `usage.printAndExit()` if less than number of arguments specified were supplied |
| `$0` | Return the name of the current script file (ex: `my_script.js`) |
| `$HOME` | Access an environment variable |
| `env.HOME` | Access an environment variable from the `env` object |
| `const [HOME, USER] = env.assert(["HOME", "USER"])` | Return environment variable values as an array or call `usage.printAndExit()` if any are undefined.  You can also pass a single environment variable name in as a string and it will return the string value (ex: `const HOME = env.assert("HOME")`) |

**Command Execution**
|     | Description |
| --- | --- |
| `result=$("cmd.sh")` | Execute a command and return the stdout |
| `$.echo("cmd.sh")` | Execute a command and stream stdout to console without returning a value.  Also aliased as `exec()`. |
| `$.noThrow("cmd.sh")` | Execute a command and do not throw an error if its exit code is not 0 |
| `$.quiet("cmd.sh")` | Execute a command and do not echo the command before running it |
| `$.retry("cmd.sh", 5)` | Execute a command and if it throws and error, retry up to a number of times until it succeeds |

**File System**
|     | Description |
| --- | --- |
| `cd("/usr/bin")` | Change the current working directory |
| `config=readFile("cnf.txt")` | Read text from file.  Also aliased as `cat()`. |
| `writeFile("cnf.txt", "World")` | Write text to file |
| `dirExists("./myDir")` | Check if directory exists |
| `mkDir("./newDirName")` | Create a directory |
| `rmDir("./newDirName")` | Delete a directory |
| `exists("./aFile.txt")` | Check if a file exists |
| `rm("./myFile")` | Delete a file |
| `dirname("./path/file.txt")` | Return the directory name for a path |

**HTTP Requests**

Note: The HTTP helpers are asynchronous.

|     | Description |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `await http.get("https://www.myapi.com")`                   | Make a HTTP GET request and return the response body data                                                |
| `await http.post("https://www.myapi.com", { data: "1" }) `  | Make a HTTP POST request and return the response body data                                               |
| `await http.put("https://www.myapi.com", { data: "1" })`    | Make a HTTP PUT request and return the response body data                                                |
| `await http.patch("https://www.myapi.com", { data: "1" })`  | Make a HTTP PATCH request and return the response body data                                              |
| `await http.delete("https://www.myapi.com", { data: "1" })` | Make a HTTP DELETE request and return the response body data                                             |
| `await http("GET", "https://www.myapi.com")`                | Make a HTTP request and return the response: (`{ data, headers, statusCode, statusMessage }`)            |
| `await http.noThrow("GET", "https://www.myapi.com")`        | Make a HTTP request and do not throw an error if status code is not 20X                                  |
| `await http.retry("GET", "https://www.myapi.com")`          | Make a HTTP request and if response status code is not 20X, retry up to a number of times until it is    |

## Usage

To define usage instructions for your script, you can call `usage()` and pass in a usage string that describes the script and documents any required or optional arguments.  

Example:
```
usage(`\
Usage:
  json_formatter.js source_file target_file [--verbose]

Example:
  json_formatter.js ./my_in_file.json ./my_out_file.json --verbose

Formats a JSON file
`);
```

You can also use `$0` to reference the name of the current script rather than having to hardcode it.  The above example could be changed to (`${$0} source_file target_file [--verbose]` ...).

### usage.printAndExit()

You can call `usage.printAndExit()` at any time to print the usage instructions and then immediately exit with an error code.  If you call usage.printAndExit() _before_ calling usage(), a simple default message will be echoed but if you call usage.printAndExit() _after_ calling usage(), your custom usage instructions will be echoed.

There are a few ways that usage.printAndExit() will be called implicitly.
1. If `--help` or `-h` is passed in as an argument
1. If `args.assertCount()` is called and the required number of arguments were not passed in.  For example, if args.assertCount(3) is called and only 2 arguments were passed in.
1. If `env.assert()` is called and the environment variable(s) are not defined.

## Command Execution

### $()

When you want to run a command and buffer the output (stdout) of that command as a return value, you use the synchronous function **$()**. As the command is running, stdout will _not_ be printed to the console but will instead be captured and returned as the result. This helper is intended for short running commands that do not produce a large amount of output.

Example:

```
// Will wait for `git status` to complete and assign output to `result` variable.
// Nothing will be printed to the console.

let result=$(`git status --porcelain`);
```

### $.echo()

**$.echo()** (also aliased as `exec()`) should be used when running commands where the output (stdout) does not need to be captured, but only printed to the console. This helper is intended for long running commands or those where output does not need to be captured.

Example:

```
// Will print `npm install` output immediately as it happens
// $.echo() will not return anything (void)

$.echo(`npm install`) // or exec(`npm install`)

> added 379 packages, and audited 380 packages in 1s
> 29 packages are looking for funding
> ...
```

### Error Handling

If a command exits with a non-zero status, a `CommandError` error will be thrown. The error contains these properties: `{ message, command, stdout, stderr, status }`.

Example:

```
try {
  const output = $(`cat invalid.txt`)
} catch (err) {
  console.log(err.message) // Error running command: `cat invalid.txt`
  console.log(err.command) // cat invalid.txt
  console.log(err.stderr) // "cat: invalid.txt: No such file or directory"
  console.log(err.status) // 1
}
```

#### $.noThrow()

You can call `$.noThrow()` to prevent an error from being thrown. Instead, the stderr will be returned.

Example:

```
// This command will error out but will not throw because `$.noThrow()` was called.
let content=$(`cat invalid.txt`)
echo(content);

> cat: invalid.txt: No such file or directory
```

## HTTP Requests

The http helper can be used to make asynchronous HTTP requests. It returns a promise and resolves with an `IHttpResponse` object that contains these properties: `{ data, headers, statusCode, statusMessage, requestOptions }`.

Example:

```
const response = await http("GET", "https://www.myapi.com);

echo(response.data) // { data: "Testing" }
echo(response.headers) // { "Content-Type": "application/json" }
echo(response.statusCode) // 200
echo(response.statusMessage) // "OK"
```

There are also helpers for each of the 4 primary HTTP methods: `http.get`, `http.post`, `http.put`, `http.delete`. These helpers do not require having to pass in the method type and will also return the response _body_. If the response is of JSON format, it will be parsed before being returned.

Example:

```
const response = await http.get("https://www.myapi.com);

echo(response) // { data: "Testing" }
```

### Error Handling

If a status code outside the range 20X is returned in the HTTP response, a `HttpRequestError` error will be thrown. The error contains these properties: `{ message, data, statusCode, statusMessage, request, response }`.

Example:

```
try {
  const response = http.post("https://www.myapi.com", { data: "1" });
} catch (err) {
  console.log(err.message) // Bad Request
  console.log(err.data) // { error: "The 'data' property is formatted incorrectly" }
  console.log(err.statusCode) // 400
  console.log(err.statusMessage) // Bad Request
}
```

#### http.noThrow()

You can call `http.noThrow()` to prevent an error from being thrown. Instead, the response will be returned.

Example:

```
const response = await http.noThrow("GET", "https://www.myapi.com);

echo(response.data) // "A server error occurred.  Please try again later."
echo(response.headers) // { "Content-Type": "text/plain" }
echo(response.statusCode) // 500
echo(response.statusMessage) // "Internal Server Error"
```

## Installation

Note: **jsh requires Node >=16**

### npx

By far the easiest way to use jsh is with a [npx](https://docs.npmjs.com/cli/v7/commands/npx) [shebang](<https://en.wikipedia.org/wiki/Shebang_(Unix)>).

#### macOS

```
#!/usr/bin/env npx jsh

echo("Hello jsh")
```

#### Linux

Since most Linux distributions do not support multiple arguments in the shebang, you need to call npx at its absolute path. Usually npx is installed in `/usr/local/bin/` but you can run `which npx` to locate it.

```
#!/usr/local/bin/npx jsh

echo("Hello jsh")
```

npx will look for a globally installed (`npm install -g jsh`) or locally installed (package.json / `node_modules` ) version of jsh, and use it if found.  Otherwise, it will download the latest version from npm. Therefore, it is recommended to install jsh globally or locally when using npx so that it will be available and not have to be downloaded each time.

### npm global install

If you don't want to use npx, you can install jsh globally with npm:

```
npm install -g jsh
```

Once it is installed globally, you can write your script with a jsh [shebang](<https://en.wikipedia.org/wiki/Shebang_(Unix)>) which will allow your script to be executed directly, with the globally installed jsh loaded at runtime.

```
#!/usr/local/bin/jsh

echo(`Hello jsh`)
```

### require

Rather than installing jsh globally, you can simply download it to a local folder and reference it directly from your script using a `require` or `import` statement. This is a good option for scripts running on a remote system where you may not have the ability to use npx or be able to install npm packages globally. Node.js will still need to be available, though.

First, download jsh:

```
wget -O jsh.js https://github.com/bradymholt/jsh/releases/latest/download/index.cjs
```

Then, in your script:

```
#!/usr/bin/env node
require('./jsh.js')

echo(`Hello jsh`)
```

## It's Still JavaScript

When you write your shell scripts in jsh, you get to use a simple Bash like syntax but remember, it's still JavaScript! This means you can install npm packages and use them to your ❤️'s content.

Example:

```
npm install uuid
```

```
#!/usr/local/bin/jsh
require('uuid/v4')

echo(uuidv4()) // -> '110ec58a-a0f2-4ac4-8393-c866d813b8d1'
```

## ES Modules

jsh is distributed as both a CommonJS and an ES Module library.  When you `require` or `import` jsh, Node should be able to determine which library to load based upon your file extension (.js, .cjs, .mjs) and/or "type" setting in your package.json file.

## TypeScript Support

TypeScript declarations for jsh are available and specified with `"types": "index.d.ts"` in the package.json file. A clean way to use TypeScript with jsh is by using [ts-node](https://github.com/TypeStrong/ts-node).

First, install ts-node, TypeScript, and jsh globally:

```
npm install -g ts-node typescript jsh
```

Then, create your jsh script file using a `.ts` file extension.

myscript.ts:

```
#!/usr/bin/env ts-node
import("jsh")

const contents: string = "Hello jsh from TypeScript";
echo(contents)
```

Run it:

```
chmod +x ./myscript.ts
./myscript.ts
```

And you should see the following printed to the console:

```
Hello jsh from TypeScript
```
