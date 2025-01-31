// copied from Plaid
interface PlaidAccount {
  id: string;
  name: string;
  mask: string;
  type: string;
  subtype: string;
  verification_status: string;
}
interface PlaidInstitution {
  name: string;
  institution_id: string;
}
interface PlaidLinkError {
  error_type: string;
  error_code: string;
  error_message: string;
  display_message: string;
}
export interface PlaidLinkOnSuccessMetadata {
  institution: null | PlaidInstitution;
  accounts: Array<PlaidAccount>;
  link_session_id: string;
  transfer_status?: string;
}
