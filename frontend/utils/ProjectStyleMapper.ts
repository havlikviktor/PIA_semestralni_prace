import { ProjectState } from "@/constants/projectState";

export class ProjectStyleMapper {
  static getStyle(state: string | ProjectState): string {
    switch (state) {
      case ProjectState.CREATED:
      case "created":
        return "bg-blue-900 text-blue-300";
      case ProjectState.ASSIGNED:
      case "assigned":
        return "bg-yellow-900 text-yellow-300";
      case ProjectState.COMPLETED:
      case "completed":
        return "bg-lime-900 text-lime-300";
      case ProjectState.APPROVED:
      case "approved":
        return "bg-purple-900 text-purple-300";
      case ProjectState.REJECTED:
      case "rejected":
        return "bg-rose-900 text-rose-300";
      default:
        return "bg-gray-700 text-gray-300";
    }
  }

  static getBackgroundStyle(state: string | ProjectState): string {
    switch (state) {
      case ProjectState.CREATED:
      case "created":
        return "bg-blue-900";
      case ProjectState.ASSIGNED:
      case "assigned":
        return "bg-yellow-900";
      case ProjectState.COMPLETED:
      case "completed":
        return "bg-lime-900";
      case ProjectState.APPROVED:
      case "approved":
        return "bg-purple-900";
      case ProjectState.REJECTED:
      case "rejected":
        return "bg-rose-900";
      default:
        return "bg-gray-700";
    }
  }

  static getTextStyle(state: string | ProjectState): string {
    switch (state) {
      case ProjectState.CREATED:
      case "created":
        return "text-blue-300";
      case ProjectState.ASSIGNED:
      case "assigned":
        return "text-yellow-300";
      case ProjectState.COMPLETED:
      case "completed":
        return "text-lime-300";
      case ProjectState.APPROVED:
      case "approved":
        return "text-purple-300";
      case ProjectState.REJECTED:
      case "rejected":
        return "text-rose-300";
      default:
        return "text-gray-300";
    }
  }
}
