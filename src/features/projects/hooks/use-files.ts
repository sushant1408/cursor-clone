import { useMutation, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const useFiles = (projectId: Id<"projects">) => {
  return useQuery(api.files.getFiles, { projectId });
};

const useFile = (id: Id<"files"> | null) => {
  return useQuery(api.files.getFile, id ? { id } : "skip");
};

const useFolderContents = ({
  projectId,
  parentId,
  enabled = true,
}: {
  projectId: Id<"projects">;
  parentId?: Id<"files">;
  enabled?: boolean;
}) => {
  return useQuery(
    api.files.getFolderContents,
    enabled ? { projectId, parentId } : "skip",
  );
};

const useCreateFile = () => {
  return useMutation(api.files.createFile);
};

const useCreateFolder = () => {
  return useMutation(api.files.createFolder);
};

const useRenameFile = () => {
  return useMutation(api.files.renameFile);
};

const useDeleteFile = () => {
  return useMutation(api.files.deleteFile);
};

const useUpdateFile = () => {
  return useMutation(api.files.updateFile);
};

const useFilePath = (id: Id<"files"> | null) => {
  return useQuery(api.files.getFilePath, id ? { id } : "skip");
};

export {
  useCreateFile,
  useCreateFolder,
  useDeleteFile,
  useFile,
  useFiles,
  useFilePath,
  useFolderContents,
  useRenameFile,
  useUpdateFile,
};
