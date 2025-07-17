import { pdfjs } from 'react-pdf';

// Configure PDF.js worker - use CDN for compatibility
if (typeof window !== 'undefined') {
  // Use CDN worker that matches the installed react-pdf version
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

// PDF.js configuration options
export const pdfOptions = {
  cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
};

// Export pdfjs for use in components
export { pdfjs };
