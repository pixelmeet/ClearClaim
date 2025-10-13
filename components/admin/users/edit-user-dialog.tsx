"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { User } from "@/types/user";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateAdminUserAction } from "@/app/actions/admin";
import { getAllRoles, getRolesForSelect, UserRole } from "@/types/roles";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters."),
  role: z.enum(getAllRoles() as [UserRole, ...UserRole[]]),
});

interface EditUserDialogProps {
  user: User | null;
  onOpenChange: (open: boolean) => void;
  allowedRoles?: UserRole[];
}

export function EditUserDialog({
  user,
  onOpenChange,
  allowedRoles,
}: EditUserDialogProps) {
  const permittedRoles =
    allowedRoles && allowedRoles.length
      ? allowedRoles
      : (getAllRoles() as UserRole[]);

  const formSchema = z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters."),
    role: z.enum(permittedRoles as [UserRole, ...UserRole[]]),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (user) {
      form.reset({
        fullName: user.fullName,
        role: user.role,
      });
    }
  }, [user, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;
    const result = await updateAdminUserAction(user.id, values);
    if (result.success) {
      toast.success("User Updated", { description: result.message });
      onOpenChange(false);
    } else {
      toast.error("Update Failed", { description: result.message });
    }
  }

  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User: {user?.fullName}</DialogTitle>
          <DialogDescription>
            Update the user&apos;s details below. Click save when you&apos;re
            done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {getRolesForSelect()
                        .filter((r) => permittedRoles.includes(r.value))
                        .map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
