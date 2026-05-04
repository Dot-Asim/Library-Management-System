'use client';

import React, { useEffect, useState } from 'react';

export default function PdfViewer({ url }: { url: string }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let objectUrl: string | null = null;
    
    async function fetchPdf() {
      try {
        setLoading(true);
        // Fetch from the API Gateway (port 8080)
        const baseUrl = url.startsWith('/') ? `http://localhost:8080${url}` : url;
        const fetchUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}cb=${new Date().getTime()}`;
        
        console.log("Fetching PDF securely from:", fetchUrl);
        const response = await fetch(fetchUrl, {
          cache: 'no-store'
        });
        
        if (!response.ok) {
          throw new Error(`Failed to load PDF: ${response.status} ${response.statusText}`);
        }
        
        const blob = await response.blob();
        if (blob.size === 0) {
          throw new Error("Received empty PDF file");
        }
        
        // Ensure the blob has the correct type so the browser knows it's a PDF
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        objectUrl = URL.createObjectURL(pdfBlob);
        setBlobUrl(objectUrl);
      } catch (err: any) {
        console.error("PDF Fetch Error:", err);
        setError(err.message || "An unknown error occurred while loading the PDF.");
      } finally {
        setLoading(false);
      }
    }

    fetchPdf();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [url]);

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-400 font-mono text-sm animate-pulse">Downloading Secure PDF...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 space-y-4">
        <div className="text-red-500 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-zinc-300 font-semibold">{error}</p>
        <p className="text-zinc-500 text-sm max-w-md text-center">
          The browser security policies or backend service prevented the PDF from loading directly.
        </p>
      </div>
    );
  }

  return (
    <iframe
      src={blobUrl || ''}
      className="w-full h-full border-0"
      title="Secure PDF Reader"
    />
  );
}
