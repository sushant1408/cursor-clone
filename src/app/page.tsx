"use client";

import { UserButton } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@/components/ui/button";
import { api } from "../../convex/_generated/api";

export default function Home() {
  const projects = useQuery(api.projects.get);
  const createProject = useMutation(api.projects.create);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <pre>
          <code>{JSON.stringify(projects, null, 2)}</code>
        </pre>
        <div className="flex">
          <UserButton />
          <Button onClick={() => createProject({ name: "New Project" })}>
            Create
          </Button>
        </div>
      </main>
    </div>
  );
}
