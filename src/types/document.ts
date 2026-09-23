export type SigningType = 'DIRECT' | 'TM' | 'KT' | 'TL' | 'Q';

export interface DocumentMetadata {
  documentType: string;
  parentOrganization: string;
  issuingOrganization: string;
  documentCode: string;
  location: string;
  date: string; // YYYY-MM-DD
  subject: string;
  signerTitle: string;
  signerName: string;
  signingType: SigningType;
  recipients: string; // Newline or comma separated
}

export interface FixLog {
  id: string;
  ruleId: string;
  ruleDescription: string;
  timestamp: string;
  fieldAffected: string;
  beforeValue: string;
  afterValue: string;
}

export type Severity = 'error' | 'warning';

export interface ValidationIssue {
  id: string;
  ruleId: string;
  description: string;
  severity: Severity;
  field: keyof DocumentMetadata | 'content';
  canAutoFix: boolean;
  message: string;
  suggestedValue?: string;
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  severity: Severity;
  category: 'metadata' | 'content' | 'layout';
  check: (meta: DocumentMetadata, content: string) => ValidationIssue[];
  autoFix?: (meta: DocumentMetadata, content: string) => {
    meta?: Partial<DocumentMetadata>;
    content?: string;
    description: string;
  };
}
