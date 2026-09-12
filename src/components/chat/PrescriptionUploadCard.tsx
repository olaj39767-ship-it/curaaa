import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  X, 
  MessageCircle, 
  ShieldCheck, 
  ExternalLink,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

interface PrescriptionUploadCardProps {
  onCancel: () => void;
  onContinueToWebQuote?: () => void;
}

export const PrescriptionUploadCard: React.FC<PrescriptionUploadCardProps> = ({
  onCancel,
  onContinueToWebQuote
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setFilePreview(url);
    } else {
      setFilePreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendToWhatsApp = () => {
    const phoneNumber = '2348002872332'; // Curadeck Pharmacy hotline
    const fileNameText = file ? `[Prescription Attached: ${file.name}]` : '[Prescription to be sent]';
    const notesText = notes.trim() ? `\nPatient Notes: "${notes.trim()}"` : '';

    const message = `Hello Curadeck Clinical Pharmacy,\nI would like to order medication with my prescription.\n\n${fileNameText}${notesText}\n\nPlease quote price and confirm availability for Lagos delivery.`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-white border border-teal-200/90 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 animate-in fade-in zoom-in-95 duration-200">
      
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-600"></span>
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">
              Upload Your Prescription
            </h4>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Attach your doctor&apos;s slip or medicine box photo.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          aria-label="Close upload"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Upload Zone */}
      {!file ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
            isDragging
              ? 'border-teal-500 bg-teal-50/50 scale-[1.01]'
              : 'border-slate-200 hover:border-teal-400 hover:bg-slate-50/70'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs sm:text-sm font-bold text-slate-800">
              Tap to choose file or drag & drop here
            </p>
            <p className="text-[11px] text-slate-400">
              Supports JPEG, PNG, PDF (Up to 15MB)
            </p>
          </div>
        </div>
      ) : (
        /* File Preview Box */
        <div className="border border-teal-200 bg-teal-50/30 rounded-xl p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {filePreview ? (
              <img
                src={filePreview}
                alt="Prescription preview"
                className="w-12 h-12 rounded-lg object-cover border border-teal-200 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <p className="text-xs font-bold text-slate-900 truncate">
                  {file.name}
                </p>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to dispatch
              </p>
            </div>
          </div>

          <button
            onClick={handleRemoveFile}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
            aria-label="Remove prescription"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Patient Notes (Optional) */}
      <div>
        <label className="text-[11px] font-bold text-slate-700 block mb-1">
          Special instructions or drug names (optional)
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Need 2 packs of Coartem + Vitamin C"
          className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-slate-50/50"
        />
      </div>

      {/* Trust notice */}
      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
        <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
        <span>
          Licensed PCN Clinical Pharmacist reviews every upload for dosage safety.
        </span>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-1">
        {/* Primary: Redirect to WhatsApp */}
        <button
          onClick={handleSendToWhatsApp}
          className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-98"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Continue to WhatsApp with Prescription</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-80" />
        </button>

        {/* Secondary: In-App Web Quote Option */}
        {onContinueToWebQuote && (
          <button
            onClick={onContinueToWebQuote}
            className="w-full py-2 px-3 text-xs text-slate-600 hover:text-teal-800 font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
          >
            <span>Or submit quote directly on Curadeck Web</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
