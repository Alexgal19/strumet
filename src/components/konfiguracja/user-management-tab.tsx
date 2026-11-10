'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GenericExcelExportButton } from '@/components/generic-excel-export-button';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/app-context';
import type { User, UserRole } from '@/lib/types';

import { t } from '@/lib/i18n';
export const UserManagementTab = () => {
    const { users, currentUser, handleUpdateUserRole } = useAppContext();
    const { toast } = useToast();
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

    const handleRoleChange = (user: User, newRole: UserRole) => {
        if (user.id === currentUser?.uid) {
            toast({ variant: 'destructive', title: t('settings.error'), description: t('settings.youCannotChangeYourOwn') });
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
                <CardTitle>{t('settings.userManagement')}</CardTitle>
                <CardDescription>
                    {t('settings.browseUsersAndManageTheir')}
                </CardDescription>
                </div>
                {users.length > 0 && (
                    <GenericExcelExportButton
                        data={users}
                        columns={[
                            { key: 'email', name: 'Email' },
                            { key: 'role', name: t('settings.role') },
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
                                <TableHead className="w-[150px] text-center">{t('settings.role')}</TableHead>
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
                                            <SelectTrigger className="w-[150px] ml-auto" aria-label={t('settings.userRole')}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="admin">{t('settings.administrator')}</SelectItem>
                                                <SelectItem value="editor">{t('settings.colleague')}</SelectItem>
                                                <SelectItem value="guest">{t('settings.guest')}</SelectItem>
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
                                    <span className="text-sm font-medium">{t('settings.role')}</span>
                                    <Select
                                        value={user.role}
                                        onValueChange={(value) => handleRoleChange(user, value as UserRole)}
                                        disabled={user.id === currentUser?.uid || updatingUserId === user.id}
                                    >
                                        <SelectTrigger className="w-[150px]" aria-label={t('settings.userRole')}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">{t('settings.administrator')}</SelectItem>
                                            <SelectItem value="editor">{t('settings.colleague')}</SelectItem>
                                            <SelectItem value="guest">{t('settings.guest')}</SelectItem>
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
