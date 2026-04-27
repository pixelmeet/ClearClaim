"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import {
  User as UserIcon,
  Mail,
  Shield,
  Loader2,
  LogOut,
  Trash2,
  Save,
  Moon,
  Sun,
} from "lucide-react";

import {
  updateUserNameAction,
  deleteUserAction,
  updateUserExtrasAction,
} from "@/app/actions/user";
// removed UserRole
import {
  getProfileUserFields,
  buildUserExtraZodShape,
} from "@/types/user-schema";
import { FieldFactory, SelectField } from "./fields";
import { getFieldOptions } from "@/types/user-schema";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  [key: string]: unknown;
}

interface UserInfoCardProps {
  user: User;
  onUserUpdate: (updatedUser: User) => void;
  variants?: {
    hidden: { opacity: number; y: number };
    visible: { opacity: number; y: number; transition: { staggerChildren: number } };
  };
}

const createFormSchema = () => {
  const baseSchema = z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters."),
  });

  const extraSchema = buildUserExtraZodShape();

  return baseSchema.extend(extraSchema);
};

type FormData = z.infer<ReturnType<typeof createFormSchema>>;

export function UserInfoCard({
  user,
  onUserUpdate,
  variants,
}: UserInfoCardProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(
    null
  );

  const formSchema = createFormSchema();

  const getDefaultValues = () => {
    const defaults: Record<string, unknown> = { fullName: user.name };
    getProfileUserFields().forEach((field) => {
      const value = (user as Record<string, unknown>)[field.name];
      if (field.ui === "select") {
        defaults[field.name] = value || "none";
      } else {
        defaults[field.name] = value || "";
      }
    });
    return defaults;
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(),
  });

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        router.push("/");
      } else {
        console.error("Logout failed:", response.statusText);
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleDeleteAccount = async () => {
    setIsSubmitting(true);
    const result = await deleteUserAction();
    if (result.success) {
      toast.success(result.message);
      router.push("/");
    } else {
      toast.error(result.message);
    }
    setIsSubmitting(false);
  };

  const handleSelectValueChange = (value: string, fieldName: string) => {
    if (fieldName === "country") {
      form.setValue("state" as keyof FormData, "none");
      form.setValue("city" as keyof FormData, "none");
    } else if (fieldName === "state") {
      form.setValue("city" as keyof FormData, "none");
    }
  };

  const handleFileUpload = async (url: string, publicId: string) => {
    form.setValue("profilePic" as keyof FormData, url);
    form.setValue("profilePicId" as keyof FormData, publicId);
  };

  async function onSubmit(values: FormData) {
    setIsSubmitting(true);

    try {
      if (values.fullName !== user.name) {
        const nameResult = await updateUserNameAction(
          values.fullName as string
        );
        if (nameResult.success) {
          onUserUpdate({ ...user, name: values.fullName as string });
        } else {
          toast.error(nameResult.message);
          setIsSubmitting(false);
          return;
        }
      }

      const extraFields: Record<string, unknown> = {};
      getProfileUserFields().forEach((field) => {
        const currentValue = (user as Record<string, unknown>)[field.name];
        let newValue = values[field.name as keyof typeof values];

        if (field.ui === "select" && newValue === "none") {
          newValue = "";
        }

        if (newValue !== currentValue) {
          extraFields[field.name] = newValue;
        }
      });

      if (Object.keys(extraFields).length > 0) {
        const extraResult = await updateUserExtrasAction(extraFields);
        if (extraResult.success) {
          onUserUpdate({ ...user, ...extraFields } as User);
          toast.success("Profile updated successfully!");
        } else {
          toast.error(extraResult.message);
        }
      } else if (values.fullName === user.name) {
        toast.info("No changes to save");
      } else {
        toast.success("Profile updated successfully!");
      }
    } catch (error) {
      toast.error("Failed to update profile");
      console.error("Profile update error:", error);
    }

    setIsSubmitting(false);
  }

  return (
    <motion.div variants={variants} className="h-full">
      <Card className="h-full relative overflow-hidden rounded-2xl border border-card-border bg-card/60 backdrop-blur-xl shadow-lg hover:shadow-xl hover:border-primary/20 transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-50 pointer-events-none" />
        <CardHeader className="relative z-10 border-b border-border/10 pb-6">
          <CardTitle className="text-3xl font-serif tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">My Profile</CardTitle>
          <CardDescription className="text-base mt-1.5">
            View and manage your personal information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 relative z-10 pt-6">
          <div className="space-y-4 text-sm">
            {/* Prominent profile picture at top (only if a file field is enabled in schema) */}
            {getProfileUserFields().some((f) => f.ui === "file") && (
              <div className="w-full flex flex-col items-center justify-center gap-3">
                {(() => {
                  const formPic = form.watch("profilePic" as any) as string | undefined;
                  const pic = formPic || (user as Record<string, unknown>)["profilePic"] as string | undefined;
                  const imgSrc = pic && pic.length ? pic : "/images/user.png";
                  return (
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-full blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                      <Image
                        src={imgSrc}
                        alt="Profile"
                        width={144}
                        height={144}
                        className="relative h-28 w-28 sm:h-36 sm:w-36 rounded-full object-cover border-2 border-background shadow-xl"
                      />
                    </div>
                  );
                })()}
                {(() => {
                  const currentPic = (form.watch("profilePic" as any) as string | undefined) || (user as Record<string, unknown>)["profilePic"];
                  return currentPic ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const publicId = form.getValues("profilePicId" as any) || (user as Record<string, unknown>)[
                            "profilePicId"
                          ] as string | undefined;
                          if (publicId) {
                            await fetch("/api/files/delete", {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({ publicId }),
                            });
                          }
                        } catch { }
                        form.setValue("profilePic" as any, "");
                        form.setValue("profilePicId" as any, "");
                        await updateUserExtrasAction({
                          profilePic: "",
                          profilePicId: "",
                        });
                        onUserUpdate({
                          ...user,
                          profilePic: "",
                          profilePicId: "",
                        } as User);
                      }}>
                      Remove Photo
                    </Button>
                  ) : null;
                })()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 bg-muted/30 p-4 rounded-xl border border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg"><Mail className="h-5 w-5 text-primary" /></div>
                <div className="flex flex-col"><span className="text-sm text-muted-foreground leading-tight">Email</span><span className="font-medium">{user.email}</span></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg"><Shield className="h-5 w-5 text-accent" /></div>
                <div className="flex flex-col"><span className="text-sm text-muted-foreground leading-tight">Role</span><span className="font-medium capitalize">{user.role}</span></div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {getProfileUserFields()
                .filter((def) => def.ui !== "checkbox")
                .map((def) => {
                  const value = (user as Record<string, unknown>)[def.name];
                  if (def.ui === "file") return null;
                  if (value === undefined || value === null || value === "")
                    return null;
                  return (
                    <div key={def.name} className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">
                        {def.label}
                      </span>
                      <span className="font-medium break-words">
                        {String(value)}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Full Name Field */}
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 font-semibold">
                      <UserIcon className="h-4 w-4" /> Full Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Your full name"
                        {...field}
                        value={field.value as string}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Dynamic Profile Fields */}
              {getProfileUserFields()
                .filter(
                  (def) =>
                    def.ui !== "checkbox" && def.editableInProfile !== false
                )
                .map((def) => {
                  // Handle select fields with dynamic options separately
                  if (def.ui === "select") {
                    let options = def.options || [];
                    if (def.dependsOn) {
                      const dependentValue = form.getValues(def.dependsOn as keyof FormData) as string;
                      options = getFieldOptions(def.name, dependentValue);
                    }

                    return (
                      <SelectField
                        key={def.name}
                        name={def.name as keyof FormData}
                        control={form.control}
                        label={def.label}
                        options={options}
                        disabled={isSubmitting}
                        onValueChange={handleSelectValueChange}
                      />
                    );
                  }

                  // Use field factory for other field types
                  return (
                    <FieldFactory
                      key={def.name}
                      fieldDef={def}
                      control={form.control}
                      disabled={isSubmitting}
                      onSelectValueChange={handleSelectValueChange}
                      onFileUpload={handleFileUpload}
                    />
                  );
                })}

              {/* Read-only fields */}
              {getProfileUserFields()
                .filter((def) => def.editableInProfile === false)
                .map((def) => {
                  const value = (user as Record<string, unknown>)[def.name];
                  if (value === undefined || value === null || value === "")
                    return null;
                  return (
                    <div key={def.name} className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-muted-foreground">
                        {def.label}
                      </span>
                      <span className="font-medium break-words">
                        {String(value)}
                      </span>
                    </div>
                  );
                })}

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t border-border/10 mt-6 pt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-w-[140px] rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md hover:shadow-lg transition-all duration-300">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-6 border-t border-border/10 bg-muted/20 backdrop-blur-md p-6 relative z-10 w-full">
          <div className="w-full flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground text-lg tracking-tight">Appearance</h3>
                <p className="text-sm text-muted-foreground mt-1">Customize the look and feel.</p>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-400" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </div>
          </div>

          <div className="w-full h-px bg-border/50" />

          <div className="w-full flex flex-col gap-4">
            <h3 className="font-semibold text-foreground text-lg tracking-tight">Account Actions</h3>
            <div className="flex w-full flex-wrap items-center justify-between gap-4">
              <Button variant="outline" onClick={handleLogout} className="rounded-xl hover:bg-muted/50 transition-colors">
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="rounded-xl shadow-sm hover:shadow-md transition-all">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      your account.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={isSubmitting}
                      className="bg-destructive hover:bg-destructive/90">
                      {isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Yes, delete my account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
