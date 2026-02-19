import React, { useState, useCallback } from 'react';
import { AppStep } from './skknTypes';
import type { SKKNData, SectionContent, TitleSuggestion, UserRequirements } from './skknTypes';
import { STEP_LABELS } from './skknConstants';
import * as geminiService from './services/skknGeminiService';
import SKKNStepUpload from './components/SKKNStepUpload';
import SKKNStepAnalysis from './components/SKKNStepAnalysis';
import SKKNStepDashboard from './components/SKKNStepDashboard';
import SKKNStepTitle from './components/SKKNStepTitle';
import SKKNStepEditor from './components/SKKNStepEditor';
import { Check, ArrowLeft, AlertCircle } from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

interface SKKNEditorAppProps {
    onClose: () => void;
}

// --- Local fallback parser ---
const parseSectionsLocal = (text: string): SectionContent[] => {
    interface SectionMatch { index: number; title: string; id: string; level: number; }
    let allMatches: SectionMatch[] = [];
    let matchCounter = 0;

    const level1Patterns = [
        { regex: /^(?:PHẦN|Phần)\s+([IVXLC]+)\b[.:)]*\s*(.*)/gim, idPrefix: 'phan' },
        { regex: /^([IVXLC]+)\.\s+([\wÀ-ỹ].*)/gim, idPrefix: 'roman' },
        { regex: /^(?:CHƯƠNG|Chương)\s+(\d+)\b[.:)]*\s*(.*)/gim, idPrefix: 'chuong' },
        { regex: /^(MỤC LỤC|TÀI LIỆU THAM KHẢO|PHỤ LỤC|DANH MỤC|LỜI CAM ĐOAN|LỜI CẢM ƠN|KẾT LUẬN VÀ KIẾN NGHỊ)\b(.*)/gim, idPrefix: 'named' },
    ];
    for (const { regex, idPrefix } of level1Patterns) {
        let match;
        regex.lastIndex = 0;
        while ((match = regex.exec(text)) !== null) {
            matchCounter++;
            allMatches.push({ index: match.index, title: match[0].trim(), id: `${idPrefix}-${matchCounter}`, level: 1 });
        }
    }

    const level2Regex = /^(\d+)\.\s+([\wÀ-ỹ][\wÀ-ỹ\s,;:'"()–\-]{5,})/gim;
    let m2;
    level2Regex.lastIndex = 0;
    while ((m2 = level2Regex.exec(text)) !== null) {
        matchCounter++;
        allMatches.push({ index: m2.index, title: m2[0].trim(), id: `l2-${matchCounter}`, level: 2 });
    }

    const level3Regex = /^(\d+\.\d+\.?\s+[\wÀ-ỹ][\wÀ-ỹ\s,;:'"()–\-]{5,})/gim;
    let m3;
    level3Regex.lastIndex = 0;
    while ((m3 = level3Regex.exec(text)) !== null) {
        matchCounter++;
        allMatches.push({ index: m3.index, title: m3[0].trim(), id: `l3-${matchCounter}`, level: 3 });
    }

    allMatches.sort((a, b) => a.index - b.index);
    const deduped: SectionMatch[] = [];
    for (const m of allMatches) {
        if (deduped.length === 0 || Math.abs(m.index - deduped[deduped.length - 1].index) > 5) {
            deduped.push(m);
        } else {
            const last = deduped[deduped.length - 1];
            if (m.level > last.level) deduped[deduped.length - 1] = m;
        }
    }

    if (deduped.length === 0) {
        const upperText = text.toUpperCase();
        const keywords = [
            { key: 'PHẦN I', id: 'section-1' }, { key: 'PHẦN II', id: 'section-2' },
            { key: 'PHẦN III', id: 'section-3' }, { key: 'PHẦN IV', id: 'section-4' },
            { key: 'PHẦN V', id: 'section-5' },
        ];
        for (const kw of keywords) {
            const idx = upperText.indexOf(kw.key);
            if (idx !== -1) {
                const lineEnd = text.indexOf('\n', idx);
                const title = text.substring(idx, lineEnd !== -1 ? lineEnd : idx + 80).trim();
                deduped.push({ index: idx, title, id: kw.id, level: 1 });
            }
        }
        deduped.sort((a, b) => a.index - b.index);
    }

    const sections: SectionContent[] = [];
    const parentStack: { id: string; level: number }[] = [];

    for (let i = 0; i < deduped.length; i++) {
        const current = deduped[i];
        const next = deduped[i + 1];
        const startPos = current.index;
        const endPos = next ? next.index : text.length;
        const rawContent = text.substring(startPos, endPos).trim();
        const titleLine = rawContent.split('\n')[0];
        const body = rawContent.substring(titleLine.length).trim();

        while (parentStack.length > 0 && parentStack[parentStack.length - 1].level >= current.level) {
            parentStack.pop();
        }
        const parentId = parentStack.length > 0 ? parentStack[parentStack.length - 1].id : undefined;

        sections.push({
            id: current.id, title: titleLine.trim(), level: current.level, parentId,
            originalContent: body, refinedContent: '', isProcessing: false,
            suggestions: [], editSuggestions: []
        });

        parentStack.push({ id: current.id, level: current.level });
    }

    return sections;
};

const SKKNEditorApp: React.FC<SKKNEditorAppProps> = ({ onClose }) => {
    const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.UPLOAD);
    const [maxReachedStep, setMaxReachedStep] = useState<number>(0);
    const [data, setData] = useState<SKKNData>({
        fileName: '', originalText: '', currentTitle: '',
        analysis: null, titleSuggestions: [],
        selectedNewTitle: null, sections: []
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingSectionId, setProcessingSectionId] = useState<string | null>(null);
    const [toasts, setToasts] = useState<{ id: string; type: 'success' | 'error' | 'info'; message: string }[]>([]);
    const [userRequirements, setUserRequirements] = useState<UserRequirements>({
        pageLimit: null, referenceDocuments: [], customInstructions: ''
    });

    const hasApiKey = !!geminiService.getApiKey();

    const addToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    }, []);

    const goToStep = useCallback((step: AppStep) => {
        setCurrentStep(step);
        setMaxReachedStep(prev => Math.max(prev, step));
    }, []);

    const handleStepClick = (step: number) => {
        if (step <= maxReachedStep && step !== currentStep) setCurrentStep(step as AppStep);
    };

    // --- Upload & Analyze ---
    const handleUpload = async (text: string, fileName: string) => {
        if (!geminiService.getApiKey()) {
            addToast('error', 'Vui lòng cài API Key trong phần Cài đặt trước!');
            return;
        }
        setIsProcessing(true);
        try {
            const result = await geminiService.analyzeSKKN(text);
            let sections: SectionContent[] = [];
            const localSections = parseSectionsLocal(text);

            try {
                const parsed = await geminiService.parseStructure(text);
                sections = parsed.map(s => ({
                    id: s.id, title: s.title, level: s.level || 1,
                    parentId: s.parentId || undefined,
                    originalContent: s.content || '', refinedContent: '',
                    isProcessing: false, suggestions: [], editSuggestions: []
                }));

                const aiLevel1Count = sections.filter(s => s.level === 1).length;
                const localLevel1Count = localSections.filter(s => s.level === 1).length;
                if (sections.length <= 3 && localSections.length > sections.length) {
                    const localTitles = localSections.map(s => s.title.toLowerCase().substring(0, 25));
                    const merged = [...localSections];
                    for (const aiSec of sections) {
                        const aiPrefix = aiSec.title.toLowerCase().substring(0, 25);
                        if (!localTitles.some(t => t.includes(aiPrefix) || aiPrefix.includes(t))) {
                            merged.push({ ...aiSec, id: `ai-${aiSec.id}` });
                        }
                    }
                    sections = merged;
                } else if (aiLevel1Count < localLevel1Count) {
                    const existing = sections.map(s => s.title.toLowerCase().substring(0, 25));
                    for (const ls of localSections) {
                        const p = ls.title.toLowerCase().substring(0, 25);
                        if (!existing.some(t => t.includes(p) || p.includes(t))) {
                            sections.push({ ...ls, id: `merged-${ls.id}` });
                        }
                    }
                }
            } catch {
                sections = localSections;
            }

            if (sections.length === 0) sections = localSections;

            setData(prev => ({
                ...prev, fileName, originalText: text,
                currentTitle: result.currentTitle, analysis: result.analysis, sections
            }));
            goToStep(AppStep.ANALYZING);
            addToast('success', `Phân tích hoàn tất! Tìm thấy ${sections.length} mục.`);
        } catch (error: any) {
            addToast('error', 'Lỗi phân tích. Vui lòng kiểm tra API Key.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAnalysisContinue = () => goToStep(AppStep.DASHBOARD);

    const handleDashboardContinue = async () => {
        goToStep(AppStep.TITLE_SELECTION);
        setIsProcessing(true);
        try {
            const summary = data.originalText.substring(0, 3000);
            const suggestions = await geminiService.generateTitleSuggestions(data.currentTitle, summary);
            setData(prev => ({ ...prev, titleSuggestions: suggestions }));
        } catch {
            addToast('error', 'Lỗi tạo đề xuất tên đề tài.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleTitleSelect = (title: TitleSuggestion) => {
        setData(prev => ({ ...prev, selectedNewTitle: title }));
        goToStep(AppStep.CONTENT_REFINEMENT);
        addToast('info', `Đã chọn: "${title.title.substring(0, 50)}..."`);
    };

    const handleRefineSection = async (sectionId: string) => {
        if (!data.selectedNewTitle) return;
        setProcessingSectionId(sectionId);
        const section = data.sections.find(s => s.id === sectionId);
        if (section && section.originalContent) {
            try {
                const refined = await geminiService.refineSectionContent(
                    section.title, section.originalContent, data.selectedNewTitle.title
                );
                setData(prev => ({
                    ...prev,
                    sections: prev.sections.map(s => s.id === sectionId ? { ...s, refinedContent: refined } : s)
                }));
                addToast('success', `Đã viết lại "${section.title}" thành công!`);
            } catch {
                addToast('error', `Lỗi viết lại phần "${section.title}".`);
            }
        }
        setProcessingSectionId(null);
    };

    const handleRefineSectionWithRefs = async (sectionId: string) => {
        if (!data.selectedNewTitle) return;
        setProcessingSectionId(sectionId);
        const section = data.sections.find(s => s.id === sectionId);
        if (section && section.originalContent) {
            try {
                const refined = await geminiService.refineSectionWithReferences(
                    section.title, section.originalContent, data.selectedNewTitle.title, userRequirements
                );
                setData(prev => ({
                    ...prev,
                    sections: prev.sections.map(s => s.id === sectionId ? { ...s, refinedContent: refined } : s)
                }));
                addToast('success', `Đã viết lại "${section.title}" với tài liệu tham khảo!`);
            } catch {
                addToast('error', `Lỗi viết lại phần "${section.title}".`);
            }
        }
        setProcessingSectionId(null);
    };

    const handleUpdateSections = (newSections: SectionContent[]) => {
        setData(prev => ({ ...prev, sections: newSections }));
    };

    const handleFinish = async () => {
        try {
            const docChildren: Paragraph[] = [];
            docChildren.push(new Paragraph({
                children: [new TextRun({
                    text: `TÊN ĐỀ TÀI: ${data.selectedNewTitle?.title || data.currentTitle}`,
                    bold: true, size: 28, font: 'Times New Roman'
                })],
                heading: HeadingLevel.TITLE,
                spacing: { after: 400 }
            }));

            data.sections.forEach(s => {
                const headingLevel = s.level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_1;
                const indent = s.level === 2 ? 360 : 0;

                docChildren.push(new Paragraph({
                    children: [new TextRun({
                        text: s.title.toUpperCase(),
                        bold: true, size: s.level === 2 ? 24 : 26, font: 'Times New Roman'
                    })],
                    heading: headingLevel,
                    spacing: { before: s.level === 2 ? 200 : 400, after: 200 },
                    indent: { left: indent }
                }));

                const content = s.refinedContent || s.originalContent;
                content.split('\n').filter(p => p.trim()).forEach(para => {
                    docChildren.push(new Paragraph({
                        children: [new TextRun({ text: para.trim(), size: 26, font: 'Times New Roman' })],
                        spacing: { after: 100 },
                        indent: { firstLine: 720, left: indent }
                    }));
                });
            });

            const doc = new Document({ sections: [{ children: docChildren }] });
            const blob = await Packer.toBlob(doc);
            const outName = `SKKN_Upgrade_${data.fileName?.replace(/\.[^.]+$/, '') || 'document'}.docx`;
            saveAs(blob, outName);
            addToast('success', `Đã tải xuống: ${outName}`);
        } catch (error) {
            const fullContent = data.sections.map(s =>
                `${s.title.toUpperCase()}\n\n${s.refinedContent || s.originalContent}\n`
            ).join('\n-----------------------------------\n\n');
            const blob = new Blob([
                `TÊN ĐỀ TÀI MỚI: ${data.selectedNewTitle?.title}\n\n` + fullContent
            ], { type: 'text/plain;charset=utf-8' });
            const outName = `SKKN_Upgrade_${data.fileName?.replace(/\.[^.]+$/, '') || 'document'}.txt`;
            saveAs(blob, outName);
            addToast('info', `Đã tải dạng text: ${outName}`);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8fafc' }}>
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 20px',
                background: 'white', borderBottom: '1px solid #e2e8f0',
                position: 'sticky', top: 0, zIndex: 10
            }}>
                <button
                    onClick={onClose}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                        borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc',
                        fontSize: 13, cursor: 'pointer', color: '#64748b', fontWeight: 500
                    }}
                >
                    <ArrowLeft size={16} /> Quay lại Chat
                </button>

                <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 800, fontSize: 14,
                    boxShadow: '0 2px 0 #0f766e'
                }}>S</div>
                <span style={{
                    fontSize: 16, fontWeight: 800,
                    background: 'linear-gradient(135deg, #0d9488, #115e59)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                }}>
                    SKKN Editor Pro
                </span>

                {!hasApiKey && (
                    <span style={{
                        fontSize: 12, color: '#e11d48', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8
                    }}>
                        <AlertCircle size={14} /> Chưa có API key
                    </span>
                )}

                <div style={{ flex: 1 }} />

                {/* Progress Steps */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {STEP_LABELS.map((item, i) => (
                        <React.Fragment key={item.step}>
                            <div
                                onClick={() => handleStepClick(item.step)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 4,
                                    cursor: item.step <= maxReachedStep ? 'pointer' : 'default',
                                    padding: '4px 8px', borderRadius: 6,
                                    background: currentStep === item.step ? '#f0fdfa' : 'transparent',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <span style={{
                                    width: 20, height: 20, borderRadius: '50%', fontSize: 10,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: currentStep > item.step ? '#10b981' : currentStep === item.step ? '#14b8a6' : '#e2e8f0',
                                    color: currentStep >= item.step ? 'white' : '#94a3b8',
                                    fontWeight: 700
                                }}>
                                    {currentStep > item.step ? <Check size={11} /> : item.icon}
                                </span>
                                <span style={{
                                    fontSize: 11, fontWeight: currentStep === item.step ? 700 : 400,
                                    color: currentStep >= item.step ? '#0d9488' : '#94a3b8'
                                }}>
                                    {item.label}
                                </span>
                            </div>
                            {i < STEP_LABELS.length - 1 && (
                                <div style={{
                                    width: 20, height: 2, borderRadius: 1,
                                    background: currentStep > item.step ? '#14b8a6' : '#e2e8f0'
                                }} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '24px 20px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
                {currentStep === AppStep.UPLOAD && (
                    <SKKNStepUpload onUpload={handleUpload} isProcessing={isProcessing} />
                )}

                {currentStep === AppStep.ANALYZING && data.analysis && (
                    <SKKNStepAnalysis metrics={data.analysis} onContinue={handleAnalysisContinue} />
                )}

                {currentStep === AppStep.DASHBOARD && data.analysis && (
                    <SKKNStepDashboard
                        sections={data.sections}
                        analysis={data.analysis}
                        currentTitle={data.currentTitle}
                        onContinue={handleDashboardContinue}
                    />
                )}

                {currentStep === AppStep.TITLE_SELECTION && (
                    <SKKNStepTitle
                        currentTitle={data.currentTitle}
                        suggestions={data.titleSuggestions}
                        onSelectTitle={handleTitleSelect}
                        isGenerating={isProcessing}
                    />
                )}

                {currentStep === AppStep.CONTENT_REFINEMENT && (
                    <SKKNStepEditor
                        sections={data.sections}
                        onRefineSection={handleRefineSection}
                        onRefineSectionWithRefs={handleRefineSectionWithRefs}
                        isProcessing={processingSectionId}
                        onFinish={handleFinish}
                        selectedTitle={data.selectedNewTitle?.title || data.currentTitle}
                        currentTitle={data.currentTitle}
                        overallAnalysisSummary={
                            data.analysis
                                ? `Chất lượng: ${data.analysis.qualityScore}/100, Đạo văn: ${data.analysis.plagiarismScore}%, ` +
                                `Cấu trúc: ${data.analysis.structure.missing.length === 0 ? 'Đầy đủ' : 'Thiếu ' + data.analysis.structure.missing.join(', ')}`
                                : 'Chưa phân tích'
                        }
                        onUpdateSections={handleUpdateSections}
                        userRequirements={userRequirements}
                        onUpdateRequirements={setUserRequirements}
                    />
                )}
            </div>

            {/* Toasts */}
            {toasts.length > 0 && (
                <div style={{
                    position: 'fixed', bottom: 20, right: 20, zIndex: 999,
                    display: 'flex', flexDirection: 'column', gap: 8
                }}>
                    {toasts.map(toast => (
                        <div key={toast.id} style={{
                            padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            background: toast.type === 'error' ? '#fef2f2' : toast.type === 'success' ? '#f0fdf4' : '#eff6ff',
                            color: toast.type === 'error' ? '#dc2626' : toast.type === 'success' ? '#16a34a' : '#2563eb',
                            border: `1px solid ${toast.type === 'error' ? '#fecaca' : toast.type === 'success' ? '#bbf7d0' : '#bfdbfe'}`,
                            animation: 'fadeIn 0.3s ease'
                        }}>
                            {toast.message}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SKKNEditorApp;
