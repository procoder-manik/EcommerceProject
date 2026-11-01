// Bundles the API into a single Vercel serverless function using the Build
// Output API (https://vercel.com/docs/build-output-api). Run: pnpm build:vercel
import { build } from "esbuild";
import { mkdir, rm, writeFile } from "node:fs/promises";

const out = ".vercel/output";
const fn = `${out}/functions/index.func`;

await rm(out, { recursive: true, force: true });
await mkdir(fn, { recursive: true });

await build({
  entryPoints: ["src/vercel.ts"],
  bundle: true,
  platform: "node",
  target: "node22",
  format: "cjs",
  outfile: `${fn}/index.js`,
  // Optional MongoDB driver add-ons, loaded lazily only when configured.
  external: [
    "kerberos",
    "snappy",
    "socks",
    "aws4",
    "gcp-metadata",
    "mongodb-client-encryption",
    "@mongodb-js/zstd",
    "@aws-sdk/credential-providers",
  ],
  // Vercel's launcher expects the handler as module.exports itself.
  footer: { js: "module.exports = module.exports.default;" },
  logLevel: "info",
});

await writeFile(
  `${fn}/.vc-config.json`,
  JSON.stringify({ runtime: "nodejs22.x", handler: "index.js", launcherType: "Nodejs", shouldAddHelpers: false })
);
await writeFile(`${out}/config.json`, JSON.stringify({ version: 3, routes: [{ src: "/(.*)", dest: "/index" }] }));
