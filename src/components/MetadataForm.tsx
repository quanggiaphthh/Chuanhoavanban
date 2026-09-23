import React from 'react';
import { DocumentMetadata, SigningType } from '../types/document';
import { FileText, Building, User, Calendar, MapPin, Hash, Plus, RefreshCw } from 'lucide-react';

interface MetadataFormProps {
  metadata: DocumentMetadata;
  onChange: (meta: DocumentMetadata) => void;
  onApplyPreset: (presetName: string) => void;
  suggestedMetadata?: Partial<Record<keyof DocumentMetadata, { value: string; sourceLine: string }>>;
}

const DOCUMENT_TYPES = [
  'Quyết định',
  'Công văn',
  'Thông báo',
  'Báo cáo',
  'Tờ trình',
  'Kế hoạch',
  'Nghị quyết',
  'Chỉ thị',
  'Quy chế',
  'Quy định',
  'Biên bản',
  'Công điện'
];

const SIGNING_TYPES: { value: SigningType; label: string; description: string }[] = [
  { value: 'DIRECT', label: 'Ký trực tiếp', description: 'Người có thẩm quyền ký trực tiếp (ví dụ: GIÁM ĐỐC Nguyễn Văn A)' },
  { value: 'TM', label: 'Thay mặt (TM.)', description: 'Ký thay mặt tập thể lãnh đạo (ví dụ: TM. ỦY BAN NHÂN DÂN)' },
  { value: 'KT', label: 'Ký thay (KT.)', description: 'Ký thay người đứng đầu cơ quan (ví dụ: KT. GIÁM ĐỐC - PHÓ GIÁM ĐỐC)' },
  { value: 'TL', label: 'Thừa lệnh (TL.)', description: 'Ký thừa lệnh người đứng đầu (ví dụ: TL. GIÁM ĐỐC - CHÁNH VĂN PHÒNG)' },
  { value: 'Q', label: 'Quyền (Q.)', description: 'Người được giao quyền đứng đầu ký (ví dụ: Q. GIÁM ĐỐC)' }
];

// Presets gợi ý nhanh để người dùng không phải nhập từ đầu
const PRESETS = [
  {
    name: 'Sở Thông tin và Truyền thông - Quyết định',
    data: {
      documentType: 'Quyết định',
      parentOrganization: 'ỦY BAN NHÂN DÂN TỈNH LÂM ĐỒNG',
      issuingOrganization: 'SỞ THÔNG TIN VÀ TRUYỀN THÔNG',
      documentCode: '128/QĐ-STTTT',
      location: 'Đà Lạt',
      date: new Date().toISOString().split('T')[0],
      subject: 'Về việc phê duyệt Kế hoạch phát triển hạ tầng số phục vụ chuyển đổi số năm 2026',
      signerTitle: 'GIÁM ĐỐC',
      signerName: 'Nguyễn Văn Hoài',
      signingType: 'DIRECT' as SigningType,
      recipients: '- Như trên;\n- UBND Tỉnh (báo cáo);\n- Các Phòng thuộc Sở;\n- Lưu: VT, CNTT.'
    }
  },
  {
    name: 'Ủy ban nhân dân Quận - Công văn',
    data: {
      documentType: 'Công văn',
      parentOrganization: 'ỦY BAN NHÂN DÂN THÀNH PHỐ HÀ NỘI',
      issuingOrganization: 'ỦY BAN NHÂN DÂN QUẬN HOÀN KIẾM',
      documentCode: '450/UBND-VP',
      location: 'Hà Nội',
      date: new Date().toISOString().split('T')[0],
      subject: 'Về việc tăng cường bảo đảm an toàn thông tin mạng dịp Tết Nguyên đán 2026',
      signerTitle: 'PHÓ CHỦ TỊCH',
      signerName: 'Trần Minh Quân',
      signingType: 'KT' as SigningType,
      recipients: '- Như trên;\n- Sở TT&TT TP. Hà Nội;\n- Công an Quận;\n- Lưu: VT, VP.'
    }
  },
  {
    name: 'Văn phòng Bộ - Thông báo',
    data: {
      documentType: 'Thông báo',
      parentOrganization: 'BỘ NỘI VỤ',
      issuingOrganization: 'VĂN PHÒNG BỘ',
      documentCode: '12/TB-VP',
      location: 'Hà Nội',
      date: new Date().toISOString().split('T')[0],
      subject: 'Về lịch nghỉ lễ Quốc khánh năm 2026 của cán bộ, công chức, viên chức Bộ Nội vụ',
      signerTitle: 'CHÁNH VĂN PHÒNG',
      signerName: 'Phạm Thanh Sơn',
      signingType: 'TL' as SigningType,
      recipients: '- Các đơn vị thuộc, trực thuộc Bộ;\n- Công đoàn Bộ;\n- Lưu: VT, HC.'
    }
  }
];

export default function MetadataForm({ metadata, onChange, onApplyPreset, suggestedMetadata }: MetadataFormProps) {
  const handleFieldChange = (field: keyof DocumentMetadata, value: string) => {
    onChange({
      ...metadata,
      [field]: value
    });
  };

  const renderSuggestion = (field: keyof DocumentMetadata) => {
    const suggestion = suggestedMetadata?.[field];
    if (!suggestion || !suggestion.value) return null;
    
    // Nếu giá trị hiện tại đã giống với giá trị gợi ý, ẩn gợi ý đi
    if (String(metadata[field]).trim() === String(suggestion.value).trim()) return null;

    return (
      <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] bg-sky-50 dark:bg-sky-950/30 text-sky-800 dark:text-sky-300 px-2 py-1.5 rounded-lg border border-sky-100/60 dark:border-sky-900/40">
        <span className="truncate">Gợi ý từ file: <strong className="font-mono">{field === 'signingType' ? `Hình thức ${suggestion.value}` : suggestion.value}</strong></span>
        <button
          type="button"
          onClick={() => handleFieldChange(field, suggestion.value)}
          className="text-[9px] font-bold text-white bg-sky-600 hover:bg-sky-700 px-2 py-0.5 rounded transition-colors shrink-0 cursor-pointer"
        >
          Chấp nhận gợi ý
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* KHU VỰC CHỌN PRESET NHANH */}
      <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <RefreshCw className="w-4 h-4 text-sky-600 dark:text-sky-400 animate-spin-slow" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Mẫu Thể Thức Nhanh (Presets)
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onApplyPreset(p.name)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 transition-colors duration-150 shadow-sm cursor-pointer"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LOẠI VĂN BẢN */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Loại văn bản
          </label>
          <div className="relative">
            <select
              value={metadata.documentType}
              onChange={(e) => handleFieldChange('documentType', e.target.value)}
              className="w-full pl-3 pr-10 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
            >
              {DOCUMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          {renderSuggestion('documentType')}
        </div>

        {/* SỐ / KÝ HIỆU */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Số, Ký hiệu văn bản</span>
            <span className="text-[10px] text-slate-400 lowercase italic">ví dụ: 123/QĐ-STTTT</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Hash className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={metadata.documentCode}
              onChange={(e) => handleFieldChange('documentCode', e.target.value)}
              placeholder="Nhập số/ký hiệu (Ví dụ: 15/QĐ-Sở)"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-mono"
            />
          </div>
          {renderSuggestion('documentCode')}
        </div>
      </div>

      {/* THÔNG TIN CƠ QUAN */}
      <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
        <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Cơ quan ban hành
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* CƠ QUAN CHỦ QUẢN */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Cơ quan chủ quản cấp trên</span>
              <span className="text-[10px] text-slate-400 italic">Không bắt buộc</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Building className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={metadata.parentOrganization}
                onChange={(e) => handleFieldChange('parentOrganization', e.target.value)}
                placeholder="Ví dụ: ỦY BAN NHÂN DÂN TỈNH LÂM ĐỒNG"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              />
            </div>
            {renderSuggestion('parentOrganization')}
          </div>

          {/* CƠ QUAN BAN HÀNH QUYẾT ĐỊNH */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Cơ quan ban hành văn bản *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Building className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={metadata.issuingOrganization}
                onChange={(e) => handleFieldChange('issuingOrganization', e.target.value)}
                placeholder="Ví dụ: SỞ THÔNG TIN VÀ TRUYỀN THÔNG"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                required
              />
            </div>
            {renderSuggestion('issuingOrganization')}
          </div>
        </div>
      </div>

      {/* ĐỊA DANH & THỜI GIAN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Địa danh ban hành *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <MapPin className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={metadata.location}
              onChange={(e) => handleFieldChange('location', e.target.value)}
              placeholder="Ví dụ: Đà Lạt, Hà Nội, TP. Hồ Chí Minh"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              required
            />
          </div>
          {renderSuggestion('location')}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Ngày tháng ban hành *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Calendar className="w-4 h-4" />
            </div>
            <input
              type="date"
              value={metadata.date}
              onChange={(e) => handleFieldChange('date', e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              required
            />
          </div>
          {renderSuggestion('date')}
        </div>
      </div>

      {/* TRÍCH YẾU NỘI DUNG */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
          <span>Trích yếu nội dung văn bản *</span>
          <span className="text-[10px] text-slate-400 italic">
            {metadata.documentType === 'Công văn' ? 'Công văn phải bắt đầu bằng "Về việc..."' : 'Khái quát ngắn gọn chủ đề'}
          </span>
        </label>
        <div className="relative">
          <div className="absolute top-3 left-3 pointer-events-none text-slate-400">
            <FileText className="w-4 h-4" />
          </div>
          <textarea
            value={metadata.subject}
            onChange={(e) => handleFieldChange('subject', e.target.value)}
            rows={2}
            placeholder={
              metadata.documentType === 'Công văn'
                ? 'Ví dụ: Về việc tăng cường chuyển đổi số tại các cơ quan hành chính nhà nước...'
                : 'Ví dụ: Ban hành Quy chế làm việc của Sở Thông tin và Truyền thông'
            }
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
            required
          />
        </div>
        {renderSuggestion('subject')}
      </div>

      {/* THÔNG TIN NGƯỜI KÝ & THẨM QUYỀN */}
      <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
        <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Chữ ký & Thẩm quyền ban hành
        </h4>

        {/* HÌNH THỨC KÝ */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Hình thức ký & Thẩm quyền
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {SIGNING_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => onChange({ ...metadata, signingType: type.value })}
                className={`text-left p-2.5 rounded-lg border transition-all duration-150 text-xs cursor-pointer ${
                  metadata.signingType === type.value
                    ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/30 text-sky-900 dark:text-sky-300 ring-2 ring-sky-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-400'
                }`}
              >
                <div className="font-bold mb-0.5">{type.label}</div>
                <div className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                  {type.description}
                </div>
              </button>
            ))}
          </div>
          {renderSuggestion('signingType')}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* CHỨC DANH NGƯỜI KÝ */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Chức danh người ký *</span>
              <span className="text-[10px] text-slate-400 lowercase italic">In hoa đậm (ví dụ: GIÁM ĐỐC)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={metadata.signerTitle}
                onChange={(e) => handleFieldChange('signerTitle', e.target.value)}
                placeholder="Ví dụ: GIÁM ĐỐC, PHÓ CHỦ TỊCH, CHỦ TỊCH"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                required
              />
            </div>
            {renderSuggestion('signerTitle')}
          </div>

          {/* HỌ TÊN NGƯỜI KÝ */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Họ và tên người ký *</span>
              <span className="text-[10px] text-slate-400 lowercase italic">viết thường đậm (ví dụ: Nguyễn Văn A)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={metadata.signerName}
                onChange={(e) => handleFieldChange('signerName', e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn Hải"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                required
              />
            </div>
            {renderSuggestion('signerName')}
          </div>
        </div>
      </div>

      {/* DANH SÁCH NƠI NHẬN */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
          <span>Danh sách Nơi nhận (Mỗi dòng một dòng nhận) *</span>
          <span className="text-[10px] text-slate-400 italic">Bắt buộc có dòng lưu trữ hành chính</span>
        </label>
        <textarea
          value={metadata.recipients}
          onChange={(e) => handleFieldChange('recipients', e.target.value)}
          rows={4}
          placeholder="- Như Điều 3;&#10;- Sở Tài chính;&#10;- Lưu: VT, HC."
          className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-mono"
          required
        />
        {renderSuggestion('recipients')}
      </div>
    </div>
  );
}
