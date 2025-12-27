
import React, { useState, useCallback, useRef } from 'react';
import { addDocument } from '../services/ragService';
import { UploadIcon, FileIcon, SpinnerIcon, CheckCircleIcon, XCircleIcon } from './icons';

interface DocumentUploaderProps {
    onUploadSuccess: () => void;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({ onUploadSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractTextFromPdf = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    return fullText;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
      setUploadStatus('');
      
      if (selectedFile.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = () => setPreviewUrl(reader.result as string);
          reader.readAsDataURL(selectedFile);
      } else {
          setPreviewUrl(null);
      }
    }
  };

  const handleUpload = useCallback(async () => {
    if (!file) {
      setUploadStatus('Please select a file first.');
      return;
    }

    setIsUploading(true);
    setUploadStatus(file.type.startsWith('image/') ? 'Analyzing image...' : 'Processing file...');

    try {
      let content = '';
      let base64 = '';
      const isImage = file.type.startsWith('image/');

      if (isImage) {
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
              reader.onload = () => resolve((reader.result as string).split(',')[1]);
              reader.readAsDataURL(file);
          });
          base64 = await base64Promise;
      } else if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        content = await extractTextFromPdf(arrayBuffer);
      } else {
        content = await file.text();
      }

      if (!isImage && (!content || content.trim().length === 0)) {
        throw new Error('Could not extract any text from the file.');
      }
      
      setUploadStatus('Saving to Knowledge Base...');
      await addDocument(content, file.name, isImage, base64, file.type); 
      
      setUploadStatus(`Successfully added '${file.name}' to the knowledge base.`);
      setFile(null);
      setPreviewUrl(null);
      if(fileInputRef.current) {
          fileInputRef.current.value = "";
      }
      onUploadSuccess();
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setUploadStatus(`Error: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  }, [file, onUploadSuccess]);

  const statusIcon = () => {
    if (uploadStatus.startsWith('Successfully')) return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    if (uploadStatus.startsWith('Error')) return <XCircleIcon className="w-5 h-5 text-red-500" />;
    return null;
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="p-4 border-2 border-dashed border-white/10 rounded-2xl text-center bg-brand-surface/30 hover:border-brand-primary/50 transition-all cursor-pointer group">
        <UploadIcon className="mx-auto h-10 w-10 text-gray-500 group-hover:text-brand-primary transition-colors mb-2" />
        <label htmlFor="file-upload" className="block text-sm font-medium text-brand-text-primary cursor-pointer">
          Click to browse or drop record
        </label>
        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".txt,.md,.pdf,image/*" ref={fileInputRef} />
        <p className="mt-1 text-xs text-brand-text-secondary">PDF, TXT, MD or Images (JPG/PNG)</p>
      </div>

      {file && (
        <div className="flex items-center justify-between p-4 bg-brand-surface/50 border border-white/5 rounded-xl text-sm animate-fade-in">
            <div className="flex items-center space-x-3 truncate">
              {previewUrl ? (
                  <img src={previewUrl} className="w-10 h-10 rounded object-cover border border-white/10" alt="Preview" />
              ) : (
                  <FileIcon className="h-5 w-5 text-brand-accent flex-shrink-0" />
              )}
              <div className="truncate">
                <span className="block truncate text-brand-text-primary font-medium" title={file.name}>{file.name}</span>
                <span className="text-[10px] text-brand-text-secondary">{(file.size / 1024).toFixed(1)} KB</span>
              </div>
            </div>
          <button onClick={() => {setFile(null); setPreviewUrl(null); if(fileInputRef.current) fileInputRef.current.value = "";}} className="p-1 hover:bg-white/10 rounded-full text-brand-text-secondary hover:text-white transition-colors">&times;</button>
        </div>
      )}
      
      <button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-sm font-bold rounded-xl shadow-lg text-white bg-gradient-to-r from-brand-primary to-brand-accent hover:opacity-90 active:scale-[0.98] disabled:from-slate-700 disabled:to-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isUploading ? <SpinnerIcon className="w-5 h-5 mr-2"/> : <UploadIcon className="w-5 h-5 mr-2" />}
        {isUploading ? 'Analyzing...' : 'Add to Knowledge Base'}
      </button>

      {uploadStatus && (
        <div className="flex items-start space-x-3 text-sm mt-2 p-4 bg-brand-surface/30 border border-white/5 rounded-xl animate-fade-in">
            <div className="mt-0.5">{statusIcon()}</div>
            <p className={uploadStatus.startsWith('Error') ? 'text-red-400' : 'text-brand-text-secondary'}>{uploadStatus}</p>
        </div>
      )}
    </div>
  );
};
