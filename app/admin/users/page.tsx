'use client';

import { useState, useEffect } from 'react';
import { User, UserRole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Plus, Edit2, ShieldAlert, ShieldCheck, Trash2 } from 'lucide-react';
import { UserFormModal } from '@/components/admin/UserFormModal';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
      } else {
        toast.error(typeof data.error === 'string' ? data.error : 'Failed to load users');
      }
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const managers = users.filter((u) => u.role === UserRole.MANAGER || u.role === UserRole.ADMIN);

  // Handle Create / Edit Submit
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUserSubmit = async (values: any, isEdit: boolean) => {
    setActionLoading(true);
    try {
      const url = isEdit && selectedUser ? `/api/admin/users/${selectedUser._id || selectedUser.id}` : '/api/admin/users';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(`User ${isEdit ? 'updated' : 'created'} successfully!`);
        setFormModalOpen(false);
        fetchUsers();
      } else {
        toast.error(typeof data.error === 'string' ? data.error : `Failed to ${isEdit ? 'update' : 'create'} user`);
      }
    } catch {
      toast.error(`Error ${isEdit ? 'updating' : 'creating'} user`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const res = await fetch(`/api/admin/users/${user._id || user.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDisabled: !user.isDisabled }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(`User ${!user.isDisabled ? 'disabled' : 'enabled'} successfully`);
        // Optimistic UI update
        setUsers(users.map(u => (u._id === user._id || u.id === user.id) ? { ...u, isDisabled: !u.isDisabled } : u));
      } else {
        toast.error(typeof data.error === 'string' ? data.error : 'Failed to update user status');
      }
    } catch {
      toast.error('Error updating status');
    }
  };

  const handleDeleteConfirm = async (userId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok) {
        toast.success('User deleted successfully');
        setDeleteModalOpen(false);
        setUsers(users.filter(u => u._id !== userId && u.id !== userId));
      } else {
        toast.error(typeof data.error === 'string' ? data.error : 'Failed to delete user');
      }
    } catch {
      toast.error('Error deleting user');
    } finally {
      setActionLoading(false);
    }
  };

  const openCreateModal = () => {
    setSelectedUser(null);
    setFormModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormModalOpen(true);
  };

  const openDeleteModal = (user: User) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  return (
    <div className="space-y-6 p-8">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground">Manage your company employees and roles.</p>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="h-4 w-4" /> Add User
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user._id || user.id} className={user.isDisabled ? "opacity-60 bg-muted/20" : ""}>
                    <TableCell className="font-medium">
                      {user.name}
                      {user.role === UserRole.ADMIN && <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Admin</span>}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span className="capitalize">{user.role.toLowerCase()}</span>
                    </TableCell>
                    <TableCell>
                      {typeof user.managerId === 'object' && user.managerId !== null
                        ? user.managerId.name
                        : typeof user.managerId === 'string' && user.managerId !== 'none'
                          ? managers.find(m => m._id === user.managerId || m.id === user.managerId)?.name || 'Unknown'
                          : '-'}
                    </TableCell>
                    <TableCell>
                      {user.isDisabled ? (
                        <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-full font-medium flex-inline items-center gap-1 w-fit">
                          Disabled
                        </span>
                      ) : (
                        <span className="text-xs bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded-full font-medium flex-inline items-center gap-1 w-fit">
                          Active
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditModal(user)} title="Edit">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleStatus(user)}
                          title={user.isDisabled ? "Enable User" : "Disable User"}
                          className={user.isDisabled ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" : "text-amber-600 hover:text-amber-700 hover:bg-amber-50"}
                        >
                          {user.isDisabled ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteModal(user)}
                          title="Delete"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modals */}
      <UserFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        user={selectedUser}
        managers={managers}
        onSubmit={handleUserSubmit}
        saving={actionLoading}
      />

      <DeleteConfirmModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        user={userToDelete}
        onConfirm={handleDeleteConfirm}
        deleting={actionLoading}
      />
    </div>
  );
}