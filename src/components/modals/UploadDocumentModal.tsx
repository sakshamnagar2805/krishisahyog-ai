import React, { useEffect, useState } from 'react';
import { FileText, Upload } from 'lucide-react';
import { Document } from '../../types';
import { dataProvider } from '../../services';
import { Button, Modal, Notice, fieldControl, fieldHint, fieldLabel } from '../ui';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmerId: string;
  defaultDocType?: Document['docType'];
  onSuccess: (uploadedDoc: Document) => void;
}

const FORM_ID = 'upload-document-form';

/** Fingerprints the file locally; returns undefined where Web Crypto is unavailable (non-secure origins). */
const computeSha256 = async (file: File): Promise<string | undefined> => {
  if (!globalThis.crypto?.subtle) return undefined;
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  isOpen,
  onClose,
  farmerId,
  defaultDocType = 'SOWING_CERTIFICATE',
  onSuccess,
}) => {
  const [docType, setDocType] = useState<Document['docType']>(defaultDocType);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start every opening fresh, preselecting the requested document type
  useEffect(() => {
    if (isOpen) {
      setDocType(defaultDocType);
      setFile(null);
      setError(null);
      setDragOver(false);
    }
  }, [isOpen, defaultDocType]);

  if (!isOpen) return null;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('This file is larger than 5 MB. Please choose a smaller file.');
      return;
    }
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Only PDF, JPG or PNG files can be uploaded.');
      return;
    }
    setFile(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please choose a file to upload.');
      return;
    }

    try {
      setIsSubmitting(true);
      const sha256 = await computeSha256(file);
      const uploaded = await dataProvider.uploadDocument(farmerId, docType, {
        name: file.name,
        size: file.size,
        type: file.type,
        sha256,
      });
      setIsSubmitting(false);
      onSuccess(uploaded);
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      setError('The upload did not work. Please try again.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload a document"
      description="The file is kept in this app and marked for review. It is not sent to a government office."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} disabled={isSubmitting || !file}>
            {isSubmitting ? (
              <>
                <span
                  className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"
                  aria-hidden="true"
                />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" aria-hidden="true" />
                Upload document
              </>
            )}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label htmlFor="upload-doc-type" className={fieldLabel}>
            Document type
          </label>
          <select
            id="upload-doc-type"
            value={docType}
            onChange={(e) => setDocType(e.target.value as Document['docType'])}
            className={fieldControl}
          >
            <option value="SOWING_CERTIFICATE">Sowing certificate from the Patwari (Khasra Girdawari)</option>
            <option value="JAMABANDI">Land record (Jamabandi / RoR)</option>
            <option value="BANK_PASSBOOK">Bank passbook</option>
            <option value="AADHAAR">Aadhaar card</option>
            <option value="SOIL_HEALTH_CARD">Soil health card</option>
          </select>
        </div>

        <div>
          <label htmlFor="file-upload" className={fieldLabel}>
            File
          </label>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors focus-within:border-brand-dark ${
              dragOver
                ? 'border-brand-dark bg-brand-light/40'
                : file
                ? 'border-brand-dark/40 bg-offwhite'
                : 'border-line bg-offwhite hover:bg-blue-soft'
            }`}
          >
            <input
              type="file"
              id="file-upload"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              aria-describedby="file-upload-hint"
              className="sr-only"
            />
            {file ? (
              <div className="flex flex-col items-center gap-1.5">
                <FileText className="w-8 h-8 text-brand-dark" aria-hidden="true" />
                <span className="font-semibold text-navy break-all">{file.name}</span>
                <span className="text-sm text-muted tabular-nums">{(file.size / 1024).toFixed(1)} KB · ready to upload</span>
                <label
                  htmlFor="file-upload"
                  className="mt-1 inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-brand-dark hover:underline underline-offset-4"
                >
                  Choose a different file
                </label>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                <Upload className="w-8 h-8 text-muted" aria-hidden="true" />
                <p className="text-[15px] text-ink">
                  Drag the file here, or{' '}
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer font-semibold text-brand-dark hover:underline underline-offset-4"
                  >
                    choose a file
                  </label>
                </p>
              </div>
            )}
          </div>
          <p id="file-upload-hint" className={fieldHint}>
            PDF, JPG or PNG, up to 5 MB.
          </p>
        </div>

        {error && <Notice tone="danger">{error}</Notice>}
      </form>
    </Modal>
  );
};
