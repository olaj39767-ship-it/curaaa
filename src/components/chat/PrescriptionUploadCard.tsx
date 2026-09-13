import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  X,
  MessageCircle,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  ArrowRight,
  User,
  Store,
  Warehouse,
  Keyboard,
  Paperclip,
} from 'lucide-react';

type CustomerType = 'individual' | 'retailer' | 'wholesaler';
type InputMode = 'upload' | 'type';

interface PrescriptionUploadCardProps {
  onCancel: () => void;
  onContinueToWebQuote?: () => void;
}

interface TypeConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  cardTitle: string;
  cardSubtitle: string;
  accept: string;
  acceptHint: string;
  dropzoneTitle: string;
  typedListLabel: string;
  typedListPlaceholder: string;
  notesLabel: string;
  notesPlaceholder: string;
  businessFieldLabel: string | null; // null = don't show a business-name field
  trustText: string;
  whatsappGreeting: string;
  contentHeading: string; // heading used in the WhatsApp message above the typed/attached content
}

const TYPE_CONFIG: Record<CustomerType, TypeConfig> = {
  individual: {
    label: 'Patient',
    icon: User,
    cardTitle: 'Upload Your Prescription',
    cardSubtitle: "Attach your doctor's slip, or type out what's on it.",
    accept: 'image/*,.pdf',
    acceptHint: 'Supports JPEG, PNG, PDF (Up to 15MB)',
    dropzoneTitle: 'Tap to choose file or drag & drop here',
    typedListLabel: 'Type out your prescription',
    typedListPlaceholder: 'e.g. Coartem 20/120mg — 1 pack\nVitamin C 1000mg — 1 pack',
    notesLabel: 'Special instructions (optional)',
    notesPlaceholder: 'e.g. Need this delivered before 6pm',
    businessFieldLabel: null,
    trustText: 'Licensed PCN Clinical Pharmacist reviews every submission for dosage safety.',
    whatsappGreeting: 'Hello Curadeck Clinical Pharmacy,\nI would like to order medication with my prescription.',
    contentHeading: 'Prescription',
  },
  retailer: {
    label: 'Retailer',
    icon: Store,
    cardTitle: 'Upload Your Order List',
    cardSubtitle: 'Send the products your pharmacy or store needs to restock — file or typed.',
    accept: '.csv,.xlsx,.xls,.pdf,image/*',
    acceptHint: 'Supports CSV, Excel, PDF, or a clear photo (Up to 15MB)',
    dropzoneTitle: 'Tap to upload your restock list',
    typedListLabel: 'Type out your order list',
    typedListPlaceholder: 'e.g. Coartem 20/120mg — 50 packs\nAugmentin 625mg — 20 packs',
    notesLabel: 'Quantities or brand preferences (optional)',
    notesPlaceholder: 'e.g. Prefer GSK brand where available',
    businessFieldLabel: 'Pharmacy / Store name',
    trustText: 'A Curadeck account manager reviews every list for pricing and stock availability.',
    whatsappGreeting: 'Hello Curadeck Wholesale Desk,\nI would like to place a restock order for my store.',
    contentHeading: 'Order List',
  },
  wholesaler: {
    label: 'Wholesaler',
    icon: Warehouse,
    cardTitle: 'Upload Your Product List',
    cardSubtitle: 'Send your available stock or price list — file or typed — for our sourcing team.',
    accept: '.csv,.xlsx,.xls,.pdf,image/*',
    acceptHint: 'Supports CSV, Excel, PDF, or a clear photo (Up to 15MB)',
    dropzoneTitle: 'Tap to upload your product/price list',
    typedListLabel: 'Type out your product list',
    typedListPlaceholder: 'e.g. Paracetamol 500mg — ₦900/pack, 500 packs available\nORS sachets — ₦150/unit, 2,000 units available',
    notesLabel: 'MOQ, lead time, or other notes (optional)',
    notesPlaceholder: 'e.g. MOQ 100 units, 3-day lead time',
    businessFieldLabel: 'Company name',
    trustText: 'Our sourcing team reviews every submission and reaches out about active supply needs.',
    whatsappGreeting: 'Hello Curadeck Sourcing Team,\nI would like to share our product/price list for supply consideration.',
    contentHeading: 'Product List',
  },
};

export const PrescriptionUploadCard: React.FC<PrescriptionUploadCardProps> = ({
  onCancel,
  onContinueToWebQuote,
}) => {
  const [customerType, setCustomerType] = useState<CustomerType>('individual');
  const [inputMode, setInputMode] = useState<InputMode>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [typedList, setTypedList] = useState('');
  const [notes, setNotes] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = TYPE_CONFIG[customerType];
  const isListUpload = customerType !== 'individual';
  const hasContent = inputMode === 'upload' ? !!file : typedList.trim().length > 0;

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

  const handleTypeChange = (type: CustomerType) => {
    // Clear content when switching customer type since accepted formats /
    // expectations differ (e.g. a prescription photo isn't a product list).
    if (type !== customerType) {
      handleRemoveFile();
      setTypedList('');
    }
    setCustomerType(type);
  };

  const handleInputModeChange = (mode: InputMode) => {
    if (mode !== inputMode) {
      handleRemoveFile();
      setTypedList('');
    }
    setInputMode(mode);
  };

  const handleSendToWhatsApp = () => {
    const phoneNumber = '2348002872332'; // Curadeck hotline (shared across desks)

    const contentBlock =
      inputMode === 'upload'
        ? `[${config.contentHeading} Attached: ${file ? file.name : 'to be sent'}]`
        : `${config.contentHeading}:\n${typedList.trim() || '(none entered)'}`;

    const bizText = businessName.trim() ? `\n${config.businessFieldLabel || 'Business'}: ${businessName.trim()}` : '';
    const notesText = notes.trim() ? `\nNotes: "${notes.trim()}"` : '';
    const closing = isListUpload
      ? 'Please send pricing and confirm availability.'
      : 'Please quote price and confirm availability for Lagos delivery.';

    const message = `${config.whatsappGreeting}\n\n${contentBlock}${bizText}${notesText}\n\n${closing}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

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
              {config.cardTitle}
            </h4>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {config.cardSubtitle}
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

      {/* Customer type selector */}
      <div>
        <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
          Who's this order for?
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {(Object.keys(TYPE_CONFIG) as CustomerType[]).map((type) => {
            const { label, icon: Icon } = TYPE_CONFIG[type];
            const active = customerType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => handleTypeChange(type)}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-1.5 rounded-xl border text-[11px] font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'bg-teal-50 border-teal-500 text-teal-800'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Business name field — retailers & wholesalers only */}
      {config.businessFieldLabel && (
        <div>
          <label className="text-[11px] font-bold text-slate-700 block mb-1">
            {config.businessFieldLabel}
          </label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder={customerType === 'wholesaler' ? 'e.g. Sunrise Pharma Distributors' : 'e.g. Grace Pharmacy, Ikeja'}
            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-slate-50/50"
          />
        </div>
      )}

      {/* Upload-file vs type-it-in toggle */}
      <div>
        <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
          How would you like to share it?
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => handleInputModeChange('upload')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border text-[11.5px] font-semibold transition-colors cursor-pointer ${
              inputMode === 'upload'
                ? 'bg-teal-50 border-teal-500 text-teal-800'
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            <Paperclip className="w-3.5 h-3.5" />
            Upload a file
          </button>
          <button
            type="button"
            onClick={() => handleInputModeChange('type')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border text-[11.5px] font-semibold transition-colors cursor-pointer ${
              inputMode === 'type'
                ? 'bg-teal-50 border-teal-500 text-teal-800'
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            Type it in
          </button>
        </div>
      </div>

      {inputMode === 'upload' ? (
        !file ? (
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
              key={customerType}
              ref={fileInputRef}
              type="file"
              accept={config.accept}
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
                {config.dropzoneTitle}
              </p>
              <p className="text-[11px] text-slate-400">
                {config.acceptHint}
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
                  alt="Upload preview"
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
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      ) : (
        /* Type-it-in mode */
        <div>
          <label className="text-[11px] font-bold text-slate-700 block mb-1">
            {config.typedListLabel}
          </label>
          <textarea
            value={typedList}
            onChange={(e) => setTypedList(e.target.value)}
            placeholder={config.typedListPlaceholder}
            rows={4}
            className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-slate-50/50 resize-none"
          />
        </div>
      )}

      {/* Notes (Optional) */}
      <div>
        <label className="text-[11px] font-bold text-slate-700 block mb-1">
          {config.notesLabel}
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={config.notesPlaceholder}
          className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-slate-50/50"
        />
      </div>

      {/* Trust notice */}
      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
        <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
        <span>{config.trustText}</span>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-1">
        {/* Primary: Redirect to WhatsApp */}
        <button
          onClick={handleSendToWhatsApp}
          disabled={!hasContent}
          className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all ${
            hasContent
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-98'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>
            {isListUpload ? 'Send List on WhatsApp' : 'Continue to WhatsApp with Prescription'}
          </span>
          <ExternalLink className="w-3.5 h-3.5 opacity-80" />
        </button>

        {/* Secondary: In-App Web Quote Option */}
        {onContinueToWebQuote && (
          <button
            onClick={onContinueToWebQuote}
            className="w-full py-2 px-3 text-xs text-slate-600 hover:text-teal-800 font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
          >
            <span>Or submit {isListUpload ? 'your list' : 'a quote'} directly on Curadeck Web</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};