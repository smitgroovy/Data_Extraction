import { useCallback, useState } from "react";
import { Upload, File, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FILE_ACCEPT_TYPES } from "@/constants";

interface UploadDropzoneProps {
  onFilesAdded: (files: File[]) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  multiple?: boolean;
}

export function UploadDropzone({
  onFilesAdded,
  accept = FILE_ACCEPT_TYPES,
  maxSize = 10 * 1024 * 1024,
  multiple = true,
}: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<{ file: File; progress: number; error?: string }[]>([]);

  const validateFile = (file: File): string | null => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    const allowedExts = Object.values(accept).flat();
    if (!allowedExts.includes(ext)) {
      return `File type ${ext} is not supported`;
    }
    if (file.size > maxSize) {
      return `File exceeds maximum size of ${maxSize / 1024 / 1024}MB`;
    }
    return null;
  };

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);
      const processed = fileArray.map((file) => ({
        file,
        progress: 0,
        error: validateFile(file) || undefined,
      }));
      setFiles((prev) => [...prev, ...processed]);
      const validFiles = processed.filter((f) => !f.error).map((f) => f.file);
      if (validFiles.length > 0) {
        onFilesAdded(validFiles);
        validFiles.forEach((f, i) => {
          setTimeout(() => {
            setFiles((prev) =>
              prev.map((pf) =>
                pf.file === f ? { ...pf, progress: 100 } : pf
              )
            );
          }, 1000 + i * 500);
        });
      }
    },
    [onFilesAdded, maxSize, accept]
  );

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          addFiles(e.dataTransfer.files);
        }}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="rounded-full bg-muted p-3">
            <Upload className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-sm font-medium">
            Drag & drop files here, or click to browse
          </div>
          <p className="text-xs text-muted-foreground">
            Supports PDF, CSV, XLSX, XLS, DOCX, PNG, JPEG (max{" "}
            {maxSize / 1024 / 1024}MB)
          </p>
        </div>
        <input
          type="file"
          className="absolute inset-0 cursor-pointer opacity-0"
          accept={Object.values(accept).flat().join(",")}
          multiple={multiple}
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
          }}
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <File className="h-8 w-8 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate">
                    {file.file.name}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {(file.file.size / 1024).toFixed(1)} KB
                </p>
                {file.error ? (
                  <div className="flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3 text-destructive" />
                    <span className="text-xs text-destructive">
                      {file.error}
                    </span>
                  </div>
                ) : (
                  <Progress value={file.progress} className="mt-1 h-1" />
                )}
              </div>
              {file.progress === 100 && !file.error && (
                <Badge variant="success">Complete</Badge>
              )}
              {file.error && <Badge variant="destructive">Error</Badge>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
