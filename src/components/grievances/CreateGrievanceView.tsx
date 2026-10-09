import React, { useState } from 'react';
import { ArrowLeft, AlertCircle, FileText, Paperclip, Trash2, CheckCircle2, Plus } from 'lucide-react';
import {
  Grievance,
  GrievanceCategory,
  GrievanceAttachment,
  PMFBYClaim,
  Document,
} from '../../types';
import {
  ConfirmationDialog,
  InformationOnlyBanner,
  OfficialPortalButton,
  StatusBadge,
} from '../common';
import { Button, Card, CardHeader, PageHeader, fieldControl, fieldHint, fieldLabel } from '../ui';

interface CreateGrievanceViewProps {
  onBack: () => void;
  onSubmit: (grievanceData: Partial<Grievance>) => Promise<Grievance>;
  onGrievanceCreated: (createdGrievance: Grievance) => void;
  prefillCategory?: GrievanceCategory;
  prefillRelatedClaimId?: string;
  prefillRelatedDocumentName?: string;
  availableClaims?: PMFBYClaim[];
  availableDocuments?: Document[];
}

const CATEGORIES: GrievanceCategory[] = [
  'PMFBY / Crop Insurance',
  'PACS Service',
  'Government Scheme',
  'Agriculture Support',
  'Credit Assistance',
  'Documents',
  'Other',
];

/** Label/value facts in the KeyValueGrid style; a lone last item spans both columns so no empty cell shows */
const FactList: React.FC<{ items: { label: string; value: React.ReactNode }[] }> = ({ items }) => (
  <dl className="grid grid-cols-1 gap-px border-y border-line bg-line sm:grid-cols-2">
    {items.map(({ label, value }) => (
      <div key={label} className="min-w-0 bg-white px-5 py-3 sm:last:odd:col-span-2">
        <dt className="text-[13px] text-muted">{label}</dt>
        <dd className="mt-0.5 font-semibold text-navy break-words">{value}</dd>
      </div>
    ))}
  </dl>
);

const SAMPLE_DEMO_ATTACHMENTS = [
  { name: 'Claim_Deficiency_Notice.pdf', type: 'application/pdf', size: 148200 },
  { name: 'Field_Loss_Survey_Photo.jpg', type: 'image/jpeg', size: 1845000 },
  { name: 'PACS_Fertilizer_Token_Receipt.pdf', type: 'application/pdf', size: 89400 },
  { name: 'Halqa_Patwari_Sowing_Certificate.pdf', type: 'application/pdf', size: 215000 },
];

export const CreateGrievanceView: React.FC<CreateGrievanceViewProps> = ({
  onBack,
  onSubmit,
  onGrievanceCreated,
  prefillCategory = 'PMFBY / Crop Insurance',
  prefillRelatedClaimId = '',
  prefillRelatedDocumentName = '',
  availableClaims = [],
  availableDocuments = [],
}) => {
  const [category, setCategory] = useState<GrievanceCategory>(prefillCategory);
  const [subject, setSubject] = useState(
    prefillRelatedClaimId ? `Help needed with claim ${prefillRelatedClaimId}` : ''
  );
  const [description, setDescription] = useState('');
  const [relatedClaimId, setRelatedClaimId] = useState(prefillRelatedClaimId);
  const [relatedDocumentName, setRelatedDocumentName] = useState(prefillRelatedDocumentName);
  const [attachments, setAttachments] = useState<GrievanceAttachment[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdGrievance, setCreatedGrievance] = useState<Grievance | null>(null);

  const handleAddSampleAttachment = (sample: (typeof SAMPLE_DEMO_ATTACHMENTS)[0]) => {
    const newAtt: GrievanceAttachment = {
      id: `ATT-DEMO-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: sample.name,
      type: sample.type,
      size: sample.size,
      uploadDate: new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      isDemo: true,
    };
    setAttachments((prev) => [...prev, newAtt]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newAtt: GrievanceAttachment = {
        id: `ATT-DEMO-${Date.now()}`,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        uploadDate: new Date().toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        isDemo: true,
      };
      setAttachments((prev) => [...prev, newAtt]);
      e.target.value = '';
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!category) newErrors.category = 'Choose what the grievance is about.';
    if (!subject.trim()) newErrors.subject = 'Enter a subject.';
    else if (subject.length > 120) newErrors.subject = 'Subject must be 120 characters or fewer.';

    if (!description.trim()) newErrors.description = 'Describe the problem.';
    else if (description.trim().length < 10)
      newErrors.description = 'Add a little more detail. Write at least 10 characters.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmCreate = async () => {
    setShowConfirmDialog(false);
    setIsSubmitting(true);
    try {
      const newRecord = await onSubmit({
        category,
        subject: subject.trim(),
        description: description.trim(),
        relatedClaimId: relatedClaimId || undefined,
        relatedDocumentName: relatedDocumentName || undefined,
        attachments,
      });
      setCreatedGrievance(newRecord);
    } catch (err) {
      console.error('Failed to create demo grievance:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatSize = (bytes: number) => `${Math.max(1, Math.round(bytes / 1024)).toLocaleString('en-IN')} KB`;

  const errorText = (field: string) =>
    errors[field] ? (
      <p id={`grievance-${field}-error`} className="mt-1.5 flex items-center gap-1.5 text-sm text-danger">
        <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
        {errors[field]}
      </p>
    ) : null;

  const controlClass = (field: string) =>
    errors[field] ? fieldControl.replace('border-line', 'border-danger') : fieldControl;

  const describedBy = (field: string, hintId?: string) =>
    [hintId, errors[field] ? `grievance-${field}-error` : undefined].filter(Boolean).join(' ') || undefined;

  // Keep a prefilled claim selectable even if it is not in the claims list
  const claimOptions = availableClaims.map((cl) => ({
    value: cl.claimId || cl.id,
    label: `${cl.claimId || cl.id} — ${cl.crop} (${cl.season} ${cl.year})`,
  }));
  if (prefillRelatedClaimId && !claimOptions.some((opt) => opt.value === prefillRelatedClaimId)) {
    claimOptions.unshift({ value: prefillRelatedClaimId, label: prefillRelatedClaimId });
  }

  const backLink = (
    <Button variant="link" onClick={onBack}>
      <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back to grievances
    </Button>
  );

  // SUCCESS STATE SCREEN
  if (createdGrievance) {
    const facts = [
      {
        label: 'Grievance ID',
        value: <span className="tabular-nums">{createdGrievance.grievanceId || createdGrievance.id}</span>,
      },
      { label: 'Status', value: <StatusBadge status={createdGrievance.status} /> },
      { label: 'Category', value: createdGrievance.category },
      ...(createdGrievance.relatedClaimId
        ? [{ label: 'Related claim', value: <span className="tabular-nums">{createdGrievance.relatedClaimId}</span> }]
        : []),
      ...(createdGrievance.relatedDocumentName
        ? [{ label: 'Related document', value: createdGrievance.relatedDocumentName }]
        : []),
    ];

    return (
      <div className="space-y-6" id="create-grievance-success">
        <div>{backLink}</div>
        <PageHeader
          title="Grievance saved"
          description="Your grievance is saved in KrishiSahyog. Note down the grievance ID so you can track it."
        />

        <Card className="max-w-3xl overflow-hidden">
          <CardHeader
            title={createdGrievance.subject}
            icon={<CheckCircle2 className="w-5 h-5 text-brand-dark" aria-hidden="true" />}
            description={`Filed ${createdGrievance.lodgedDate || new Date(createdGrievance.createdAt).toLocaleDateString('en-IN')}`}
          />
          <FactList items={facts} />
          <div className="px-5 py-4 space-y-4">
            <p className="text-sm text-muted">
              This grievance is not sent to a government office. To file an official complaint, use the CPGRAMS portal.
            </p>
            <div className="flex flex-col-reverse sm:flex-row sm:flex-wrap sm:justify-end gap-2">
              <OfficialPortalButton href="https://pgportal.gov.in" portalName="CPGRAMS portal (pgportal.gov.in)" />
              <Button variant="secondary" onClick={onBack}>
                Back to grievances
              </Button>
              <Button onClick={() => onGrievanceCreated(createdGrievance)}>Track this grievance</Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // CREATE FORM VIEW
  return (
    <div className="space-y-6" id="create-grievance-form-container">
      <div>{backLink}</div>

      <PageHeader
        title="Raise a grievance"
        description="Tell us what went wrong. We keep a record here so you can track it and have the details ready for the official complaint."
        actions={<OfficialPortalButton href="https://pgportal.gov.in" portalName="CPGRAMS portal (pgportal.gov.in)" />}
      />

      <InformationOnlyBanner message="This app does not file complaints with the government. Your grievance is saved in KrishiSahyog only. To file an official complaint, use the CPGRAMS portal (pgportal.gov.in)." />

      <Card as="div" className="max-w-3xl">
        <form onSubmit={handleFormSubmit} noValidate>
          <div className="p-5 sm:p-6 space-y-5">
            {/* Category */}
            <div>
              <label htmlFor="grievance-category" className={fieldLabel}>
                What is the grievance about?
              </label>
              <select
                id="grievance-category"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as GrievanceCategory);
                  if (errors.category) setErrors((prev) => ({ ...prev, category: '' }));
                }}
                aria-invalid={errors.category ? true : undefined}
                aria-describedby={describedBy('category')}
                className={controlClass('category')}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errorText('category')}
            </div>

            {/* Subject */}
            <div>
              <label htmlFor="grievance-subject" className={fieldLabel}>
                Subject
              </label>
              <input
                id="grievance-subject"
                type="text"
                value={subject}
                maxLength={120}
                onChange={(e) => {
                  setSubject(e.target.value);
                  if (errors.subject) setErrors((prev) => ({ ...prev, subject: '' }));
                }}
                placeholder="For example: Claim payment not received"
                aria-invalid={errors.subject ? true : undefined}
                aria-describedby={describedBy('subject', 'grievance-subject-hint')}
                className={controlClass('subject')}
              />
              <div className="flex flex-wrap justify-between gap-x-3">
                <p id="grievance-subject-hint" className={fieldHint}>
                  One short line about the problem.
                </p>
                <p className={`${fieldHint} tabular-nums`}>
                  {subject.length} of 120 characters
                </p>
              </div>
              {errorText('subject')}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="grievance-description" className={fieldLabel}>
                Describe the problem
              </label>
              <p id="grievance-description-hint" className="text-[13px] text-muted mb-1.5">
                Say what happened, when, who you spoke to and what you want done. Do not write passwords, OTPs or bank
                PINs.
              </p>
              <textarea
                id="grievance-description"
                value={description}
                rows={5}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
                }}
                aria-invalid={errors.description ? true : undefined}
                aria-describedby={describedBy('description', 'grievance-description-hint')}
                className={controlClass('description')}
              ></textarea>
              {errorText('description')}
            </div>

            {/* Related records */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="min-w-0">
                <label htmlFor="grievance-related-claim" className={fieldLabel}>
                  Related crop insurance claim (optional)
                </label>
                <select
                  id="grievance-related-claim"
                  value={relatedClaimId}
                  onChange={(e) => setRelatedClaimId(e.target.value)}
                  className={fieldControl}
                >
                  <option value="">Not related to a claim</option>
                  {claimOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <label htmlFor="grievance-related-document" className={fieldLabel}>
                  Related document (optional)
                </label>
                <input
                  id="grievance-related-document"
                  type="text"
                  value={relatedDocumentName}
                  onChange={(e) => setRelatedDocumentName(e.target.value)}
                  placeholder="For example: Land record (Jamabandi)"
                  list={availableDocuments.length ? 'grievance-document-options' : undefined}
                  aria-describedby="grievance-related-document-hint"
                  className={fieldControl}
                />
                {availableDocuments.length > 0 && (
                  <datalist id="grievance-document-options">
                    {availableDocuments.map((doc) => (
                      <option key={doc.id} value={doc.title} />
                    ))}
                  </datalist>
                )}
                <p id="grievance-related-document-hint" className={fieldHint}>
                  Type or pick a document from your locker.
                </p>
              </div>
            </div>

            {/* Attachments */}
            <fieldset className="space-y-3">
              <legend className={fieldLabel}>Attachments (optional)</legend>
              <p className="text-[13px] text-muted">
                Photos or papers that support your grievance. Files stay in this app and are not sent anywhere.
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-line bg-white px-4 text-[15px] font-semibold text-ink hover:bg-offwhite focus-within:ring-2 focus-within:ring-brand-dark/30">
                  <Paperclip className="w-4 h-4" aria-hidden="true" />
                  Attach a file
                  <input type="file" className="sr-only" onChange={handleFileUpload} />
                </label>
              </div>

              <div>
                <p className="text-[13px] text-muted mb-1.5">Or add a sample file for this demo:</p>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_DEMO_ATTACHMENTS.map((sample, idx) => (
                    <Button
                      key={idx}
                      variant="secondary"
                      size="sm"
                      onClick={() => handleAddSampleAttachment(sample)}
                      className="max-w-full font-medium"
                    >
                      <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{sample.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {attachments.length > 0 && (
                <ul className="divide-y divide-line rounded-md border border-line">
                  {attachments.map((att) => (
                    <li key={att.id} className="flex items-center gap-3 pl-3">
                      <FileText className="w-5 h-5 shrink-0 text-navy" aria-hidden="true" />
                      <div className="min-w-0 flex-1 py-2">
                        <p className="truncate text-[15px] text-ink">{att.name}</p>
                        <p className="text-[13px] text-muted tabular-nums">{formatSize(att.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(att.id)}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-danger hover:bg-danger/5"
                        aria-label={`Remove ${att.name}`}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </fieldset>
          </div>

          {/* Submit */}
          <div className="flex flex-col gap-3 border-t border-line bg-offwhite px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 rounded-b-lg">
            <p className="text-sm text-muted">You can check the details before saving.</p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button variant="secondary" onClick={onBack}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} id="create-demo-grievance-btn">
                {isSubmitting ? 'Saving…' : 'Save grievance'}
              </Button>
            </div>
          </div>
        </form>
      </Card>

      <ConfirmationDialog
        isOpen={showConfirmDialog}
        title="Save this grievance?"
        description="Check that the category, subject and description are correct. After saving, you can track this grievance from your list."
        confirmLabel="Save grievance"
        cancelLabel="Go back and edit"
        onConfirm={handleConfirmCreate}
        onCancel={() => setShowConfirmDialog(false)}
      />
    </div>
  );
};
