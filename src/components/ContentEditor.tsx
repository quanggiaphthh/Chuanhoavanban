import React from 'react';
import { FileText, Plus, HelpCircle, BookOpen, Layers } from 'lucide-react';

interface ContentEditorProps {
  content: string;
  onChange: (content: string) => void;
  documentType: string;
}

const TEMPLATES: Record<string, string> = {
  'Quyết định': `Căn cứ Luật Tổ chức Chính phủ ngày 19 tháng 6 năm 2015;
Căn cứ Nghị định số 30/2020/NĐ-CP ngày 05 tháng 3 năm 2020 của Chính phủ về công tác văn thư;
Xét đề nghị của Chánh Văn phòng Sở và Trưởng phòng Công nghệ thông tin.

QUYẾT ĐỊNH:

Điều 1. Ban hành kèm theo Quyết định này Kế hoạch Chuyển đổi số và Ứng dụng Công nghệ thông tin trong hoạt động hành chính năm 2026.

Điều 2. Các đơn vị chuyên môn và tổ chức trực thuộc chịu trách nhiệm triển khai, phân bổ ngân sách, bảo đảm hạ tầng kỹ thuật phục vụ các mục tiêu đã đề ra.

Điều 3. Chánh Văn phòng, Trưởng phòng Kế hoạch - Tài chính, Trưởng phòng Công nghệ thông tin và Thủ trưởng các đơn vị có liên quan chịu trách nhiệm thi hành Quyết định này kể từ ngày ký.`,

  'Công văn': `Kính gửi: Các phòng chuyên môn, đơn vị trực thuộc Sở.

Thực hiện chỉ đạo của Ủy ban nhân dân tỉnh tại Công văn số 4567/UBND-VX ngày 12 tháng 09 năm 2026 về việc tăng cường bảo mật dữ liệu số quốc gia.

Giám đốc Sở yêu cầu các cơ quan, đơn vị nghiêm túc thực hiện các nội dung sau:

1. Rà soát, cập nhật đầy đủ các chứng thư số chuyên dùng cho 100% cán bộ, công chức làm việc trực tiếp trên Hệ thống thông tin giải quyết thủ tục hành chính.

2. Tuyệt đối không lưu trữ mật khẩu, thông tin tài khoản công vụ trên các trình duyệt công cộng hoặc chia sẻ cho người không có trách nhiệm.

3. Giao Trung tâm Công nghệ thông tin và Truyền thông phối hợp với Phòng An toàn thông tin giám sát, quét quét lỗ hổng định kỳ, báo cáo kết quả trước ngày 30 hàng tháng.`,

  'Thông báo': `Căn cứ nội dung Kế hoạch công tác quý IV năm 2026 của cơ quan đã được phê duyệt;
Để chuẩn bị tốt nhất các điều kiện cần thiết cho Hội nghị Chuyển đổi số vùng kinh tế trọng điểm.

Văn phòng Sở thông báo lịch làm việc cụ thể của Hội đồng kiểm tra như sau:

1. Thời gian tập trung: Đúng 08 giờ 00 phút, ngày 12 tháng 10 năm 2026.

2. Địa điểm: Hội trường số 2, Tầng 3, Nhà làm việc Liên cơ quan.

3. Thành phần tham dự: Toàn thể thành viên Hội đồng khoa học công nghệ, đại diện Ban Giám đốc Sở, và các nhóm nghiên cứu đề tài ứng dụng IoT trong nông nghiệp.

Đề nghị các phòng ban liên quan cử người tham gia đúng giờ, chuẩn bị báo cáo thuyết minh bản in và file chiếu (Slide) đầy đủ.`,

  'Báo cáo': `Thực hiện Chương trình hành động số 24-CTr/TU ngày 15 tháng 3 năm 2025 của Tỉnh ủy về phát triển kinh tế số, xã hội số toàn diện;
Sở Thông tin và Truyền thông báo cáo tiến độ thực hiện tính đến tháng 09 năm 2026 như sau:

I. KẾT QUẢ ĐẠT ĐƯỢC

1. Về chuyển đổi nhận thức số:
Đã hoàn thành tổ chức 15 lớp tập huấn kỹ năng số cho 1.200 cán bộ cấp xã, phường; tỷ lệ người dân biết sử dụng dịch vụ công trực tuyến tăng 35% so với cùng kỳ.

2. Về hạ tầng số công cộng:
Phủ sóng băng rộng di động 4G/5G đến 99.8% các thôn bản, hoàn thành giai đoạn 1 cổng kết nối dữ liệu dùng chung (LGSP).

II. PHƯƠNG HƯỚNG VÀ KIẾN NGHỊ QUÝ IV

Để đẩy nhanh tiến độ, đề nghị Sở Tài chính sớm thẩm định dự toán kinh phí nâng cấp Trung tâm dữ liệu của tỉnh phục vụ cơ sở dữ liệu đất đai.`,

  'Tờ trình': `Kính gửi: Ủy ban nhân dân tỉnh Lâm Đồng.

Căn cứ Quyết định số 749/QĐ-TTg ngày 03 tháng 6 năm 2020 của Thủ tướng Chính phủ phê duyệt Chương trình Chuyển đổi số quốc gia;
Để đáp ứng yêu cầu vận hành hạ tầng dùng chung an toàn của tỉnh.

Sở Thông tin và Truyền thông kính trình Ủy ban nhân dân tỉnh xem xét, phê duyệt Đề án nâng cấp Trung tâm dữ liệu tỉnh giai đoạn 2026 - 2030 với các nội dung chính sau:

1. Mục tiêu đề án: Hiện đại hóa hạ tầng điện toán đám mây riêng của tỉnh đạt chuẩn an toàn thông tin cấp độ 3.

2. Tổng mức đầu tư dự kiến: 12.500.000.000 đồng (Mười hai tỷ năm trăm triệu đồng chẵn).

3. Thời gian thực hiện: Từ năm 2026 đến năm 2028.

(Đính kèm dự thảo Quyết định phê duyệt Đề án và Thuyết minh thuyết trình chi tiết).

Sở Thông tin và Truyền thông kính trình Ủy ban nhân dân tỉnh xem xét, quyết định.`
};

export default function ContentEditor({ content, onChange, documentType }: ContentEditorProps) {
  
  // Áp dụng mẫu văn bản tự động tương ứng loại
  const handleApplyTemplate = (typeKey: string) => {
    const template = TEMPLATES[typeKey] || TEMPLATES['Quyết định'];
    if (confirm(`Bạn có chắc chắn muốn nạp nội dung mẫu cho "${typeKey}"? Nội dung hiện tại của bạn sẽ bị thay thế.`)) {
      onChange(template);
    }
  };

  // Các nút chèn nhanh các ký tự cấu trúc hành chính
  const insertTextAtCursor = (textToInsert: string) => {
    const textarea = document.getElementById('raw-content-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const beforeText = content.substring(0, startPos);
    const afterText = content.substring(endPos, content.length);

    const newContent = beforeText + textToInsert + afterText;
    onChange(newContent);

    // Re-focus and set cursor position after inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = startPos + textToInsert.length;
    }, 50);
  };

  // Đếm các thông số nội dung
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const paragraphCount = content.split('\n').filter(p => p.trim()).length;

  return (
    <div className="space-y-4">
      {/* TOOLBAR NẠP MẪU NHANH & HƯỚNG DẪN */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Nội dung mẫu theo thể loại:
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {Object.keys(TEMPLATES).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleApplyTemplate(key)}
              className={`text-[11px] px-2.5 py-1 rounded-md border cursor-pointer transition-colors ${
                documentType === key
                  ? 'bg-sky-600 border-sky-600 text-white font-medium hover:bg-sky-700'
                  : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
            >
              Mẫu {key}
            </button>
          ))}
        </div>
      </div>

      {/* SHORTCUTS CHÈN NHANH */}
      <div className="flex flex-wrap items-center gap-2 bg-sky-50/50 dark:bg-slate-950/30 p-2.5 rounded-lg border border-sky-100 dark:border-slate-800">
        <span className="text-[11px] font-bold text-sky-800 dark:text-sky-400 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5" />
          Chèn nhanh cấu trúc:
        </span>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => insertTextAtCursor('\nCăn cứ ')}
            className="text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded shadow-sm cursor-pointer"
          >
            + Căn cứ mới
          </button>
          <button
            type="button"
            onClick={() => insertTextAtCursor('\n\nĐiều 1. ')}
            className="text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded shadow-sm cursor-pointer font-bold"
          >
            + Điều mới (.)
          </button>
          <button
            type="button"
            onClick={() => insertTextAtCursor('\n1. ')}
            className="text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded shadow-sm cursor-pointer"
          >
            + Khoản mới (1, 2)
          </button>
          <button
            type="button"
            onClick={() => insertTextAtCursor('\na) ')}
            className="text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded shadow-sm cursor-pointer"
          >
            + Điểm mới (a, b)
          </button>
        </div>
      </div>

      {/* VÙNG NHẬP LIỆU CHÍNH */}
      <div className="relative">
        <textarea
          id="raw-content-textarea"
          value={content}
          onChange={(e) => onChange(e.target.value)}
          rows={16}
          className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-serif text-base leading-relaxed"
          placeholder="Nhập hoặc dán nội dung văn bản thô tại đây (nhập Căn cứ, Điều, Khoản, Điểm,...)..."
        />
        
        {/* Nút dán đè văn bản hướng dẫn nếu trống */}
        {content.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6 text-center">
            <FileText className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-sm text-slate-400 dark:text-slate-500 max-w-sm">
              Bạn có thể dán nội dung thô sao chép từ Microsoft Word vào đây, sau đó nhấn <strong className="text-sky-500 font-semibold">"Tự động định dạng"</strong> để đưa về chuẩn Nghị định 30.
            </p>
          </div>
        )}
      </div>

      {/* THÔNG TIN ĐẾM DỮ LIỆU */}
      <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 px-1 font-mono">
        <div className="flex items-center gap-3">
          <span>Ký tự: <strong className="text-slate-600 dark:text-slate-300">{charCount}</strong></span>
          <span>Từ: <strong className="text-slate-600 dark:text-slate-300">{wordCount}</strong></span>
          <span>Đoạn: <strong className="text-slate-600 dark:text-slate-300">{paragraphCount}</strong></span>
        </div>
        <span className="italic flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5" /> Thụt lề và 1.5 dòng sẽ tự gán ở trang xem trước.
        </span>
      </div>
    </div>
  );
}
