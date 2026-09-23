import React, { useRef } from 'react';
import { DocumentMetadata } from '../types/document';
import { formatVietnameseDate } from '../utils/rules';
import { Eye, EyeOff } from 'lucide-react';

interface PreviewA4Props {
  metadata: DocumentMetadata;
  content: string;
  showGuidelines: boolean;
  onToggleGuidelines: () => void;
}

export default function PreviewA4({
  metadata,
  content,
  showGuidelines,
  onToggleGuidelines
}: PreviewA4Props) {
  const pageRef = useRef<HTMLDivElement>(null);

  // Phân tách nội dung văn bản thành các đoạn văn
  const paragraphs = content.split('\n').map(p => p.trim()).filter(Boolean);

  // Ký tự thẩm quyền TM, KT, TL, Q
  let sigPrefix = '';
  if (metadata.signingType === 'TM') {
    sigPrefix = 'TM. ';
  } else if (metadata.signingType === 'KT') {
    sigPrefix = 'KT. ';
  } else if (metadata.signingType === 'TL') {
    sigPrefix = 'TL. ';
  } else if (metadata.signingType === 'Q') {
    sigPrefix = 'Q. ';
  }

  // Danh sách nơi nhận
  const recipientList = metadata.recipients
    ? metadata.recipients.split('\n').map(l => l.trim()).filter(Boolean)
    : ['- Như trên;', '- Lưu: VT, HC.'];

  const isLetter = metadata.documentType === 'Công văn';

  // Xác định số cột cho khối header (tránh co cụm cơ quan ban hành quá dài)
  const hasLongOrgName = (metadata.issuingOrganization || '').length > 28 || (metadata.parentOrganization || '').length > 28;
  const leftColSpan = hasLongOrgName ? 'col-span-6' : 'col-span-5';
  const rightColSpan = hasLongOrgName ? 'col-span-6' : 'col-span-7';

  // Định nghĩa kích cỡ chữ động dựa trên độ dài để tối ưu hóa tính thẩm mỹ
  const getParentOrgClass = (text: string) => {
    if (text.length > 45) return 'text-[9pt] tracking-tighter';
    if (text.length > 35) return 'text-[10pt] tracking-tighter';
    if (text.length > 25) return 'text-[10.5pt] tracking-tight';
    return 'text-[11pt] tracking-normal';
  };

  const getIssuingOrgClass = (text: string) => {
    if (text.length > 45) return 'text-[10pt] tracking-tighter leading-tight';
    if (text.length > 35) return 'text-[11pt] tracking-tighter leading-tight';
    if (text.length > 25) return 'text-[11.5pt] tracking-tight leading-tight';
    return 'text-[12pt] tracking-normal leading-tight';
  };

  return (
    <div className="space-y-4">
      {/* THANH ĐIỀU KHIỂN PREVIEW */}
      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Khung xem trước A4 (WYSIWYG - Chuẩn Nghị định 30)
          </span>
        </div>
        <button
          type="button"
          onClick={onToggleGuidelines}
          className="text-xs flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 transition-colors duration-150 cursor-pointer"
        >
          {showGuidelines ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showGuidelines ? 'Ẩn đường căn lề' : 'Hiện đường căn lề'}
        </button>
      </div>

      {/* KHU VỰC TRANG GIẤY A4 SIMULATOR */}
      <div className="overflow-x-auto pb-4 flex justify-center bg-slate-100 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200 dark:border-slate-900/80">
        <div
          ref={pageRef}
          id="a4-document-preview"
          className="relative bg-white text-black shadow-lg border border-slate-300/60 print:shadow-none print:border-none select-text transition-all duration-200"
          style={{
            width: '210mm',
            minHeight: '297mm',
            paddingTop: '20mm', // Lề trên 20-25mm
            paddingBottom: '20mm', // Lề dưới 20-25mm
            paddingLeft: '30mm', // Lề trái 30-35mm
            paddingRight: '15mm', // Lề phải 15-20mm
            fontFamily: '"Times New Roman", Times, Baskerville, Georgia, serif',
            boxSizing: 'border-box'
          }}
        >
          {/* ĐƯỜNG CĂN LỀ GIÚP THƯ KÝ ĐO ĐẠC ĐỊNH DẠNG (ẢNH ẨN KHI IN) */}
          {showGuidelines && (
            <div className="absolute inset-0 pointer-events-none border-dashed border-red-300/50 print:hidden"
                 style={{
                   top: '20mm',
                   bottom: '20mm',
                   left: '30mm',
                   right: '15mm',
                   borderWidth: '1px'
                 }}>
              <span className="absolute -top-5 left-1 text-[9px] text-red-500 font-mono">Lề trên: 20mm</span>
              <span className="absolute top-1/2 -left-28 -translate-y-1/2 text-[9px] text-red-500 font-mono rotate-90 whitespace-nowrap">Lề trái: 30mm</span>
              <span className="absolute top-1/2 -right-14 -translate-y-1/2 text-[9px] text-red-500 font-mono -rotate-90 whitespace-nowrap">Lề phải: 15mm</span>
              <span className="absolute -bottom-5 left-1 text-[9px] text-red-500 font-mono">Lề dưới: 20mm</span>
            </div>
          )}

          {/* 1. KHỐI TIÊU ĐỀ: QUỐC HIỆU & CƠ QUAN BAN HÀNH (SIDE-BY-SIDE GRID) */}
          <div className="space-y-3 mb-6">
            {/* Hàng 1: Cơ quan ban hành & Quốc hiệu Tiêu ngữ */}
            <div className="grid grid-cols-12 gap-2 text-center items-start leading-tight">
              {/* Cột trái: Cơ quan chủ quản và ban hành */}
              <div className={`${leftColSpan} flex flex-col items-center justify-start min-w-0`}>
                {metadata.parentOrganization ? (
                  <span className={`uppercase font-normal text-slate-800 text-center whitespace-nowrap ${getParentOrgClass(metadata.parentOrganization)}`}>
                    {metadata.parentOrganization}
                  </span>
                ) : (
                  <span className="text-[11pt] text-gray-300 italic whitespace-nowrap">Cơ quan chủ quản cấp trên</span>
                )}
                
                <span className={`font-bold uppercase tracking-tight text-center mt-1 whitespace-nowrap ${getIssuingOrgClass(metadata.issuingOrganization)}`}>
                  {metadata.issuingOrganization || 'TÊN CƠ QUAN BAN HÀNH'}
                </span>

                {/* Đường gạch ngang nhỏ dưới cơ quan ban hành (độ dài bằng 1/3 đến 1/2 độ dài tên cơ quan) */}
                <div className="w-1/3 border-b border-black mt-2 h-0"></div>
              </div>

              {/* Cột phải: Quốc hiệu, Tiêu ngữ */}
              <div className={`${rightColSpan} flex flex-col items-center justify-start min-w-0`}>
                <span className="text-[12.5pt] font-bold uppercase tracking-tight whitespace-nowrap">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </span>
                
                <span className="text-[13pt] font-bold mt-1.5 whitespace-nowrap">
                  Độc lập - Tự do - Hạnh phúc
                </span>

                {/* Gạch chân tiêu ngữ dưới (Độ dài bằng khoảng dòng tiêu ngữ, nét liền, đặt cân đối) */}
                <div className="w-7/12 border-b-2 border-black mt-2 h-0"></div>
              </div>
            </div>

            {/* Hàng 2: Số ký hiệu văn bản & Địa danh ngày tháng năm ban hành (luôn nằm cùng 1 hàng thẳng tắp) */}
            <div className="grid grid-cols-12 gap-2 text-center items-baseline leading-tight">
              {/* Cột trái: Số hiệu văn bản */}
              <div className={`${leftColSpan} flex flex-col items-center justify-start min-w-0`}>
                <span className="text-[12pt] font-normal whitespace-nowrap text-slate-900">
                  {metadata.documentCode ? `Số: ${metadata.documentCode}` : 'Số: .../...'}
                </span>
              </div>

              {/* Cột phải: Địa danh & ngày tháng */}
              <div className={`${rightColSpan} flex flex-col items-center justify-start min-w-0`}>
                <span className="text-[13pt] italic font-normal whitespace-nowrap text-slate-900">
                  {metadata.location || '...'}, {formatVietnameseDate(metadata.date)}
                </span>
              </div>
            </div>
          </div>

          {/* 2. KHỐI TRÍCH YẾU & TIÊU ĐỀ LOẠI VĂN BẢN */}
          <div className="mt-8 mb-6 flex flex-col items-center justify-center text-center leading-normal">
            {isLetter ? (
              // Đối với Công văn: trích yếu đặt bên trái, cân đối
              <div className="w-full text-left pl-2">
                <p className="text-[12pt] font-semibold">
                  V/v: <span className="font-bold">{metadata.subject || 'Nhập trích yếu nội dung công văn'}</span>
                </p>
              </div>
            ) : (
              // Đối với văn bản có tên loại (Quyết định, Thông báo,...)
              <div className="w-full flex flex-col items-center">
                <span className="text-[14pt] font-bold uppercase tracking-wide">
                  {metadata.documentType || 'LOẠI VĂN BẢN'}
                </span>
                <span className="text-[14pt] font-bold max-w-lg mt-1">
                  {metadata.subject || 'Trích yếu nội dung của văn bản'}
                </span>
                {/* Đường gạch chân dưới trích yếu (độ dài bằng 1/3 đến 1/2 độ dài dòng trích yếu) */}
                <div className="w-1/4 border-b border-black mt-2 h-0"></div>
              </div>
            )}
          </div>

          {/* 3. PHẦN NỘI DUNG VĂN BẢN (Times New Roman, 13-14pt, 1.5 lines, justify) */}
          <div className="text-[13.5pt] leading-[1.55] text-justify space-y-4 pt-4 pb-8 min-h-[300px]">
            {paragraphs.length > 0 ? (
              paragraphs.map((pText, index) => {
                const lowerText = pText.toLowerCase();
                const isCanCu = lowerText.startsWith('căn cứ') || lowerText.startsWith('- căn cứ');
                const isDieu = /^điều\s+\d+/i.test(pText);

                if (isDieu) {
                  // Tách phần "Điều 1." ra để in đậm, còn nội dung sau viết thường
                  const match = pText.match(/^(Điều\s+\d+\.)(.*)$/i);
                  if (match) {
                    return (
                      <p key={index} style={{ textIndent: '1.25cm' }} className="m-0 text-justify">
                        <strong className="font-bold">{match[1]}</strong>
                        {match[2]}
                      </p>
                    );
                  }
                }

                return (
                  <p
                    key={index}
                    style={{
                      textIndent: '1.25cm',
                      fontStyle: isCanCu ? 'italic' : 'normal'
                    }}
                    className="m-0 text-justify"
                  >
                    {pText}
                  </p>
                );
              })
            ) : (
              <p className="italic text-gray-400 text-center select-none py-12">
                [Nội dung văn bản trống. Nhập nội dung vào trình soạn thảo để hiển thị tại đây]
              </p>
            )}
          </div>

          {/* 4. KHỐI CHỮ KÝ VÀ NƠI NHẬN (SIDE-BY-SIDE GRID) */}
          <div className="grid grid-cols-12 gap-4 items-start mt-8">
            {/* Cột trái: Nơi nhận (Size 11-12pt, italic, left aligned) */}
            <div className="col-span-5 text-left leading-normal">
              <span className="text-[11.5pt] font-bold italic block mb-1">Nơi nhận:</span>
              <div className="space-y-0.5 text-[10.5pt] italic text-slate-800">
                {recipientList.map((line, idx) => (
                  <span key={idx} className="block">
                    {line}
                  </span>
                ))}
              </div>
            </div>

            {/* Cột phải: Thẩm quyền & Người ký (Size 13-14pt, centered, bold) */}
            <div className="col-span-7 flex flex-col items-center text-center leading-normal">
              <span className="text-[13pt] font-bold uppercase tracking-tight block">
                {sigPrefix}{metadata.signerTitle || 'CHỨC DANH NGƯỜI KÝ'}
              </span>
              
              {/* Khoảng trống ký tên mô phỏng */}
              <div className="h-24 w-full flex items-center justify-center relative select-none">
                <span className="text-[10px] text-gray-300 border border-dashed border-gray-200 px-3 py-1 rounded">
                  Không gian đóng dấu & ký tên
                </span>
              </div>

              <span className="text-[13pt] font-bold block mt-2">
                {metadata.signerName || 'HỌ TÊN NGƯỜI KÝ'}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
