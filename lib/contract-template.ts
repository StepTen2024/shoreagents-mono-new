/**
 * Contract Template Generator
 * Generates HTML contract content from EmploymentContract data
 */

interface ContractData {
  employeeName: string
  employeeAddress: string
  contactType: string
  assignedClient: string
  position: string
  startDate: Date | string
  work_schedules: string
  basicSalary: number
  deMinimis: number
  totalMonthlyGross: number
  hmoOffer: string
  paidLeave: string
  probationaryPeriod: string
  company?: {
    companyName: string
  }
}

export function generateContractHTML(contractData: ContractData): string {
  const startDate = typeof contractData.startDate === 'string' 
    ? new Date(contractData.startDate) 
    : contractData.startDate

  const formattedDate = startDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return `
    <div class="contract-content prose prose-invert max-w-none">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold mb-2">PROJECT EMPLOYMENT CONTRACT</h1>
        <p class="text-slate-400">ShoreAgents</p>
      </div>

      <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4 text-purple-400">SECTION 1: PARTIES TO THE CONTRACT</h2>
        <div class="space-y-3 text-slate-300">
          <p><strong>This Project Employment Contract</strong> is made and entered into on <strong>${formattedDate}</strong> by and between:</p>
          
          <div class="ml-6 space-y-2">
            <p><strong>SHOREAGENTS</strong> (the "Employer"), a business process outsourcing company duly organized and existing under the laws of the Philippines, with principal office address at [Company Address];</p>
            
            <p>- and -</p>
            
            <p><strong>${contractData.employeeName.toUpperCase()}</strong> (the "Employee"), of legal age, Filipino, and with address at <strong>${contractData.employeeAddress}</strong>.</p>
          </div>
          
          <p class="mt-4">The Employer and Employee are collectively referred to as the "Parties" and individually as a "Party."</p>
        </div>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4 text-purple-400">SECTION 2: NATURE OF EMPLOYMENT</h2>
        <div class="space-y-3 text-slate-300">
          <p>The Employee is hereby employed under a <strong>${contractData.contactType}</strong> arrangement for the following client:</p>
          
          <div class="ml-6 space-y-2 mt-3">
            <p><strong>Client:</strong> ${contractData.assignedClient}</p>
            <p><strong>Position:</strong> ${contractData.position}</p>
            <p><strong>Start Date:</strong> ${formattedDate}</p>
            <p><strong>Work Schedule:</strong> ${contractData.work_schedules}</p>
          </div>
          
          <p class="mt-4">The employment shall commence on the Start Date specified above and shall continue for the duration of the project or as otherwise specified by the Employer and the Client.</p>
          
          <p class="mt-3"><strong>Probationary Period:</strong> The Employee shall undergo a probationary period of <strong>${contractData.probationaryPeriod}</strong> from the Start Date. During this period, the Employer shall evaluate the Employee's performance, and either Party may terminate the employment with or without cause and with or without notice.</p>
        </div>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4 text-purple-400">SECTION 3: DUTIES AND RESPONSIBILITIES</h2>
        <div class="space-y-3 text-slate-300">
          <p>The Employee agrees to perform the following duties and responsibilities, as well as other tasks that may be assigned from time to time:</p>
          
          <ul class="list-disc ml-8 space-y-2 mt-3">
            <li>Perform all duties associated with the position of <strong>${contractData.position}</strong> as directed by the Client and/or the Employer.</li>
            <li>Comply with all company policies, procedures, and guidelines as set forth by ShoreAgents and the assigned Client.</li>
            <li>Maintain confidentiality of all proprietary and sensitive information encountered during the course of employment.</li>
            <li>Adhere to the work schedule and maintain punctuality and reliability.</li>
            <li>Communicate effectively with supervisors, colleagues, and clients as required.</li>
            <li>Participate in training sessions, meetings, and other company activities as directed.</li>
            <li>Report any issues, concerns, or incidents to management promptly.</li>
            <li>Maintain professional conduct and represent the company in a positive manner at all times.</li>
          </ul>
          
          <p class="mt-4">The Employee acknowledges that the duties and responsibilities outlined above are not exhaustive and may be modified or supplemented by the Employer or Client as business needs require.</p>
        </div>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4 text-purple-400">SECTION 4: COMPENSATION AND BENEFITS</h2>
        <div class="space-y-3 text-slate-300">
          <p>In consideration for the services rendered by the Employee, the Employer agrees to provide the following compensation and benefits:</p>
          
          <div class="ml-6 mt-4">
            <h3 class="text-lg font-semibold mb-3 text-purple-300">4.1 Monthly Compensation</h3>
            <table class="w-full border border-slate-600 mb-4">
              <tbody>
                <tr class="border-b border-slate-600">
                  <td class="p-3 font-semibold bg-slate-800">Basic Salary</td>
                  <td class="p-3 text-right">PHP ${contractData.basicSalary.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                <tr class="border-b border-slate-600">
                  <td class="p-3 font-semibold bg-slate-800">De Minimis Benefits</td>
                  <td class="p-3 text-right">PHP ${contractData.deMinimis.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                <tr class="bg-purple-900/30">
                  <td class="p-3 font-bold">Total Monthly Gross</td>
                  <td class="p-3 text-right font-bold">PHP ${contractData.totalMonthlyGross.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
            
            <p class="text-sm text-slate-400 mb-4">Salary shall be paid on a semi-monthly basis via bank deposit to the Employee's designated bank account. Mandatory deductions including withholding tax, SSS, PhilHealth, and Pag-IBIG contributions shall be made in accordance with Philippine law.</p>
          </div>
          
          <div class="ml-6 mt-4">
            <h3 class="text-lg font-semibold mb-3 text-purple-300">4.2 Health Maintenance Organization (HMO)</h3>
            <p>${contractData.hmoOffer}</p>
          </div>
          
          <div class="ml-6 mt-4">
            <h3 class="text-lg font-semibold mb-3 text-purple-300">4.3 Paid Leave</h3>
            <p>${contractData.paidLeave}</p>
          </div>
          
          <div class="ml-6 mt-4">
            <h3 class="text-lg font-semibold mb-3 text-purple-300">4.4 Government-Mandated Benefits</h3>
            <p>The Employee shall be entitled to all benefits mandated by Philippine labor laws, including but not limited to:</p>
            <ul class="list-disc ml-6 mt-2 space-y-1">
              <li>Social Security System (SSS) coverage</li>
              <li>PhilHealth coverage</li>
              <li>Pag-IBIG Fund coverage</li>
              <li>13th Month Pay</li>
              <li>Service Incentive Leave (as applicable)</li>
            </ul>
          </div>
        </div>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4 text-purple-400">SECTION 5: CONFIDENTIALITY AND DATA PROTECTION</h2>
        <div class="space-y-3 text-slate-300">
          <p>The Employee acknowledges that during the course of employment, they may have access to confidential and proprietary information belonging to ShoreAgents and/or the assigned Client. The Employee agrees to:</p>
          
          <ul class="list-disc ml-8 space-y-2 mt-3">
            <li>Maintain strict confidentiality of all proprietary information, trade secrets, client data, and business strategies.</li>
            <li>Not disclose any confidential information to third parties without prior written authorization from the Employer.</li>
            <li>Use confidential information solely for the purpose of performing assigned duties.</li>
            <li>Return all company property, documents, and data upon termination of employment.</li>
            <li>Comply with all applicable data privacy laws, including the Data Privacy Act of 2012 (Republic Act No. 10173).</li>
          </ul>
          
          <p class="mt-4">This confidentiality obligation shall survive the termination of this Contract and shall remain in effect indefinitely.</p>
        </div>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4 text-purple-400">SECTION 6: TERMINATION</h2>
        <div class="space-y-3 text-slate-300">
          <h3 class="text-lg font-semibold mb-2 text-purple-300">6.1 Termination by Employer</h3>
          <p>The Employer may terminate this Contract for just or authorized causes as provided under the Labor Code of the Philippines, including but not limited to:</p>
          <ul class="list-disc ml-8 space-y-1 mt-2">
            <li>Serious misconduct or willful disobedience</li>
            <li>Gross and habitual neglect of duties</li>
            <li>Fraud or breach of trust</li>
            <li>Commission of a crime against the Employer or Client</li>
            <li>Completion or termination of the project</li>
            <li>Redundancy or retrenchment</li>
          </ul>
          
          <h3 class="text-lg font-semibold mb-2 mt-4 text-purple-300">6.2 Termination by Employee</h3>
          <p>The Employee may terminate this Contract by giving at least thirty (30) days written notice to the Employer.</p>
          
          <h3 class="text-lg font-semibold mb-2 mt-4 text-purple-300">6.3 Clearance and Final Pay</h3>
          <p>Upon termination, the Employee must complete the clearance process and return all company property. Final pay, including unused leave credits and other benefits due, shall be released in accordance with company policy and applicable laws.</p>
        </div>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4 text-purple-400">SECTION 7: GENERAL PROVISIONS</h2>
        <div class="space-y-3 text-slate-300">
          <p><strong>7.1 Governing Law:</strong> This Contract shall be governed by and construed in accordance with the laws of the Republic of the Philippines.</p>
          
          <p><strong>7.2 Dispute Resolution:</strong> Any disputes arising from this Contract shall be resolved through amicable settlement. If no settlement is reached, the dispute shall be submitted to the appropriate labor tribunal.</p>
          
          <p><strong>7.3 Amendments:</strong> Any amendments or modifications to this Contract must be made in writing and signed by both Parties.</p>
          
          <p><strong>7.4 Entire Agreement:</strong> This Contract constitutes the entire agreement between the Parties and supersedes all prior discussions, agreements, or understandings, whether written or oral.</p>
          
          <p><strong>7.5 Severability:</strong> If any provision of this Contract is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.</p>
        </div>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4 text-purple-400">ACKNOWLEDGMENT</h2>
        <div class="space-y-4 text-slate-300">
          <p>By signing below, the Employee acknowledges that they have read, understood, and agree to all the terms and conditions set forth in this Project Employment Contract.</p>
          
          <p>The Employee further acknowledges that they have received a copy of the ShoreAgents Staff Handbook and agree to comply with all company policies and procedures contained therein.</p>
          
          <div class="mt-8 pt-8 border-t border-slate-600">
            <p class="text-center text-slate-400 italic">
              [Digital signature will be affixed upon completion of contract signing process]
            </p>
          </div>
        </div>
      </section>
    </div>
  `
}

/**
 * Generate contract sections for checkbox display
 */
export const contractSections = [
  {
    id: 1,
    title: "Parties to the Contract",
    description: "Introduction and identification of Employer and Employee"
  },
  {
    id: 2,
    title: "Nature of Employment",
    description: "Employment type, position, schedule, and probationary period"
  },
  {
    id: 3,
    title: "Duties and Responsibilities",
    description: "Expected duties and professional obligations"
  },
  {
    id: 4,
    title: "Compensation and Benefits",
    description: "Salary, allowances, HMO, leave, and government benefits"
  },
  {
    id: 5,
    title: "Confidentiality and Data Protection",
    description: "Confidentiality obligations and data privacy compliance"
  },
  {
    id: 6,
    title: "Termination",
    description: "Conditions and procedures for employment termination"
  },
  {
    id: 7,
    title: "General Provisions",
    description: "Governing law, dispute resolution, and other legal provisions"
  }
]

/**
 * Get contract section count
 */
export function getContractSectionCount(): number {
  return contractSections.length
}

