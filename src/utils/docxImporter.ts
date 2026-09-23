import { DocumentMetadata, SigningType } from '../types/document';

export interface SuggestedField {
  value: string;
  sourceLine: string;
}

export interface ExtractedDocxData {
  extractedContent: string;
  suggestedMetadata: Partial<Record<keyof DocumentMetadata, SuggestedField>>;
}

/**
 * Phân tích văn bản thô từ Mammoth.js để trích xuất nội dung và gợi ý các trường metadata theo Nghị định 30/2020/NĐ-CP
 */
export function parseDocxRawText(rawText: string): ExtractedDocxData {
  // Chuẩn hóa dòng xuống dòng
  const allLines = rawText
    .split(/\r?\n/)
    .map(line => line.trim());

  // Tìm các chỉ mục để phân tách thể thức (Header, Body, Footer)
  let headerEndIdx = 0;
  let bodyStartIdx = 0;
  let footerStartIdx = allLines.length;

  const suggestedMetadata: Partial<Record<keyof DocumentMetadata, SuggestedField>> = {};

  // --- 1. PHÂN TÍCH HEADER / METADATA ĐẦU TRANG ---
  
  // Quét 25 dòng đầu tiên để nhận diện các trường thể thức đầu trang
  const topLinesLimit = Math.min(allLines.length, 25);
  
  // Tìm kiếm "Số hiệu"
  // Ví dụ: "Số: 128/QĐ-STTTT" hoặc "Số: 45/2026/QĐ-UBND"
  const docCodeRegex = /^(?:S[ốo]|No\.?)\s*:\s*([^\s]+)/i;
  let codeFoundLineIdx = -1;

  // Tìm kiếm "Địa danh & Ngày tháng"
  // Ví dụ: "Đà Lạt, ngày 23 tháng 09 năm 2026" hoặc "Hà Nội, ngày 05/02/2026"
  const dateRegex = /(?:ng[àa]y)\s+(\d{1,2})\s+th[áa]ng\s+(\d{1,2})\s+n[ăa]m\s+(\d{4})/i;
  const shortDateRegex = /ng[àa]y\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/i;
  let dateFoundLineIdx = -1;

  // Tìm kiếm "Tên loại văn bản" và "Trích yếu"
  // Định dạng có tên loại: QUYẾT ĐỊNH, THÔNG BÁO, BÁO CÁO...
  const documentTypesList = [
    'QUYẾT ĐỊNH', 'THÔNG BÁO', 'BÁO CÁO', 'KẾ HOẠCH', 'TỜ TRÌNH', 
    'HƯỚNG DẪN', 'NGHỊ QUYẾT', 'CHỈ THỊ', 'PHƯƠNG ÁN', 'QUY CHẾ', 
    'QUY ĐỊNH', 'BIÊN BẢN', 'CÔNG VĂN', 'CÔNG ĐIỆN', 'GIẤY MỜI'
  ];
  let docTypeFoundIdx = -1;
  let subjectFoundIdx = -1;

  for (let i = 0; i < topLinesLimit; i++) {
    const line = allLines[i];
    if (!line) continue;

    // A. Số hiệu
    if (codeFoundLineIdx === -1) {
      const isExactlySo = /^(?:S[ốo]|No\.?)\s*:?$/i.test(line);
      if (isExactlySo && i + 1 < topLinesLimit) {
        const nextLine = allLines[i + 1];
        if (nextLine && nextLine.trim()) {
          suggestedMetadata.documentCode = {
            value: nextLine.trim(),
            sourceLine: `${line} ${nextLine}`
          };
          codeFoundLineIdx = i;
        }
      } else {
        const match = line.match(docCodeRegex);
        if (match && match[1]) {
          suggestedMetadata.documentCode = {
            value: match[1].trim(),
            sourceLine: line
          };
          codeFoundLineIdx = i;
        }
      }
    }

    // B. Địa danh & Ngày tháng
    if (dateFoundLineIdx === -1) {
      const matchLong = line.match(dateRegex);
      const matchShort = line.match(shortDateRegex);
      
      if (matchLong) {
        dateFoundLineIdx = i;
        const day = matchLong[1].padStart(2, '0');
        const month = matchLong[2].padStart(2, '0');
        const year = matchLong[3];
        
        // Trích địa danh: phần trước dấu phẩy
        const commaIdx = line.indexOf(',');
        let loc = 'Hà Nội'; // Mặc định
        if (commaIdx !== -1) {
          loc = line.substring(0, commaIdx).trim();
        } else {
          // Đoán địa danh bằng cách cắt bỏ phần ngày
          const dayIdx = line.toLowerCase().indexOf('ngày');
          if (dayIdx > 0) {
            loc = line.substring(0, dayIdx).replace(/[,-]/g, '').trim();
          }
        }

        suggestedMetadata.location = {
          value: loc,
          sourceLine: line
        };
        suggestedMetadata.date = {
          value: `${year}-${month}-${day}`,
          sourceLine: line
        };
      } else if (matchShort) {
        dateFoundLineIdx = i;
        const day = matchShort[1].padStart(2, '0');
        const month = matchShort[2].padStart(2, '0');
        const year = matchShort[3];
        
        const commaIdx = line.indexOf(',');
        let loc = 'Hà Nội';
        if (commaIdx !== -1) {
          loc = line.substring(0, commaIdx).trim();
        }

        suggestedMetadata.location = {
          value: loc,
          sourceLine: line
        };
        suggestedMetadata.date = {
          value: `${year}-${month}-${day}`,
          sourceLine: line
        };
      }
    }

    // C. Tìm Tên loại văn bản
    if (docTypeFoundIdx === -1) {
      for (const type of documentTypesList) {
        // Khớp chính xác hoặc khớp từ khóa in hoa
        if (line === type || line.startsWith(type + ' ') || line.startsWith('V/V ' + type)) {
          suggestedMetadata.documentType = {
            value: type,
            sourceLine: line
          };
          docTypeFoundIdx = i;
          break;
        }
      }
    }

    // D. Tìm Trích yếu (Về việc... hoặc V/v...)
    if (subjectFoundIdx === -1) {
      if (/^(?:V[ềe]\s*vi[ệe]c|V\/v)\s*:/i.test(line)) {
        const cleanSubj = line.replace(/^(?:V[ềe]\s*vi[ệe]c|V\/v)\s*:\s*/i, '').trim();
        suggestedMetadata.subject = {
          value: cleanSubj,
          sourceLine: line
        };
        subjectFoundIdx = i;
      }
    }
  }

  // Nếu không nhận diện được loại văn bản nhưng có dòng "Kính gửi:", suy đoán là Công văn
  const hasKinhGui = allLines.slice(0, 15).some(l => /^K[íi]nh\s+g[ửui]i/i.test(l));
  if (docTypeFoundIdx === -1 && hasKinhGui) {
    suggestedMetadata.documentType = {
      value: 'Công văn',
      sourceLine: 'Phát hiện dòng "Kính gửi" đặc trưng của Công văn'
    };
  }

  // Tìm cơ quan ban hành (thường ở 5 dòng đầu, không chứa Quốc hiệu/Tiêu ngữ/Số hiệu)
  const orgLines: string[] = [];
  for (let i = 0; i < Math.min(allLines.length, 8); i++) {
    const line = allLines[i];
    if (!line) continue;
    
    // Bỏ qua quốc hiệu tiêu ngữ, số hiệu, ngày tháng
    const isMotto = /CỘNG HÒA|ĐỘC LẬP|TỰ DO|HẠNH PHÚC/i.test(line);
    const isCode = docCodeRegex.test(line);
    const isDate = dateRegex.test(line) || shortDateRegex.test(line);
    
    if (!isMotto && !isCode && !isDate) {
      // Dòng chứa cơ quan
      const hasOrgKeywords = /ỦY BAN|BỘ|SỞ|CỤC|TỔNG|VĂN PHÒNG|PHÒNG|BAN|TRƯỜNG|CÔNG TY|TẬP ĐOÀN|UBND|HĐND/i.test(line);
      if (hasOrgKeywords && line === line.toUpperCase()) {
        orgLines.push(line);
      }
    }
  }

  if (orgLines.length > 0) {
    if (orgLines.length === 1) {
      suggestedMetadata.issuingOrganization = {
        value: orgLines[0],
        sourceLine: orgLines[0]
      };
    } else {
      suggestedMetadata.parentOrganization = {
        value: orgLines[0],
        sourceLine: orgLines[0]
      };
      suggestedMetadata.issuingOrganization = {
        value: orgLines[1],
        sourceLine: orgLines[1]
      };
    }
  }

  // --- XÁC ĐỊNH ĐIỂM KẾT THÚC CỦA HEADER (ĐỂ LẤY NỘI DUNG) ---
  // Thường nội dung bắt đầu sau dòng trích yếu, hoặc sau dòng có loại văn bản + trích yếu
  let startSearchIdx = 0;
  if (subjectFoundIdx !== -1) {
    startSearchIdx = subjectFoundIdx + 1;
  } else if (docTypeFoundIdx !== -1) {
    startSearchIdx = docTypeFoundIdx + 2;
  } else if (dateFoundLineIdx !== -1) {
    startSearchIdx = dateFoundLineIdx + 1;
  } else {
    // Dự phòng
    startSearchIdx = Math.min(allLines.length, 6);
  }

  // Tìm dòng không trống đầu tiên sau phần tiêu đề để làm mốc bắt đầu body
  for (let i = startSearchIdx; i < allLines.length; i++) {
    if (allLines[i].trim() !== '') {
      bodyStartIdx = i;
      break;
    }
  }

  // --- 2. PHÂN TÍCH FOOTER / CHỮ KÝ / NƠI NHẬN ---
  
  // Quét 20 dòng cuối văn bản để bóc tách Nơi nhận & Chữ ký
  const footerLinesLimit = Math.max(0, allLines.length - 20);
  let noiNhanIdx = -1;

  for (let i = allLines.length - 1; i >= footerLinesLimit; i--) {
    const line = allLines[i];
    if (!line) continue;

    if (/^Nơi\s+nhận\s*:/i.test(line)) {
      noiNhanIdx = i;
      break;
    }
  }

  // Nếu tìm thấy "Nơi nhận:"
  if (noiNhanIdx !== -1) {
    footerStartIdx = Math.min(footerStartIdx, noiNhanIdx);
    
    // Gom tất cả các dòng nơi nhận (bắt đầu bằng dấu gạch ngang)
    const recipientLines: string[] = [];
    recipientLines.push(allLines[noiNhanIdx]);
    
    for (let j = noiNhanIdx + 1; j < allLines.length; j++) {
      const recLine = allLines[j];
      if (!recLine) continue;
      
      // Nếu dòng này thuộc về chữ ký (thường căn phải hoặc viết hoa), dừng lại
      const isSignerTitle = /^[A-Z\s\.]{4,30}$/.test(recLine) && !recLine.startsWith('-');
      if (isSignerTitle) break;

      if (recLine.startsWith('-') || recLine.startsWith('•') || recLine.startsWith('*')) {
        recipientLines.push(recLine);
      } else if (recipientLines.length > 1 && recLine.trim() === '') {
        // Dòng trống sau khi đã có danh sách -> dừng
        break;
      }
    }

    suggestedMetadata.recipients = {
      value: recipientLines.join('\n'),
      sourceLine: allLines[noiNhanIdx]
    };
  }

  // Nhận diện "Thẩm quyền & Chức danh người ký" & "Tên người ký"
  // Thường nằm ở các dòng cuối, lệch về phía phải, viết hoa đậm
  const signingPrefixes = [
    { prefix: 'KT.', type: 'KT' as SigningType },
    { prefix: 'TM.', type: 'TM' as SigningType },
    { prefix: 'TL.', type: 'TL' as SigningType },
    { prefix: 'Q.', type: 'Q' as SigningType }
  ];

  let signerTitleIdx = -1;
  let signerNameIdx = -1;

  // Quét các dòng cuối (sau điểm bắt đầu footer nghi ngờ)
  for (let i = Math.max(bodyStartIdx, allLines.length - 15); i < allLines.length; i++) {
    const line = allLines[i];
    if (!line) continue;

    // Tránh trùng với các dòng nơi nhận hoặc dòng quá ngắn
    if (line.startsWith('-') || line.toLowerCase().startsWith('nơi nhận')) continue;

    // Tìm chức danh viết hoa tiêu chuẩn: GIÁM ĐỐC, CHỦ TỊCH, CHÁNH VĂN PHÒNG...
    const hasTitleKeyword = /GIÁM ĐỐC|CHỦ TỊCH|BỘ TRƯỞNG|HIỆU TRƯỞNG|TRƯỞNG PHÒNG|CHÁNH VĂN PHÒNG|ỦY BAN/i.test(line);
    const isUppercase = line === line.toUpperCase();

    if (hasTitleKeyword && isUppercase && signerTitleIdx === -1) {
      signerTitleIdx = i;
      footerStartIdx = Math.min(footerStartIdx, i);

      let cleanTitle = line;
      let detectedSignType: SigningType = 'DIRECT';

      // Nhận diện hình thức ký
      for (const sp of signingPrefixes) {
        if (line.startsWith(sp.prefix)) {
          detectedSignType = sp.type;
          cleanTitle = line.substring(sp.prefix.length).trim();
          break;
        }
      }

      suggestedMetadata.signingType = {
        value: detectedSignType,
        sourceLine: line
      };

      suggestedMetadata.signerTitle = {
        value: cleanTitle,
        sourceLine: line
      };
    }
  }

  // Tìm họ tên người ký: Thường là dòng in hoa có 2-4 từ ở cuối tài liệu, nằm dưới chức danh
  const searchStartForName = signerTitleIdx !== -1 ? signerTitleIdx + 1 : allLines.length - 6;
  for (let i = allLines.length - 1; i >= Math.max(bodyStartIdx, searchStartForName); i--) {
    const line = allLines[i];
    if (!line) continue;

    // Kiểm tra xem dòng có phải là tên người Việt Nam viết hoa (không chứa số, ký tự đặc biệt, có khoảng 2-4 từ)
    const words = line.split(/\s+/);
    const isNameFormat = words.length >= 2 && words.length <= 5 && 
                         words.every(w => /^[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝĐ][a-zàáâãèéêìíòóôõùúýđ]*$/.test(w) || w === w.toUpperCase()) &&
                         !/[0-9:\-\/\(\)\*]/.test(line) &&
                         !/nơi nhận|lưu|ký|thay/i.test(line);

    if (isNameFormat) {
      signerNameIdx = i;
      suggestedMetadata.signerName = {
        value: line,
        sourceLine: line
      };
      break;
    }
  }

  // --- 3. TRÍCH XUẤT NỘI DUNG NGUYÊN VĂN GỐC (BODY TEXT) ---
  
  // Đảm bảo footerStartIdx hợp lệ
  if (footerStartIdx < bodyStartIdx) {
    footerStartIdx = allLines.length;
  }

  // Lọc lấy các dòng thuộc phần Nội dung
  const bodyLines = allLines.slice(bodyStartIdx, footerStartIdx);
  const extractedContent = bodyLines.join('\n').trim();

  return {
    extractedContent,
    suggestedMetadata
  };
}
