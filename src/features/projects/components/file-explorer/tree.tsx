import { FileIcon, FolderIcon } from "@react-symbols/icons/utils";
import { ChevronRightIcon } from "lucide-react";
import { useState } from "react";

import { Doc, Id } from "@/convex/_generated/dataModel";
import { CreateInput } from "@/features/projects/components/file-explorer/create-input";
import { LoadingRow } from "@/features/projects/components/file-explorer/loading-row";
import { RenameInput } from "@/features/projects/components/file-explorer/rename-input";
import { TreeItemWrapper } from "@/features/projects/components/file-explorer/tree-item-wrapper";
import { getItemPadding } from "@/features/projects/components/file-explorer/utils";
import {
  useCreateFile,
  useCreateFolder,
  useDeleteFile,
  useFolderContents,
  useRenameFile,
} from "@/features/projects/hooks/use-files";
import { cn } from "@/lib/utils";
import { useEditor } from "@/features/editor/hooks/use-editor";

function Tree({
  item,
  level = 0,
  projectId,
}: {
  item: Doc<"files">;
  level?: number;
  projectId: Id<"projects">;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [creating, setCreating] = useState<"file" | "folder" | null>(null);

  const { openFile, closeTab, activeTabId } = useEditor(projectId);

  const folderContents = useFolderContents({
    projectId,
    parentId: item._id,
    enabled: item.type === "folder" && isOpen,
  });

  const createFile = useCreateFile();
  const createFolder = useCreateFolder();
  const renameFile = useRenameFile({ projectId, parentId: item._id });
  const deleteFile = useDeleteFile({ projectId, parentId: item._id });

  const startCreating = (type: "file" | "folder") => {
    setIsOpen(true);
    setCreating(type);
  };

  const handleRename = (name: string) => {
    setIsRenaming(false);

    if (name === item.name) {
      return;
    }

    renameFile({ id: item._id, name });
  };

  const handleCreate = (name: string) => {
    setCreating(null);

    if (creating === "file") {
      createFile({ projectId, name, content: "", parentId: item._id });
    } else if (creating === "folder") {
      createFolder({ projectId, name, parentId: item._id });
    }
  };

  if (item.type === "file") {
    const fileName = item.name;
    const isActive = activeTabId === item._id;

    if (isRenaming) {
      return (
        <RenameInput
          type="file"
          defaultValue={fileName}
          level={level}
          onSubmit={handleRename}
          onCancel={() => setIsRenaming(false)}
        />
      );
    }

    return (
      <TreeItemWrapper
        item={item}
        level={level}
        isActive={isActive}
        onClick={() => openFile(item._id, { pinned: false })}
        onDoubleClick={() => openFile(item._id, { pinned: true })}
        onDelete={() => {
          closeTab(item._id);
          deleteFile({ id: item._id });
        }}
        onRename={() => setIsRenaming(true)}
      >
        <FileIcon fileName={fileName} autoAssign className="size-4" />
        <span className="truncate text-sm">{fileName}</span>
      </TreeItemWrapper>
    );
  }

  const folderName = item.name;
  const folderTitleRow = (
    <>
      <div className="flex items-center gap-0.5">
        <ChevronRightIcon
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-[rotate]",
            isOpen && "rotate-90",
          )}
        />
        <FolderIcon folderName={folderName} className="size-4" />
      </div>
      <span className="truncate text-sm">{folderName}</span>
    </>
  );

  if (creating) {
    return (
      <>
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="group flex items-center gap-1 h-5.5 bg-accent/30 w-full"
          style={{ paddingLeft: getItemPadding(level, false) }}
        >
          {folderTitleRow}
        </button>
        {isOpen && (
          <>
            {folderContents === undefined && <LoadingRow level={level + 1} />}
            <CreateInput
              type={creating}
              level={level + 1}
              onSubmit={handleCreate}
              onCancel={() => setCreating(null)}
            />
            {folderContents?.map((subItem) => (
              <Tree
                key={subItem._id}
                item={subItem}
                level={level + 1}
                projectId={projectId}
              />
            ))}
          </>
        )}
      </>
    );
  }

  if (isRenaming) {
    return (
      <>
        <RenameInput
          type="file"
          defaultValue={folderName}
          level={level}
          onSubmit={handleRename}
          onCancel={() => setIsRenaming(false)}
        />
        {isOpen && (
          <>
            {folderContents === undefined && <LoadingRow level={level + 1} />}
            {folderContents?.map((subItem) => (
              <Tree
                key={subItem._id}
                item={subItem}
                level={level + 1}
                projectId={projectId}
              />
            ))}
          </>
        )}
      </>
    );
  }

  return (
    <>
      <TreeItemWrapper
        item={item}
        level={level}
        isActive={false}
        onClick={() => setIsOpen((prev) => !prev)}
        onCreateFile={() => startCreating("file")}
        onCreateFolder={() => startCreating("folder")}
        onDelete={() => deleteFile({ id: item._id })}
        onRename={() => setIsRenaming(true)}
      >
        {folderTitleRow}
      </TreeItemWrapper>
      {isOpen && (
        <>
          {folderContents === undefined && <LoadingRow level={level + 1} />}
          {folderContents?.map((subItem) => (
            <Tree
              key={subItem._id}
              item={subItem}
              level={level + 1}
              projectId={projectId}
            />
          ))}
        </>
      )}
    </>
  );
}

export { Tree };
