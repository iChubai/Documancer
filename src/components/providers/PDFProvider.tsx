'use client';

import { useEffect } from 'react';
import { pdfjs } from 'react-pdf';

// Configure PDF.js worker
const configurePDFJS = () => {
  if (typeof window !== 'undefined') {
    // Use CDN worker that matches the installed react-pdf version
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    
    console.log('PDF.js configured with version:', pdfjs.version);
    console.log('Worker source:', pdfjs.GlobalWorkerOptions.workerSrc);
  }
};

export default function PDFProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    configurePDFJS();
  }, []);

  return <>{children}</>;
}
