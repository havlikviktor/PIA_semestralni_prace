import { FileState } from '@/constants/fileState';

export const downloadProjectFile = async (
  serverIp: string,
  projectId: number,
  type: FileState,
  authFetch: (
    url: string,
    options?: RequestInit,
    responseType?: 'json' | 'blob' | 'text',
  ) => Promise<any>,
): Promise<void> => {
  const { blob, headers } = await authFetch(
    `${serverIp}/projects/${projectId}/file?type=${type}`,
    {},
    'blob',
  );

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const contentDisposition = headers.get('Content-Disposition');
  let filename = `${type}_file`;
  if (contentDisposition) {
    const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/);
    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);

    if (filenameStarMatch && filenameStarMatch[1]) {
      filename = decodeURIComponent(filenameStarMatch[1]);
    } else if (filenameMatch && filenameMatch[1]) {
      filename = decodeURIComponent(filenameMatch[1]);
    }
  }
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
