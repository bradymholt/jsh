# jsh

[![Build](https://github.com/bradymholt/jsh/actions/workflows/build.yml/badge.svg)](https://github.com/bradymholt/jsh/actions/workflows/build.yml) [![NPM Package](https://img.shields.io/npm/v/jsh.svg)](https://www.npmjs.com/package/jsh)

Helpers for Bash like shell scripting in JavaScript

<p align="left">
<img alt="jsh logo" src="https://user-images.githubusercontent.com/759811/174220014-2dcb1c9b-17b4-4a61-8f40-ddfa2d1e7c7f.png">
</p>

jsh, pronounced "j shell", is a small JavaScript library (with no dependencies!) that provides helper aliases and functions that are similar to Bash syntax, allowing you to write shell scripts in JavaScript / Node.js that are simple and familiar.

**Requirement**: Node.js >=16

## Quick Start

Create a file called `script.js`:

```
#!/usr/bin/env npx jsh

echo("Hello jsh")
```

Make the file executable, run it, and you should see "Hello jsh" printed:

```
chmod +x ./script.js && ./script.js

> Hello jsh
```

See [details installation instructions below](#installation).

## Helpers

Below is a summarized list of the available helpers.  You can refer to the [declaration file](https://github.com/bradymholt/jsh/releases/latest/download/index.d.ts) for a full list of the helpers and JSDoc documentation for arguments and usage.  

**General Scripting**
|     | Description |
| --- | --- |
| `echo("Hello")` | Print text to console with trailing newline |
| `echo.yellow("Hello")`,<br/> `echo.green("Hello")`,<br/>`echo.red("Hello")`,<br/>`echo.blue("Hello")` | Prints colored text to console with trailing newline |
| `printf("Processing...")` | Print text to console without a trailing newline |
| `exit(1)` | Halt the script and return an exit code |
| `error("An error", 1)` | Echo an error and halt the script with an exit code |
| `const name = prompt("What is your name?");` | Prompt (synchronously) for user input and return after \<Enter\> pressed; also aliased as `read()`. |
| `sleep(2000)` | Sleep (synchronously) for specified number of milliseconds |

**Command Execution** ([detailed docs below](#command-execution-helpers))
|     | Description |
| --- | --- |
| `result=$("cmd.sh")` | Execute a command and return the stdout |
| `exec("cmd.sh")` | Execute a command and stream stdout to console without returning a value |

**Arguments and Environment**
|     | Description |
| --- | --- |
| `$0` | Return the name of the current script file (ex: `my_script.js`) |
| `$1`, `$2`, `$3`, ... | Access arguments that have been passed by numeric order |
| `args[0], args[1], ...` | Access arguments that have been passed in from args array |
| `args.source_file, args.v` | Access arguments prefixed with "--" or "-".<br/><br/>If argument is in format `--source_file=input.txt` the value of `args.source_file` would be `"input.txt"`.<br/><br/>If argument is in format `--source_file` or `-v` the argument name will be available on args as a `true` boolean (`args.source_file == true`, `args.v == true`)   |
| `const [source_file, target_file] = args.assertCount(2)` | Return arg values as array or call `usage.printAndExit()` if less than number of arguments specified were supplied.  See [details below](#usage-helpers). |
| `$HOME`,`env.HOME`, or `env["HOME"]`| Access an environment variable |
| `const USER = env.assert("USER")`or<br/>`const [HOME, USER] = env.assert(["HOME", "USER"])` | Return environment variable value or call `usage.printAndExit()` if undefined.  You can also pass an array of environment variable names and an array of values will be returned.  See [details below](#usage-helpers).  |
| `usage("Usage: myscript.js [--verbose]")` | Define a usage message.  See [details below](#usage-helpers). |
| `usage.printAndExit()` | Print the usage message and then exit with an error exit code.  If `usage()` was not previously called to define a usage message, a default one will be used.  See [details below](#usage-helpers). |

**File System**
|     | Description |
| --- | --- |
| `cd("/usr/bin")` | Change the current working directory |
| `config=readFile("cnf.txt")` | Read text from file; also aliased as `cat()`. |
| `writeFile("cnf.txt", "World")` | Write text to file |
| `dirExists("./myDir")` | Check if directory exists |
| `mkdir("./newDirName")` | Create a directory |
| `rmdir("./newDirName")` | Delete a directory |
| `exists("./aFile.txt")` | Check if a file exists |
| `rm("./myFile")` | Delete a file |
| `dirname("./path/file.txt")` | Return the directory name for a path |
| `__dirname` | Returns the absolute path (directory) containing the entry script |
| `__filename` | Returns the name of the entry script |

**HTTP Requests** ([detailed docs below](#http-request-helpers))

**Note:** The HTTP helpers are asynchronous and return a Promise.

|     | Description |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `await http.get("https://www.myapi.com")`                   | Make a HTTP GET request and return the response body data                                                |
| `await http.post("https://www.myapi.com", { data: "1" }, { Authorization: "Bearer abc123"})`   | Make a HTTP POST request and return the response body data                                               |
| `await http.put("https://www.myapi.com", { data: "1" })`    | Make a HTTP PUT request and return the response body data                                                |
| `await http.patch("https://www.myapi.com", { data: "1" })`  | Make a HTTP PATCH request and return the response body data                                              |
| `await http.delete("https://www.myapi.com", { data: "1" })` | Make a HTTP DELETE request and return the response body data                                             |
| `await http("POST", "https://www.myapi.com", { data: "1" }, { headers: { Accept: "application/json" } })`                | Make a HTTP request and return the response: (`{ data, headers, statusCode, statusMessage }`)            |

## Examples

<details>
<summary>Write text to file</summary>

```js
#!/usr/bin/env npx jsh

usage(`\
Usage:
  ${$0} text target_file [--verbose]

Example:
  ${$0} "My text" ./test.txt --verbose

Writes some text to a file\
`);

const [text, target_file] = args.assertCount(2);

if (args.verbose) echo(`Writing text to file...`);

writeFile(target_file, text);

if (args.verbose) echo.green(`Done!`);
```
</details>

<details>
<summary>Prompt for input</summary>

```js
#!/usr/bin/env npx jsh

usage(`\
Usage:
  ${$0} prompt_text

Example:
  ${$0} "What is your name?"

Prompts for input and then echos it\
`);

const input = prompt($1); // `$1` contains the first argument which is prompt_text
echo(input);
```
</details>

## Command Execution Helpers

### $()

When you want to run a command and buffer the output (stdout) of that command as a return value, you use the synchronous function **$()**. As the command is running, stdout will _not_ be printed to the console but will instead be captured and returned as the result. This helper is intended for short running commands that do not produce a large amount of output.

Example:

```
// Will wait for `git status` to complete and assign output to `result` variable.
// Nothing will be printed to the console.

let result=$(`git status --porcelain`);
```

### exec

**exec** should be used when running commands where the output (stdout) does not need to be captured, but only printed to the console. This helper is intended for long running commands or those where output does not need to be captured.

Example:

```
// Will print `npm install` output immediately as it happens
// exec will not return anything (void)

exec(`npm install`)

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
  echo(err.message) // Error running command: `cat invalid.txt`
  echo(err.command) // cat invalid.txt
  echo(err.stderr) // "cat: invalid.txt: No such file or directory"
  echo(err.status) // 1
}
```

#### `noThrow` option

You can pass in the option `noThrow: true` to prevent an error from being thrown. Instead, the stderr (or stdout) will be returned.

Example:

```
// This command will error out but will not throw because `$.noThrow()` was called.
let content=$(`cat invalid.txt`, { noThrow: true})
echo(content);

> cat: invalid.txt: No such file or directory
```

### Command Options

`$()` and `exec()` accept an `options` parameter object that may contain any of the following fields:
 
- `echoCommand: boolean` - If true will echo the command itself before running it (Default: `true`)
- `noThrow: boolean` -  If set to true, will not throw if the command returns a non-zero exit code (Default: `false`)
- `timeout: number` - In milliseconds the maximum amount of time the process is allowed to run (Default: `undefined` (unlimited))
- `shell: string` - By default, commands will be run inside of a shell (`/bin/sh` on *nix systems and `process.env.ComSpec` on Windows).  This option can be used to specify the path to a different shell to execute commands with.  For example, you could specify `shell: "/bin/bash"` to use bash.
- `maxBuffer: number` - Specifies the largest number of bytes allowed on stdout or stderr. If this value is exceeded, the child process will be terminated. (Default: `268435456` (256MB))



## Usage Helpers

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

There are a few ways that usage.printAndExit() will be called implicitly:
1. If `--help` or `-h` is passed in as an argument.  (Note: in this case, the exit code will be set to 0)
1. If `args.assertCount()` is called and the required number of arguments were not passed in.  For example, if args.assertCount(3) is called and only 2 arguments were passed in.
1. If `env.assert()` is called and the environment variable(s) are not defined.

## HTTP Request Helpers

The http helper can be used to make asynchronous HTTP requests. It returns a promise and resolves with an `IHttpResponse` object that contains these properties: `{ data, headers, statusCode, statusMessage, requestOptions }`.

Example:

```
const response = await http("GET", "https://www.myapi.com);

echo(response.data) // { data: "Testing" }
echo(response.headers) // { "Content-Type": "application/json" }
echo(response.statusCode) // 200
echo(response.statusMessage) // "OK"
```

There are also helpers for the primary HTTP methods: `http.get`, `http.post`, `http.put`, `http.patch`, and `http.delete`. These helpers do not require having to pass in the method type and will also return the response _body_ data. If the response is of JSON format, it will be parsed before being returned.

Example:

```
const response = await http.get("https://www.myapi.com);

echo(response) // { data: "Testing" }
```

### data

You can pass a `data` parameter which will then be sent as the body of the request.  If you pass a JavaScript object, it will be converted to JSON automatically and headers `Content-Type`, `Accept` will be set to `application/json`, unless specified differently.


#### Stream
You may also pass a readable Stream as `data`.  This is common when sending a file as part of a request:

```
const fs = require("fs");
const filePath = "./my_image.jpg";
const data = fs.createReadStream(filePath);
const fileSize = fs.statSync(filePath).size;
await http.post("https://fakeimageserver.com/uploads", data, {
  "Content-Type": "image/jpeg",
  "Content-Length": fileSize,
});
```

### Default Headers

If any of the following headers are not specified, these default values will be used:

| Header              | Value                                                  |
| ------------------- | ------------------------------------------------------ |
| `Accept`            | `*/*` or `application/json` if `data` is an object     |
| `Accept-Encoding`   | `gzip`                                                 |
| `Connection`        | `close`                                                |
| `User-Agent`        | `jsh`                                                  |
| `Host`              | (extracted from `url` in format hostname:port)         |

### Error Handling

If a status code outside the range 20X is returned in the HTTP response, a `HttpRequestError` error will be thrown. The error contains these properties: `{ message, data, statusCode, statusMessage, request, response }`.

Example:

```
try {
  const response = http.post("https://www.myapi.com", { data: "1" });
} catch (err) {
  echo(err.message) // Bad Request
  echo(err.data) // { error: "The 'data' property is formatted incorrectly" }
  echo(err.statusCode) // 400
  echo(err.statusMessage) // Bad Request
}
```

#### `noThrow` option

You can pass in the option `noThrow: true` when calling `http()` to prevent an error from being thrown when the response status is not 2xx. Instead, the response will be returned.

Example:

```
const response = await http("POST", "https://www.myapi.com", { data: 2 }, { noThrow: true });

echo(response.data) // "A server error occurred.  Please try again later."
echo(response.headers) // { "Content-Type": "text/plain" }
echo(response.statusCode) // 500
echo(response.statusMessage) // "Internal Server Error"
```

### HTTP Request Options

`http()` accepts an `options` parameter object that may contain any of the following fields:
 
- `headers: object` - The request headers to send with the request.  A set of default headers will be included with the request even if not specified here.  See "Default Headers" section above for more info.
- `timeout: number` - The number of milliseconds of inactivity before a socket is presumed to have timed out (Default: `120000` (2 minutes))
- `noThrow: boolean` - If set to true, will not throw if the response status code is not 2xx (Default: false)

## Installation

Note: **jsh requires Node >=16**

### npx

By far the easiest way to use jsh is with a [npx](https://docs.npmjs.com/cli/v7/commands/npx) [shebang](<https://en.wikipedia.org/wiki/Shebang_(Unix)>).

#### macOS

Create a file called `script.js`:

```
#!/usr/bin/env npx jsh

echo("Hello jsh")
```

#### Linux

Since most Linux distributions do not support multiple arguments in the shebang, you need to call npx at its absolute path. Usually npx is installed in `/usr/local/bin/` but you can run `which npx` to locate it.

Create a file called `script.js`:

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

Once it is installed globally, you can write your script with a jsh [shebang](<https://en.wikipedia.org/wiki/Shebang_(Unix)>) which will allow your script to be executed directly, with the globally installed jsh loaded at runtime.  Run `which jsh` to locate the absolute path the jsh and use that for the shebang path.

```
#!/usr/local/bin/jsh

echo(`Hello jsh`)
```

### require

Rather than installing jsh globally, you can simply download it to a local folder and reference it directly from your script using a `require` or `import` statement. This is a good option for scripts running on a remote system where you may not have the ability to use npx or be able to install npm packages globally. Node.js will still need to be available, though.

First, download jsh:

```
wget -O jsh.cjs https://github.com/bradymholt/jsh/releases/latest/download/index.cjs
```

Then, in your script:

```
#!/usr/bin/env node
require('./jsh.cjs')

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

1. Install ts-node, TypeScript, and jsh:
    ```
    npm init -y && npm install ts-node typescript jsh
    ```
1. Create your jsh script file using a `.ts` file extension, following the below example.
    
    _myscript.ts_
    
    ```
    #!/usr/bin/env npx ts-node
    import "jsh"
    
    const contents: string = "Hello jsh from TypeScript";
    echo(contents)
    ```
    
    Note: The above shebang includes 2 arguments which will not work in some enviroments.  See [this post](https://github.com/TypeStrong/ts-node/issues/639#issuecomment-885817246) for a workaround.
1. Run it: `chmod +x ./myscript.ts && ./myscript.ts`.

### ES Modules

You can use jsh with TypeScript and ES Modules support so you can use features like [top-level await](https://v8.dev/features/top-level-await).

1. Install ts-node, TypeScript, and jsh:
    ```
    npm init -y && npm install ts-node typescript jsh
    ```
1. Ensure you have a `package.json` file defined with (at least) `"type": "module"` specified:

    ```
    {
      ...
      "type": "module",
      ...
    }
    ```

1. Ensure you have a `tsconfig.json` file defined with (at leaast) the following config:
    ```
    {
      "compilerOptions": {
        "target": "ESNext",
        "module": "ESNext",
        "moduleResolution": "node"
      }
    }
    ```
 1. Create your jsh script, specifying `ts-node-esm` in the shebang:
    
    _myscript.ts_
    
    ```
    #!/usr/bin/env npx ts-node-esm
    import  "jsh"
    
    echo("Hello jsh from TypeScript")
    await new Promise((resolve) => setTimeout(resolve, 2000));
    echo("Goodbye!")
    ```
    
    Note: The above shebang includes 2 arguments which will not work in some enviroments.  See [this post](https://github.com/TypeStrong/ts-node/issues/639#issuecomment-885817246) for a workaround.
  1.  Run it: `chmod +x ./myscript.ts && ./myscript.ts`
