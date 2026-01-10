import { useMutation, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const useFiles = (projectId: Id<"projects">) => {
  return useQuery(api.files.getFiles, { projectId });
};

const useFile = (id: Id<"files">) => {
  return useQuery(api.files.getFile, { id });
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

export {
  useCreateFile,
  useCreateFolder,
  useDeleteFile,
  useFile,
  useFiles,
  useFolderContents,
  useRenameFile,
  useUpdateFile
};

