import { FileState } from "@/constants/fileState";

export const downloadProjectFile = async (
  serverIp: string,
  projectId: number,
  type: FileState,
  token: string
): Promise<void> => {
  const res = await fetch(
    `${serverIp}/projects/${projectId}/file?type=${type}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error("Download failed");
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const contentDisposition = res.headers.get("Content-Disposition");
  let filename = `${type}_file`;
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?([^"]+)"?/);
    if (match && match[1]) filename = match[1];
  }
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
