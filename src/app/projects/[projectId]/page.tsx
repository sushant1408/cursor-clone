import { Id } from "@/convex/_generated/dataModel";
import { ProjectIdView } from "@/features/projects/components/project-id-view";

export default async function ProjectIdPage({
  params,
}: {
  params: Promise<{ projectId: Id<"projects"> }>;
}) {
  const { projectId } = await params;

  return <ProjectIdView projectId={projectId} />;
}
