# Feature Specification: Client Detail View

*OpenCode Implementation Guide - Client Overview & Management*  
Generated: April 13, 2026

---

## 🎯 Feature Overview

### Goal
Provide admins with a comprehensive client overview showing profile, stats, ad accounts, and management actions. This is a VIEW page, not a "Create User" page.

### Success Criteria
- [ ] Client profile displayed with avatar + stats
- [ ] Contact info editable (name/phone/email only)
- [ ] KVK/VAT immutable (cannot be changed)
- [ ] Stats cards show accurate data
- [ ] Ad accounts list visible
- [ ] Deactivate/Delete actions work

---

## 🎨 Design (From Screenshot)

```
┌───────────────────────────────────────────────────┐
│ [J] Jessy Pinas              [Deactivate] [Edit]  │
│     active · email@domain.com           [Delete]  │
├───────────────────────────────────────────────────┤
│ Stats: [1 Active] [€235] [€0 Top-Ups] [0 Convos] │
├───────────────────────────────────────────────────┤
│ Client Information:                               │
│ Email | Phone | Company | Member Since            │
│ KVK | VAT                                          │
├───────────────────────────────────────────────────┤
│ [● Accounts] [○ Notifications] [○ Notes]         │
│                                                    │
│ Ad Account: Indy London (5% fee) €235.00         │
└───────────────────────────────────────────────────┘
```

---

## 🛠️ Implementation

### Editable vs Immutable

**✅ CAN Edit:**
- Full Name
- Phone
- Email

**❌ CANNOT Edit:**
- Company Name (from application)
- KVK Number (legal ID)
- VAT Number (legal ID)

### Edit Modal

```typescript
export function EditClientModal({ client, onClose }) {
  const [formData, setFormData] = useState({
    full_name: client.full_name,
    phone: client.phone,
    email: client.email
  })
  
  return (
    <Modal>
      <form onSubmit={handleSubmit}>
        <Input label="Full Name" value={formData.full_name} />
        <Input label="Phone" value={formData.phone} />
        <Input label="Email" type="email" value={formData.email} />
        
        <Warning>
          ⚠️ Company name, KVK, and VAT cannot be changed
        </Warning>
        
        <Button type="submit">Save Changes</Button>
      </form>
    </Modal>
  )
}
```

### Delete Flow

```typescript
export function DeleteConfirmModal({ clientName, onConfirm }) {
  const [confirmText, setConfirmText] = useState('')
  
  return (
    <Modal>
      <h2>⚠️ Delete Client</h2>
      <p>This will delete:</p>
      <ul>
        <li>All ad accounts</li>
        <li>Wallet & transactions</li>
        <li>Invoices</li>
      </ul>
      <p>Type <code>DELETE</code> to confirm:</p>
      <Input value={confirmText} onChange={setConfirmText} />
      <Button
        onClick={onConfirm}
        disabled={confirmText !== 'DELETE'}
      >
        Delete Permanently
      </Button>
    </Modal>
  )
}
```

---

## ✅ Testing

- [ ] Stats calculate correctly
- [ ] Can edit contact info
- [ ] Cannot edit KVK/VAT
- [ ] Delete requires typing "DELETE"
- [ ] Deactivate works
- [ ] All related data deleted on delete

---

*Client Detail View - Complete Overview!*
