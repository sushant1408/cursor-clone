import { useClerk } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import ky, { HTTPError } from "ky";
import {
  CheckCheckIcon,
  CheckCircle2Icon,
  ExternalLinkIcon,
  XCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FaGithub } from "react-icons/fa";
import { toast } from "sonner";
import z from "zod";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { Id } from "@/convex/_generated/dataModel";
import { useProject } from "@/features/projects/hooks/use-projects";

const formSchema = z.object({
  repoName: z
    .string()
    .min(1, "Repository name is required")
    .max(100, "Repository name is too long")
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      "Only alphanumeric characters, hyphens, underscores, and dots are allowed",
    ),
  visibility: z.enum(["public", "private"]),
  description: z.string().max(350, "Description is too long"),
});

interface ExportPopoverProps {
  projectId: Id<"projects">;
}

function ExportPopover({ projectId }: ExportPopoverProps) {
  const { openUserProfile } = useClerk();
  const project = useProject(projectId);

  const [open, setOpen] = useState(false);

  const exportStatus = project?.exportStatus;
  const exportRepoUrl = project?.exportRepoUrl;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      repoName: "",
      visibility: "private" as "public" | "private",
      description: "",
    },
  });

  useEffect(() => {
    if (project?.name) {
      form.setValue(
        "repoName",
        project?.name?.replace(/[^a-zA-Z0-9._-]/g, "-"),
      );
    }
  }, [project?.name]);

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await ky.post("/api/github/export", {
        json: {
          projectId,
          repoName: values.repoName,
          visibility: values.visibility,
          description: values.description || undefined,
        },
      });

      toast.success("Export started...");
    } catch (error) {
      if (error instanceof HTTPError) {
        const body = await error.response.json<{ error: string }>();

        if (body.error?.includes("Pro plan required")) {
          toast.error("Upgrade to import repositories", {
            action: {
              label: "Upgrade",
              onClick: () => openUserProfile(),
            },
          });
          setOpen(false);
          return;
        }

        if (body.error?.includes("GitHub not connected")) {
          toast.error("Github account not connected", {
            action: {
              label: "Connect",
              onClick: () => openUserProfile(),
            },
          });
          setOpen(false);
          return;
        }
      }

      toast.error("Unable to export repository.");
    }
  };

  const handleCancelExport = async () => {
    await ky.post("/api/github/export/cancel", { json: { projectId } });
  };

  const handleResetExport = async () => {
    await ky.post("/api/github/export/reset", { json: { projectId } });
  };

  const renderContent = () => {
    if (exportStatus === "exporting") {
      return (
        <div className="flex flex-col items-center gap-3">
          <Spinner className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Exporting to GitHub...
          </p>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={handleCancelExport}
          >
            Cancel
          </Button>
        </div>
      );
    }

    if (exportStatus === "completed" && exportRepoUrl) {
      return (
        <div className="flex flex-col items-center gap-3">
          <CheckCircle2Icon className="size-6 text-emerald-500" />
          <p className="text-sm font-medium">Repository Created</p>
          <p className="text-xs text-muted-foreground text-center">
            Your project has been exported to GitHub.
          </p>
          <div className="flex flex-col w-full gap-2">
            <Button size="sm" className="w-full" asChild>
              <Link
                href={exportRepoUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLinkIcon className="size-4 mr-1" />
                View on GitHub
              </Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={handleResetExport}
            >
              Reset
            </Button>
          </div>
        </div>
      );
    }

    if (exportStatus === "failed") {
      return (
        <div className="flex flex-col items-center gap-3">
          <XCircleIcon className="size-6 text-rose-500" />
          <p className="text-sm font-md">Enable to Export</p>
          <p className="text-xs text-muted-foreground text-center">
            Something went wrong. Please try again.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={handleResetExport}
          >
            Retry
          </Button>
        </div>
      );
    }

    return (
      <form
        id="form-export-to-github"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <FieldGroup className="gap-4">
          <div className="space-y-1">
            <h4 className="font-medium text-sm">Export to GitHub</h4>
            <p className="text-xs text-muted-foreground">
              Export your project to a GitHub repository.
            </p>
          </div>

          <Controller
            control={form.control}
            name="repoName"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="form-export-to-github-repoName">
                  Repository name
                </FieldLabel>
                <Input
                  {...field}
                  id="form-form-export-to-github-repoName"
                  aria-invalid={fieldState.invalid}
                  placeholder="my-project"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="visibility"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="form-export-to-github-visibility">
                  Visibility
                </FieldLabel>
                <Select
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="form-export-to-github-visibility"
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="description"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="form-export-to-github-description">
                  Description
                </FieldLabel>
                <Textarea
                  {...field}
                  id="form-form-export-to-github-description"
                  aria-invalid={fieldState.invalid}
                  placeholder="A short description of your project"
                  rows={2}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Field>
            <Button
              form="form-export-to-github"
              type="submit"
              size="sm"
              className="w-full"
              disabled={!form.formState.isValid || form.formState.isSubmitting}
            >
              {form.formState.isSubmitting
                ? "Creating..."
                : "Create Repository"}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    );
  };

  const getStatusIcon = () => {
    if (exportStatus === "exporting") {
      return <Spinner className="size-3.5" />;
    }
    if (exportStatus === "completed") {
      return <CheckCheckIcon className="size-3.5 text-emerald-500" />;
    }
    if (exportStatus === "failed") {
      return <XCircleIcon className="size-3.5 text-red-500" />;
    }
    return <FaGithub className="size-3.5" />;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-1.5 h-full px-3 cursor-pointer text-muted-foreground border-l hover:bg-accent/30">
          {getStatusIcon()}
          <span className="text-sm">Export</span>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        {renderContent()}
      </PopoverContent>
    </Popover>
  );
}

export { ExportPopover };
