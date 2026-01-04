import { useTranslations } from "next-intl";
import { useState } from "react";
import { ProjectState } from "@/constants/projectState";
import { Role } from "@/constants/role";
import { Project } from "@/types/project";
import { mapStateToEnum } from "@/utils/StateMapper";

interface TranslatorActionsProps {
  userRole: Role | undefined;
  project: Project;
  onUpdateState: (newState: ProjectState) => void;
  onUpload: (file: File) => Promise<void>;
}

export default function TranslatorActions({
  userRole,
  project,
  onUpdateState,
  onUpload,
}: TranslatorActionsProps) {
  const t = useTranslations("ProjectDetails");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUploadClick = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      await onUpload(selectedFile);
      setSelectedFile(null);
    } finally {
      setUploading(false);
    }
  };

  if (
    userRole !== Role.TRANSLATOR ||
    mapStateToEnum(project.state) !== ProjectState.ASSIGNED
  ) {
    return null;
  }

  return (
    <>
      <hr className="border-t border-gray-200 my-6" />
      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-2">{t("translatorActions")}</h2>

        {/* File Upload */}
        <div className="bg-gray-50 p-4 rounded">
          <label className="block mb-2 font-medium">
            {t("uploadTranslation")}
          </label>
          <div className="flex gap-2">
            <input
              type="file"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
            />
            <button
              onClick={handleUploadClick}
              disabled={uploading || !selectedFile}
              className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:bg-zinc-300 disabled:cursor-not-allowed"
            >
              {uploading ? t("uploading") : t("upload")}
            </button>
          </div>
        </div>

        {/* Complete Project */}
        {project.hasTranslatedFile && (
          <button
            onClick={() => onUpdateState(ProjectState.COMPLETED)}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-full font-semibold"
          >
            {t("completeProject")}
          </button>
        )}
      </div>
    </>
  );
}
