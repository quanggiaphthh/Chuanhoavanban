import React, { useState } from 'react';
import { DocumentMetadata } from '../types/document';
import { exportToDocx } from '../utils/docxExporter';
import { FileDown, FileText, Printer, Loader2, Info } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportControlsProps {
  metadata: DocumentMetadata;
  content: string;
}

export default function ExportControls({ metadata, content }: ExportControlsProps) {
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Xuất file Microsoft Word (.docx)
  const handleExportDocx = async () => {
    setIsExportingDocx(true);
    try {
      const blob = await exportToDocx(metadata, content);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // Tạo tên file sạch sẽ, tiếng Việt không dấu hoặc có dấu rõ ràng
      const cleanFileName = `VanBan_${metadata.documentType || 'HanhChinh'}_${metadata.documentCode ? metadata.documentCode.replace(/\//g, '_') : Date.now()}.docx`;
      
      link.href = url;
      link.download = cleanFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Lỗi khi xuất DOCX:', e);
      alert('Không thể xuất file Word. Vui lòng kiểm tra lại cấu trúc văn bản.');
    } finally {
      setIsExportingDocx(false);
    }
  };

  // Xuất file PDF bằng html2canvas + jsPDF
  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const element = document.getElementById('a4-document-preview');
      if (!element) {
        alert('Không tìm thấy vùng văn bản xem trước.');
        return;
      }

      // Tạm thời tắt đường căn lề nếu có trước khi chụp ảnh
      const canvas = await html2canvas(element, {
        scale: 2, // Tăng chất lượng ảnh chụp
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      // Khổ A4 đứng tiêu chuẩn: 210mm x 297mm
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Trang đầu tiên
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Xử lý nếu văn bản dài tràn sang nhiều trang
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const cleanFileName = `VanBan_${metadata.documentType || 'HanhChinh'}_${metadata.documentCode ? metadata.documentCode.replace(/\//g, '_') : Date.now()}.pdf`;
      pdf.save(cleanFileName);
    } catch (e) {
      console.error('Lỗi khi xuất PDF:', e);
      alert('Lỗi khi tạo file PDF. Vui lòng thử lại.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Kích hoạt tính năng In Trực Tiếp của trình duyệt
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
        Xuất bản văn bản hành chính
      </h3>
      
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        Các tệp tin được biên dịch hoàn toàn độc lập tại máy tính của bạn (phía client), bảo đảm tính riêng tư tuyệt đối cho nội dung dự thảo.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Nút xuất Word */}
        <button
          type="button"
          onClick={handleExportDocx}
          disabled={isExportingDocx}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white font-medium text-xs rounded-xl shadow-md cursor-pointer transition-all duration-150"
        >
          {isExportingDocx ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileDown className="w-4 h-4" />
          )}
          Tải file Word (.docx)
        </button>

        {/* Nút xuất PDF */}
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={isExportingPdf}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:bg-slate-400 text-white font-medium text-xs rounded-xl shadow-md cursor-pointer transition-all duration-150"
        >
          {isExportingPdf ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileText className="w-4 h-4" />
          )}
          Tải file PDF (.pdf)
        </button>

        {/* Nút In ấn */}
        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs rounded-xl shadow-sm cursor-pointer transition-all duration-150"
        >
          <Printer className="w-4 h-4 text-slate-500" />
          In / Lưu PDF Trực tiếp
        </button>
      </div>

      {/* THÔNG TIN HƯỚNG DẪN IN CHUẨN ĐẸP 100% VECTOR */}
      <div className="flex gap-2.5 bg-sky-50/50 dark:bg-slate-950/40 border border-sky-100 dark:border-slate-800 p-3.5 rounded-xl text-xs text-sky-900 dark:text-sky-300">
        <Info className="w-4 h-4 shrink-0 text-sky-600 dark:text-sky-400 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold block text-sky-800 dark:text-sky-300">Mẹo nhỏ khi xuất PDF chất lượng cao:</span>
          <p className="leading-relaxed text-slate-600 dark:text-slate-400">
            Nút <strong className="text-slate-800 dark:text-slate-300">"Tải file PDF"</strong> chụp lại giao diện nên ảnh chữ có thể bị nén nhẹ. Để tải PDF <strong className="text-sky-700 dark:text-sky-300">sắc nét 100% dạng vector</strong>, hãy nhấn <strong className="text-slate-800 dark:text-slate-300">"In / Lưu PDF Trực tiếp"</strong>, chọn thiết bị in là <strong className="text-sky-700 dark:text-sky-300">"Lưu dưới dạng PDF" (Save as PDF)</strong>, chọn khổ <strong className="text-slate-800 dark:text-slate-300">A4</strong> và tích chọn <strong className="text-sky-700 dark:text-sky-300">"In hình nền" (Background graphics)</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
