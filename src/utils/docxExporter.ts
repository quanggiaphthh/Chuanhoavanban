import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  UnderlineType,
} from 'docx';
import { DocumentMetadata, SigningType } from '../types/document';
import { formatVietnameseDate } from './rules';

// Helper tạo đường kẻ phân cách chuẩn dxa (ví dụ nét liền dưới quốc hiệu hoặc cơ quan)
function createHorizontalLine() {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 40, after: 120 },
    children: [
      new TextRun({
        text: '_________________',
        bold: true,
        size: 24,
        font: 'Times New Roman',
      }),
    ],
  });
}

export async function exportToDocx(meta: DocumentMetadata, content: string): Promise<Blob> {
  // Lề A4 dxa (1mm = 56.7 dxa)
  // Lề trên: 20mm = 1134 dxa
  // Lề dưới: 20mm = 1134 dxa
  // Lề trái: 30mm = 1701 dxa
  // Lề phải: 15mm = 850 dxa
  const marginDxa = {
    top: 1134,
    bottom: 1134,
    left: 1701,
    right: 850,
  };

  const borderNone = {
    style: BorderStyle.NONE,
    size: 0,
    color: 'FFFFFF',
  };

  const borderCellNone = {
    top: borderNone,
    bottom: borderNone,
    left: borderNone,
    right: borderNone,
  };

  // --- PHẦN 1: BẢNG TIÊU ĐỀ ĐẦU TRANG (Header Table) ---
  const headerTable = new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    borders: borderCellNone,
    rows: [
      new TableRow({
        children: [
          // Cột trái: Cơ quan ban hành + Số ký hiệu
          new TableCell({
            width: {
              size: 40,
              type: WidthType.PERCENTAGE,
            },
            borders: borderCellNone,
            children: [
              ...(meta.parentOrganization
                ? [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 0, after: 40 },
                      children: [
                        new TextRun({
                          text: meta.parentOrganization.toUpperCase(),
                          size: 22, // 11pt
                          font: 'Times New Roman',
                        }),
                      ],
                    }),
                  ]
                : []),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 40 },
                children: [
                  new TextRun({
                    text: meta.issuingOrganization.toUpperCase(),
                    bold: true,
                    size: 24, // 12pt
                    font: 'Times New Roman',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 40, after: 0 },
                children: [
                  new TextRun({
                    text: meta.documentCode ? `Số: ${meta.documentCode}` : 'Số: .../QĐ-UBND',
                    size: 24, // 12pt
                    font: 'Times New Roman',
                  }),
                ],
              }),
              // Đường gạch chân cơ quan (độ dài khoảng 1/3 đến 1/2 tên cơ quan)
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 20, after: 0 },
                children: [
                  new TextRun({
                    text: '———————',
                    size: 16,
                    font: 'Times New Roman',
                  }),
                ],
              }),
            ],
          }),
          // Cột phải: Quốc hiệu tiêu ngữ + Địa danh thời gian
          new TableCell({
            width: {
              size: 60,
              type: WidthType.PERCENTAGE,
            },
            borders: borderCellNone,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 40 },
                children: [
                  new TextRun({
                    text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
                    bold: true,
                    size: 24, // 12pt
                    font: 'Times New Roman',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 40 },
                children: [
                  new TextRun({
                    text: 'Độc lập - Tự do - Hạnh phúc',
                    bold: true,
                    size: 26, // 13pt
                    font: 'Times New Roman',
                  }),
                ],
              }),
              // Gạch chân tiêu ngữ (độ dài bằng khoảng dòng tiêu ngữ)
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 20, after: 60 },
                children: [
                  new TextRun({
                    text: '————————————————',
                    bold: true,
                    size: 16,
                    font: 'Times New Roman',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 40, after: 0 },
                children: [
                  new TextRun({
                    text: `${meta.location ? meta.location : '...'}, ${formatVietnameseDate(meta.date)}`,
                    italics: true,
                    size: 26, // 13pt
                    font: 'Times New Roman',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // --- PHẦN 2: TIÊU ĐỀ VĂN BẢN (Document Title) ---
  const titleParagraphs: Paragraph[] = [];
  const isLetter = meta.documentType === 'Công văn';

  if (isLetter) {
    // Công văn không viết QUYẾT ĐỊNH to, mà viết trích yếu ngay sau Số
    titleParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 360, after: 120 },
        children: [
          new TextRun({
            text: `V/v: ${meta.subject}`,
            bold: true,
            size: 24, // 12pt
            font: 'Times New Roman',
          }),
        ],
      })
    );
  } else {
    // Các văn bản có tên loại (Quyết định, Nghị quyết, Thông báo...)
    titleParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 360, after: 80 },
        children: [
          new TextRun({
            text: meta.documentType.toUpperCase(),
            bold: true,
            size: 28, // 14pt
            font: 'Times New Roman',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 120 },
        children: [
          new TextRun({
            text: meta.subject,
            bold: true,
            size: 28, // 14pt
            font: 'Times New Roman',
          }),
        ],
      }),
      // Đường kẻ dưới trích yếu ngắn
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 20, after: 240 },
        children: [
          new TextRun({
            text: '————————',
            bold: true,
            size: 16,
            font: 'Times New Roman',
          }),
        ],
      })
    );
  }

  // --- PHẦN 3: NỘI DUNG CHÍNH (Content Body) ---
  const bodyParagraphs: Paragraph[] = [];
  
  // Xử lý xuống dòng trong nội dung thô để tạo thành các đoạn paragraph riêng biệt
  const rawParagraphs = content.split('\n').map(p => p.trim());
  
  for (const rawP of rawParagraphs) {
    if (!rawP) continue;

    const isCanCu = rawP.toLowerCase().startsWith('căn cứ') || rawP.toLowerCase().startsWith('- căn cứ');
    const isDieu = /^điều\s+\d+/i.test(rawP);
    
    bodyParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { before: 100, after: 100, line: 360 }, // line 360 dxa = 1.5 line height
        indent: { firstLine: 400 }, // Thụt lề dòng đầu 400 dxa (khoảng 1cm)
        children: [
          new TextRun({
            text: rawP,
            italics: isCanCu, // Căn cứ in nghiêng theo chuẩn soạn thảo
            bold: isDieu, // Tên điều in đậm
            size: 26, // 13pt
            font: 'Times New Roman',
          }),
        ],
      })
    );
  }

  // --- PHẦN 4: KHỐI KÝ TÊN VÀ NƠI NHẬN (Signature & Recipients Block Table) ---
  // Định dạng chức vụ người ký TM., KT., TL., Q.
  let sigPrefix = '';
  if (meta.signingType === 'TM') {
    sigPrefix = 'TM. ';
  } else if (meta.signingType === 'KT') {
    sigPrefix = 'KT. ';
  } else if (meta.signingType === 'TL') {
    sigPrefix = 'TL. ';
  } else if (meta.signingType === 'Q') {
    sigPrefix = 'Q. ';
  }

  const recipientLines = meta.recipients
    ? meta.recipients.split('\n').map(l => l.trim()).filter(Boolean)
    : ['- Như trên;', '- Lưu: VT, HC.'];

  const recipientParagraphs: Paragraph[] = [
    new Paragraph({
      spacing: { before: 0, after: 60 },
      children: [
        new TextRun({
          text: 'Nơi nhận:',
          bold: true,
          italics: true,
          size: 24, // 12pt
          font: 'Times New Roman',
        }),
      ],
    }),
    ...recipientLines.map(
      line =>
        new Paragraph({
          spacing: { before: 20, after: 20 },
          children: [
            new TextRun({
              text: line,
              size: 22, // 11pt nhỏ hơn theo quy định
              italics: true,
              font: 'Times New Roman',
            }),
          ],
        })
    ),
  ];

  const signatureTable = new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    borders: borderCellNone,
    rows: [
      new TableRow({
        children: [
          // Ô bên trái: Nơi nhận
          new TableCell({
            width: {
              size: 45,
              type: WidthType.PERCENTAGE,
            },
            borders: borderCellNone,
            children: recipientParagraphs,
          }),
          // Ô bên phải: Người ký
          new TableCell({
            width: {
              size: 55,
              type: WidthType.PERCENTAGE,
            },
            borders: borderCellNone,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 40 },
                children: [
                  new TextRun({
                    text: `${sigPrefix}${meta.signerTitle}`.toUpperCase(),
                    bold: true,
                    size: 26, // 13pt
                    font: 'Times New Roman',
                  }),
                ],
              }),
              // Không gian ký tên (Trống vài dòng)
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 400, after: 400 },
                children: [
                  new TextRun({
                    text: '',
                    size: 26,
                    font: 'Times New Roman',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 40, after: 0 },
                children: [
                  new TextRun({
                    text: meta.signerName,
                    bold: true,
                    size: 26, // 13pt
                    font: 'Times New Roman',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // --- HOÀN THIỆN ĐỐI TƯỢNG DOCUMENT ---
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: marginDxa,
          },
        },
        children: [
          headerTable,
          new Paragraph({ spacing: { before: 180, after: 180 } }), // Dòng trống ngăn cách
          ...titleParagraphs,
          ...bodyParagraphs,
          new Paragraph({ spacing: { before: 360, after: 360 } }), // Dòng trống ngăn cách ký tên
          signatureTable,
        ],
      },
    ],
  });

  // Đóng gói và trả về Blob
  return await Packer.toBlob(doc);
}
