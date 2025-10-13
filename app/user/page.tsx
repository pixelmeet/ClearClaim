"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  User as UserIcon,
  Mail,
  Shield,
  Loader2,
  LogOut,
  Trash2,
  Save,
  LogIn,
  ArrowLeft,
  LayoutDashboard,
  Moon,
  Sun,
} from "lucide-react";

import { getCurrentUserAction } from "@/app/actions/auth";
import {
  updateUserNameAction,
  deleteUserAction,
  updateUserExtrasAction,
} from "@/app/actions/user";
import { canAccessRole, UserRole } from "@/types/roles";
import { getProfileUserFields } from "@/types/user-schema";

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
import Link from "next/link";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

const formSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters."),
});

export default function UserPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(
    null
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { fullName: "" },
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUserAction();
        if (currentUser) {
          setUser(currentUser);
          form.reset({ fullName: currentUser.name });
        }
      } catch (error) {
        console.error("Failed to fetch user", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [form]);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/signout", {
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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || values.fullName === user.name) return;
    setIsSubmitting(true);
    const result = await updateUserNameAction(values.fullName);
    if (result.success) {
      toast.success(result.message);
      setUser((prev) => (prev ? { ...prev, name: values.fullName } : null));
    } else {
      toast.error(result.message);
    }
    setIsSubmitting(false);
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You must be logged in to view this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/login")}>
              <LogIn className="mr-2 h-4 w-4" /> Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
  };

  return (
    <main className="min-h-screen bg-secondary p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        <motion.div
          className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8"
          variants={cardVariants}
          initial="hidden"
          animate="visible">
          {/* Left Side: User Profile */}
          <motion.div variants={cardVariants}>
            <Card className="h-full shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-serif">
                  My Profile
                </CardTitle>
                <CardDescription>
                  View and manage your personal information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4 text-sm">
                  {/* Prominent profile picture at top (only if a file field is enabled in schema) */}
                  {getProfileUserFields().some((f) => f.ui === "file") && (
                    <div className="w-full flex flex-col items-center justify-center gap-3">
                      {(() => {
                        const pic = (user as any)["profilePic"] as
                          | string
                          | undefined;
                        const imgSrc =
                          pic && pic.length ? pic : "/images/user.png";
                        return (
                          <img
                            src={imgSrc}
                            alt="Profile"
                            className="h-28 w-28 sm:h-36 sm:w-36 rounded-full object-cover border"
                          />
                        );
                      })()}
                      {(user as any)["profilePic"] ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              const publicId = (user as any)["profilePicId"] as
                                | string
                                | undefined;
                              if (publicId) {
                                await fetch("/api/files/delete", {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({ publicId }),
                                });
                              }
                            } catch {}
                            await updateUserExtrasAction({
                              profilePic: "",
                              profilePicId: "",
                            });
                            setUser((prev) =>
                              prev
                                ? ({
                                    ...prev,
                                    profilePic: "",
                                    profilePicId: "",
                                  } as any)
                                : prev
                            );
                            setProfilePicPreview(null);
                          }}>
                          Remove Photo
                        </Button>
                      ) : null}
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium capitalize">{user.role}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {getProfileUserFields()
                      .filter((def) => def.ui !== "checkbox")
                      .map((def) => {
                        const value = (user as any)[def.name];
                        if (def.ui === "file") return null;
                        if (
                          value === undefined ||
                          value === null ||
                          value === ""
                        )
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
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 font-semibold">
                            <UserIcon className="h-4 w-4" /> Full Name
                          </FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Your full name"
                                {...field}
                                disabled={isSubmitting}
                              />
                              <Button
                                type="submit"
                                size="icon"
                                disabled={
                                  isSubmitting ||
                                  form.getValues().fullName === user.name
                                }>
                                {isSubmitting ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Save className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
                {/* Dynamic editable fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {getProfileUserFields()
                    .filter((def) => def.ui !== "checkbox")
                    .map((def) => {
                      const current = (user as any)[def.name];
                      const readOnly = def.editableInProfile === false;
                      return (
                        <div key={def.name} className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground">
                            {def.label}
                          </span>
                          {readOnly ? (
                            <span className="font-medium break-words">
                              {String(current ?? "")}
                            </span>
                          ) : def.ui === "textarea" ? (
                            <textarea
                              className="rounded-md border bg-background p-2"
                              defaultValue={String(
                                (user as any)[def.name] ?? ""
                              )}
                              onBlur={async (e) => {
                                const val = e.target.value;
                                if (val === (user as any)[def.name]) return;
                                await updateUserExtrasAction({
                                  [def.name]: val,
                                });
                                setUser((prev) =>
                                  prev
                                    ? ({ ...prev, [def.name]: val } as any)
                                    : prev
                                );
                              }}
                            />
                          ) : def.ui === "select" ? (
                            <select
                              className="rounded-md border bg-background p-2"
                              defaultValue={
                                ((user as any)[def.name] ?? "") as string
                              }
                              onChange={async (e) => {
                                const val = e.target.value;
                                await updateUserExtrasAction({
                                  [def.name]: val,
                                });
                                setUser((prev) =>
                                  prev
                                    ? ({ ...prev, [def.name]: val } as any)
                                    : prev
                                );
                              }}>
                              <option value="">Select {def.label}</option>
                              {(def.options || []).map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          ) : def.ui === "date" ? (
                            <input
                              type="date"
                              className="rounded-md border bg-background p-2"
                              defaultValue={String(
                                (user as any)[def.name] ?? ""
                              )}
                              onBlur={async (e) => {
                                const val = e.target.value;
                                if (val === (user as any)[def.name]) return;
                                await updateUserExtrasAction({
                                  [def.name]: val,
                                });
                                setUser((prev) =>
                                  prev
                                    ? ({ ...prev, [def.name]: val } as any)
                                    : prev
                                );
                              }}
                            />
                          ) : def.ui === "url" ? (
                            <input
                              type="url"
                              className="rounded-md border bg-background p-2"
                              defaultValue={String(
                                (user as any)[def.name] ?? ""
                              )}
                              onBlur={async (e) => {
                                const val = e.target.value;
                                if (val === (user as any)[def.name]) return;
                                await updateUserExtrasAction({
                                  [def.name]: val,
                                });
                                setUser((prev) =>
                                  prev
                                    ? ({ ...prev, [def.name]: val } as any)
                                    : prev
                                );
                              }}
                            />
                          ) : def.ui === "file" ? (
                            <input
                              type="file"
                              className="rounded-md border bg-background p-2"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.size > 2 * 1024 * 1024) {
                                  alert(
                                    "Profile picture must be 2 MB or smaller."
                                  );
                                  e.currentTarget.value = "";
                                  return;
                                }
                                const objectUrl = URL.createObjectURL(file);
                                setProfilePicPreview(objectUrl);
                                const form = new FormData();
                                form.append("folder", "users/profilePics");
                                form.append("file", file);
                                const res = await fetch("/api/files/upload", {
                                  method: "POST",
                                  body: form,
                                });
                                const data = await res.json();
                                const url = data?.uploads?.[0]?.url as
                                  | string
                                  | undefined;
                                const publicId = data?.uploads?.[0]
                                  ?.public_id as string | undefined;
                                if (!url) return;
                                await updateUserExtrasAction({
                                  [def.name]: url,
                                  profilePicId: publicId,
                                });
                                setUser((prev) =>
                                  prev
                                    ? ({
                                        ...prev,
                                        [def.name]: url,
                                        profilePicId: publicId,
                                      } as any)
                                    : prev
                                );
                                URL.revokeObjectURL(objectUrl);
                              }}
                            />
                          ) : (
                            <input
                              className="rounded-md border bg-background p-2"
                              defaultValue={String(
                                (user as any)[def.name] ?? ""
                              )}
                              onBlur={async (e) => {
                                const val = e.target.value;
                                if (val === (user as any)[def.name]) return;
                                await updateUserExtrasAction({
                                  [def.name]: val,
                                });
                                setUser((prev) =>
                                  prev
                                    ? ({ ...prev, [def.name]: val } as any)
                                    : prev
                                );
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col items-start gap-4 border-t bg-muted/50 p-6">
                <h3 className="font-semibold text-foreground">
                  Account Actions
                </h3>
                <div className="flex w-full flex-wrap items-center justify-between gap-2">
                  <Button variant="outline" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete your account.
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
              </CardFooter>
            </Card>
          </motion.div>

          {/* Right Side: Links & Settings */}
          <motion.div
            variants={cardVariants}
            className="flex flex-col justify-between gap-6 lg:gap-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-serif">
                  Quick Links
                </CardTitle>
                <CardDescription>
                  Navigate to other parts of the application.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {canAccessRole(user.role, "admin") ? (
                  <Link href="/admin">
                    <Button
                      variant="outline"
                      className="w-full justify-start text-base h-12">
                      <Shield className="mr-3 h-5 w-5 text-primary" />
                      Go to Admin Panel
                    </Button>
                  </Link>
                ) : canAccessRole(user.role, "moderator") ? (
                  <Link href="/moderator">
                    <Button
                      variant="outline"
                      className="w-full justify-start text-base h-12">
                      <Shield className="mr-3 h-5 w-5 text-primary" />
                      Go to Moderator Dashboard
                    </Button>
                  </Link>
                ) : (
                  <Link href="/user">
                    <Button
                      variant="outline"
                      className="w-full justify-start text-base h-12">
                      <LayoutDashboard className="mr-3 h-5 w-5 text-primary" />
                      Go to User Dashboard
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-serif">Appearance</CardTitle>
                <CardDescription>
                  Customize the look and feel of the app.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="font-medium">Toggle Theme</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
