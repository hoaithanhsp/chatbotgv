import React, { useState, useMemo } from 'react';
import { X, Search, Zap } from 'lucide-react';
import { PROMPT_TEMPLATES, TEMPLATE_CATEGORIES } from '../data/promptTemplates';
import type { PromptTemplate } from '../data/promptTemplates';

interface PromptTemplatePanelProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTemplate: (prompt: string) => void;
}

export const PromptTemplatePanel: React.FC<PromptTemplatePanelProps> = ({ isOpen, onClose, onSelectTemplate }) => {
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filtered = useMemo(() => {
        let list = PROMPT_TEMPLATES;
        if (activeCategory !== 'all') {
            list = list.filter(t => t.category === activeCategory);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(t =>
                t.title.toLowerCase().includes(q) ||
                t.description.toLowerCase().includes(q) ||
                t.prompt.toLowerCase().includes(q)
            );
        }
        return list;
    }, [activeCategory, searchQuery]);

    const handleSelect = (template: PromptTemplate) => {
        onSelectTemplate(template.prompt);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
            <div
                className="bg-white w-full sm:w-[90vw] sm:max-w-4xl sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-300"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl text-white">
                            <Zap size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Kho Prompt Templates</h2>
                            <p className="text-xs text-gray-500">{PROMPT_TEMPLATES.length} mẫu câu lệnh chuyên biệt cho GV</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                {/* Search + Categories */}
                <div className="px-5 pt-4 pb-2 space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm template..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                        {TEMPLATE_CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeCategory === cat.id
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                <span>{cat.icon}</span>
                                <span>{cat.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Templates Grid */}
                <div className="flex-1 overflow-y-auto px-5 pb-5 custom-scrollbar">
                    {filtered.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <p className="text-3xl mb-2">🔍</p>
                            <p>Không tìm thấy template phù hợp</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                            {filtered.map(template => (
                                <button
                                    key={template.id}
                                    onClick={() => handleSelect(template)}
                                    className="flex flex-col items-start p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all duration-200 group text-left hover:-translate-y-0.5"
                                >
                                    <div className="flex items-center gap-2 mb-2 w-full">
                                        <span className="text-xl">{template.icon}</span>
                                        <span className="font-semibold text-gray-800 text-sm flex-1 line-clamp-1">{template.title}</span>
                                        {template.slashCommand && (
                                            <span className="text-[10px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                {template.slashCommand}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{template.description}</p>
                                    {template.variables && template.variables.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {template.variables.slice(0, 3).map(v => (
                                                <span key={v} className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full">
                                                    [{v}]
                                                </span>
                                            ))}
                                            {template.variables.length > 3 && (
                                                <span className="text-[10px] text-gray-400">+{template.variables.length - 3}</span>
                                            )}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer hint */}
                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
                    <p className="text-[11px] text-gray-400 text-center">
                        💡 Mẹo: Gõ <kbd className="bg-gray-200 px-1.5 py-0.5 rounded text-gray-600 font-mono">/</kbd> trong chat để truy cập nhanh bằng Slash Commands
                    </p>
                </div>
            </div>
        </div>
    );
};
