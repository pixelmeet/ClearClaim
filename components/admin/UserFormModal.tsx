'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, UserRole } from '@/lib/types';
import { AdminCreateUserSchema, AdminUpdateUserSchema } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface UserFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user?: User | null; // If provided, it's edit mode
    managers: User[];
    onSubmit: (data: z.infer<typeof AdminCreateUserSchema> | z.infer<typeof AdminUpdateUserSchema>, isEdit: boolean) => Promise<void>;
    saving: boolean;
}

export function UserFormModal({ open, onOpenChange, user, managers, onSubmit, saving }: UserFormModalProps) {
    const isEdit = !!user;

    // Use the appropriate schema based on edit mode
    // The AdminUpdateUserSchema makes name and email optional, but we want to require them in the form visually
    const schema = isEdit ? AdminUpdateUserSchema : AdminCreateUserSchema;

    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            role: UserRole.EMPLOYEE,
            managerId: 'none',
        },
    });

    // Reset form when modal opens or user changes
    useEffect(() => {
        if (open) {
            if (user) {
                // Edit mode data prep
                let mgrId = 'none';
                if (user.managerId) {
                    mgrId = typeof user.managerId === 'string' ? user.managerId : user.managerId._id || user.managerId.id || 'none';
                }
                form.reset({
                    name: user.name || '',
                    email: user.email || '',
                    role: user.role || UserRole.EMPLOYEE,
                    managerId: mgrId,
                });
            } else {
                // Create mode defaults
                form.reset({
                    name: '',
                    email: '',
                    password: '',
                    role: UserRole.EMPLOYEE,
                    managerId: 'none',
                });
            }
        }
    }, [open, user, form]);

    const handleSubmit = async (values: z.infer<typeof schema>) => {
        await onSubmit(values, isEdit);
    };

    const selectedRole = form.watch('role');

    return (
        <Dialog open={open} onOpenChange={(val) => !saving && onOpenChange(val)}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit User' : 'Create User'}</DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? "Update user details."
                            : "Create a new user account. Default password is 'password123' if left blank."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Jane Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="jane@company.com" type="email" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Only show password field in Create mode */}
                        {!isEdit && (
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password (Optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Leave blank for default" type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Role</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select role" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value={UserRole.EMPLOYEE}>Employee</SelectItem>
                                            <SelectItem value={UserRole.MANAGER}>Manager</SelectItem>
                                            <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Manager Selection - Only applicable for Employees */}
                        {selectedRole === UserRole.EMPLOYEE && (
                            <FormField
                                control={form.control}
                                name="managerId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Assign Manager</FormLabel>
                                        <Select
                                            onValueChange={(val) => field.onChange(val === 'none' ? 'none' : val)}
                                            value={field.value || 'none'}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select manager" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">No Manager</SelectItem>
                                                {managers
                                                    // Ensure we don't allow assigning a user as their own manager in edit mode
                                                    .filter(m => isEdit ? (m._id || m.id) !== (user?._id || user?.id) : true)
                                                    .map((m) => (
                                                        <SelectItem key={m._id || m.id} value={m._id || m.id || 'err'}>
                                                            {m.name}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>Employees can optionally report to a Manager or Admin.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={saving}>
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEdit ? 'Save Changes' : 'Create User'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
