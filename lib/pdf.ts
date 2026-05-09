type PDFParseCtor = {
  new (options: { data: Buffer }): {
    getText(): Promise<{ text: string }>;
    destroy(): Promise<void>;
  };
  setWorker(worker: string): void;
};

let parserSetup: Promise<PDFParseCtor> | null = null;

async function ensurePdfParser() {
  if (!parserSetup) {
    parserSetup = (async () => {
      const canvas = await import("@napi-rs/canvas");
      globalThis.DOMMatrix ??= canvas.DOMMatrix as typeof globalThis.DOMMatrix;
      globalThis.ImageData ??= canvas.ImageData as typeof globalThis.ImageData;
      globalThis.Path2D ??= canvas.Path2D as typeof globalThis.Path2D;

      const { PDFParse } = (await import("pdf-parse")) as { PDFParse: PDFParseCtor };
      try {
        const worker = (await import("pdf-parse/worker")) as { getData?: () => string };
        const workerData = worker.getData?.();
        if (workerData) {
          PDFParse.setWorker(workerData);
        }
      } catch {
        // In some serverless bundles the explicit worker helper may not resolve.
        // `pdf-parse` can still run with its internal fallback, so we avoid crashing.
      }

      return PDFParse;
    })();
  }

  return parserSetup;
}

export async function extractPdfText(buffer: Buffer) {
  const PDFParse = await ensurePdfParser();
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();
  return result.text;
}
