import type { ChatMessage } from '../types';

// ========== EXPORT TO MARKDOWN ==========

export const exportToMarkdown = (title: string, messages: ChatMessage[]): string => {
    const date = new Date().toLocaleDateString('vi-VN');
    let md = `# ${title}\n> Xuất ngày: ${date}\n\n---\n\n`;

    for (const msg of messages) {
        const time = new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        if (msg.role === 'user') {
            md += `### 👤 Bạn (${time})\n${msg.text}\n\n---\n\n`;
        } else {
            md += `### 🤖 Trợ lý GV (${time})\n${msg.text}\n\n---\n\n`;
        }
    }

    return md;
};

export const downloadMarkdown = (title: string, messages: ChatMessage[]) => {
    const md = exportToMarkdown(title, messages);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sanitizeFilename(title)}.md`;
    a.click();
    URL.revokeObjectURL(url);
};

// ========== EXPORT TO WORD (.docx) ==========

export const downloadWord = async (title: string, messages: ChatMessage[]) => {
    // Dynamic import to keep initial bundle small
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle, AlignmentType } = await import('docx');

    const date = new Date().toLocaleDateString('vi-VN');

    const children: any[] = [
        new Paragraph({
            text: title,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
        }),
        new Paragraph({
            children: [
                new TextRun({ text: `Xuất ngày: ${date}`, italics: true, color: '888888', size: 20 }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
        }),
        // Horizontal rule
        new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' } },
            spacing: { after: 200 },
        }),
    ];

    for (const msg of messages) {
        const time = new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        const isUser = msg.role === 'user';
        const label = isUser ? `👤 Bạn (${time})` : `🤖 Trợ lý GV (${time})`;

        // Speaker heading
        children.push(new Paragraph({
            children: [
                new TextRun({
                    text: label,
                    bold: true,
                    size: 24,
                    color: isUser ? '4F46E5' : '059669',
                }),
            ],
            spacing: { before: 300, after: 100 },
        }));

        // Message content - split by lines
        const lines = msg.text.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();

            if (trimmed.startsWith('### ')) {
                children.push(new Paragraph({
                    text: trimmed.replace(/^###\s*/, ''),
                    heading: HeadingLevel.HEADING_3,
                    spacing: { before: 100, after: 50 },
                }));
            } else if (trimmed.startsWith('## ')) {
                children.push(new Paragraph({
                    text: trimmed.replace(/^##\s*/, ''),
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 150, after: 50 },
                }));
            } else if (trimmed.startsWith('# ')) {
                children.push(new Paragraph({
                    text: trimmed.replace(/^#\s*/, ''),
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 200, after: 100 },
                }));
            } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                children.push(new Paragraph({
                    children: [new TextRun({ text: '• ' + trimmed.substring(2), size: 22 })],
                    indent: { left: 360 },
                    spacing: { after: 50 },
                }));
            } else if (/^\d+\.\s/.test(trimmed)) {
                children.push(new Paragraph({
                    children: [new TextRun({ text: trimmed, size: 22 })],
                    indent: { left: 360 },
                    spacing: { after: 50 },
                }));
            } else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
                children.push(new Paragraph({
                    children: [new TextRun({ text: trimmed.replace(/\*\*/g, ''), bold: true, size: 22 })],
                    spacing: { after: 50 },
                }));
            } else if (trimmed === '') {
                children.push(new Paragraph({ text: '', spacing: { after: 50 } }));
            } else {
                // Parse inline bold **text**
                const parts = parseInlineBold(trimmed);
                children.push(new Paragraph({
                    children: parts.map(p => new TextRun({ text: p.text, bold: p.bold, size: 22 })),
                    spacing: { after: 50 },
                }));
            }
        }

        // Separator
        children.push(new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'EEEEEE' } },
            spacing: { before: 100, after: 200 },
        }));
    }

    const doc = new Document({
        sections: [{
            properties: {
                page: { margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 } },
            },
            children,
        }],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sanitizeFilename(title)}.docx`;
    a.click();
    URL.revokeObjectURL(url);
};

// ========== HELPERS ==========

function sanitizeFilename(name: string): string {
    return name.replace(/[<>:"/\\|?*]/g, '_').substring(0, 100);
}

function parseInlineBold(text: string): { text: string; bold: boolean }[] {
    const parts: { text: string; bold: boolean }[] = [];
    const regex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push({ text: text.substring(lastIndex, match.index), bold: false });
        }
        parts.push({ text: match[1], bold: true });
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        parts.push({ text: text.substring(lastIndex), bold: false });
    }

    return parts.length > 0 ? parts : [{ text, bold: false }];
}
