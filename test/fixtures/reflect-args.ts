#!./node_modules/ts-node/dist/bin-esm.js
import "../../src/index.js";
echo(`First four argument values:`);
echo(args[0]);
echo(args[1]);
echo(args[2]);
echo(args[3]);
echo("JSON.stringify(args):");
echo(JSON.stringify(args));
echo(`args.foo: ${args.foo.toString()}`);
echo(`args.hello: ${args.hello.toString()}`);
echo(`args.quotes: ${args.quotes.toString()}`);
echo(`args.path: ${args.path.toString()}`);
echo(`args.b: ${args.b.toString()}`);
