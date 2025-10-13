import { z } from "zod";

export type UserExtraFieldName =
  // | "addressLine1"
  // | "addressLine2"
  // | "gender"
  // | "bio"
  // | "profilePic"
  // | "username";
// | "dateOfBirth"
// | "city"
// | "state"
// | "country"
| "is_active";

export type UserFieldDef = {
  name: UserExtraFieldName;
  label: string;
  ui: "text" | "textarea" | "select" | "date" | "url" | "checkbox" | "file";
  options?: { label: string; value: string }[];
  required?: boolean;
  placeholder?: string;
  contexts?: ("signup" | "profile")[];
  editableInProfile?: boolean;
};

export const USER_FIELD_DEFS: UserFieldDef[] = [
  // { name: "addressLine1", label: "Address Line 1", ui: "textarea", placeholder: "123 Main St" },
  // { name: "addressLine2", label: "Address Line 2", ui: "textarea", placeholder: "Apt, suite, etc." },
  // {
  //   name: "gender",
  //   label: "Gender",
  //   ui: "select",
  //   options: [
  //     { label: "Male", value: "Male" },
  //     { label: "Female", value: "Female" },
  //     { label: "Other", value: "Other" },
  //   ],
  //   contexts: ["signup", "profile"],
  //   editableInProfile: true,
  // },
  // { name: "bio", label: "Bio", ui: "textarea", placeholder: "Tell us about yourself" },
  // {
  //   name: "profilePic",
  //   label: "Profile Picture",
  //   ui: "file",
  //   contexts: ["profile"],
  // },
  // {
  //   name: "username",
  //   label: "Username",
  //   ui: "text",
  //   required: true,
  //   contexts: ["signup", "profile"],
  //   editableInProfile: true,
  // },
  // { name: "dateOfBirth", label: "Date of Birth", ui: "date" },
  // { name: "city", label: "City", ui: "select", options: [] },
  // { name: "state", label: "State", ui: "select", options: [] },
  // { name: "country", label: "Country", ui: "select", options: [] },
  // { name: "is_active", label: "Active", ui: "checkbox" },
];

export function getEnabledUserFields(): UserFieldDef[] {
  return USER_FIELD_DEFS;
}

export function getSignupUserFields(): UserFieldDef[] {
  return USER_FIELD_DEFS.filter(
    (f) => !f.contexts || f.contexts.includes("signup")
  );
}

export function getProfileUserFields(): UserFieldDef[] {
  return USER_FIELD_DEFS.filter(
    (f) => !f.contexts || f.contexts.includes("profile")
  );
}

export function buildUserExtraZodShape() {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of USER_FIELD_DEFS) {
    let schema: z.ZodTypeAny;
    switch (f.ui) {
      case "textarea":
      case "text":
        schema = z
          .string()
          .min(f.required ? 1 : 0)
          .optional();
        break;
      case "file":
        schema = z.any().optional();
        break;
      case "url":
        schema = z.string().url().optional();
        break;
      case "select":
        schema = z.string().optional();
        break;
      case "date":
        schema = z.string().optional();
        break;
      case "checkbox":
        schema = z.boolean().optional();
        break;
      default:
        schema = z.any().optional();
    }
    shape[f.name] = schema;
  }
  return shape;
}
