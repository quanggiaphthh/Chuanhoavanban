import React, { useState, useRef } from 'react';
import mammoth from 'mammoth';
import { parseDocxRawText, ExtractedDocxData, SuggestedField } from '../utils/docxImporter';
import { DocumentMetadata, SigningType } from '../types/document';
import { 
  FileUp, 
  Check, 
  ArrowRight, 
  X, 
  HelpCircle, 
  AlertTriangle, 
  FileText, 
  Loader2, 
  Sparkles,
  RefreshCw,
  Info
} from 'lucide-react';

interface DocxImportPanelProps {
  onImport: (
    content: string, 
    metadata: Partial<DocumentMetadata>, 
    suggestedMetadata: Partial<Record<keyof DocumentMetadata, SuggestedField>>
  ) => void;
  onCancel: () => void;
}

const FIELD_LABELS: Record<keyof DocumentMetadata, string> = {
  documentType: 'Loại văn bản',
  parentOrganization: 'Cơ quan chủ quản',
  issuingOrganization: 'Cơ quan ban hành',
  documentCode: 'Số hiệu văn bản',
  location: 'Địa danh',
  date: 'Ngày ban hành',
  subject: 'Trích yếu nội dung',
  signerTitle: 'Chức danh người ký',
  signerName: 'Họ tên người ký',
  signingType: 'Hình thức ký',
  recipients: 'Nơi nhận'
};

export default function DocxImportPanel({ onImport, onCancel }: DocxImportPanelProps) {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalRawText, setOriginalRawText] = useState<string>('');
  const [parsedData, setParsedData] = useState<ExtractedDocxData | null>(null);
  const [acceptedMetadata, setAcceptedMetadata] = useState<Partial<DocumentMetadata>>({});
  const [hasTable, setHasTable] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Xử lý kéo thả file
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Đọc file .docx bằng mammoth
  const processFile = async (file: File) => {
    if (!file.name.endsWith('.docx')) {
      setError('Định dạng tệp không được hỗ trợ. Vui lòng chỉ tải lên tệp Word có đuôi mở rộng .docx');
      return;
    }

    setLoading(true);
    setError(null);
    setParsedData(null);
    setAcceptedMetadata({});
    setHasTable(false);

    try {
      const arrayBuffer = await file.arrayBuffer();
      
      const [result, htmlResult] = await Promise.all([
        mammoth.extractRawText({ arrayBuffer: arrayBuffer.slice(0) }),
        mammoth.convertToHtml({ arrayBuffer: arrayBuffer.slice(0) })
      ]);
      
      if (!result.value.trim()) {
        throw new Error('Tệp Word trống hoặc không trích xuất được ký tự.');
      }

      const rawText = result.value;
      setOriginalRawText(rawText);

      // Phân tích văn bản thô để đoán nội dung & metadata
      const data = parseDocxRawText(rawText);
      setParsedData(data);

      const containsTable = htmlResult.value.toLowerCase().includes('<table');
      setHasTable(containsTable);

      // Trạng thái khởi tạo bắt buộc rỗng, không tự động chọn
      setAcceptedMetadata({});

    } catch (err: any) {
      console.error('Lỗi phân tích tệp:', err);
      setError(
        err.message || 'Không thể đọc tệp Word này. Đảm bảo đây là tệp .docx chuẩn, không bị mã hóa mật khẩu hoặc bị lỗi cấu trúc.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Bật/tắt việc đồng ý chấp nhận gợi ý cho từng trường cụ thể
  const toggleAcceptField = (key: keyof DocumentMetadata, value: string) => {
    setAcceptedMetadata(prev => {
      const copy = { ...prev };
      if (copy[key] !== undefined) {
        delete copy[key];
      } else {
        copy[key] = value as any;
      }
      return copy;
    });
  };

  const handleConfirmImport = () => {
    if (!parsedData) return;
    onImport(parsedData.extractedContent, acceptedMetadata, parsedData.suggestedMetadata);
  };

  const handleReset = () => {
    setParsedData(null);
    setOriginalRawText('');
    setAcceptedMetadata({});
    setHasTable(false);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectAll = () => {
    if (!parsedData) return;
    const allSelected: Partial<DocumentMetadata> = {};
    Object.entries(parsedData.suggestedMetadata).forEach(([key, field]) => {
      if (field && field.value) {
        allSelected[key as keyof DocumentMetadata] = field.value as any;
      }
    });
    setAcceptedMetadata(allSelected);
  };

  const handleUnselectAll = () => {
    setAcceptedMetadata({});
  };

  // Chuẩn hóa hiển thị dòng gốc có đánh dấu các phần được bóc tách
  const renderOriginalLinesWithHighlights = () => {
    if (!originalRawText) return null;
    const lines = originalRawText.split(/\r?\n/).map(l => l.trim());

    return (
      <div className="space-y-1 font-mono text-[11px] leading-relaxed max-h-[350px] overflow-y-auto p-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl select-none">
        {lines.map((line, idx) => {
          if (!line) return <div key={idx} className="h-2"></div>;

          // Xem dòng này khớp với trường nào
          let matchedField: keyof DocumentMetadata | null = null;
          if (parsedData) {
            for (const [key, field] of Object.entries(parsedData.suggestedMetadata)) {
              if (field && field.sourceLine === line) {
                matchedField = key as keyof DocumentMetadata;
                break;
              }
            }
          }

          if (matchedField) {
            return (
              <div 
                key={idx} 
                className="bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 px-2 py-0.5 rounded border-l-2 border-sky-500 flex justify-between items-center group transition-colors"
                title={`Đã bóc tách tự động: ${FIELD_LABELS[matchedField]}`}
              >
                <span className="truncate">{line}</span>
                <span className="text-[9px] font-bold bg-sky-200 dark:bg-sky-900 text-sky-800 dark:text-sky-300 px-1.5 py-0.5 rounded shrink-0 uppercase tracking-wider">
                  {FIELD_LABELS[matchedField]}
                </span>
              </div>
            );
          }

          return <div key={idx} className="text-slate-600 dark:text-slate-400 px-2">{line}</div>;
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. KHU VỰC TẢI FILE CHƯA ĐƯỢC LOAD */}
      {!parsedData && !loading && (
        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center gap-3 ${
            dragActive 
              ? 'border-sky-500 bg-sky-50/40 dark:bg-sky-950/10' 
              : 'border-slate-300 dark:border-slate-700 hover:border-sky-500 hover:bg-slate-50 dark:hover:bg-slate-900/30'
          }`}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange}
            accept=".docx"
            className="hidden" 
          />
          <div className="p-4 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-full shadow-inner animate-pulse">
            <FileUp className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Kéo thả file Microsoft Word hoặc click để tải lên
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Chỉ chấp nhận định dạng .docx của Microsoft Word
            </p>
          </div>
          
          <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 max-w-md bg-amber-50 dark:bg-amber-950/20 px-3 py-2 rounded-lg flex gap-1.5 text-left border border-amber-100 dark:border-amber-900/40">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>Cam kết dữ liệu:</strong> Nội dung văn bản được giữ nguyên tuyệt đối; chỉ phần trình bày được chuẩn hóa theo Nghị định 30/2020/NĐ-CP.
            </span>
          </div>
        </div>
      )}

      {/* TRẠNG THÁI ĐANG ĐỌC FILE */}
      {loading && (
        <div className="p-12 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 text-center space-y-3 shadow-inner">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600 mx-auto" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Đang đọc dữ liệu nhị phân của tệp DOCX...</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Mã hóa được xử lý hoàn toàn nội bộ tại trình duyệt (Local Client)</p>
        </div>
      )}

      {/* TRẠNG THÁI LỖI */}
      {error && (
        <div className="p-4 border border-rose-200 dark:border-rose-950/40 rounded-xl bg-rose-50/50 dark:bg-rose-950/10 text-rose-800 dark:text-rose-400 text-xs flex gap-3 items-start">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div className="space-y-2 flex-1">
            <span className="font-bold block text-sm">Phát hiện lỗi tải tệp!</span>
            <p>{error}</p>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 bg-rose-100 dark:bg-rose-900 hover:bg-rose-200 text-rose-800 dark:text-rose-300 rounded-lg font-bold transition-colors cursor-pointer"
            >
              Thử lại file khác
            </button>
          </div>
        </div>
      )}

      {/* 2. HIỂN THỊ KẾT QUẢ PHÂN TÁCH KHI ĐÃ ĐỌC XONG */}
      {parsedData && (
        <div className="space-y-6">
          {/* HEADER TRẠNG THÁI THÀNH CÔNG */}
          <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 p-4 rounded-xl text-emerald-900 dark:text-emerald-300">
            <div className="flex gap-2.5 items-center">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <div>
                <span className="font-bold block text-sm">Đọc file .docx thành công!</span>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">Đã tự động trích lọc và phát hiện cấu trúc thể thức.</p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-bold shadow-sm transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Thay đổi file
            </button>
          </div>

          {/* CẢNH BÁO BẢNG BIỂU */}
          {hasTable && (
            <div className="p-4 border border-amber-200 dark:border-amber-950/40 rounded-xl bg-amber-50/50 dark:bg-amber-950/10 text-amber-800 dark:text-amber-400 text-xs flex gap-3 items-start shadow-sm">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-500 mt-0.5 animate-pulse" />
              <div className="space-y-1">
                <span className="font-bold text-sm block text-amber-900 dark:text-amber-300">File gốc có chứa bảng biểu (thường dùng cho khối Nơi nhận/Chữ ký)</span>
                <p className="leading-relaxed text-[11px]">
                  công cụ chỉ đọc được văn bản thuần túy nên có thể đã bỏ sót hoặc xáo trộn thứ tự nội dung trong bảng. Vui lòng kiểm tra kỹ phần Nơi nhận và Chữ ký ở cột so sánh bên dưới trước khi xác nhận.
                </p>
              </div>
            </div>
          )}

          {/* GỢI Ý THUỘC TÍNH (METADATA SUGGESTIONS) */}
          <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-4 h-4 text-sky-600" />
                Đề xuất thông tin hành chính từ văn bản gốc
              </h3>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 hover:bg-sky-50 dark:hover:bg-sky-950/20 px-2.5 py-1 rounded-lg border border-sky-200 dark:border-sky-800 transition-colors cursor-pointer"
                >
                  Chọn tất cả
                </button>
                <button
                  type="button"
                  onClick={handleUnselectAll}
                  className="text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
                >
                  Bỏ chọn tất cả
                </button>
              </div>
            </div>
            
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Hệ thống phát hiện các dòng thể thức đầu/cuối của file. Hãy tích chọn các trường thông tin bạn muốn đồng ý đưa vào dự thảo chính thức.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {Object.entries(parsedData.suggestedMetadata).map(([key, field]) => {
                const typedKey = key as keyof DocumentMetadata;
                const isAccepted = acceptedMetadata[typedKey] !== undefined;
                
                return (
                  <div 
                    key={typedKey} 
                    onClick={() => toggleAcceptField(typedKey, field.value)}
                    className={`p-3 rounded-xl border cursor-pointer select-none transition-all duration-150 flex items-start gap-2.5 ${
                      isAccepted 
                        ? 'border-sky-500 bg-sky-50/30 dark:bg-sky-950/10' 
                        : 'border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/20 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center transition-colors ${
                      isAccepted ? 'bg-sky-600 border-sky-600 text-white' : 'border-slate-300 dark:border-slate-700'
                    }`}>
                      {isAccepted && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                        {FIELD_LABELS[typedKey]}
                      </span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {typedKey === 'signingType' ? (
                          <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-[10px]">
                            Hình thức: {field.value}
                          </span>
                        ) : field.value}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 italic truncate" title={`Dòng gốc: "${field.sourceLine}"`}>
                        Trích từ: "{field.sourceLine}"
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BẢNG SO SÁNH 2 CỘT TÁCH NỘI DUNG */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Cột trái: File gốc */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <FileText className="w-4 h-4 text-slate-400" />
                Văn bản gốc trích xuất từ file (.docx)
              </span>
              {renderOriginalLinesWithHighlights()}
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                Ghi chú: Các phần được tô màu <span className="text-sky-600 font-bold">Xanh dương</span> đã được bóc tách đưa lên danh sách thông tin metadata ở trên.
              </p>
            </div>

            {/* Cột phải: Nội dung đưa vào editor */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 text-emerald-600">
                <Check className="w-4 h-4" />
                Nội dung sẽ đưa vào trình soạn thảo (Body Content)
              </span>
              <textarea
                value={parsedData.extractedContent}
                readOnly
                className="w-full h-[350px] font-mono text-[11px] leading-relaxed p-3 border border-emerald-200 dark:border-emerald-950/40 bg-emerald-50/10 dark:bg-slate-950 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none resize-none"
              />
              <p className="text-[10px] text-emerald-600 font-bold">
                ✓ Đảm bảo giữ nguyên 100% từng câu chữ, dấu câu gốc. Không tự sửa chữ nghĩa.
              </p>
            </div>
          </div>

          {/* HÀNH ĐỘNG CUỐI PANEL */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={onCancel}
              className="px-4 py-2.5 text-xs font-bold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-all cursor-pointer"
            >
              Hủy bỏ / Quay lại
            </button>
            <button
              onClick={handleConfirmImport}
              className="px-5 py-2.5 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              Xác nhận nhập văn bản <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
