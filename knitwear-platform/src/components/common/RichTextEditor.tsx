'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Youtube from '@tiptap/extension-youtube';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Link as LinkIcon,
    Youtube as YoutubeIcon,
    Type,
    Palette,
    ChevronDown
} from 'lucide-react';
import { useCallback, useState, useRef, useEffect } from 'react';

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
    minHeight?: string;
    hideLink?: boolean;
    hideYoutube?: boolean;
}

const COLORS = [
    { name: 'Default', color: '#1c1917' }, // stone-900
    { name: 'Rose', color: '#f43f5e' },
    { name: 'Emerald', color: '#10b981' },
    { name: 'Blue', color: '#3b82f6' },
    { name: 'Amber', color: '#f59e0b' },
];

const RichTextEditor = ({ content, onChange, placeholder, minHeight, hideLink, hideYoutube, className }: RichTextEditorProps & { className?: string }) => {
    const [isColorMenuOpen, setIsColorMenuOpen] = useState(false);
    const colorMenuRef = useRef<HTMLDivElement>(null);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-rose-500 underline cursor-pointer',
                },
            }),
            TextStyle,
            Color,
            Youtube.configure({
                width: 480,
                height: 270,
                HTMLAttributes: {
                    class: 'rounded-xl overflow-hidden shadow-lg mx-auto my-4',
                },
            }),
        ],
        content: content,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                // Remove fixed padding/height from prose to let container handle it
                class: 'prose prose-sm max-w-none focus:outline-none px-6 py-4 text-stone-800 [&_strong]:font-bold [&_a]:text-rose-500 [&_a]:underline',
            },
        },
    });

    // Close color menu on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (colorMenuRef.current && !colorMenuRef.current.contains(event.target as Node)) {
                setIsColorMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const setLink = useCallback(() => {
        if (!editor) return;
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);

        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    const addYoutubeVideo = useCallback(() => {
        if (!editor) return;
        const url = window.prompt('Enter YouTube URL');

        if (url) {
            editor.commands.setYoutubeVideo({
                src: url,
            });
        }
    }, [editor]);

    if (!editor) {
        return null;
    }

    const activeColor = COLORS.find(c => editor.isActive('textStyle', { color: c.color }))?.color || COLORS[0].color;

    return (
        <div className={`relative border border-tan-200 rounded-2xl overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-rose-400 transition-all flex flex-col ${className || ''}`} style={{ height: minHeight || 'auto' }}>
            {/* Toolbar - Sticky */}
            <div className="flex flex-wrap items-center gap-1 p-2 bg-stone-50 border-b border-tan-100 sticky top-0 z-10 flex-none w-full">
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    active={editor.isActive('bold')}
                >
                    <Bold size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    active={editor.isActive('italic')}
                >
                    <Italic size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    active={editor.isActive('underline')}
                >
                    <UnderlineIcon size={18} />
                </ToolbarButton>

                <div className="w-px h-6 bg-tan-200 mx-1" />

                {/* Color Palette Dropdown */}
                <div className="relative" ref={colorMenuRef}>
                    <button
                        type="button"
                        onClick={() => setIsColorMenuOpen(!isColorMenuOpen)}
                        className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${isColorMenuOpen ? 'bg-tan-100 text-stone-800' : 'text-stone-500 hover:bg-tan-100'}`}
                    >
                        <Palette size={18} style={{ color: activeColor }} />
                        <ChevronDown size={12} />
                    </button>

                    {isColorMenuOpen && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-tan-200 rounded-xl p-2 shadow-xl z-50 flex flex-col gap-1 min-w-[120px] animate-in fade-in zoom-in-95 duration-200">
                            {COLORS.map((c) => (
                                <button
                                    key={c.color}
                                    onClick={() => {
                                        editor.chain().focus().setColor(c.color).run();
                                        setIsColorMenuOpen(false);
                                    }}
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-stone-50 text-sm font-medium transition-colors"
                                >
                                    <div className="w-4 h-4 rounded-full border border-black/5" style={{ backgroundColor: c.color }} />
                                    <span style={{ color: c.color }}>{c.name}</span>
                                    {editor.isActive('textStyle', { color: c.color }) && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-rose-500" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {!hideLink && !hideYoutube && <div className="w-px h-6 bg-tan-200 mx-1" />}

                {!hideLink && (
                    <ToolbarButton onClick={setLink} active={editor.isActive('link')}>
                        <LinkIcon size={18} />
                    </ToolbarButton>
                )}
                {!hideYoutube && (
                    <ToolbarButton onClick={addYoutubeVideo}>
                        <YoutubeIcon size={18} />
                    </ToolbarButton>
                )}
            </div>

            {/* Editor Area - Scrollable */}
            <div className="relative flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-stone-200 scrollbar-track-transparent hover:scrollbar-thumb-stone-300">
                <EditorContent editor={editor} className="h-full" />
                {placeholder && editor.isEmpty && (
                    <div className="absolute top-4 left-6 pointer-events-none text-stone-400 text-sm">
                        {placeholder}
                    </div>
                )}
            </div>
        </div>
    );
};

const ToolbarButton = ({
    onClick,
    children,
    active = false
}: {
    onClick: () => void;
    children: React.ReactNode;
    active?: boolean
}) => (
    <button
        type="button"
        onMouseDown={(e) => {
            // Prevent button from stealing focus from editor
            e.preventDefault();
        }}
        onClick={(e) => {
            e.preventDefault();
            onClick();
        }}
        className={`p-2 rounded-lg transition-colors ${active ? 'bg-rose-100 text-rose-600 shadow-inner' : 'text-stone-500 hover:bg-tan-100 hover:text-stone-700'
            }`}
    >
        {children}
    </button>
);

export default RichTextEditor;
