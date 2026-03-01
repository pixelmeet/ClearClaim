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
import { Loader2, Plus, Edit2, ShieldAlert, ShieldCheck, Trash2, Search, Users } from 'lucide-react';
import { UserFormModal } from '@/components/admin/UserFormModal';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';
import { Input } from '@/components/ui/input';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

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
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4 opacity-0 animate-fade-in-up">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Users
          </h2>
          <p className="text-muted-foreground mt-1">Manage your company employees and roles.</p>
        </div>
        <Button onClick={openCreateModal} className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" /> Add User
        </Button>
      </div>

      {/* Search Bar */}
      <div className="opacity-0 animate-fade-in-up delay-100">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card/60 backdrop-blur-xl border-card-border"
          />
        </div>
      </div>

      {/* Table */}
      <div className="opacity-0 animate-fade-in-up delay-200">
        <Card className="border-card-border bg-card/60 backdrop-blur-xl overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Role</TableHead>
                  <TableHead className="font-semibold">Manager</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-8 w-8 text-muted-foreground/50" />
                        <p className="text-muted-foreground">
                          {searchQuery ? 'No users match your search.' : 'No users found.'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow
                      key={user._id || user.id}
                      className={`transition-colors duration-200 ${user.isDisabled ? 'opacity-60 bg-muted/10' : 'hover:bg-primary/[0.02]'}`}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {user.name}
                          {user.role === UserRole.ADMIN && (
                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                              Admin
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <span className="text-xs bg-muted px-2.5 py-1 rounded-full font-medium capitalize">
                          {user.role.toLowerCase()}
                        </span>
                      </TableCell>
                      <TableCell>
                        {typeof user.managerId === 'object' && user.managerId !== null
                          ? user.managerId.name
                          : typeof user.managerId === 'string' && user.managerId !== 'none'
                            ? managers.find(m => m._id === user.managerId || m.id === user.managerId)?.name || 'Unknown'
                            : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {user.isDisabled ? (
                          <span className="inline-flex items-center gap-1.5 text-xs bg-destructive/10 text-destructive px-2.5 py-1 rounded-full font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                            Disabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-500/10 text-emerald-600 px-2.5 py-1 rounded-full font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-glow-pulse" />
                            Active
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(user)}
                            title="Edit"
                            className="h-8 w-8 rounded-lg hover:bg-primary/5"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleStatus(user)}
                            title={user.isDisabled ? 'Enable User' : 'Disable User'}
                            className={`h-8 w-8 rounded-lg ${user.isDisabled ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50' : 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'}`}
                          >
                            {user.isDisabled ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteModal(user)}
                            title="Delete"
                            className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
      </div>

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