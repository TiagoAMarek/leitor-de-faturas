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

    const fileName = file.name.toLowerCase();
    const isPdf = fileName.endsWith('.pdf') || file.type === 'application/pdf';
    const isOfx = fileName.endsWith('.ofx') || file.type === 'text/ofx' || file.type === 'application/x-ofx';

    if (!isPdf && !isOfx) {
      return NextResponse.json(
        { error: 'Formato inválido. Envie um arquivo PDF ou OFX.' },
        { status: 400 }
      );
    }

    let fullText = '';

    if (isPdf) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const parser = new PDFParse({ data: buffer });
      try {
        const result = await parser.getText();
        for (const page of result.pages) {
          fullText += page.text + '\n';
        }
      } finally {
        await parser.destroy();
      }
    } else {
      // OFX is text-based
      fullText = await file.text();
    }

    if (!fullText.trim()) {
      return NextResponse.json(
        { error: 'Não foi possível extrair o conteúdo do arquivo.' },
        { status: 422 }
      );
    }

    const statement = parseStatement(fullText);

    if (statement.transactions.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum lançamento encontrado no arquivo. Verifique se é uma fatura ou extrato válido.' },
        { status: 422 }
      );
    }

    return NextResponse.json(statement);
  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      { error: 'Erro ao processar o arquivo. Tente novamente.' },
      { status: 500 }
    );
  }
}
