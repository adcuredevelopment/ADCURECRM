'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Users, Plus, Search, MoreVertical, Pencil, Trash2, X, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ValidatedInput } from '@/components/shared/ValidatedInput'

// =====================================================
// Types
// =====================================================

interface UserRecord {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  company_name: string | null
  role: 'client' | 'agency_admin'
  organization_id: string
  organization_name: string | null
  organization_type: string | null
  created_at: string
}

interface Organization {
  id: string
  name: string
  type: string
}

type RoleFilter = 'all' | 'client' | 'agency_admin'

// =====================================================
// Edit User Modal
// =====================================================

interface EditUserModalProps {
  user: UserRecord
  onSave: (data: Partial<UserRecord>) => Promise<void>
  onClose: () => void
}

function EditUserModal({ user, onSave, onClose }: EditUserModalProps) {
  const [fullName, setFullName] = useState(user.full_name ?? '')
  const [phone, setPhone] = useState(user.phone ?? '')
  const [companyName, setCompanyName] = useState(user.company_name ?? '')
  const [role, setRole] = useState<'client' | 'agency_admin'>(user.role)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await onSave({
      full_name: fullName || null,
      phone: phone || null,
      company_name: companyName || null,
      role,
    })
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-[#2A3040] bg-[#1A1F2B] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-white">Edit User</h3>
          <button onClick={onClose} className="text-[#4A5568] hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-[#94A3B8] mb-4">{user.email}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Full Name">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              className="w-full rounded-lg border border-[#2A3040] bg-[#141920] px-3 py-2 text-sm text-white placeholder-[#4A5568] focus:border-[#2D7FF9] focus:outline-none"
            />
          </FormField>

          <FormField label="Phone">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+31 6 12345678"
              className="w-full rounded-lg border border-[#2A3040] bg-[#141920] px-3 py-2 text-sm text-white placeholder-[#4A5568] focus:border-[#2D7FF9] focus:outline-none"
            />
          </FormField>

          <FormField label="Company Name">
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Company BV"
              className="w-full rounded-lg border border-[#2A3040] bg-[#141920] px-3 py-2 text-sm text-white placeholder-[#4A5568] focus:border-[#2D7FF9] focus:outline-none"
            />
          </FormField>

          <FormField label="Role">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'client' | 'agency_admin')}
              className="w-full rounded-lg border border-[#2A3040] bg-[#141920] px-3 py-2 text-sm text-white focus:border-[#2D7FF9] focus:outline-none"
            >
              <option value="client">Client</option>
              <option value="agency_admin">Agency Admin</option>
            </select>
          </FormField>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-lg border border-[#2A3040] bg-transparent px-4 py-2 text-sm text-[#94A3B8] hover:bg-[#2A3040] hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-[#2D7FF9] hover:bg-[#2070e0] px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// =====================================================
// Add User Modal
// =====================================================

interface AddUserModalProps {
  organizations: Organization[]
  onAdd: (data: {
    email: string
    full_name: string
    role: 'client' | 'agency_admin'
    organization_id: string
  }) => Promise<void>
  onClose: () => void
}

function AddUserModal({ organizations, onAdd, onClose }: AddUserModalProps) {
  const [email, setEmail] = useState('')
  const [emailValid, setEmailValid] = useState(false)
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'client' | 'agency_admin'>('client')
  const [orgId, setOrgId] = useState(organizations[0]?.id ?? '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !orgId) return
    setLoading(true)
    await onAdd({ email, full_name: fullName, role, organization_id: orgId })
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-[#2A3040] bg-[#1A1F2B] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-white">Add User</h3>
          <button onClick={onClose} className="text-[#4A5568] hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-lg border border-[#2D7FF9]/20 bg-[#2D7FF9]/5 px-3 py-2 mb-4">
          <p className="text-xs text-[#94A3B8]">
            De gebruiker ontvangt een email om een wachtwoord in te stellen.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ValidatedInput
            id="add-user-email"
            label="Email"
            type="email"
            placeholder="naam@bedrijf.nl"
            required
            validateEndpoint="/api/validate/email"
            validatePayloadKey="email"
            hint="Geen Gmail, Hotmail, Outlook etc."
            onValidated={(val, valid) => {
              setEmail(val)
              setEmailValid(valid)
            }}
          />

          <FormField label="Full Name">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              className="w-full rounded-lg border border-[#2A3040] bg-[#141920] px-3 py-2 text-sm text-white placeholder-[#4A5568] focus:border-[#2D7FF9] focus:outline-none"
            />
          </FormField>

          <FormField label="Role">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'client' | 'agency_admin')}
              className="w-full rounded-lg border border-[#2A3040] bg-[#141920] px-3 py-2 text-sm text-white focus:border-[#2D7FF9] focus:outline-none"
            >
              <option value="client">Client</option>
              <option value="agency_admin">Agency Admin</option>
            </select>
          </FormField>

          <FormField label="Organization *">
            <select
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              required
              className="w-full rounded-lg border border-[#2A3040] bg-[#141920] px-3 py-2 text-sm text-white focus:border-[#2D7FF9] focus:outline-none"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.type})
                </option>
              ))}
            </select>
          </FormField>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-lg border border-[#2A3040] bg-transparent px-4 py-2 text-sm text-[#94A3B8] hover:bg-[#2A3040] hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !email || !emailValid || !orgId}
              className="flex-1 rounded-lg bg-[#2D7FF9] hover:bg-[#2070e0] px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// =====================================================
// Delete Confirm Modal
// =====================================================

function DeleteConfirmModal({
  user,
  onConfirm,
  onClose,
}: {
  user: UserRecord
  onConfirm: () => Promise<void>
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    await onConfirm()
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-xl border border-[#2A3040] bg-[#1A1F2B] p-6 shadow-2xl">
        <h3 className="text-sm font-semibold text-white mb-2">Delete User</h3>
        <p className="text-xs text-[#94A3B8] mb-5">
          Are you sure you want to delete{' '}
          <span className="text-white">{user.full_name ?? user.email}</span>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-lg border border-[#2A3040] bg-transparent px-4 py-2 text-sm text-[#94A3B8] hover:bg-[#2A3040] hover:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 rounded-lg bg-[#EF4444] hover:bg-[#dc2626] px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// =====================================================
// User Card
// =====================================================

interface UserCardProps {
  user: UserRecord
  onEdit: (user: UserRecord) => void
  onDelete: (user: UserRecord) => void
}

function UserCard({ user, onEdit, onDelete }: UserCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()

  const initial = (user.full_name ?? user.email)[0]?.toUpperCase() ?? '?'
  const isAdmin = user.role === 'agency_admin'

  return (
    <div
      className="relative rounded-xl border border-[#2A3040] bg-[#141920] p-5 hover:border-[#3A4050] transition-colors cursor-pointer"
      onClick={() => user.role === 'client' && router.push(`/agency/clients/${user.id}`)}
    >
      {/* Three-dots menu */}
      <div className="absolute top-4 right-4 z-30">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v) }}
          className="flex items-center justify-center h-7 w-7 rounded-lg text-[#4A5568] hover:text-white hover:bg-[#2A3040] transition-colors"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false) }}
            />
            <div className="absolute right-0 top-8 z-40 w-36 rounded-lg border border-[#2A3040] bg-[#1A1F2B] shadow-xl overflow-hidden">
              {user.role === 'client' && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); router.push(`/agency/clients/${user.id}`); setMenuOpen(false) }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[#94A3B8] hover:bg-[#2A3040] hover:text-white transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View
                </button>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onEdit(user); setMenuOpen(false) }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[#94A3B8] hover:bg-[#2A3040] hover:text-white transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(user); setMenuOpen(false) }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </>
        )}
      </div>

      {/* Avatar + Name */}
      <div className="flex items-center gap-3 mb-4 pr-8">
        <div
          className={cn(
            'flex items-center justify-center h-10 w-10 rounded-full text-sm font-bold flex-shrink-0',
            isAdmin
              ? 'bg-[#2D7FF9]/20 text-[#2D7FF9]'
              : 'bg-[#4A5568]/20 text-[#94A3B8]'
          )}
        >
          {initial}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {user.full_name ?? user.email}
          </p>
          <p className="text-xs text-[#4A5568] truncate">{user.email}</p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-1.5 mb-4">
        <DetailItem label="Phone" value={user.phone ?? '-'} />
        <DetailItem label="Company" value={user.company_name ?? '-'} />
        {user.organization_name && (
          <DetailItem label="Org" value={user.organization_name} />
        )}
      </div>

      {/* Role Badge */}
      <div className="pt-3 border-t border-[#2A3040]">
        <span
          className={cn(
            'text-xs px-2.5 py-1 rounded-full font-medium border',
            isAdmin
              ? 'text-[#2D7FF9] bg-[#2D7FF9]/10 border-[#2D7FF9]/20'
              : 'text-[#94A3B8] bg-[#4A5568]/10 border-[#4A5568]/20'
          )}
        >
          {isAdmin ? 'Admin' : 'Client'}
        </span>
      </div>
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-xs text-[#4A5568] w-14 flex-shrink-0">{label}</span>
      <span className="text-xs text-[#94A3B8] truncate">{value}</span>
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">{label}</label>
      {children}
    </div>
  )
}

// =====================================================
// Main Page
// =====================================================

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [editTarget, setEditTarget] = useState<UserRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [usersRes, orgsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/wallets'), // Reuse wallets to get org data, or use a direct supabase call
      ])

      if (!usersRes.ok) throw new Error('Failed to fetch users')
      const usersData: UserRecord[] = await usersRes.json()
      setUsers(usersData)

      // Fetch organizations for add modal
      const orgsRes2 = await fetch('/api/admin/users') // We need org list
      // Extract unique organizations from users
      const orgsMap = new Map<string, Organization>()
      for (const u of usersData) {
        if (u.organization_id && u.organization_name) {
          orgsMap.set(u.organization_id, {
            id: u.organization_id,
            name: u.organization_name,
            type: u.organization_type ?? 'client',
          })
        }
      }
      setOrganizations([...orgsMap.values()])
    } catch {
      setError('Failed to load users. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Filter users client-side
  const filtered = users.filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    const searchLower = search.toLowerCase()
    const matchesSearch =
      !search ||
      u.email.toLowerCase().includes(searchLower) ||
      (u.full_name && u.full_name.toLowerCase().includes(searchLower)) ||
      (u.company_name && u.company_name.toLowerCase().includes(searchLower))
    return matchesRole && matchesSearch
  })

  const handleEditSave = async (data: Partial<UserRecord>) => {
    if (!editTarget) return
    try {
      const res = await fetch(`/api/admin/users/${editTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update')
      toast.success('User updated successfully')
      setEditTarget(null)
      await fetchUsers()
    } catch {
      toast.error('Failed to update user. Please try again.')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('User deleted')
      setDeleteTarget(null)
      await fetchUsers()
    } catch {
      toast.error('Failed to delete user. Please try again.')
    }
  }

  const handleAddUser = async (data: {
    email: string
    full_name: string
    role: 'client' | 'agency_admin'
    organization_id: string
  }) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create')
      toast.success('User created successfully')
      setShowAddModal(false)
      await fetchUsers()
    } catch {
      toast.error('Failed to create user. Please try again.')
    }
  }

  const roleFilterOptions: { value: RoleFilter; label: string }[] = [
    { value: 'all', label: 'All Users' },
    { value: 'client', label: 'Clients' },
    { value: 'agency_admin', label: 'Agency Admins' },
  ]

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">User Management</h2>
          <p className="text-[#94A3B8] text-sm mt-1">
            Manage all portal users and their permissions
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-[#2D7FF9] hover:bg-[#2070e0] px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4A5568]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or company..."
            className="w-full rounded-lg border border-[#2A3040] bg-[#141920] pl-9 pr-4 py-2 text-sm text-white placeholder-[#4A5568] focus:border-[#2D7FF9] focus:outline-none"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
          className="rounded-lg border border-[#2A3040] bg-[#141920] px-3 py-2 text-sm text-white focus:border-[#2D7FF9] focus:outline-none"
        >
          {roleFilterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-52 rounded-xl border border-[#2A3040] bg-[#141920]" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center min-h-48 gap-3">
          <p className="text-[#EF4444] text-sm">{error}</p>
          <button onClick={fetchUsers} className="text-xs text-[#2D7FF9] hover:underline">
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-48 rounded-xl border border-dashed border-[#2A3040] bg-[#141920]/50">
          <Users className="h-10 w-10 text-[#4A5568] mb-3" />
          <p className="text-sm font-medium text-white">
            {search || roleFilter !== 'all' ? 'No users match your filters' : 'No users yet'}
          </p>
          <p className="text-xs text-[#94A3B8] mt-1">
            {search || roleFilter !== 'all' ? 'Try adjusting your search or filter' : 'Add users to get started'}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-[#4A5568]">
            Showing {filtered.length} of {users.length} user{users.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onEdit={setEditTarget}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        </>
      )}

      {/* Modals */}
      {editTarget && (
        <EditUserModal
          user={editTarget}
          onSave={handleEditSave}
          onClose={() => setEditTarget(null)}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          user={deleteTarget}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {showAddModal && (
        <AddUserModal
          organizations={organizations}
          onAdd={handleAddUser}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}
