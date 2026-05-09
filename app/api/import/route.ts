import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { importPdfFile } from "@/lib/importer";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);

    if (!files.length) {
      return NextResponse.json({ error: "Nenhum ficheiro enviado." }, { status: 400 });
    }

    const imported = [];

    for (const file of files) {
      const result = await importPdfFile(file);
      imported.push(result);
    }

    revalidatePath("/");

    return NextResponse.json({ imported });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao importar PDFs.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
