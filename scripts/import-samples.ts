import { basename } from "node:path";
import { readFile } from "node:fs/promises";
import { importPdfFile } from "../lib/importer";

const samplePaths = [
  "/Users/miguelmendes/Downloads/boltBLC3049_22204694.pdf",
  "/Users/miguelmendes/Downloads/boltBLC16481_23223268.pdf",
  "/Users/miguelmendes/Downloads/boltBLC17164_23282778.pdf",
];

async function run() {
  for (const samplePath of samplePaths) {
    const buffer = await readFile(samplePath);
    const file = new File([buffer], basename(samplePath), { type: "application/pdf" });
    const result = await importPdfFile(file);
    console.log(`${result.reportCode}: ${result.metricCount} métricas`);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
