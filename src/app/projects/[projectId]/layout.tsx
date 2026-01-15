import { Id } from "@/convex/_generated/dataModel";
import { ProjectIdLayout } from "@/features/projects/components/project-id-layout";

export default async function Layout({
  children,
  params,
}: LayoutProps<"/projects/[projectId]">) {
  const { projectId } = await params;

  return (
    <ProjectIdLayout projectId={projectId as Id<"projects">}>
      {children}
    </ProjectIdLayout>
  );
}
