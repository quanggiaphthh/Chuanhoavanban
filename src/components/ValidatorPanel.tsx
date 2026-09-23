import React, { useState } from 'react';
import { ValidationIssue, DocumentMetadata, FixLog } from '../types/document';
import { rules } from '../utils/rules';
import { AlertCircle, CheckCircle, ArrowRight, CornerDownRight, History, Trash2, Eye } from 'lucide-react';

interface ValidatorPanelProps {
  issues: ValidationIssue[];
  metadata: DocumentMetadata;
  content: string;
  onApplyFix: (
    issueId: string,
    ruleId: string,
    updatedMeta?: Partial<DocumentMetadata>,
    updatedContent?: string,
    description?: string
  ) => void;
  fixLogs: FixLog[];
  onClearLogs: () => void;
}

export default function ValidatorPanel({
  issues,
  metadata,
  content,
  onApplyFix,
  fixLogs,
  onClearLogs
}: ValidatorPanelProps) {
  const [selectedIssueForFix, setSelectedIssueForFix] = useState<ValidationIssue | null>(null);

  // Chuẩn bị thông tin so sánh trước/sau khi Auto-fix
  const handleOpenFixDialog = (issue: ValidationIssue) => {
    setSelectedIssueForFix(issue);
  };

  const handleConfirmFix = () => {
    if (!selectedIssueForFix) return;

    const targetRule = rules.find(r => r.id === selectedIssueForFix.ruleId);
    if (targetRule && targetRule.autoFix) {
      const result = targetRule.autoFix(metadata, content);
      
      onApplyFix(
        selectedIssueForFix.id,
        selectedIssueForFix.ruleId,
        result.meta,
        result.content,
        result.description
      );
    }
    setSelectedIssueForFix(null);
  };

  // Lấy giá trị hiện tại của trường đang lỗi để hiển thị ở cột "Trước khi sửa"
  const getBeforeValue = (issue: ValidationIssue): string => {
    if (issue.field === 'content') {
      // Chỉ lấy đoạn văn chứa lỗi hoặc thu gọn nội dung
      return content.length > 120 ? content.slice(0, 120) + '...' : content;
    }
    return String(metadata[issue.field] || '');
  };

  // Sắp xếp lỗi: Lỗi nghiêm trọng (Error) lên trước, Cảnh báo (Warning) sau
  const sortedIssues = [...issues].sort((a, b) => {
    if (a.severity === 'error' && b.severity !== 'error') return -1;
    if (a.severity !== 'error' && b.severity === 'error') return 1;
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* KHU VỰC THỐNG KÊ LỖI */}
      <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            Kiểm tra thể thức hành chính ({issues.length})
          </h3>
          {issues.length === 0 ? (
            <span className="text-xs bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Thể thức hoàn hảo
            </span>
          ) : (
            <span className="text-xs bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 font-bold px-2.5 py-1 rounded-full">
              Phát hiện {issues.filter(i => i.severity === 'error').length} lỗi nghiêm trọng
            </span>
          )}
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[380px] overflow-y-auto">
          {sortedIssues.length > 0 ? (
            sortedIssues.map((issue) => {
              const isError = issue.severity === 'error';
              return (
                <div
                  key={issue.id}
                  className={`p-4 transition-colors ${
                    isError
                      ? 'bg-rose-50/20 dark:bg-rose-950/5 hover:bg-rose-50/40 dark:hover:bg-rose-950/10'
                      : 'bg-amber-50/10 dark:bg-amber-950/2 hover:bg-amber-50/25 dark:hover:bg-amber-950/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            isError
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-400'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400'
                          }`}
                        >
                          {isError ? 'Bắt buộc sửa' : 'Khuyến nghị'}
                        </span>
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 font-mono">
                          Phạm vi: {issue.field === 'content' ? 'Nội dung' : 'Thuộc tính'}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {issue.description}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {issue.message}
                      </p>
                    </div>

                    {issue.canAutoFix && (
                      <button
                        type="button"
                        onClick={() => handleOpenFixDialog(issue)}
                        className="text-xs shrink-0 bg-sky-600 hover:bg-sky-700 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-medium px-3 py-1.5 rounded-lg shadow-sm cursor-pointer transition-colors"
                      >
                        Tự sửa nhanh
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 space-y-2">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="text-sm font-medium">Tuyệt vời! Văn bản hoàn toàn hợp lệ.</p>
              <p className="text-xs">Không phát hiện lỗi định dạng hay sai sót thể thức theo Nghị định 30/2020/NĐ-CP.</p>
            </div>
          )}
        </div>
      </div>

      {/* LỊCH SỬ CHỈNH SỬA (AUDIT TRAIL) */}
      <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <History className="w-3.5 h-3.5 text-slate-400" />
            Nhật ký tự động chuẩn hóa ({fixLogs.length})
          </h3>
          {fixLogs.length > 0 && (
            <button
              onClick={onClearLogs}
              title="Xóa lịch sử sửa đổi"
              className="text-xs text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Xóa nhật ký
            </button>
          )}
        </div>

        {fixLogs.length > 0 ? (
          <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
            {fixLogs.map((log) => (
              <div key={log.id} className="text-xs border-l-2 border-sky-500 pl-3 py-1 space-y-1">
                <div className="flex justify-between text-slate-400 dark:text-slate-500 font-mono text-[10px]">
                  <span>{log.timestamp}</span>
                  <span>Trường: {log.fieldAffected}</span>
                </div>
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  {log.ruleDescription}
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 dark:bg-slate-900/60 p-1.5 rounded text-slate-500 dark:text-slate-400 font-mono overflow-x-auto">
                  <div className="truncate">
                    <span className="text-[10px] text-rose-500 block uppercase font-bold">Trước:</span>
                    {log.beforeValue || '<trống>'}
                  </div>
                  <div className="truncate border-l border-slate-200 dark:border-slate-800 pl-2">
                    <span className="text-[10px] text-emerald-500 block uppercase font-bold">Sau:</span>
                    {log.afterValue}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic py-4 text-center">
            Chưa có hành động tự sửa đổi nào được kích hoạt trong phiên này.
          </p>
        )}
      </div>

      {/* DIALOG XÁC NHẬN SỬA ĐỔI BEFORE / AFTER */}
      {selectedIssueForFix && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-950 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Xác nhận tự động sửa đổi hành chính
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {selectedIssueForFix.description}
                </p>
              </div>
              <span className="text-xs font-mono bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-semibold px-2.5 py-1 rounded">
                Nghị định 30/2020/NĐ-CP
              </span>
            </div>

            {/* Nội dung so sánh */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="bg-sky-50/50 dark:bg-sky-950/20 p-4 rounded-xl border border-sky-100 dark:border-sky-900/40 text-xs text-sky-900 dark:text-sky-300 leading-relaxed">
                <span className="font-bold block mb-1">Quy định áp dụng:</span>
                {rules.find(r => r.id === selectedIssueForFix.ruleId)?.description}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* TRƯỚC KHI SỬA */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="bg-rose-50 dark:bg-rose-950/30 px-3 py-2 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-rose-800 dark:text-rose-400">
                    Nội dung hiện tại (Trước)
                  </div>
                  <div className="p-4 text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/30 min-h-[100px] break-words whitespace-pre-wrap leading-relaxed max-h-[250px] overflow-y-auto">
                    {getBeforeValue(selectedIssueForFix)}
                  </div>
                </div>

                {/* SAU KHI SỬA */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-emerald-800 dark:text-emerald-400">
                    Đề xuất tự sửa đổi (Sau)
                  </div>
                  <div className="p-4 text-xs font-mono text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 min-h-[100px] break-words whitespace-pre-wrap leading-relaxed max-h-[250px] overflow-y-auto">
                    {selectedIssueForFix.suggestedValue || '<giá trị tự sửa đặc biệt>'}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer nút điều khiển */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedIssueForFix(null)}
                className="px-4 py-2 text-xs font-medium border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmFix}
                className="px-4 py-2 text-xs font-medium bg-sky-600 hover:bg-sky-700 text-white rounded-lg shadow-md cursor-pointer transition-colors flex items-center gap-1"
              >
                Xác nhận áp dụng <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
