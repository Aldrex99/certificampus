import { isFulfilled, isRejectedWithValue, Middleware } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { apiError } from "@/lib/errors";

const successMessages: Record<string, string> = {
  createStudent: "Étudiant créé",
  updateStudent: "Étudiant mis à jour",
  deleteStudent: "Étudiant supprimé",
  bulkDeleteStudents: "Étudiants supprimés",
  createTraining: "Formation créée",
  updateTraining: "Formation mise à jour",
  deleteTraining: "Formation supprimée",
  // generate/publishDiplomas show detailed count toasts from their own handlers.
  updateProfile: "Profil mis à jour",
  changePassword: "Mot de passe modifié",
  createSchool: "École créée",
  updateSchool: "École mise à jour",
  deleteSchool: "École supprimée",
  createSubscription: "Abonnement créé",
  updateSubscription: "Abonnement mis à jour",
  deleteSubscription: "Abonnement supprimé",
  createTemplate: "Modèle créé",
  updateTemplate: "Modèle mis à jour",
  deleteTemplate: "Modèle supprimé",
};

const silentEndpoints = new Set([
  "login",
  "register",
  "activate",
  "logout",
  "forgotPassword",
  "resetPassword",
]);

interface QueryActionMeta {
  arg?: { endpointName?: string; type?: "query" | "mutation" };
}

function endpointName(meta: QueryActionMeta | undefined): string | undefined {
  return meta?.arg?.endpointName;
}

function isMutation(meta: QueryActionMeta | undefined): boolean {
  return meta?.arg?.type === "mutation";
}

export const toastMiddleware: Middleware = () => (next) => (action) => {
  if (isFulfilled(action)) {
    const meta = action.meta as QueryActionMeta | undefined;
    const name = endpointName(meta);
    if (name && successMessages[name]) {
      toast.success(successMessages[name]);
    }
  } else if (isRejectedWithValue(action)) {
    const meta = action.meta as QueryActionMeta | undefined;
    const name = endpointName(meta);
    if (name && silentEndpoints.has(name)) return next(action);
    if (isMutation(meta) || name) {
      toast.error(apiError(action.payload));
    }
  }
  return next(action);
};
