import { useClerk } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import ky, { HTTPError } from "ky";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Id } from "@/convex/_generated/dataModel";

const formSchema = z.object({
  url: z.url("Please enter a valid URL"),
});

interface ImportGithubDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ImportGithubDialog({ open, onOpenChange }: ImportGithubDialogProps) {
  const router = useRouter();
  const { openUserProfile } = useClerk();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
    },
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "i" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const { projectId } = await ky
        .post("/api/github/import", {
          json: { url: values.url },
        })
        .json<{
          success: boolean;
          projectId: Id<"projects">;
          eventId: string;
        }>();

      toast.success("Importing repository...");
      onOpenChange(false);
      form.reset();

      router.push(`/projects/${projectId}`);
    } catch (error) {
      if (error instanceof HTTPError) {
        const body = await error.response.json<{ error: string }>();

        if (body.error?.includes("GitHub not connected")) {
          toast.error("Github account not connected", {
            action: {
              label: "Connect",
              onClick: () => openUserProfile(),
            },
          });
          onOpenChange(false);
          return;
        }
      }

      toast.error(
        "Unable to import repository. Please check the URL and try again.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import from GitHub</DialogTitle>
          <DialogDescription>
            Enter a GitHub repository URL to import. A new project will be
            created with the repository contents.
          </DialogDescription>
        </DialogHeader>
        <form
          id="form-import-github-repo"
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          <FieldGroup>
            <Controller
              control={form.control}
              name="url"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-import-github-repo-url">
                    Repository URL
                  </FieldLabel>
                  <Input
                    {...field}
                    id="form-import-github-repo-url"
                    aria-invalid={fieldState.invalid}
                    placeholder="https://github.com/owner/repo"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="form-import-github-repo"
            disabled={!form.formState.isValid || form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { ImportGithubDialog };
