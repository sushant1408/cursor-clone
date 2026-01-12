import ky from "ky";
import { toast } from "sonner";
import z from "zod";

const suggestionRequestSchama = z.object({
  fileName: z.string(),
  code: z.string(),
  currentLine: z.string(),
  previousLines: z.string(),
  textBeforeCursor: z.string(),
  textAfterCursor: z.string(),
  nextLines: z.string(),
  lineNumber: z.number(),
});

const suggestionResponseSchama = z.object({
  suggestion: z.string(),
});

type SuggestionRequest = z.infer<typeof suggestionRequestSchama>;
type SuggestionResponse = z.infer<typeof suggestionResponseSchama>;

export const fetcher = async (
  payload: SuggestionRequest,
  signal: AbortSignal,
): Promise<string | null> => {
  try {
    const validatedPayload = suggestionRequestSchama.parse(payload);

    const response = await ky
      .post("/api/suggestion", {
        json: validatedPayload,
        signal,
        timeout: 10_000,
        retry: 0,
      })
      .json<SuggestionResponse>();

    const validatedResponse = suggestionResponseSchama.parse(response);

    return validatedResponse.suggestion || null;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return null;
    }

    toast.error("Failed to fetch AI completion");
    return null;
  }
};
