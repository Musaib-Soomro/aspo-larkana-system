import React, { useState, useEffect, useCallback } from 'react';
import { Upload, File, X, Loader2, Paperclip, Download, Trash2, ShieldCheck } from 'lucide-react';
import api from '../../utils/api';
import { useNotifications } from '../../context/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function FileUploader({ entityType, entityId, label = 'Attachments' }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const { notify } = useNotifications();

  const fetchFiles = useCallback(async () => {
    if (!entityId) return;
    setLoading(true);
    try {
      const res = await api.get(`/upload?entity_type=${entityType}&entity_id=${entityId}`);
      setFiles(res.data.data);
    } catch (err) {
      console.error('Failed to fetch attachments:', err);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!entityId) {
      notify('Please save the record first before uploading files.', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('entity_type', entityType);
    formData.append('entity_id', entityId);

    setUploading(true);
    try {
      await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      notify('File uploaded successfully.', 'success');
      fetchFiles();
    } catch (err) {
      notify('Failed to upload file.', 'error');
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this attachment?')) return;
    try {
      await api.delete(`/upload/${id}`);
      notify('Attachment deleted.', 'success');
      fetchFiles();
    } catch (err) {
      notify('Failed to delete attachment.', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-gray-400 dark:text-dark-muted uppercase tracking-wider ml-1">
          {label}
        </label>
        {uploading && (
          <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase animate-pulse">
            <Loader2 size={12} className="animate-spin" />
            Uploading...
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Upload Button */}
        <label className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-border dark:border-dark-border rounded-2xl hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer group">
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
          <div className="w-10 h-10 rounded-full bg-surface dark:bg-dark-surface flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors mb-2">
            <Upload size={20} />
          </div>
          <p className="text-xs font-bold text-gray-500 dark:text-dark-muted group-hover:text-primary transition-colors">
            Click to upload
          </p>
          <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tight">PDF, JPG, PNG (Max 10MB)</p>
        </label>

        {/* File List */}
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {files.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center justify-between p-3 rounded-xl bg-surface dark:bg-dark-surface border border-border/50 dark:border-dark-border/50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-dark-card shadow-sm flex items-center justify-center text-primary shrink-0">
                    <File size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-dark-text truncate pr-2">
                      {file.file_name}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • {new Date(file.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <a
                    href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/${file.file_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-gray-400 hover:text-primary transition-colors"
                    title="Download/View"
                  >
                    <Download size={14} />
                  </a>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="p-1.5 text-gray-400 hover:text-danger transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {files.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full py-8 text-gray-400">
              <Paperclip size={24} className="opacity-20 mb-2" />
              <p className="text-[10px] font-bold uppercase tracking-widest">No attachments</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
