import { Id } from "@/convex/_generated/dataModel";
import { ProjectIdLayout } from "@/features/projects/components/project-id-layout";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: Id<"projects"> }>;
}) {
  const { projectId } = await params;

  return <ProjectIdLayout projectId={projectId}>{children}</ProjectIdLayout>;
}
