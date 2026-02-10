import { NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';
import { getPath } from 'pdf-parse/worker';
import { parseStatement } from '@/lib/parser';

// Configure the worker for Node.js / Next.js server-side usage
PDFParse.setWorker(getPath());

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Formato inválido. Envie um arquivo PDF.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParse({ data: buffer });

    let fullText = '';
    try {
      const result = await parser.getText();
      for (const page of result.pages) {
        fullText += page.text + '\n';
      }
    } finally {
      await parser.destroy();
    }

    if (!fullText.trim()) {
      return NextResponse.json(
        { error: 'Não foi possível extrair texto do PDF. O arquivo pode ser uma imagem escaneada.' },
        { status: 422 }
      );
    }

    const statement = parseStatement(fullText);

    if (statement.transactions.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum lançamento encontrado no PDF. Verifique se é uma fatura de cartão de crédito.' },
        { status: 422 }
      );
    }

    return NextResponse.json(statement);
  } catch (error) {
    console.error('Error processing PDF:', error);
    return NextResponse.json(
      { error: 'Erro ao processar o PDF. Tente novamente.' },
      { status: 500 }
    );
  }
}
