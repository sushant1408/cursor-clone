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
  return useMutation(api.conversations.create).withOptimisticUpdate(
    (localStore, args) => {
      const existingConversations = localStore.getQuery(
        api.conversations.getByProject,
        { projectId: args.projectId },
      );

      if (existingConversations !== undefined) {
        // eslint-disable-next-line react-hooks/purity -- optimistic update callback runs on mutation, not render
        const now = Date.now();
        const newConversation = {
          _id: crypto.randomUUID() as Id<"conversations">,
          _creationTime: now,
          projectId: args.projectId,
          title: args.title,
          createdAt: now,
          updatedAt: now,
        };

        localStore.setQuery(
          api.conversations.getByProject,
          {
            projectId: args.projectId,
          },
          [newConversation, ...existingConversations],
        );
      }
    },
  );
};

export { useConversation, useConversations, useCreateConversation };
