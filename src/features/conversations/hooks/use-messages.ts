import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const useMessages = (conversationId: Id<"conversations"> | null) => {
  return useQuery(
    api.messages.getMessages,
    conversationId ? { conversationId } : "skip",
  );
};

export { useMessages };
