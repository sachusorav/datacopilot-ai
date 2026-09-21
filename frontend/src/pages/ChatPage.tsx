import React from 'react';
import { ChatWidget } from '../components/ChatWidget';

interface ChatPageProps {
  datasetId: string | null;
  filename: string | null;
}

export const ChatPage: React.FC<ChatPageProps> = ({ datasetId, filename }) => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          AI Data Copilot Chat
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Chat with your business data in plain English. Hybrid RAG computes exact math in Pandas & retrieves row details via FAISS.
        </p>
      </div>

      <ChatWidget datasetId={datasetId} filename={filename} />
    </div>
  );
};
