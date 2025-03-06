import { AiEditor, AiEditorOptions } from "aieditor";
import "aieditor/dist/style.css";

import { HTMLAttributes, forwardRef, useEffect, useRef } from "react";

import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

import { useQiniuUpload } from "@/hooks/use-qiniu-upload";

type AIEditorProps = Omit<HTMLAttributes<HTMLDivElement>, "onChange"> & {
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (val: string) => void;
  options?: Omit<AiEditorOptions, "element">;
  light?: boolean;
};

/**
 * 富文本编辑器
 * Bug: 当输入过快，容易渲染错误
 * 
 * const [value, setValue] = useState("xxx");
 *  <Editor
 *     placeholder="描述代码的作用"
 *     value={value}
 *     onChange={(val) => {
 *       setValue(val);
 *     }}
 *   />
 */
export default forwardRef<HTMLDivElement, AIEditorProps>(function AIEditor(
  {
    placeholder,
    defaultValue,
    value,
    onChange,
    options,
    light = false,
    ...props
  }: AIEditorProps,
  ref
) {
  const divRef = useRef<HTMLDivElement>(null);
  const aiEditorRef = useRef<AiEditor | null>(null);

  const { theme } = useTheme();

  const { uploadToQiniu } = useQiniuUpload();

  const getToolbarKeys = (isLight: boolean) => {
    if (isLight) {
      return [
        "undo",
        "redo",
        "|",
        "font-size",
        "bold",
        "italic",
        "underline",
        "strike",
        "link",
        "code",
        "|",
        "font-color",
        "|",
        "align",
        "|",
        "fullscreen",
      ];
    }

    return [
      "undo",
      "redo",
      "brush",
      "eraser",
      "|",
      "heading",
      "font-family",
      "font-size",
      "|",
      "bold",
      "italic",
      "underline",
      "strike",
      "link",
      "code",
      "subscript",
      "superscript",
      "hr",
      "todo",
      "emoji",
      "|",
      "highlight",
      "font-color",
      "|",
      "align",
      "line-height",
      "|",
      "bullet-list",
      "ordered-list",
      "indent-decrease",
      "indent-increase",
      "break",
      "|",
      "image",
      "video",
      "quote",
      "code-block",
      "table",
      "|",
      "source-code",
      "fullscreen",
    ];
  };

  useEffect(() => {
    if (!aiEditorRef.current) return;

    aiEditorRef.current.changeTheme(theme as any);
  }, [theme]);

  useEffect(() => {
    if (!divRef.current) return;

    if (!aiEditorRef.current) {
      const aiEditor = new AiEditor({
        element: divRef.current,
        placeholder: placeholder,
        content: defaultValue,
        onChange: (ed) => {
          if (typeof onChange === "function" && value !== ed.getHtml()) {
            onChange(ed.getHtml());
          }
        },
        theme: theme as any,
        uploader: (file: File): Promise<Record<string, any>> => {
          return uploadToQiniu(file).then(async (response: any) => {
            // await new Promise((resolve) => setTimeout(resolve, 2000));
            return {
              errorCode: 0,
              data: {
                src: response.path,
              },
            };
          });
        },
        toolbarKeys: getToolbarKeys(light),
        textSelectionBubbleMenu: {
          enable: true,
          items: ["Bold", "Italic", "Underline", "Strike", "code", "comment"],
        },
        ...options,
      });

      aiEditorRef.current = aiEditor;
    }

    return () => {
      if (aiEditorRef.current) {
        aiEditorRef.current.destroy();
        aiEditorRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (ref) {
      if (typeof ref === "function") {
        ref(divRef.current);
      } else {
        ref.current = divRef.current;
      }
    }
  }, [ref]);

  useEffect(() => {
    if (aiEditorRef.current && value !== aiEditorRef.current.getHtml()) {
      aiEditorRef.current.setContent(value || "");
    }
  }, [value]);

  return (
    <div ref={divRef} {...props} className={cn("h-[40%]", props.className)}>
      <style>
        {`
        aie-footer {
          display: none !important;
        }
      `}
      </style>
    </div>
  );
});
