
import React, { useState, useEffect, useMemo } from 'react';
import { DocumentUploader } from '../components/DocumentUploader';
import { getFilesMetadata, deleteFile } from '../services/ragService';
import { FileMetadata } from '../types';
import { SpinnerIcon, FileIcon, TrashIcon, SearchIcon, SparklesIcon, BookIcon } from '../components/icons';

interface KnowledgeBasePageProps {
  setPage: (page: 'chat' | 'profile' | 'knowledge') => void;
}

export const KnowledgeBasePage: React.FC<KnowledgeBasePageProps> = ({ setPage }) => {
    const [documents, setDocuments] = useState<FileMetadata[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchDocuments = async () => {
        try {
            setError(null);
            setIsLoading(true);
            const userDocuments = await getFilesMetadata();
            setDocuments(userDocuments);
        } catch (err: any) {
            setError(err.message || "Failed to fetch documents.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const handleDelete = async (doc: FileMetadata) => {
        if (window.confirm(`Are you sure you want to delete "${doc.file_name}"? This will permanently remove it from VEDA's knowledge base.`)) {
            try {
                await deleteFile(doc.id);
                setDocuments(prev => prev.filter(d => d.id !== doc.id));
            } catch (err: any) {
                setError(err.message || "Failed to delete document.");
            }
        }
    };
    
    const filteredDocuments = useMemo(() => 
        documents.filter(doc => 
            doc.file_name.toLowerCase().includes(searchQuery.toLowerCase())
        ), [documents, searchQuery]);

    return (
        <div className="p-6 animate-fade-in max-h-screen overflow-y-auto">
          <div className="w-full max-w-2xl mx-auto p-8 bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40 space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold mb-2 text-brand-text-primary">Veda Knowledge Base</h1>
                    <p className="text-brand-text-secondary text-sm">
                        Manage your health records and reports for personalized guidance.
                    </p>
                </div>
            </div>

            <div className="animate-fade-in space-y-8">
                <div>
                    <h2 className="text-lg font-semibold mb-4 text-brand-text-primary flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-brand-accent" />
                        Upload New Record
                    </h2>
                    <DocumentUploader onUploadSuccess={fetchDocuments} />
                </div>

                <div className="border-b border-white/10"></div>
                
                <div>
                    <h2 className="text-lg font-semibold mb-4 text-brand-text-primary flex items-center gap-2">
                        <BookIcon className="w-5 h-5 text-brand-accent" />
                        Stored Records ({filteredDocuments.length})
                    </h2>
                    <div className="relative mb-4">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-secondary" />
                        <input 
                            type="text"
                            placeholder="Search records..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-brand-surface border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent text-brand-text-primary text-sm"
                        />
                    </div>
                    {isLoading ? (
                        <div className="flex justify-center items-center py-8">
                            <SpinnerIcon className="w-8 h-8 text-brand-primary" />
                        </div>
                    ) : error ? (
                        <p className="text-center text-red-400 py-4">{error}</p>
                    ) : (
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                            {filteredDocuments.length > 0 ? filteredDocuments.map(doc => (
                            <div key={doc.id} className="flex items-center justify-between p-3 bg-brand-surface/70 rounded-lg border border-white/10 hover:border-brand-accent/50 transition-colors group">
                                    <div className="flex items-center space-x-3 truncate">
                                        <FileIcon className="w-5 h-5 text-brand-text-secondary flex-shrink-0" />
                                        <div className="truncate">
                                            <p className="text-sm font-medium text-brand-text-primary truncate" title={doc.file_name}>{doc.file_name}</p>
                                            <p className="text-[10px] text-brand-text-secondary">
                                                Added on {new Date(doc.uploaded_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(doc)} className="p-2 rounded-md hover:bg-red-500/20 text-brand-text-secondary hover:text-red-400 transition-colors opacity-50 group-hover:opacity-100" aria-label={`Delete ${doc.file_name}`}>
                                        <TrashIcon className="w-4 h-4"/>
                                    </button>
                            </div>
                            )) : (
                                <p className="text-center text-brand-text-secondary py-8 text-sm italic">No records found. Upload a report to get started.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 pt-4 border-t border-white/10 flex justify-between">
                 <button type="button" onClick={() => setPage('chat')} className="px-6 py-2 text-sm font-semibold text-brand-text-primary bg-brand-surface rounded-lg hover:bg-opacity-80 transition-colors">
                    Back to Chat
                 </button>
            </div>
          </div>
        </div>
    );
};
