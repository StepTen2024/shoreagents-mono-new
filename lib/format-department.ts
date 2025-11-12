// Format department enum values to user-friendly strings
export function formatDepartment(dept: string): string {
  const departmentMap: Record<string, string> = {
    'CEO_EXECUTIVE': 'CEO & Executive',
    'IT_DEPARTMENT': 'IT Department',
    'HR_DEPARTMENT': 'HR Department',
    'NURSE_DEPARTMENT': 'Nurse Department',
    'RECRUITMENT_DEPARTMENT': 'Recruitment',
    'ACCOUNT_MANAGEMENT': 'Account Management',
    'FINANCE_DEPARTMENT': 'Finance',
    'NERDS_DEPARTMENT': 'Tech Team',
    'OPERATIONS': 'Operations'
  }
  return departmentMap[dept] || dept
}

