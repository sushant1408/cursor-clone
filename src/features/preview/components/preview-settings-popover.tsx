"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SettingsIcon } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
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
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useUpdateProjectSettings } from "@/features/projects/hooks/use-projects";

const formSchema = z.object({
  installCommand: z.string(),
  devCommand: z.string(),
});

interface PreviewSettingsPopoverProps {
  projectId: Id<"projects">;
  initialValues: Doc<"projects">["settings"];
  onSave?: () => void;
}

function PreviewSettingsPopover({
  initialValues,
  onSave,
  projectId,
}: PreviewSettingsPopoverProps) {
  const [open, setOpen] = useState(false);

  const updateSettings = useUpdateProjectSettings();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      installCommand: initialValues?.installCommand ?? "",
      devCommand: initialValues?.devCommand ?? "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    await updateSettings({
      id: projectId,
      settings: {
        installCommand: values.installCommand || undefined,
        devCommand: values.devCommand || undefined,
      },
    });

    setOpen(false);
    onSave?.();
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      form.reset({
        installCommand: initialValues?.installCommand ?? "",
        devCommand: initialValues?.devCommand ?? "",
      });
    }

    setOpen(open);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-full rounded-none"
          title="Preview Settings"
        >
          <SettingsIcon className="size-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <form
          id="form-preview-settings"
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          <FieldGroup className="gap-4">
            <div className="space-y-1">
              <h4 className="font-medium text-sm">Preview Settings</h4>
              <p className="text-xs text-muted-foreground">
                Configure how your project runs in the preview
              </p>
            </div>

            <Controller
              control={form.control}
              name="installCommand"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-installCommand">
                    Install Command
                  </FieldLabel>
                  <Input
                    {...field}
                    id="form-installCommand"
                    aria-invalid={fieldState.invalid}
                    placeholder="npm install"
                  />
                  <FieldDescription>
                    Command to install dependencies
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="devCommand"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-devCommand">
                    Start Command
                  </FieldLabel>
                  <Input
                    {...field}
                    id="form-devCommand"
                    aria-invalid={fieldState.invalid}
                    placeholder="npm run dev"
                  />
                  <FieldDescription>
                    Command to start the development server
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Field>
              <Button
                type="submit"
                form="form-preview-settings"
                size="sm"
                className="w-full"
                disabled={
                  !form.formState.isValid || form.formState.isSubmitting
                }
              >
                {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </PopoverContent>
    </Popover>
  );
}

export { PreviewSettingsPopover };
