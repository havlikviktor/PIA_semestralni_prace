import { UserInfo } from "./user";


export interface Feedback {
  text: string;
  createdAt: string;
}

export interface Project {
  ProjectId: number;
  fileName: string;
  languageCode: string;
  state: string;
  createdAt: string;
  fileSuffix: string;
  customer: UserInfo;
  translator?: UserInfo;
  feedback?: Feedback;
  hasTranslatedFile: boolean;
}
