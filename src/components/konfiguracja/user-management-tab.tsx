'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GenericExcelExportButton } from '@/components/generic-excel-export-button';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/app-context';
import type { User, UserRole } from '@/lib/types';

export const UserManagementTab = () => {
    const { users, currentUser, handleUpdateUserRole } = useAppContext();
    const { toast } = useToast();
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

    const handleRoleChange = (user: User, newRole: UserRole) => {
        if (user.id === currentUser?.uid) {
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie można zmienić własnej roli.' });
            return;
        }
        setUpdatingUserId(user.id);
        handleUpdateUserRole(user.id, newRole).finally(() => {
            setUpdatingUserId(null);
        });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                <CardTitle>Zarządzanie Użytkownikami</CardTitle>
                <CardDescription>
                    Przeglądaj użytkowników i zarządzaj ich uprawnieniami.
                </CardDescription>
                </div>
                {users.length > 0 && (
                    <GenericExcelExportButton
                        data={users}
                        columns={[
                            { key: 'email', name: 'Email' },
                            { key: 'role', name: 'Rola' },
                        ]}
                        fileName="uzytkownicy"
                    />
                )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="hidden md:block rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead className="w-[150px] text-center">Rola</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.email}</TableCell>
                                     <TableCell className="text-center">
                                        <Select
                                            value={user.role}
                                            onValueChange={(value) => handleRoleChange(user, value as UserRole)}
                                            disabled={user.id === currentUser?.uid || updatingUserId === user.id}
                                        >
                                            <SelectTrigger className="w-[150px] ml-auto" aria-label="Rola użytkownika">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="admin">Administrator</SelectItem>
                                                <SelectItem value="editor">Kolega</SelectItem>
                                                <SelectItem value="guest">Gość</SelectItem>
                                            </SelectContent>
                                        </Select>
                                     </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <div className="md:hidden flex flex-col gap-4 mt-4">
                    {users.map(user => (
                        <Card key={user.id} className="bg-card">
                            <CardContent className="p-4 flex flex-col gap-3">
                                <span className="font-semibold text-base break-all">{user.email}</span>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Rola</span>
                                    <Select
                                        value={user.role}
                                        onValueChange={(value) => handleRoleChange(user, value as UserRole)}
                                        disabled={user.id === currentUser?.uid || updatingUserId === user.id}
                                    >
                                        <SelectTrigger className="w-[150px]" aria-label="Rola użytkownika">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Administrator</SelectItem>
                                            <SelectItem value="editor">Kolega</SelectItem>
                                            <SelectItem value="guest">Gość</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
