import { useMutation, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const useConversation = (id: Id<"conversations"> | null) => {
  return useQuery(api.conversations.getById, id ? { id } : "skip");
};

const useConversations = (projectId: Id<"projects"> | null) => {
  return useQuery(
    api.conversations.getByProject,
    projectId ? { projectId } : "skip",
  );
};

const useCreateConversation = () => {
  return useMutation(api.conversations.create);
};

export { useConversation, useConversations, useCreateConversation };
