import { Spinner } from "@/components/ui/spinner";
import { getItemPadding } from "@/features/projects/components/file-explorer/utils";
import { cn } from "@/lib/utils";

function LoadingRow({
  level,
  className,
}: {
  level: number;
  className?: string;
}) {
  return (
    <div
      className={cn("h-5.5 flex items-center text-muted-foreground", className)}
      style={{
        paddingLeft: getItemPadding(level, true),
      }}
    >
      <Spinner className="size-4 text-ring ml-0.5" />
    </div>
  );
}

export { LoadingRow };
