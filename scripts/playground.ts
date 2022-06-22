#!./node_modules/ts-node/dist/bin-esm.js
import "../src/index.js";

(async () => {
  const res = await http.get<any>("https://dog.ceo/api/breeds/image/random");
  echo(res);
})();
