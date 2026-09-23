/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { DocumentMetadata, ValidationIssue, FixLog, SigningType } from './types/document';
import { validateDocument, rules } from './utils/rules';
import MetadataForm from './components/MetadataForm';
import ContentEditor from './components/ContentEditor';
import PreviewA4 from './components/PreviewA4';
import ValidatorPanel from './components/ValidatorPanel';
import ExportControls from './components/ExportControls';
import DocxImportPanel from './components/DocxImportPanel';
import { SuggestedField } from './utils/docxImporter';
import {
  FileText,
  AlertTriangle,
  Sparkles,
  Sun,
  Moon,
  BookOpen,
  HelpCircle,
  FileCheck2,
  X,
  Settings,
  FlameKindling,
  FileUp
} from 'lucide-react';

const LOCAL_STORAGE_KEYS = {
  METADATA: 'hanhchinh30_meta',
  CONTENT: 'hanhchinh30_content',
  DARK_MODE: 'hanhchinh30_dark',
  FIX_LOGS: 'hanhchinh30_logs'
};

const DEFAULT_PRESET = {
  documentType: 'Quyết định',
  parentOrganization: 'ỦY BAN NHÂN DÂN TỈNH LÂM ĐỒNG',
  issuingOrganization: 'SỞ THÔNG TIN VÀ TRUYỀN THÔNG',
  documentCode: '128/QĐ-STTTT',
  location: 'Đà Lạt',
  date: '2026-09-23',
  subject: 'Về việc phê duyệt Kế hoạch phát triển hạ tầng số phục vụ chuyển đổi số năm 2026',
  signerTitle: 'GIÁM ĐỐC',
  signerName: 'Nguyễn Văn Hoài',
  signingType: 'DIRECT' as SigningType,
  recipients: '- Như trên;\n- UBND Tỉnh (báo cáo);\n- Các Phòng thuộc Sở;\n- Lưu: VT, CNTT.'
};

const DEFAULT_CONTENT = `Căn cứ Luật Tổ chức chính quyền địa phương ngày 19 tháng 6 năm 2015;
Căn cứ Nghị định số 30/2020/NĐ-CP ngày 05 tháng 3 năm 2020 của Chính phủ về công tác văn thư;
Xét đề nghị của Chánh Văn phòng Sở và Trưởng phòng Công nghệ thông tin.

QUYẾT ĐỊNH:

Điều 1: Ban hành kèm theo Quyết định này Kế hoạch Chuyển đổi số và Ứng dụng Công nghệ thông tin trong hoạt động hành chính năm 2026.

Điều 2: Các đơn vị chuyên môn và tổ chức trực thuộc chịu trách nhiệm triển khai, phân bổ ngân sách, bảo đảm hạ tầng kỹ thuật phục vụ các mục tiêu đã đề ra.

Điều 3 - Chánh Văn phòng, Trưởng phòng Kế hoạch - Tài chính, Trưởng phòng Công nghệ thông tin và Thủ trưởng các đơn vị có liên quan chịu trách nhiệm thi hành Quyết định này kể từ ngày ký.`;

export default function App() {
  // --- STATE ---
  const [metadata, setMetadata] = useState<DocumentMetadata>(DEFAULT_PRESET);
  const [content, setContent] = useState<string>(DEFAULT_CONTENT);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [fixLogs, setFixLogs] = useState<FixLog[]>([]);
  const [activeTab, setActiveTab] = useState<'metadata' | 'editor' | 'validator'>('metadata');
  const [showGuidelines, setShowGuidelines] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Trạng thái modal thông tin
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  // Trạng thái Nhập file Word (.docx)
  const [showImportPanel, setShowImportPanel] = useState<boolean>(false);
  const [suggestedMetadata, setSuggestedMetadata] = useState<Partial<Record<keyof DocumentMetadata, SuggestedField>> | null>(null);

  // --- TỰ ĐỘNG TẢI DỮ LIỆU CŨ TỪ LOCALSTORAGE ---
  useEffect(() => {
    const savedMeta = localStorage.getItem(LOCAL_STORAGE_KEYS.METADATA);
    const savedContent = localStorage.getItem(LOCAL_STORAGE_KEYS.CONTENT);
    const savedDark = localStorage.getItem(LOCAL_STORAGE_KEYS.DARK_MODE);
    const savedLogs = localStorage.getItem(LOCAL_STORAGE_KEYS.FIX_LOGS);

    if (savedMeta) {
      try { setMetadata(JSON.parse(savedMeta)); } catch (e) { console.error(e); }
    }
    if (savedContent) {
      setContent(savedContent);
    }
    if (savedDark) {
      setDarkMode(savedDark === 'true');
    }
    if (savedLogs) {
      try { setFixLogs(JSON.parse(savedLogs)); } catch (e) { console.error(e); }
    }
  }, []);

  // --- LƯU TRỮ DỰ THẢO KHI CÓ THAY ĐỔI (AUTOSAVE) ---
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.METADATA, JSON.stringify(metadata));
  }, [metadata]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.CONTENT, content);
  }, [content]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.DARK_MODE, String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.FIX_LOGS, JSON.stringify(fixLogs));
  }, [fixLogs]);

  // --- DỌN SẠCH NHẬT KÝ ---
  const handleClearLogs = () => {
    setFixLogs([]);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.FIX_LOGS);
  };

  // --- DỰNG DANH SÁCH LỖI REALTIME ---
  const issues = useMemo(() => {
    return validateDocument(metadata, content);
  }, [metadata, content]);

  // --- HÀM TỰ ĐỘNG CHUẨN HÓA TOÀN BỘ (ONE-CLICK AUTO FIX) ---
  const handleAutoFormatAll = () => {
    const fixableIssues = issues.filter(i => i.canAutoFix);
    if (fixableIssues.length === 0) {
      showToast('Không tìm thấy lỗi định dạng nào có thể tự sửa đổi.');
      return;
    }

    let updatedMeta = { ...metadata };
    let updatedContent = content;
    const newLogs: FixLog[] = [];
    const timestamp = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    for (const issue of fixableIssues) {
      const targetRule = rules.find(r => r.id === issue.ruleId);
      if (targetRule && targetRule.autoFix) {
        const fixResult = targetRule.autoFix(updatedMeta, updatedContent);
        
        // Cập nhật giá trị
        if (fixResult.meta) {
          updatedMeta = { ...updatedMeta, ...fixResult.meta };
        }
        if (fixResult.content !== undefined) {
          updatedContent = fixResult.content;
        }

        // Lưu log
        const originalValue = issue.field === 'content' 
          ? (content.length > 60 ? content.slice(0, 60) + '...' : content)
          : String(metadata[issue.field] || '');

        const correctedValue = issue.suggestedValue || '<đã chuẩn hóa>';

        newLogs.unshift({
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          ruleId: issue.ruleId,
          ruleDescription: issue.description,
          timestamp,
          fieldAffected: issue.field === 'content' ? 'Nội dung' : String(issue.field),
          beforeValue: originalValue,
          afterValue: correctedValue
        });
      }
    }

    setMetadata(updatedMeta);
    setContent(updatedContent);
    setFixLogs(prev => [...newLogs, ...prev]);
    showToast(`Đã tự động sửa thành công ${fixableIssues.length} lỗi thể thức hành chính!`);
  };

  // --- HÀM ÁP DỤNG MỘT LỖI CỤ THỂ (SỬA LẺ) ---
  const handleApplySingleFix = (
    issueId: string,
    ruleId: string,
    updatedMetaPart?: Partial<DocumentMetadata>,
    updatedContentVal?: string,
    description?: string
  ) => {
    const timestamp = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const targetIssue = issues.find(i => i.id === issueId);
    
    if (!targetIssue) return;

    if (updatedMetaPart) {
      setMetadata(prev => ({ ...prev, ...updatedMetaPart }));
    }
    if (updatedContentVal !== undefined) {
      setContent(updatedContentVal);
    }

    const originalValue = targetIssue.field === 'content' 
      ? (content.length > 60 ? content.slice(0, 60) + '...' : content)
      : String(metadata[targetIssue.field] || '');

    const correctedValue = targetIssue.suggestedValue || '<đã chuẩn hóa>';

    const newLog: FixLog = {
      id: `log-${Date.now()}`,
      ruleId,
      ruleDescription: description || targetIssue.description,
      timestamp,
      fieldAffected: targetIssue.field === 'content' ? 'Nội dung' : String(targetIssue.field),
      beforeValue: originalValue,
      afterValue: correctedValue
    };

    setFixLogs(prev => [newLog, ...prev]);
    showToast(`Đã chuẩn hóa thành công: ${targetIssue.description}`);
  };

  // --- HÀM ÁP DỤNG PRESETS CƠ QUAN MẪU ---
  const handleApplyPreset = (presetName: string) => {
    const savedPreset = [
      {
        name: 'Sở Thông tin và Truyền thông - Quyết định',
        meta: DEFAULT_PRESET,
        content: DEFAULT_CONTENT
      },
      {
        name: 'Ủy ban nhân dân Quận - Công văn',
        meta: {
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
        },
        content: `Kính gửi: Các phòng chuyên môn, đơn vị trực thuộc Sở.

Thực hiện chỉ đạo của Ủy ban nhân dân tỉnh tại Công văn số 4567/UBND-VX ngày 12 tháng 09 năm 2026 về việc tăng cường bảo mật dữ liệu số quốc gia.

Giám đốc Sở yêu cầu các cơ quan, đơn vị nghiêm túc thực hiện các nội dung sau:

1. Rà soát, cập nhật đầy đủ các chứng thư số chuyên dùng cho 100% cán bộ, công chức làm việc trực tiếp trên Hệ thống thông tin giải quyết thủ tục hành chính.

2. Tuyệt đối không lưu trữ mật khẩu, thông tin tài khoản công vụ trên các trình duyệt công cộng hoặc chia sẻ cho người không có trách nhiệm.

3. Giao Trung tâm Công nghệ thông tin và Truyền thông phối hợp với Phòng An toàn thông tin giám sát, quét quét lỗ hổng định kỳ, báo cáo kết quả trước ngày 30 hàng tháng.`
      },
      {
        name: 'Văn phòng Bộ - Thông báo',
        meta: {
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
        },
        content: `Căn cứ kế hoạch công tác năm 2026 của cơ quan đã được phê duyệt;
Để chuẩn bị tốt nhất các điều kiện cần thiết cho lễ Quốc khánh diễn ra thành công tốt đẹp.

Văn phòng Bộ thông báo lịch làm việc cụ thể như sau:

1. Thời gian nghỉ lễ: Từ ngày 02 tháng 09 năm 2026 đến hết ngày 05 tháng 09 năm 2026.

2. Trực cơ quan: Giao Phòng Bảo vệ phối hợp với Văn phòng bộ bố trí lịch trực 24/24 bảo đảm an toàn phòng chống cháy nổ.

3. Báo cáo tình hình: Yêu cầu các đơn vị trực thuộc báo cáo mọi diễn biến bất thường về Thường trực Ban Chỉ đạo qua đường dây nóng.`
      }
    ].find(p => p.name === presetName);

    if (savedPreset) {
      setMetadata(savedPreset.meta);
      setContent(savedPreset.content);
      showToast(`Đã nạp mẫu: "${presetName}"`);
    }
  };

  // --- HIỂN THỊ TOAST THÔNG BÁO ---
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200 pb-16">
      {/* 1. TOP NAV BAR (THỎA THUẬN TOP BAR CONTRACT) */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm print:hidden">
        {/* Brand Zone (Single-line, wordmark in display style) */}
        <div className="flex items-center gap-2">
          <FileCheck2 className="w-5.5 h-5.5 text-sky-600 dark:text-sky-400" />
          <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0">
            Hành Chính 30
          </span>
        </div>

        {/* 4-6 Nav Links (Single-line, text only) */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <button
            onClick={() => setActiveTab('metadata')}
            className={`hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer ${
              activeTab === 'metadata' ? 'text-sky-600 dark:text-sky-400 font-bold' : ''
            }`}
          >
            Thuộc tính
          </button>
          <button
            onClick={() => setActiveTab('editor')}
            className={`hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer ${
              activeTab === 'editor' ? 'text-sky-600 dark:text-sky-400 font-bold' : ''
            }`}
          >
            Biên tập
          </button>
          <button
            onClick={() => setActiveTab('validator')}
            className={`hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer relative ${
              activeTab === 'validator' ? 'text-sky-600 dark:text-sky-400 font-bold' : ''
            }`}
          >
            Kiểm tra lỗi
            {issues.length > 0 && (
              <span className="absolute -top-1.5 -right-2.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            )}
          </button>
          <button
            onClick={() => setShowInfoModal(true)}
            className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer"
          >
            Quy định 30
          </button>
          <button
            onClick={() => setShowHelpModal(true)}
            className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer"
          >
            Hướng dẫn
          </button>
        </nav>

        {/* 1-2 Primary Action Points */}
        <div className="flex items-center gap-3">
          {/* Light/Dark mode */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={darkMode ? 'Chuyển sang Giao diện sáng' : 'Chuyển sang Giao diện tối'}
          >
            {darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>

          {/* Nút Chuẩn Hóa Tự Động */}
          <button
            onClick={handleAutoFormatAll}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-700 hover:to-sky-600 dark:from-sky-500 dark:to-sky-600 text-white font-bold text-xs rounded-lg shadow-md hover:shadow-lg transition-all duration-150 whitespace-nowrap cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            Tự động định dạng
          </button>
        </div>
      </header>

      {/* 2. CHƯƠNG TRÌNH CHÍNH (WORKSPACE LAYOUT) */}
      <main className="max-w-[1400px] mx-auto px-4 md:px-6 pt-6 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* CỘT TRÁI: BẢNG ĐIỀU KHIỂN & BIÊN TẬP (6 cột) */}
        <div className="xl:col-span-6 space-y-6 print:hidden">
          {/* Hộp chuyển tab biên dịch nhanh */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 flex gap-1 shadow-sm">
            <button
              onClick={() => setActiveTab('metadata')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'metadata'
                  ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 shadow-sm border border-sky-100 dark:border-slate-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Settings className="w-4 h-4" />
              1. Thông tin (Metadata)
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'editor'
                  ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 shadow-sm border border-sky-100 dark:border-slate-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 border border-transparent'
              }`}
            >
              <FileText className="w-4 h-4" />
              2. Nội dung văn bản
            </button>
            <button
              onClick={() => setActiveTab('validator')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer relative ${
                activeTab === 'validator'
                  ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 shadow-sm border border-sky-100 dark:border-slate-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 border border-transparent'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              3. Bộ kiểm lỗi ({issues.length})
              {issues.length > 0 && (
                <span className="absolute top-2 right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              )}
            </button>
          </div>

          {/* NỘI DUNG PHÂN TÁCH THEO TAB */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            {activeTab === 'metadata' && (
              <MetadataForm
                metadata={metadata}
                onChange={setMetadata}
                onApplyPreset={handleApplyPreset}
                suggestedMetadata={suggestedMetadata || undefined}
              />
            )}
            
            {activeTab === 'editor' && (
              <div className="space-y-4">
                {!showImportPanel ? (
                  <>
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Trình soạn thảo nội dung gốc
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowImportPanel(true)}
                        className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-slate-800 border border-sky-100 dark:border-sky-900/40 rounded-lg font-bold transition-all cursor-pointer shadow-sm"
                        title="Tải tệp .docx của bạn và bóc tách tự động"
                      >
                        <FileUp className="w-3.5 h-3.5 animate-bounce" /> Nhập từ file Word (.docx)
                      </button>
                    </div>
                    <ContentEditor
                      content={content}
                      onChange={setContent}
                      documentType={metadata.documentType}
                    />
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <FileUp className="w-4 h-4 text-sky-600" /> Nhập và phân tách tệp Microsoft Word (.docx)
                      </span>
                    </div>
                    <DocxImportPanel
                      onImport={(extractedContent, acceptedMeta, fullSuggestions) => {
                        setContent(extractedContent);
                        setMetadata(prev => ({
                          ...prev,
                          ...acceptedMeta
                        }));
                        setSuggestedMetadata(fullSuggestions);
                        setShowImportPanel(false);
                        showToast("Đã trích xuất và chuẩn hóa nội dung từ file Word thành công!");
                      }}
                      onCancel={() => setShowImportPanel(false)}
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'validator' && (
              <ValidatorPanel
                issues={issues}
                metadata={metadata}
                content={content}
                onApplyFix={handleApplySingleFix}
                fixLogs={fixLogs}
                onClearLogs={handleClearLogs}
              />
            )}
          </div>

          {/* BẢNG ĐIỀU KHIỂN XUẤT FILE */}
          <ExportControls metadata={metadata} content={content} />
        </div>

        {/* CỘT PHẢI: TRANG XEM TRƯỚC WYSIWYG A4 (6 cột) */}
        <div className="xl:col-span-6 sticky top-24">
          <PreviewA4
            metadata={metadata}
            content={content}
            showGuidelines={showGuidelines}
            onToggleGuidelines={() => setShowGuidelines(!showGuidelines)}
          />
        </div>

      </main>

      {/* 3. TOAST THÔNG BÁO (POPUP) */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-800 dark:border-slate-200 animate-slide-up text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-sky-400 dark:text-sky-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 4. MODAL THÔNG TIN NGHỊ ĐỊNH 30 */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-950 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-sky-600" />
                Thể Thức Văn Bản theo Nghị định 30/2020/NĐ-CP
              </h3>
              <button
                onClick={() => setShowInfoModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                Nghị định 30/2020/NĐ-CP do Chính phủ ban hành ngày 05/03/2020 quy định rất chi tiết về công tác văn thư, đặc biệt là kích cỡ, vị trí và định dạng chuẩn của từng thành phần văn bản hành chính Việt Nam:
              </p>

              <div className="space-y-3">
                <div className="border-l-2 border-sky-500 pl-3">
                  <span className="font-bold block text-slate-900 dark:text-slate-200">1. Quốc hiệu và Tiêu ngữ</span>
                  <p>
                    - "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM": in hoa, đậm, cỡ 12-13, căn giữa.<br />
                    - "Độc lập - Tự do - Hạnh phúc": in thường, đậm, cỡ 13-14, căn giữa, có gạch chân bằng nét liền, độ dài bằng khoảng 1/2 dòng chữ, đặt cân đối; đặt ở góc trên bên phải trang.
                  </p>
                </div>

                <div className="border-l-2 border-sky-500 pl-3">
                  <span className="font-bold block text-slate-900 dark:text-slate-200">2. Tên cơ quan, tổ chức ban hành</span>
                  <p>
                    - Đặt ở góc trên bên trái, cân đối với Quốc hiệu Tiêu ngữ.<br />
                    - In hoa, đậm, cỡ 12-13, có cơ quan chủ quản phía trên (nếu có, không đậm), có đường gạch chân ngắn (độ dài bằng 1/3 đến 1/2 tên cơ quan).
                  </p>
                </div>

                <div className="border-l-2 border-sky-500 pl-3">
                  <span className="font-bold block text-slate-900 dark:text-slate-200">3. Số, ký hiệu văn bản</span>
                  <p>
                    - Số đặt dưới cơ quan ban hành. Định dạng: "Số: [Số]/[Ký hiệu viết tắt]" (ví dụ: Số: 45/QĐ-UBND). Chữ viết tắt ngăn cách bằng dấu gạch chéo (/), nếu có tên loại thì viết liền kèm theo gạch ngang (QĐ-UBND).
                  </p>
                </div>

                <div className="border-l-2 border-sky-500 pl-3">
                  <span className="font-bold block text-slate-900 dark:text-slate-200">4. Địa danh và thời gian</span>
                  <p>
                    - Đặt dưới Quốc hiệu Tiêu ngữ. In nghiêng, cỡ 13-14. Ngày dưới 10 và tháng 1, 2 phải ghi số 0 phía trước (ví dụ: ngày 05 tháng 02 năm 2026).
                  </p>
                </div>

                <div className="border-l-2 border-sky-500 pl-3">
                  <span className="font-bold block text-slate-900 dark:text-slate-200">5. Tên loại văn bản và trích yếu</span>
                  <p>
                    - Đối với văn bản có tên loại: Tên loại in hoa đậm căn giữa cỡ 14 (ví dụ: QUYẾT ĐỊNH), trích yếu in thường đậm căn giữa ngay dưới. Có gạch chân ngắn.<br />
                    - Đối với Công văn (không tên loại): Trích yếu in đậm nằm bên trái góc dưới Số, bắt đầu bằng "V/v: " hoặc "Về việc:".
                  </p>
                </div>

                <div className="border-l-2 border-sky-500 pl-3">
                  <span className="font-bold block text-slate-900 dark:text-slate-200">6. Chữ ký và Nơi nhận</span>
                  <p>
                    - "Nơi nhận:" in nghiêng đậm bên trái cuối trang, danh sách cơ quan nhận thụ lý viết dòng nghiêng cỡ 11, kết thúc bằng "- Lưu: VT,..."<br />
                    - Quyền hạn (TM., KT., TL., Q.) in hoa đậm; Chức danh in hoa đậm lệch phải. Họ tên in đậm đặt phía dưới.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
              >
                Đã hiểu quy định
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL HƯỚNG DẪN SỬ DỤNG APP */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-950 w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-sky-600" />
                Hướng Dẫn Sử Dụng
              </h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                Các bước soạn thảo và chuẩn hóa văn bản nhanh chóng:
              </p>
              
              <ol className="list-decimal list-inside space-y-2">
                <li>
                  <strong>Chọn mẫu nhanh (Presets):</strong> Hãy bắt đầu bằng cách nhấn chọn 1 trong các mẫu ở tab <strong className="text-slate-800 dark:text-slate-200">1. Thông tin (Metadata)</strong> để xem cách thức điền dữ liệu.
                </li>
                <li>
                  <strong>Chỉnh sửa thông tin:</strong> Nhập thông tin của đơn vị của bạn như tên cơ quan, số hiệu, chức danh người ký và ngày ban hành.
                </li>
                <li>
                  <strong>Nhập nội dung:</strong> Di chuyển qua tab <strong className="text-slate-800 dark:text-slate-200">2. Nội dung văn bản</strong> để soạn thảo hoặc dán nội dung từ tệp Word thô của bạn vào. Hãy sử dụng các nút chèn nhanh cấu trúc (+ Điều, + Khoản,...) bên trên hộp soạn thảo.
                </li>
                <li>
                  <strong>Kiểm lỗi & Auto-format:</strong> Chuyển sang tab <strong className="text-slate-800 dark:text-slate-200">3. Bộ kiểm lỗi</strong> để xem các vấn đề thể thức chưa chuẩn xác. Bạn có thể nhấn nút <strong className="text-sky-600">"Tự động định dạng"</strong> ở thanh menu đầu trang để ứng dụng tự động rà soát và định dạng lại 100% các lỗi chuẩn thể thức.
                </li>
                <li>
                  <strong>Tải xuống file kết quả:</strong> Nhấn chọn các nút ở phần xuất bản cuối trang bên trái để tải file <strong className="text-sky-600">Microsoft Word (.docx)</strong> hoặc tệp <strong className="text-slate-800 dark:text-slate-300">PDF</strong> sắc nét về máy tính phục vụ công việc thực tế.
                </li>
              </ol>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
              >
                Bắt đầu soạn thảo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
