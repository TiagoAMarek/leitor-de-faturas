import { NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';
import { getPath } from 'pdf-parse/worker';
import { parseStatement } from '@/lib/parser';
import { ERROR_MESSAGES } from '@/lib/constants';
import { isFileSizeValid, isPdfFile, isOfxFile, isCsvFile } from '@/lib/validators';

// Configure the worker for Node.js / Next.js server-side usage
PDFParse.setWorker(getPath());

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const raw = formData.get('file');

    if (!raw || !(raw instanceof File)) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.NO_FILE_UPLOADED },
        { status: 400 }
      );
    }

    const file = raw;

    if (!isFileSizeValid(file)) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.FILE_TOO_LARGE },
        { status: 413 }
      );
    }

    const isPdf = isPdfFile(file);
    const isOfx = isOfxFile(file);
    const isCsv = isCsvFile(file);

    if (!isPdf && !isOfx && !isCsv) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.INVALID_FILE_FORMAT },
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
      // OFX/CSV are text-based
      fullText = await file.text();
    }

    if (!fullText.trim()) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.EMPTY_FILE_CONTENT },
        { status: 422 }
      );
    }

    const statement = parseStatement(fullText);

    if (statement.transactions.length === 0) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.NO_TRANSACTIONS_FOUND },
        { status: 422 }
      );
    }

    return NextResponse.json(statement);
  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.PROCESSING_ERROR },
      { status: 500 }
    );
  }
}
