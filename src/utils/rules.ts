import { Rule, DocumentMetadata, ValidationIssue, SigningType } from '../types/document';

// Chuyển chữ thành dạng viết hoa chữ đầu mỗi từ (Title Case) cho địa danh, họ tên
export function toTitleCase(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Chuyển chữ cái đầu tiên của chuỗi thành viết hoa
export function capitalizeFirstLetter(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Hàm trích xuất từ viết tắt của cơ quan ban hành (dùng để gợi ý Số/Ký hiệu)
export function getAcronym(orgName: string): string {
  if (!orgName) return 'ABC';
  // Loại bỏ các từ chung như "Sở", "Ủy ban", "Bộ", "Cục", "Chi cục" để lấy ký hiệu chính
  const cleanName = orgName
    .replace(/^(Sở|Cục|Ủy ban nhân dân|Ủy ban|Bộ|Chi cục|Tổng cục|Văn phòng|Trung tâm)\s+/i, '');
  
  const words = cleanName.split(/\s+/);
  const acronym = words
    .map(w => w.charAt(0))
    .join('')
    .toUpperCase();
  
  // Loại bỏ dấu tiếng Việt để lấy ký hiệu Latinh chuẩn hành chính
  return acronym
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Đ/g, 'D');
}

export const rules: Rule[] = [
  // --- NHÓM QUY TẮC CƠ QUAN BAN HÀNH ---
  {
    id: 'RULE_PARENT_ORG_UPPERCASE',
    name: 'Cơ quan chủ quản viết hoa',
    description: 'Tên cơ quan chủ quản cấp trên (nếu có) phải viết hoa, chữ thường, không in đậm theo quy định.',
    severity: 'warning',
    category: 'metadata',
    check: (meta, content) => {
      if (meta.parentOrganization && meta.parentOrganization !== meta.parentOrganization.toUpperCase()) {
        return [{
          id: `parent-org-case-${Date.now()}`,
          ruleId: 'RULE_PARENT_ORG_UPPERCASE',
          description: 'Cơ quan chủ quản chưa viết hoa toàn bộ chữ cái.',
          severity: 'warning',
          field: 'parentOrganization',
          canAutoFix: true,
          message: `Nên chuyển "${meta.parentOrganization}" thành dạng viết hoa chữ in: "${meta.parentOrganization.toUpperCase()}".`,
          suggestedValue: meta.parentOrganization.toUpperCase()
        }];
      }
      return [];
    },
    autoFix: (meta, content) => {
      const original = meta.parentOrganization;
      const fixed = original.toUpperCase();
      return {
        meta: { parentOrganization: fixed },
        description: `Đã chuyển cơ quan chủ quản thành viết hoa: "${original}" -> "${fixed}"`
      };
    }
  },
  {
    id: 'RULE_ISSUING_ORG_UPPERCASE',
    name: 'Cơ quan ban hành viết hoa',
    description: 'Tên cơ quan, tổ chức ban hành văn bản phải viết hoa hoàn bộ chữ cái (và in đậm khi hiển thị).',
    severity: 'error',
    category: 'metadata',
    check: (meta, content) => {
      if (!meta.issuingOrganization) {
        return [{
          id: `issuing-org-empty-${Date.now()}`,
          ruleId: 'RULE_ISSUING_ORG_UPPERCASE',
          description: 'Tên cơ quan ban hành văn bản không được để trống.',
          severity: 'error',
          field: 'issuingOrganization',
          canAutoFix: false,
          message: 'Bắt buộc nhập tên cơ quan ban hành văn bản.'
        }];
      }
      if (meta.issuingOrganization !== meta.issuingOrganization.toUpperCase()) {
        return [{
          id: `issuing-org-case-${Date.now()}`,
          ruleId: 'RULE_ISSUING_ORG_UPPERCASE',
          description: 'Tên cơ quan ban hành phải viết hoa toàn bộ.',
          severity: 'error',
          field: 'issuingOrganization',
          canAutoFix: true,
          message: `Cần chuyển "${meta.issuingOrganization}" thành chữ in hoa toàn bộ: "${meta.issuingOrganization.toUpperCase()}".`,
          suggestedValue: meta.issuingOrganization.toUpperCase()
        }];
      }
      return [];
    },
    autoFix: (meta, content) => {
      const original = meta.issuingOrganization;
      const fixed = original.toUpperCase();
      return {
        meta: { issuingOrganization: fixed },
        description: `Đã chuyển cơ quan ban hành thành viết hoa: "${original}" -> "${fixed}"`
      };
    }
  },

  // --- NHÓM QUY TẮC SỐ, KÝ HIỆU VĂN BẢN ---
  {
    id: 'RULE_DOCUMENT_CODE_FORMAT',
    name: 'Định dạng Số, ký hiệu văn bản',
    description: 'Số, ký hiệu văn bản phải đúng định dạng hành chính. Ví dụ: "Số: 123/QĐ-UBND" hoặc "Số: 456/STTTT-CNTT" (đối với Công văn).',
    severity: 'error',
    category: 'metadata',
    check: (meta, content) => {
      if (!meta.documentCode) {
        return [{
          id: `doc-code-empty-${Date.now()}`,
          ruleId: 'RULE_DOCUMENT_CODE_FORMAT',
          description: 'Số, ký hiệu văn bản đang trống.',
          severity: 'error',
          field: 'documentCode',
          canAutoFix: true,
          message: 'Số, ký hiệu văn bản trống. Sẽ tự động đề xuất định dạng chuẩn dựa trên loại văn bản và cơ quan ban hành.',
          suggestedValue: `.../${meta.documentType === 'Công văn' ? getAcronym(meta.issuingOrganization) : 'QĐ-' + getAcronym(meta.issuingOrganization)}`
        }];
      }

      // Check if it matches patterns like "[Số]/[Chữ viết tắt]"
      const hasSlash = meta.documentCode.includes('/');
      const isLetter = meta.documentType === 'Công văn';
      
      if (!hasSlash) {
        let suggested = meta.documentCode;
        const acronym = getAcronym(meta.issuingOrganization);
        if (isLetter) {
          suggested = `${meta.documentCode}/${acronym}`;
        } else {
          const typeAbbr = meta.documentType === 'Quyết định' ? 'QĐ' : 
                          meta.documentType === 'Thông báo' ? 'TB' :
                          meta.documentType === 'Báo cáo' ? 'BC' : 
                          meta.documentType === 'Tờ trình' ? 'TTr' :
                          meta.documentType === 'Kế hoạch' ? 'KH' : 'VB';
          suggested = `${meta.documentCode}/${typeAbbr}-${acronym}`;
        }

        return [{
          id: `doc-code-slash-${Date.now()}`,
          ruleId: 'RULE_DOCUMENT_CODE_FORMAT',
          description: 'Số, ký hiệu thiếu dấu gạch chéo phân tách giữa số và chữ viết tắt.',
          severity: 'error',
          field: 'documentCode',
          canAutoFix: true,
          message: `Số, ký hiệu phải có cấu trúc phân tách gạch chéo. Gợi ý tự sửa thành: "${suggested}".`,
          suggestedValue: suggested
        }];
      }
      return [];
    },
    autoFix: (meta, content) => {
      const original = meta.documentCode || '123';
      const isLetter = meta.documentType === 'Công văn';
      const acronym = getAcronym(meta.issuingOrganization);
      let fixed = original;
      
      if (!original.includes('/')) {
        if (isLetter) {
          fixed = `${original}/${acronym}`;
        } else {
          const typeAbbr = meta.documentType === 'Quyết định' ? 'QĐ' : 
                          meta.documentType === 'Thông báo' ? 'TB' :
                          meta.documentType === 'Báo cáo' ? 'BC' : 
                          meta.documentType === 'Tờ trình' ? 'TTr' : 'KH';
          fixed = `${original}/${typeAbbr}-${acronym}`;
        }
      }
      return {
        meta: { documentCode: fixed },
        description: `Đã tự động sửa cấu trúc Số/Ký hiệu hành chính thành: "${fixed}"`
      };
    }
  },

  // --- NHÓM QUY TẮC ĐỊA DANH, THỜI GIAN ---
  {
    id: 'RULE_LOCATION_TITLE_CASE',
    name: 'Địa danh ban hành viết hoa danh từ riêng',
    description: 'Địa danh ban hành văn bản hành chính phải viết hoa đúng quy chuẩn danh từ riêng (chữ cái đầu mỗi từ).',
    severity: 'warning',
    category: 'metadata',
    check: (meta, content) => {
      if (!meta.location) {
        return [{
          id: `loc-empty-${Date.now()}`,
          ruleId: 'RULE_LOCATION_TITLE_CASE',
          description: 'Địa danh ban hành trống.',
          severity: 'warning',
          field: 'location',
          canAutoFix: true,
          message: 'Nên nhập địa danh ban hành văn bản (Ví dụ: "Hà Nội", "Lâm Đồng").',
          suggestedValue: 'Hà Nội'
        }];
      }
      const titleCased = toTitleCase(meta.location);
      if (meta.location !== titleCased) {
        return [{
          id: `loc-case-${Date.now()}`,
          ruleId: 'RULE_LOCATION_TITLE_CASE',
          description: 'Địa danh chưa viết hoa chuẩn danh từ riêng.',
          severity: 'warning',
          field: 'location',
          canAutoFix: true,
          message: `Nên chuyển "${meta.location}" thành viết hoa chữ đầu: "${titleCased}".`,
          suggestedValue: titleCased
        }];
      }
      return [];
    },
    autoFix: (meta, content) => {
      const original = meta.location || 'hà nội';
      const fixed = toTitleCase(original);
      return {
        meta: { location: fixed },
        description: `Đã chuẩn hóa viết hoa địa danh: "${original}" -> "${fixed}"`
      };
    }
  },
  {
    id: 'RULE_DATE_FORMAT_DECREE_30',
    name: 'Định dạng thời gian theo Nghị định 30',
    description: 'Ngày dưới 10 và tháng 1, 2 phải có số "0" phía trước. Tháng 3 trở đi viết trực tiếp (Ví dụ: ngày 05 tháng 02 năm 2026; ngày 15 tháng 3 năm 2026).',
    severity: 'warning',
    category: 'metadata',
    check: (meta, content) => {
      if (!meta.date) {
        return [{
          id: `date-empty-${Date.now()}`,
          ruleId: 'RULE_DATE_FORMAT_DECREE_30',
          description: 'Ngày tháng ban hành văn bản đang trống.',
          severity: 'error',
          field: 'date',
          canAutoFix: true,
          message: 'Bắt buộc chọn ngày ban hành. Gợi ý chọn ngày hôm nay.',
          suggestedValue: new Date().toISOString().split('T')[0]
        }];
      }
      return [];
    },
    autoFix: (meta, content) => {
      const todayStr = new Date().toISOString().split('T')[0];
      return {
        meta: { date: meta.date || todayStr },
        description: `Đã gán ngày ban hành văn bản.`
      };
    }
  },

  // --- NHÓM QUY TẮC TRÍCH YẾU / TIÊU ĐỀ VĂN BẢN ---
  {
    id: 'RULE_SUBJECT_LETTER_VETHIEC',
    name: 'Cấu trúc trích yếu của Công văn',
    description: 'Đối với Công văn (không có tên loại), trích yếu nội dung phải bắt đầu bằng cụm từ "Về việc...".',
    severity: 'warning',
    category: 'metadata',
    check: (meta, content) => {
      if (meta.documentType === 'Công văn') {
        if (!meta.subject) {
          return [{
            id: `subj-empty-${Date.now()}`,
            ruleId: 'RULE_SUBJECT_LETTER_VETHIEC',
            description: 'Trích yếu nội dung công văn không được để trống.',
            severity: 'error',
            field: 'subject',
            canAutoFix: false,
            message: 'Hãy nhập nội dung trích yếu của công văn.'
          }];
        }
        if (!meta.subject.trim().toLowerCase().startsWith('về việc')) {
          return [{
            id: `subj-letter-prefix-${Date.now()}`,
            ruleId: 'RULE_SUBJECT_LETTER_VETHIEC',
            description: 'Trích yếu của công văn nên bắt đầu bằng cụm từ "Về việc".',
            severity: 'warning',
            field: 'subject',
            canAutoFix: true,
            message: `Nên thêm "Về việc" vào trước trích yếu: "Về việc ${meta.subject.charAt(0).toLowerCase() + meta.subject.slice(1)}".`,
            suggestedValue: `Về việc ${meta.subject.charAt(0).toLowerCase() + meta.subject.slice(1)}`
          }];
        }
      } else {
        // Đối với văn bản có tên loại (Quyết định, Thông báo...), trích yếu phải khái quát được nội dung
        if (!meta.subject) {
          return [{
            id: `subj-empty-${Date.now()}`,
            ruleId: 'RULE_SUBJECT_LETTER_VETHIEC',
            description: 'Trích yếu nội dung văn bản đang trống.',
            severity: 'error',
            field: 'subject',
            canAutoFix: false,
            message: 'Hãy nhập nội dung trích yếu của văn bản.'
          }];
        }
      }
      return [];
    },
    autoFix: (meta, content) => {
      const original = meta.subject || '';
      let fixed = original;
      if (meta.documentType === 'Công văn' && !original.toLowerCase().startsWith('về việc')) {
        const firstCharLower = original.charAt(0).toLowerCase() + original.slice(1);
        fixed = `Về việc ${firstCharLower}`;
      }
      return {
        meta: { subject: fixed },
        description: `Đã chuẩn hóa trích yếu công văn với tiền tố "Về việc": "${original}" -> "${fixed}"`
      };
    }
  },

  // --- NHÓM QUY TẮC NGƯỜI KÝ ---
  {
    id: 'RULE_SIGNER_TITLE_UPPERCASE',
    name: 'Chức vụ người ký viết hoa',
    description: 'Chức vụ của người ký có thẩm quyền phải viết hoa toàn bộ chữ cái (ví dụ: "GIÁM ĐỐC", "CHỦ TỊCH").',
    severity: 'error',
    category: 'metadata',
    check: (meta, content) => {
      if (!meta.signerTitle) {
        return [{
          id: `signer-title-empty-${Date.now()}`,
          ruleId: 'RULE_SIGNER_TITLE_UPPERCASE',
          description: 'Chức danh/chức vụ người ký đang trống.',
          severity: 'error',
          field: 'signerTitle',
          canAutoFix: false,
          message: 'Cần nhập chức vụ người ký có thẩm quyền (Ví dụ: "GIÁM ĐỐC").'
        }];
      }
      if (meta.signerTitle !== meta.signerTitle.toUpperCase()) {
        return [{
          id: `signer-title-case-${Date.now()}`,
          ruleId: 'RULE_SIGNER_TITLE_UPPERCASE',
          description: 'Chức vụ người ký phải viết hoa toàn bộ.',
          severity: 'error',
          field: 'signerTitle',
          canAutoFix: true,
          message: `Nên viết hoa toàn bộ chức vụ: "${meta.signerTitle.toUpperCase()}".`,
          suggestedValue: meta.signerTitle.toUpperCase()
        }];
      }
      return [];
    },
    autoFix: (meta, content) => {
      const original = meta.signerTitle;
      const fixed = original.toUpperCase();
      return {
        meta: { signerTitle: fixed },
        description: `Đã chuyển chức vụ người ký thành viết hoa: "${original}" -> "${fixed}"`
      };
    }
  },
  {
    id: 'RULE_SIGNER_NAME_TITLECASE',
    name: 'Họ tên người ký viết hoa danh từ riêng',
    description: 'Họ và tên của người ký phải viết hoa các chữ cái đầu của mỗi từ và có in đậm.',
    severity: 'error',
    category: 'metadata',
    check: (meta, content) => {
      if (!meta.signerName) {
        return [{
          id: `signer-name-empty-${Date.now()}`,
          ruleId: 'RULE_SIGNER_NAME_TITLECASE',
          description: 'Họ và tên người ký đang trống.',
          severity: 'error',
          field: 'signerName',
          canAutoFix: false,
          message: 'Bắt buộc nhập họ tên người ký văn bản.'
        }];
      }
      const titleCased = toTitleCase(meta.signerName);
      if (meta.signerName !== titleCased) {
        return [{
          id: `signer-name-case-${Date.now()}`,
          ruleId: 'RULE_SIGNER_NAME_TITLECASE',
          description: 'Họ tên người ký chưa viết hoa đúng chuẩn.',
          severity: 'error',
          field: 'signerName',
          canAutoFix: true,
          message: `Họ tên người ký cần viết hoa chữ cái đầu: "${titleCased}".`,
          suggestedValue: titleCased
        }];
      }
      return [];
    },
    autoFix: (meta, content) => {
      const original = meta.signerName;
      const fixed = toTitleCase(original);
      return {
        meta: { signerName: fixed },
        description: `Đã chuẩn hóa viết hoa họ tên người ký: "${original}" -> "${fixed}"`
      };
    }
  },

  // --- NHÓM QUY TẮC NƠI NHẬN ---
  {
    id: 'RULE_RECIPIENTS_STRUCTURE',
    name: 'Cấu trúc danh sách Nơi nhận',
    description: 'Nơi nhận phải bắt đầu bằng "Nơi nhận:" (in nghiêng, đậm) và kết thúc với các dòng lưu trữ "- Như trên;" và "- Lưu: VT, ...".',
    severity: 'warning',
    category: 'metadata',
    check: (meta, content) => {
      if (!meta.recipients) {
        return [{
          id: `recipients-empty-${Date.now()}`,
          ruleId: 'RULE_RECIPIENTS_STRUCTURE',
          description: 'Nơi nhận đang trống.',
          severity: 'warning',
          field: 'recipients',
          canAutoFix: true,
          message: 'Nên có danh sách nơi nhận chuẩn hành chính. Gợi ý tự động tạo danh sách nơi nhận mẫu.',
          suggestedValue: `- Như trên;\n- Lưu: VT, ${getAcronym(meta.issuingOrganization)}.`
        }];
      }

      const lines = meta.recipients.split('\n').map(l => l.trim()).filter(Boolean);
      const hasLikeAbove = lines.some(line => line.toLowerCase().includes('như trên') || line.toLowerCase().includes('như điều'));
      const hasArchive = lines.some(line => line.toLowerCase().includes('lưu:') || line.toLowerCase().includes('lưu vt'));

      if (!hasLikeAbove || !hasArchive) {
        let suggested = meta.recipients;
        if (!hasLikeAbove) {
          suggested = `- Như trên;\n${suggested}`;
        }
        if (!hasArchive) {
          suggested = `${suggested}\n- Lưu: VT, ${getAcronym(meta.issuingOrganization)}.`;
        }

        return [{
          id: `recipients-missing-standard-${Date.now()}`,
          ruleId: 'RULE_RECIPIENTS_STRUCTURE',
          description: 'Nơi nhận thiếu dòng lưu trữ hành chính chuẩn ("- Như trên;" hoặc "- Lưu: VT,...").',
          severity: 'warning',
          field: 'recipients',
          canAutoFix: true,
          message: 'Danh sách nơi nhận cần có "- Như trên;" và dòng lưu hành chính (ví dụ: "- Lưu: VT, HC."). Gợi ý sửa đổi.',
          suggestedValue: suggested
        }];
      }
      return [];
    },
    autoFix: (meta, content) => {
      const original = meta.recipients || '';
      let lines = original.split('\n').map(l => l.trim()).filter(Boolean);
      const hasLikeAbove = lines.some(line => line.toLowerCase().includes('như trên') || line.toLowerCase().includes('như điều'));
      const hasArchive = lines.some(line => line.toLowerCase().includes('lưu:') || line.toLowerCase().includes('lưu vt'));
      
      if (!hasLikeAbove) {
        lines.unshift('- Như trên;');
      }
      if (!hasArchive) {
        lines.push(`- Lưu: VT, ${getAcronym(meta.issuingOrganization)}.`);
      }
      
      const fixed = lines.join('\n');
      return {
        meta: { recipients: fixed },
        description: `Đã bổ sung các dòng nơi nhận tiêu chuẩn hành chính: Như trên và Lưu trữ.`
      };
    }
  },

  // --- NHÓM QUY TẮC NỘI DUNG VĂN BẢN ---
  {
    id: 'RULE_CONTENT_DOUBLE_SPACES',
    name: 'Nội dung chứa khoảng trắng kép',
    description: 'Văn bản hành chính không được chứa các khoảng trắng kép liên tục để tránh làm mất mỹ quan trang in.',
    severity: 'warning',
    category: 'content',
    check: (meta, content) => {
      if (!content) return [];
      const hasDoubleSpace = /\s{2,}/.test(content);
      if (hasDoubleSpace) {
        return [{
          id: `content-double-space-${Date.now()}`,
          ruleId: 'RULE_CONTENT_DOUBLE_SPACES',
          description: 'Nội dung văn bản chứa một số vị trí có khoảng trắng thừa (2 hoặc nhiều khoảng trắng liên tiếp).',
          severity: 'warning',
          field: 'content',
          canAutoFix: true,
          message: 'Nên rút gọn các khoảng trắng kép thành khoảng trắng đơn để đều chữ.',
          suggestedValue: content.replace(/ {2,}/g, ' ')
        }];
      }
      return [];
    },
    autoFix: (meta, content) => {
      const fixed = content.replace(/ {2,}/g, ' ');
      return {
        content: fixed,
        description: 'Đã loại bỏ các khoảng trắng thừa trùng lặp trong nội dung văn bản.'
      };
    }
  },
  {
    id: 'RULE_CONTENT_HEADING_PUNCTUATION',
    name: 'Dấu câu sau tiêu đề Điều',
    description: 'Sau tiêu đề "Điều ...", phải là dấu chấm (".") chứ không dùng dấu hai chấm (":") hay gạch ngang ("-") theo Nghị định 30.',
    severity: 'warning',
    category: 'content',
    check: (meta, content) => {
      if (!content) return [];
      
      // Tìm các từ "Điều 1:", "Điều 2 -", "Điều 1 -"
      const regex = /(Điều\s+\d+)\s*[:\-]/g;
      const matches = [...content.matchAll(regex)];
      
      if (matches.length > 0) {
        return [{
          id: `content-heading-punctuation-${Date.now()}`,
          ruleId: 'RULE_CONTENT_HEADING_PUNCTUATION',
          description: 'Phát hiện sử dụng dấu ":" hoặc "-" ngay sau tiêu đề Điều.',
          severity: 'warning',
          field: 'content',
          canAutoFix: true,
          message: 'Theo Nghị định 30, sau chữ "Điều [số]" phải là dấu chấm (Ví dụ: "Điều 1. Phạm vi điều chỉnh" thay vì "Điều 1:").',
          suggestedValue: content.replace(/(Điều\s+\d+)\s*[:\-]/g, '$1.')
        }];
      }
      return [];
    },
    autoFix: (meta, content) => {
      const fixed = content.replace(/(Điều\s+\d+)\s*[:\-]/g, '$1.');
      return {
        content: fixed,
        description: 'Đã thay thế dấu câu sau tiêu đề "Điều" bằng dấu chấm theo quy định.'
      };
    }
  }
];

// Hàm chạy toàn bộ các quy tắc kiểm tra và trả về danh sách các vấn đề
export function validateDocument(meta: DocumentMetadata, content: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const rule of rules) {
    try {
      const ruleIssues = rule.check(meta, content);
      issues.push(...ruleIssues);
    } catch (e) {
      console.error(`Lỗi khi chạy quy tắc ${rule.id}:`, e);
    }
  }
  return issues;
}

// Chuyển đổi định dạng ngày YYYY-MM-DD sang định dạng chuỗi tiếng Việt theo Nghị định 30
export function formatVietnameseDate(dateStr: string): string {
  if (!dateStr) return 'ngày ... tháng ... năm 2026';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return 'ngày ... tháng ... năm 2026';
  
  const year = parts[0];
  const monthInt = parseInt(parts[1], 10);
  const dayInt = parseInt(parts[2], 10);
  
  // Rule Nghị định 30:
  // - Ngày dưới 10 phải thêm "0"
  // - Tháng 1, 2 phải thêm "0"
  const dayStr = dayInt < 10 ? `0${dayInt}` : `${dayInt}`;
  const monthStr = monthInt < 10 ? `0${monthInt}` : `${monthInt}`; // Nghị định 30 ghi rõ tháng 1, 2 bắt buộc viết 01, 02. Từ tháng 3 có thể viết 3 hoặc 03.
  
  return `ngày ${dayStr} tháng ${monthStr} năm ${year}`;
}
