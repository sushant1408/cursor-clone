import ky from "ky";
import { toast } from "sonner";
import z from "zod";

const editRequestSchama = z.object({
  selectedCode: z.string(),
  fullCode: z.string(),
  instruction: z.string(),
});

const editResponseSchama = z.object({
  editedCode: z.string(),
});

type EditRequest = z.infer<typeof editRequestSchama>;
type EditResponse = z.infer<typeof editResponseSchama>;

export const fetcher = async (
  payload: EditRequest,
  signal: AbortSignal,
): Promise<string | null> => {
  try {
    const validatedPayload = editRequestSchama.parse(payload);

    const response = await ky
      .post("/api/quick-edit", {
        json: validatedPayload,
        signal,
        timeout: 30_000,
        retry: 0,
      })
      .json<EditResponse>();

    const validatedResponse = editResponseSchama.parse(response);

    return validatedResponse.editedCode || null;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return null;
    }

    toast.error("Failed to fetch AI quick edit");
    return null;
  }
};
