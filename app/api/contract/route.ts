import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import crypto from "crypto";

// Helper function to retry Prisma queries
async function retryQuery<T>(queryFn: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await queryFn()
    } catch (error) {
      console.error(`[CONTRACT] Query attempt ${i + 1}/${retries} failed:`, error)
      if (i === retries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i))) // 1s, 2s, 4s
    }
  }
  throw new Error('Retry limit exceeded')
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const staffUser = await retryQuery(() => prisma.staff_users.findUnique({
      where: { authUserId: session.user.id },
      include: {
        job_acceptances: {
          include: {
            company: true,
            interview_requests: true
          }
        },
        company: true
      }
    }));

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 });
    }

    // Get staff profile for contact details
    const staffProfile = await retryQuery(() => prisma.staff_profiles.findUnique({
      where: { staffUserId: staffUser.id }
    }));

    let contract = await retryQuery(() => prisma.employment_contracts.findUnique({
      where: { staffUserId: staffUser.id },
      include: {
        company: {
          select: { companyName: true }
        }
      }
    }));

    // Auto-create contract if none exists and staff has job acceptance
    if (!contract && staffUser.job_acceptances && staffUser.companyId) {
      console.log('📄 [CONTRACT] Auto-creating contract from job acceptance for:', staffUser.name);
      
      const jobAcceptance = staffUser.job_acceptances;
      const company = staffUser.company || jobAcceptance.company;
      
      // Get staff profile for address
      const staffProfile = await retryQuery(() => prisma.staff_profiles.findUnique({
        where: { staffUserId: staffUser.id }
      }));
      
      // Calculate salary breakdown
      const totalSalary = jobAcceptance.salary ? parseFloat(jobAcceptance.salary) : 25000;
      const deMinimis = 4000; // Fixed de minimis (government mandate)
      const basicSalary = totalSalary - deMinimis;
      
      // Build work schedule from job acceptance data
      let workSchedule = "";
      
      // Use workDays array if available, otherwise fallback to "Monday-Friday"
      if (jobAcceptance.workDays && jobAcceptance.workDays.length > 0) {
        if (jobAcceptance.workDays.length === 5 && 
            ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].every(day => jobAcceptance.workDays.includes(day))) {
          workSchedule = "Monday-Friday";
        } else {
          workSchedule = jobAcceptance.workDays.join(', ');
        }
      } else {
        workSchedule = "Monday-Friday";
      }
      
      // Add work hours - check for custom hours first
      if (jobAcceptance.hasCustomHours && jobAcceptance.customHours) {
        // Display custom hours for each day
        const customHoursObj = jobAcceptance.customHours as Record<string, string>;
        const customHoursText = Object.entries(customHoursObj).map(([day, time]) => {
          const [hours, minutes] = time.split(':').map(Number);
          const endHour = (hours + 9) % 24;
          const endTime = `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          return `${day}: ${time}-${endTime}`;
        }).join(', ');
        workSchedule += `, ${customHoursText}`;
      } else if (jobAcceptance.workStartTime && jobAcceptance.workEndTime) {
        // Use uniform start/end times
        workSchedule += `, ${jobAcceptance.workStartTime} - ${jobAcceptance.workEndTime}`;
      } else if (jobAcceptance.workHours) {
        workSchedule += `, ${jobAcceptance.workHours}`;
      } else if (jobAcceptance.shiftType) {
        // Fallback to shift type
        const shiftMap: Record<string, string> = {
          'DAY_SHIFT': '9:00 AM - 5:00 PM',
          'NIGHT_SHIFT': '9:00 PM - 5:00 AM',
          'MID_SHIFT': '3:00 PM - 11:00 PM'
        };
        workSchedule += `, ${shiftMap[jobAcceptance.shiftType] || '9:00 AM - 5:00 PM'}`;
      } else {
        workSchedule += ', 9:00 AM - 5:00 PM';
      }
      
      // Add timezone if available
      if (jobAcceptance.clientTimezone) {
        const tzDisplayMap: Record<string, string> = {
          'Australia/Brisbane': 'Brisbane Time (AEST)',
          'America/New_York': 'Eastern Time (EST)',
          'Europe/London': 'London Time (GMT)'
        };
        const tzDisplay = tzDisplayMap[jobAcceptance.clientTimezone] || jobAcceptance.clientTimezone;
        workSchedule += ` (${tzDisplay})`;
      }
      
      // HMO offer text
      const hmoText = jobAcceptance.hmoIncluded 
        ? "HMO coverage included from day 1" 
        : "HMO coverage after probation";
      
      // Leave credits
      const leaveCredits = jobAcceptance.leaveCredits || 12;
      const leaveText = `${leaveCredits} days annual leave (after probation)`;
      
      // Default contract values (can be customized by admin later)
      contract = await prisma.employment_contracts.create({
        data: {
          id: crypto.randomUUID(),
          staffUserId: staffUser.id,
          companyId: staffUser.companyId,
          jobAcceptanceId: jobAcceptance.id,
          employeeName: staffUser.name,
          employeeAddress: staffProfile?.location || "To be provided",
          contactType: jobAcceptance.workLocation === 'WORK_FROM_HOME' ? 'REMOTE' : 'FULL_TIME',
          position: jobAcceptance.position || "Staff Member",
          assignedClient: company?.companyName || "To be assigned",
          startDate: jobAcceptance.preferredStartDate || jobAcceptance.interview_requests?.finalStartDate || new Date(),
          workSchedule: workSchedule,
          basicSalary: basicSalary,
          deMinimis: deMinimis,
          totalMonthlyGross: totalSalary,
          hmoOffer: hmoText,
          paidLeave: leaveText,
          probationaryPeriod: "6 months",
          signed: false,
          fullyInitialed: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          company: {
            select: { companyName: true }
          }
        }
      });
      
      console.log('✅ [CONTRACT] Contract auto-created:', contract.id);
      console.log('💰 [CONTRACT] Salary breakdown:', {
        total: totalSalary,
        basic: basicSalary,
        deMinimis: deMinimis,
        hmo: jobAcceptance.hmoIncluded,
        leave: leaveCredits
      });
    }

    if (!contract) {
      return NextResponse.json({ error: "No contract found and no job acceptance to create from" }, { status: 404 });
    }

    // Add contact details to response
    const contractWithDetails = {
      ...contract,
      staffEmail: staffUser.email,
      staffPhone: staffProfile?.phone || null,
      staffLocation: contract.employeeAddress
    };

    console.log('📧 [CONTRACT API] Contact details:', {
      email: staffUser.email,
      phone: staffProfile?.phone,
      address: contract.employeeAddress,
      staffProfileExists: !!staffProfile
    });

    if (contract.signed) {
      return NextResponse.json({ 
        success: true, 
        contract: contractWithDetails, 
        message: "Contract already signed" 
      }, { status: 200 });
    }

    return NextResponse.json({ success: true, contract: contractWithDetails }, { status: 200 });
  } catch (error) {
    console.error("Error fetching employment contract:", error);
    return NextResponse.json({ error: "Failed to fetch employment contract" }, { status: 500 });
  }
}
