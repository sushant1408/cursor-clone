"use client";

import { SparkleIcon } from "lucide-react";
import { Poppins } from "next/font/google";
import { useState } from "react";
import { FaGithub } from "react-icons/fa";

import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { ImportGithubDialog } from "@/features/projects/components/import-github-dialog";
import { NewProjectDialog } from "@/features/projects/components/new-project-dialog";
import { ProjectsCommandDialog } from "@/features/projects/components/projects-command-dialog";
import { ProjectsList } from "@/features/projects/components/projects-list";
import { useCreateProject } from "@/features/projects/hooks/use-projects";
import { cn } from "@/lib/utils";

const font = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

function ProjectsView() {
  const createProject = useCreateProject();

  const [commandDialogOpen, setCommandDialogOpen] = useState(false);
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  return (
    <>
      <ProjectsCommandDialog
        open={commandDialogOpen}
        onOpenChange={setCommandDialogOpen}
      />

      <ImportGithubDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />

      <NewProjectDialog
        open={newProjectDialogOpen}
        onOpenChange={setNewProjectDialogOpen}
      />

      <div className="min-h-screen bg-sidebar flex flex-col items-center justify-center p-6 md:p-16">
        <div className="w-full max-w-sm mx-auto flex flex-col gap-4 items-center">
          <div className="flex justify-between gap-4 w-full items-center">
            <div className="flex items-center gap-2 w-full group/logo">
              <img
                src="/logo.svg"
                alt="cursor-clone"
                className="size-8 md:size-11.5"
              />
              <h1
                className={cn(
                  "text-4xl md:text-5xl font-semibold",
                  font.className,
                )}
              >
                Cursor Clone
              </h1>
            </div>
          </div>

          <div className="flex flex-col gap-4 w-full">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => setNewProjectDialogOpen(true)}
                className="h-full items-start justify-start p-4 bg-background flex flex-col gap-6 rounded-none"
              >
                <div className="flex items-center justify-between w-full">
                  <SparkleIcon />
                  <Kbd className="bg-accent border">&#8984;J</Kbd>
                </div>
                <div>
                  <span className="text-sm">New</span>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={() => setImportDialogOpen(true)}
                className="h-full items-start justify-start p-4 bg-background flex flex-col gap-6 rounded-none"
              >
                <div className="flex items-center justify-between w-full">
                  <FaGithub />
                  <Kbd className="bg-accent border">&#8984;I</Kbd>
                </div>
                <div>
                  <span className="text-sm">Import</span>
                </div>
              </Button>
            </div>

            <ProjectsList onViewAll={() => setCommandDialogOpen(true)} />
          </div>
        </div>
      </div>
    </>
  );
}

export { ProjectsView };
