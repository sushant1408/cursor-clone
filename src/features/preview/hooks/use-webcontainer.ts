import { WebContainer } from "@webcontainer/api";
import { useCallback, useEffect, useRef, useState } from "react";

import { Doc, Id } from "@/convex/_generated/dataModel";
import { buildFileTree, getFilePath } from "@/features/preview/utils/file-tree";
import { useFiles } from "@/features/projects/hooks/use-files";

let webContainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

const getWebContainer = async (): Promise<WebContainer> => {
  if (webContainerInstance) {
    return webContainerInstance;
  }

  if (!bootPromise) {
    bootPromise = WebContainer.boot({ coep: "credentialless" });
  }

  webContainerInstance = await bootPromise;
  return webContainerInstance;
};

const teardownWebContainer = () => {
  if (webContainerInstance) {
    webContainerInstance.teardown();
    webContainerInstance = null;
  }

  bootPromise = null;
};

interface UseWebContainerProps {
  projectId: Id<"projects">;
  enabled: boolean;
  settings?: Doc<"projects">["settings"];
}

const useWebContainer = ({
  enabled,
  projectId,
  settings,
}: UseWebContainerProps) => {
  const [status, setStatus] = useState<
    "idle" | "booting" | "installing" | "running" | "error"
  >("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restartKey, setRestartKey] = useState(0);
  const [terminalOutput, setTerminalOutput] = useState("");

  const containerRef = useRef<WebContainer>(null);
  const hasStartedRef = useRef(false);

  // fetch files from convex
  const files = useFiles(projectId);

  // initial boot and mount
  useEffect(() => {
    if (!enabled || !files || files.length === 0 || hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;

    const start = async () => {
      try {
        setStatus("booting");
        setError(null);
        setTerminalOutput("");

        const appendOutput = (data: string) => {
          setTerminalOutput((prev) => prev + data);
        };

        const container = await getWebContainer();
        containerRef.current = container;

        const fileTree = buildFileTree(files);
        await container.mount(fileTree);

        container.on("server-ready", (_port, url) => {
          setPreviewUrl(url);
          setStatus("running");
        });

        setStatus("installing");

        // parse install command (default: "npm install")
        const installCmd = settings?.installCommand || "npm install";
        const [installBin, ...installArgs] = installCmd.split(" ");
        appendOutput(`$ ${installCmd}\n`);

        const installProcess = await container.spawn(installBin, installArgs);
        installProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              appendOutput(data);
            },
          }),
        );

        const installExitCode = await installProcess.exit;

        if (installExitCode !== 0) {
          throw new Error(`${installCmd} failed with code ${installExitCode}`);
        }

        // parse dev command (default: "npm run dev")
        const devCmd = settings?.devCommand || "npm run dev";
        const [devBin, ...devArgs] = devCmd.split(" ");
        appendOutput(`\n$ ${devCmd}\n`);

        const devProcess = await container.spawn(devBin, devArgs);
        devProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              appendOutput(data);
            },
          }),
        );
      } catch (error) {
        setError(error instanceof Error ? error.message : "Unknown error");
        setStatus("error");
      }
    };

    start();
  }, [
    enabled,
    files,
    restartKey,
    settings?.installCommand,
    settings?.devCommand,
  ]);

  // sync files changes (hot-reload)
  useEffect(() => {
    const container = containerRef.current;

    if (!container || !files || status !== "running") {
      return;
    }

    const filesMap = new Map(files.map((f) => [f._id, f]));

    for (const file of files) {
      if (file.type !== "file" || file.storageId || !file.content) {
        continue;
      }

      const filePath = getFilePath(file, filesMap);
      container.fs.writeFile(filePath, file.content);
    }
  }, [files, status]);

  // reset when disabled
  useEffect(() => {
    if (!enabled) {
      hasStartedRef.current = false;
      setStatus("idle");
      setError(null);
      setPreviewUrl(null);
    }
  }, [enabled]);

  // restart the entire webcontainer process
  const restart = useCallback(() => {
    teardownWebContainer();
    containerRef.current = null;
    hasStartedRef.current = false;
    setStatus("idle");
    setPreviewUrl(null);
    setError(null);
    setRestartKey((prevKey) => prevKey + 1);
  }, []);

  return {
    status,
    previewUrl,
    error,
    restart,
    terminalOutput,
  };
};

export { useWebContainer };
