// =====================================================
// AdCure Portal - Database Types
// Auto-generated structure matching Supabase schema
// =====================================================

export interface Database {
  public: {
    Tables: {
      account_applications: {
        Row: {
          id: string
          company_name: string
          kvk_number: string
          vat_number: string
          iban: string | null
          full_name: string
          email: string
          phone: string
          status: 'pending' | 'approved' | 'rejected'
          reviewed_by: string | null
          reviewed_at: string | null
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_name: string
          kvk_number: string
          vat_number: string
          iban?: string | null
          full_name: string
          email: string
          phone: string
          status?: 'pending' | 'approved' | 'rejected'
          reviewed_by?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_name?: string
          kvk_number?: string
          vat_number?: string
          iban?: string | null
          full_name?: string
          email?: string
          phone?: string
          status?: 'pending' | 'approved' | 'rejected'
          reviewed_by?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          id: string
          name: string
          type: 'client' | 'agency'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'client' | 'agency'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'client' | 'agency'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          organization_id: string
          email: string
          full_name: string | null
          phone: string | null
          company_name: string | null
          role: 'client' | 'agency_admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id: string
          email: string
          full_name?: string | null
          phone?: string | null
          company_name?: string | null
          role: 'client' | 'agency_admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          company_name?: string | null
          role?: 'client' | 'agency_admin'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          id: string
          organization_id: string
          balance_cents: number
          currency: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          balance_cents?: number
          currency?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          balance_cents?: number
          currency?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ad_accounts: {
        Row: {
          id: string
          organization_id: string
          name: string
          account_id: string
          platform: 'meta' | 'google' | 'tiktok'
          currency: string
          timezone: string
          fee_percentage: number
          status: 'active' | 'disabled'
          balance_cents: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          account_id: string
          platform: 'meta' | 'google' | 'tiktok'
          currency?: string
          timezone?: string
          fee_percentage: number
          status?: 'active' | 'disabled'
          balance_cents?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          account_id?: string
          platform?: 'meta' | 'google' | 'tiktok'
          currency?: string
          timezone?: string
          fee_percentage?: number
          status?: 'active' | 'disabled'
          balance_cents?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          id: string
          wallet_id: string
          type: 'top_up' | 'transfer' | 'refund' | 'adjustment'
          amount_cents: number
          status: 'pending' | 'completed' | 'rejected'
          reference: string | null
          proof_url: string | null
          notes: string | null
          ad_account_id: string | null
          created_by: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          wallet_id: string
          type: 'top_up' | 'transfer' | 'refund' | 'adjustment'
          amount_cents: number
          status?: 'pending' | 'completed' | 'rejected'
          reference?: string | null
          proof_url?: string | null
          notes?: string | null
          ad_account_id?: string | null
          created_by?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          wallet_id?: string
          type?: 'top_up' | 'transfer' | 'refund' | 'adjustment'
          amount_cents?: number
          status?: 'pending' | 'completed' | 'rejected'
          reference?: string | null
          proof_url?: string | null
          notes?: string | null
          ad_account_id?: string | null
          created_by?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ad_account_requests: {
        Row: {
          id: string
          organization_id: string
          account_name: string
          domain_name: string
          business_manager_id: string
          currency: string
          timezone: string
          platform: 'meta' | 'google' | 'tiktok'
          status: 'pending' | 'approved' | 'rejected'
          reviewed_by: string | null
          reviewed_at: string | null
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          account_name: string
          domain_name: string
          business_manager_id: string
          currency?: string
          timezone?: string
          platform?: 'meta' | 'google' | 'tiktok'
          status?: 'pending' | 'approved' | 'rejected'
          reviewed_by?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          account_name?: string
          domain_name?: string
          business_manager_id?: string
          currency?: string
          timezone?: string
          platform?: 'meta' | 'google' | 'tiktok'
          status?: 'pending' | 'approved' | 'rejected'
          reviewed_by?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          id: string
          organization_id: string
          transaction_id: string
          invoice_number: string
          moneybird_id: string | null
          amount_cents: number
          vat_cents: number
          total_cents: number
          status: 'created' | 'sent' | 'paid'
          pdf_url: string | null
          sent_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          transaction_id: string
          invoice_number: string
          moneybird_id?: string | null
          amount_cents: number
          vat_cents: number
          total_cents: number
          status?: 'created' | 'sent' | 'paid'
          pdf_url?: string | null
          sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          transaction_id?: string
          invoice_number?: string
          moneybird_id?: string | null
          amount_cents?: number
          vat_cents?: number
          total_cents?: number
          status?: 'created' | 'sent' | 'paid'
          pdf_url?: string | null
          sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      user_organization_id: {
        Args: Record<string, never>
        Returns: string
      }
      user_role: {
        Args: Record<string, never>
        Returns: string
      }
    }
  }
}

// =====================================================
// App-level types (business logic layer)
// =====================================================

export type UserRole = 'client' | 'agency_admin'

export type Platform = 'meta' | 'google' | 'tiktok'

export type TransactionType = 'top_up' | 'transfer' | 'refund' | 'adjustment'

export type TransactionStatus = 'pending' | 'completed' | 'rejected'

export type RequestStatus = 'pending' | 'approved' | 'rejected'

export type InvoiceStatus = 'created' | 'sent' | 'paid'

export interface AppUser {
  id: string
  email: string
  fullName: string | null
  phone: string | null
  companyName: string | null
  role: UserRole
  organizationId: string
}

export interface WalletBalance {
  id: string
  balance: number        // In euros (converted from cents)
  balanceCents: number   // Raw cents value
  currency: string
  organizationId: string
}

export interface AdAccount {
  id: string
  name: string
  accountId: string
  platform: Platform
  currency: string
  timezone: string
  feePercentage: number  // Variable per account (e.g., 5.00 for 5%)
  status: 'active' | 'disabled'
  balance: number        // In euros
  balanceCents: number
  organizationId: string
}

/**
 * Fee calculation for ad account top-ups
 * VAT (21%) applies ONLY to the fee, NOT the ad amount
 * Wallet top-ups have NO fee
 */
export interface FeeCalculation {
  adAmount: number       // Amount to top up (euros)
  feePercentage: number  // e.g., 5.00 for 5%
  fee: number            // adAmount * (feePercentage / 100)
  vat: number            // fee * 0.21
  total: number          // adAmount + fee + vat
}

export interface Transaction {
  id: string
  walletId: string
  type: TransactionType
  amount: number         // In euros
  amountCents: number
  status: TransactionStatus
  reference: string | null
  proofUrl: string | null
  notes: string | null
  adAccountId: string | null
  createdBy: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string
}

export interface AdAccountRequest {
  id: string
  organizationId: string
  accountName: string
  domainName: string
  businessManagerId: string
  currency: string
  timezone: string
  platform: Platform
  status: RequestStatus
  reviewedBy: string | null
  reviewedAt: string | null
  rejectionReason: string | null
  createdAt: string
}

export interface Invoice {
  id: string
  organizationId: string
  transactionId: string
  invoiceNumber: string
  moneybirdId: string | null
  amount: number
  vat: number
  total: number
  status: InvoiceStatus
  pdfUrl: string | null
  sentAt: string | null
  createdAt: string
}
