import Image from "next/image";
import { useEffect, useRef } from "react";

import { Id } from "@/convex/_generated/dataModel";
import { CodeEditor } from "@/features/editor/components/code-editor";
import { FileBreadcrumbs } from "@/features/editor/components/file-breadcrumbs";
import { TopNavigation } from "@/features/editor/components/top-navigation";
import { useEditor } from "@/features/editor/hooks/use-editor";
import { useFile, useUpdateFile } from "@/features/projects/hooks/use-files";
import { DEBOUNCE_MS } from "@/lib/constants";

function EditorView({ projectId }: { projectId: Id<"projects"> }) {
  const { activeTabId } = useEditor(projectId);
  const activeFile = useFile(activeTabId);
  const updateFile = useUpdateFile();

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isActiveFileBinary = activeFile && activeFile.storageId;
  const isActiveFileText = activeFile && !activeFile.storageId;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center">
        <TopNavigation projectId={projectId} />
      </div>

      {activeTabId && <FileBreadcrumbs projectId={projectId} />}

      <div className="flex-1 min-h-0 bg-background">
        {!activeFile && (
          <div className="size-full flex items-center justify-center">
            <Image
              src="/logo-alt.svg"
              alt="cursor-clone"
              width={50}
              height={50}
              className="opacity-25"
            />
          </div>
        )}
        {isActiveFileText && (
          <CodeEditor
            key={activeFile._id}
            fileName={activeFile.name}
            onChange={(content) => {
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
              }

              timeoutRef.current = setTimeout(() => {
                updateFile({ id: activeFile._id, content });
              }, DEBOUNCE_MS);
            }}
            initialValue={activeFile.content}
          />
        )}
      </div>
    </div>
  );
}

export { EditorView };
