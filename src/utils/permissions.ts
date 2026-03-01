// src/utils/permissions.ts
import { User } from '../db/db';

type Role = User['role'];

/**
 * Super admin: Full control
 * Admin: Create, Edit (Cannot delete)
 * Consultor: Edit only (Specifically progress/status, cannot create or delete Projects)
 */

export const canCreate = (role?: Role): boolean => {
    if (!role) return false;
    return role === 'Super admin' || role === 'Admin';
};

export const canEdit = (role?: Role): boolean => {
    if (!role) return false;
    return role === 'Super admin' || role === 'Admin' || role === 'Consultor';
};

export const canDelete = (role?: Role): boolean => {
    if (!role) return false;
    return role === 'Super admin';
};

export const canViewAuditLog = (role?: Role): boolean => {
    if (!role) return false;
    return role === 'Super admin';
};
