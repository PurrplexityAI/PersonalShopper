import React, { useState, useRef } from 'react';
import { X, Download, Upload, RotateCcw, Smartphone, Check, AlertCircle, Info } from 'lucide-react';
import { api } from '../api';

interface DataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => Promise<void>;
}

export const DataModal: React.FC<DataModalProps> = ({ isOpen, onClose, onRefreshData }) => {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `personal-shopper-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage('Pantry inventory exported successfully!');
    } catch (err: any) {
      setError(err.message || 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      const text = await file.text();
      const parsed = JSON.parse(text);
      const items = Array.isArray(parsed) ? parsed : parsed.items;
      if (!Array.isArray(items)) {
        throw new Error('Invalid JSON format: Expected array of items.');
      }
      const msg = await api.importData(items);
      setMessage(msg);
      await onRefreshData();
    } catch (err: any) {
      setError(err.message || 'Import failed. Check file format.');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleResetSample = async () => {
    if (!window.confirm('Reset pantry to sample grocery items? Your current entries will be replaced.')) {
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await api.resetSampleData();
      setMessage('Reset to sample pantry items successfully.');
      await onRefreshData();
    } catch (err: any) {
      setError(err.message || 'Failed to reset data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Data, Sync & Mobile Access</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4">
          {message && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-800 text-xs">
              <Check className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Mobile Access Guide */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center space-x-2 text-emerald-900 font-bold text-xs">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>Mobile Phone Access (Local Wi-Fi)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              To use Personal Shopper on your phone, connect to the same Wi-Fi network and open your computer's IP address:
            </p>
            <div className="bg-white px-3 py-2 rounded-lg border border-emerald-200 text-xs font-mono text-emerald-800 flex items-center justify-between">
              <span>http://&lt;your-pc-ip&gt;:5173</span>
              <span className="text-[10px] text-slate-400 font-sans font-normal">Check terminal on start</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Tip: On iOS Safari or Android Chrome, tap <strong>"Share" &gt; "Add to Home Screen"</strong> for a native app feel!
            </p>
          </div>

          {/* Backup & Restore */}
          <div className="space-y-2 pt-1">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Backup & Restore Data
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExport}
                disabled={loading}
                className="flex items-center justify-center space-x-2 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Export Backup (JSON)</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="flex items-center justify-center space-x-2 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors"
              >
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>Import Backup</span>
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportFile}
              accept=".json"
              className="hidden"
            />
          </div>

          {/* Reset to Samples */}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={handleResetSample}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold border border-rose-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Sample Groceries</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
