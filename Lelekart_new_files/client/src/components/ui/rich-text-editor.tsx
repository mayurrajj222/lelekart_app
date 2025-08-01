import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Heading from "@tiptap/extension-heading";
import Highlight from "@tiptap/extension-highlight";
import Color from "@tiptap/extension-color";
import { FC, useEffect, useState } from "react";
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}

interface MenubarProps {
  editor: Editor | null;
}

const colorOptions = [
  { value: "#000000", label: "Black" },
  { value: "#0000FF", label: "Blue" },
  { value: "#FF0000", label: "Red" },
  { value: "#008000", label: "Green" },
  { value: "#FFA500", label: "Orange" },
  { value: "#800080", label: "Purple" },
];

const Menubar: FC<MenubarProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const setColor = (color: string) => {
    editor.chain().focus().setColor(color).run();
  };

  return (
    <div className="border border-input bg-transparent rounded-t-md p-1 flex flex-wrap gap-1 items-center">
      <Toggle
        size="sm"
        pressed={editor.isActive("bold")}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        aria-label="Toggle bold"
      >
        <BoldIcon className="h-4 w-4" />
      </Toggle>

      <Toggle
        size="sm"
        pressed={editor.isActive("italic")}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        aria-label="Toggle italic"
      >
        <ItalicIcon className="h-4 w-4" />
      </Toggle>

      <Toggle
        size="sm"
        pressed={editor.isActive("underline")}
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
        aria-label="Toggle underline"
      >
        <UnderlineIcon className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="h-6" />

      <Toggle
        size="sm"
        pressed={editor.isActive("heading", { level: 2 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
        aria-label="Toggle heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </Toggle>

      <Toggle
        size="sm"
        pressed={editor.isActive("heading", { level: 3 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
        aria-label="Toggle heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="h-6" />

      <Toggle
        size="sm"
        pressed={editor.isActive("textAlign", { align: "left" })}
        onPressedChange={() =>
          editor.chain().focus().setTextAlign("left").run()
        }
        aria-label="Align left"
      >
        <AlignLeft className="h-4 w-4" />
      </Toggle>

      <Toggle
        size="sm"
        pressed={editor.isActive("textAlign", { align: "center" })}
        onPressedChange={() =>
          editor.chain().focus().setTextAlign("center").run()
        }
        aria-label="Align center"
      >
        <AlignCenter className="h-4 w-4" />
      </Toggle>

      <Toggle
        size="sm"
        pressed={editor.isActive("textAlign", { align: "right" })}
        onPressedChange={() =>
          editor.chain().focus().setTextAlign("right").run()
        }
        aria-label="Align right"
      >
        <AlignRight className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="h-6" />

      <Toggle
        size="sm"
        pressed={editor.isActive("highlight")}
        onPressedChange={() => editor.chain().focus().toggleHighlight().run()}
        aria-label="Toggle highlight"
      >
        <Highlighter className="h-4 w-4" />
      </Toggle>

      <Popover>
        <PopoverTrigger asChild>
          <Toggle size="sm" aria-label="Choose text color">
            <Palette className="h-4 w-4" />
          </Toggle>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2">
          <div className="grid grid-cols-3 gap-1">
            {colorOptions.map((color) => (
              <button
                key={color.value}
                onClick={() => setColor(color.value)}
                className="p-2 rounded-md hover:bg-secondary flex items-center space-x-2"
              >
                <div
                  className="w-4 h-4 rounded-full border border-input"
                  style={{ backgroundColor: color.value }}
                />
                <span className="text-xs" style={{ color: color.value }}>
                  {color.label}
                </span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Start typing...",
  minHeight = 200,
}: RichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Bold,
      Italic,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Heading.configure({
        levels: [2, 3],
      }),
      Highlight.configure({
        HTMLAttributes: {
          class: "bg-yellow-200 text-black px-1 rounded",
        },
      }),
      Color,
    ],
    content: value,
    editorProps: {
      attributes: {
        class: `prose prose-sm focus:outline-none max-w-full p-3 min-h-[${minHeight}px]`,
      },
    },
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
  });

  // Only render the editor on the client-side to avoid hydration errors
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update the editor content when the value prop changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  if (!isMounted) {
    return (
      <div
        className="border border-input rounded-md"
        style={{ minHeight: `${minHeight}px` }}
      >
        <div className="border border-input bg-transparent rounded-t-md p-1 h-9" />
        <div className="p-3 text-sm text-muted-foreground">{placeholder}</div>
      </div>
    );
  }

  return (
    <div className={cn("border border-input rounded-md overflow-hidden")}>
      <Menubar editor={editor} />
      <EditorContent editor={editor} className="min-h-[100px]" />
    </div>
  );
}
