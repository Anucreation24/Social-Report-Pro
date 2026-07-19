import { createClient } from './supabase/server'

export type CompanyRole = 'owner' | 'admin' | 'marketing_manager' | 'viewer'

export interface UserPermission {
  userId: string
  companyId: string
  role: CompanyRole
}

/**
 * Checks if the current authenticated user has one of the allowed roles for a given company.
 * Enforces security rules server-side.
 */
export async function verifyCompanyPermission(
  companyId: string,
  allowedRoles: CompanyRole[]
): Promise<{ authorized: boolean; role?: CompanyRole; error?: string }> {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { authorized: false, error: 'Unauthenticated session.' }
  }

  // Fetch the membership record
  const { data: member, error: memberError } = await supabase
    .from('company_members')
    .select('role')
    .eq('company_id', companyId)
    .eq('user_id', user.id)
    .single()

  if (memberError || !member) {
    return { authorized: false, error: 'User is not a member of this company.' }
  }

  const authorized = allowedRoles.includes(member.role as CompanyRole)
  return { 
    authorized, 
    role: member.role as CompanyRole,
    error: authorized ? undefined : 'Insufficient role permissions for this action.'
  }
}
