import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Home from '@/app/page';
import { loadFixture, createMockFile } from '../helpers/file-helpers';
import {
  createItauMockResponse,
  createNubankMockResponse,
  mockFetchSuccess,
  mockFetchError,
} from '../helpers/mock-factories';

describe('E2E: Upload Flow', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should upload Itaú PDF, parse it, and display results', async () => {
    const user = userEvent.setup();
    const mockResponse = createItauMockResponse();

    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchSuccess(mockResponse) as Response,
    );

    render(<Home />);

    // Verify upload zone is visible
    expect(screen.getByText(/Arraste sua fatura/i)).toBeInTheDocument();

    // Create and upload a mock PDF file
    const itauText = loadFixture('itau-statement.txt');
    const file = createMockFile(itauText, 'fatura-itau.pdf', 'application/pdf');
    const input = screen.getByTestId('file-input');
    await user.upload(input, file);

    // Wait for results to display
    await waitFor(() => {
      expect(screen.getByText('Itaú')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify API was called with correct payload
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('/api/upload', expect.objectContaining({
      method: 'POST',
      body: expect.any(FormData),
    }));

    // Verify metadata is displayed
    expect(screen.getByText('JOÃO DA SILVA')).toBeInTheDocument();
    expect(screen.getByText(/1234/)).toBeInTheDocument();
    expect(screen.getByText(/15\/12\/2024/)).toBeInTheDocument();

    // Verify some transactions are displayed
    expect(screen.getByText(/FARMACIA PANVEL/i)).toBeInTheDocument();
    expect(screen.getByText(/SUPERMERCADO ZAFFARI/i)).toBeInTheDocument();
    expect(screen.getByText(/RESTAURANTE FAZENDA/i)).toBeInTheDocument();
    expect(screen.getByText(/NETFLIX/i)).toBeInTheDocument();
    expect(screen.getByText(/ZARA FASHION/i)).toBeInTheDocument();

    // Verify installment info is shown
    expect(screen.getByText(/04\/06/)).toBeInTheDocument();
    expect(screen.getByText(/03\/03/)).toBeInTheDocument();

    // Verify total amount
    expect(screen.getByText(/1\.942,97/)).toBeInTheDocument();
  });

  it('should upload OFX file and display parsed transactions', async () => {
    const user = userEvent.setup();
    const mockResponse = createNubankMockResponse();

    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchSuccess(mockResponse) as Response,
    );

    render(<Home />);

    // Create and upload a mock OFX file
    const ofxContent = loadFixture('sample.ofx');
    const file = createMockFile(ofxContent, 'statement.ofx', 'text/ofx');
    const input = screen.getByTestId('file-input');
    await user.upload(input, file);

    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('Nubank')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify OFX transactions are displayed
    expect(screen.getByText(/FARMACIA PANVEL/i)).toBeInTheDocument();
    expect(screen.getByText(/SUPERMERCADO ZAFFARI/i)).toBeInTheDocument();
    expect(screen.getByText(/AMAZON BRASIL/i)).toBeInTheDocument();

    // Verify total
    expect(screen.getByText(/1\.685,57/)).toBeInTheDocument();
  });

  it('should not call API when uploading invalid file type', async () => {
    const user = userEvent.setup();

    render(<Home />);

    // The accept=".pdf,.ofx" attribute prevents .txt files from being selected
    const file = createMockFile('some text content', 'document.txt', 'text/plain');
    const input = screen.getByTestId('file-input');
    await user.upload(input, file);

    // Fetch should never have been called — client-side filter blocks it
    expect(fetch).not.toHaveBeenCalled();
    expect(screen.getByText(/Arraste sua fatura/i)).toBeInTheDocument();
  });

  it('should display API error when server rejects the file', async () => {
    const user = userEvent.setup();

    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchError(400, 'Formato inválido. Envie um arquivo PDF ou OFX.') as Response,
    );

    render(<Home />);

    // Use .pdf extension so it passes client-side filter, but server rejects it
    const file = createMockFile('not a real pdf', 'bad-file.pdf', 'application/pdf');
    const input = screen.getByTestId('file-input');
    await user.upload(input, file);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/Formato inválido/i)).toBeInTheDocument();
    });

    // Verify no transaction data is displayed
    expect(screen.queryByText('Itaú')).not.toBeInTheDocument();
    expect(screen.queryByText('Nubank')).not.toBeInTheDocument();
  });

  it('should handle empty or unreadable PDF gracefully', async () => {
    const user = userEvent.setup();

    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchError(422, 'Nenhum lançamento encontrado no arquivo. Verifique se é uma fatura ou extrato válido.') as Response,
    );

    render(<Home />);

    // Create empty PDF
    const file = createMockFile('', 'empty.pdf', 'application/pdf');
    const input = screen.getByTestId('file-input');
    await user.upload(input, file);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/Nenhum lançamento encontrado/i)).toBeInTheDocument();
    }, { timeout: 5000 });

    // Verify upload zone still shows the filename
    expect(screen.getByText('empty.pdf')).toBeInTheDocument();
  });

  it('should reset to upload view when clicking "Nova fatura"', async () => {
    const user = userEvent.setup();
    const mockResponse = createItauMockResponse({
      transactions: [
        { date: '01/11', description: 'FARMACIA PANVEL', category: 'saúde', amount: 125.50, city: 'Porto Alegre' },
      ],
    });

    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchSuccess(mockResponse) as Response,
    );

    render(<Home />);

    // Upload file
    const itauText = loadFixture('itau-statement.txt');
    const file = createMockFile(itauText, 'fatura.pdf', 'application/pdf');
    const input = screen.getByTestId('file-input');
    await user.upload(input, file);

    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('Itaú')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Find and click "Nova fatura" button
    const novaFaturaButton = screen.getByRole('button', { name: /nova fatura/i });
    await user.click(novaFaturaButton);

    // Verify we're back to upload view
    await waitFor(() => {
      expect(screen.getByText(/Arraste sua fatura/i)).toBeInTheDocument();
    });

    // Verify transaction data is cleared
    expect(screen.queryByText('JOÃO DA SILVA')).not.toBeInTheDocument();
    expect(screen.queryByText(/FARMACIA PANVEL/i)).not.toBeInTheDocument();
  });

  it('should show connection error on network failure', async () => {
    const user = userEvent.setup();

    vi.mocked(fetch).mockRejectedValueOnce(new Error('network error'));

    render(<Home />);

    const file = createMockFile('pdf content', 'fatura.pdf', 'application/pdf');
    const input = screen.getByTestId('file-input');
    await user.upload(input, file);

    // Wait for connection error message
    await waitFor(() => {
      expect(screen.getByText(/Erro de conexão/i)).toBeInTheDocument();
    });

    // No transaction data should be shown
    expect(screen.queryByText('Itaú')).not.toBeInTheDocument();
  });

  it('should show loading indicator while processing', async () => {
    const user = userEvent.setup();
    const mockResponse = createItauMockResponse();

    // Create a fetch promise we can resolve manually
    let resolveFetch!: (value: unknown) => void;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });

    vi.mocked(fetch).mockReturnValueOnce(fetchPromise as Promise<Response>);

    render(<Home />);

    const file = createMockFile('pdf content', 'fatura.pdf', 'application/pdf');
    const input = screen.getByTestId('file-input');
    await user.upload(input, file);

    // Loading indicator should appear
    await waitFor(() => {
      expect(screen.getByText(/Processando fatura/i)).toBeInTheDocument();
    });
    expect(screen.getByText('fatura.pdf')).toBeInTheDocument();

    // Resolve the fetch — results should appear
    resolveFetch(mockFetchSuccess(mockResponse));

    await waitFor(() => {
      expect(screen.getByText('Itaú')).toBeInTheDocument();
    });

    // Loading indicator should be gone
    expect(screen.queryByText(/Processando fatura/i)).not.toBeInTheDocument();
  });

  it('should show "Exportar OFX" button after successful upload', async () => {
    const user = userEvent.setup();
    const mockResponse = createItauMockResponse();

    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchSuccess(mockResponse) as Response,
    );

    render(<Home />);

    const itauText = loadFixture('itau-statement.txt');
    const file = createMockFile(itauText, 'fatura.pdf', 'application/pdf');
    const input = screen.getByTestId('file-input');
    await user.upload(input, file);

    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('Itaú')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify export button is visible
    const exportButton = screen.getByRole('button', { name: /exportar ofx/i });
    expect(exportButton).toBeInTheDocument();
  });
});
