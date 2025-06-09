
'use server';

import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import {
  TeamMemberSchema,
  CreateTeamMemberInputSchema,
  type TeamMember,
  type CreateTeamMemberInput,
  type UpdateTeamMemberInput,
} from '@/lib/schemas/team-member-schemas';
import { revalidatePath } from 'next/cache';

const teamMembersFilePath = path.join(process.cwd(), 'data', 'team_members.json');

async function getTeamMembersInternal(): Promise<TeamMember[]> {
  try {
    await fs.mkdir(path.dirname(teamMembersFilePath), { recursive: true });
    const data = await fs.readFile(teamMembersFilePath, 'utf-8');
    const items = JSON.parse(data) as unknown[];
    const parsedItems = z.array(TeamMemberSchema).parse(items);
    // Sort by joiningDate ascending (oldest first), then by createdAt as a fallback
    parsedItems.sort((a, b) => {
      const dateA = a.joiningDate ? new Date(a.joiningDate).getTime() : new Date(a.createdAt).getTime();
      const dateB = b.joiningDate ? new Date(b.joiningDate).getTime() : new Date(b.createdAt).getTime();
      return dateA - dateB;
    });
    return parsedItems;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(teamMembersFilePath, JSON.stringify([]), 'utf-8');
      return [];
    }
    console.error("Error reading team members file:", error);
    throw new Error('Could not read team member data.');
  }
}

async function saveTeamMembers(items: TeamMember[]): Promise<void> {
  try {
    await fs.mkdir(path.dirname(teamMembersFilePath), { recursive: true });
    await fs.writeFile(teamMembersFilePath, JSON.stringify(items, null, 2), 'utf-8');
  } catch (error) {
    console.error("Error writing team members file:", error);
    throw new Error('Could not save team member data.');
  }
}

export async function getTeamMembers(): Promise<{ members?: TeamMember[]; error?: string }> {
  try {
    let members = await getTeamMembersInternal();
    return { members };
  } catch (error: any) {
    return { error: error.message || "Failed to fetch team members." };
  }
}

export async function addTeamMember(data: CreateTeamMemberInput): Promise<{ success: boolean; member?: TeamMember; error?: string; errors?: z.ZodIssue[] }> {
  const validation = CreateTeamMemberInputSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: "Invalid data provided.", errors: validation.error.issues };
  }
  
  try {
    const members = await getTeamMembersInternal();
    const now = new Date().toISOString();
    const newMember: TeamMember = {
      ...validation.data,
      id: crypto.randomUUID(),
      joiningDate: validation.data.joiningDate || now, // Default joiningDate to now if not provided
      createdAt: now,
      updatedAt: now,
    };
    
    members.push(newMember);
    await saveTeamMembers(members); // This will save them unsorted, but getTeamMembersInternal will sort on read
    revalidatePath('/admin/dashboard/team');
    revalidatePath('/company'); 
    return { success: true, member: newMember };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to add team member." };
  }
}

export async function getTeamMemberById(id: string): Promise<{ member?: TeamMember; error?: string }> {
  try {
    const members = await getTeamMembersInternal(); // Already sorted
    const member = members.find(p => p.id === id);
    if (!member) {
      return { error: "Team member not found." };
    }
    return { member };
  } catch (error: any) {
    return { error: error.message || "Failed to fetch team member." };
  }
}

export async function updateTeamMember(id: string, data: UpdateTeamMemberInput): Promise<{ success: boolean; member?: TeamMember; error?: string, errors?: z.ZodIssue[] }> {
  // Use CreateTeamMemberInputSchema for full validation on update, as partial doesn't enforce min lengths on existing fields if they are changed.
  // Or, create a specific Update schema that re-validates existing fields if present.
  // For now, we'll use Create... and rely on the form sending all fields or the .partial() for UpdateTeamMemberInput type.
  // Let's make a more specific update validation
   const validation = CreateTeamMemberInputSchema.partial().safeParse(data);
   if (!validation.success) {
    return { success: false, error: "Invalid data provided for update.", errors: validation.error.issues };
  }

  try {
    let members = await getTeamMembersInternal();
    const memberIndex = members.findIndex(p => p.id === id);

    if (memberIndex === -1) {
      return { success: false, error: "Team member not found." };
    }
    
    const originalMember = members[memberIndex];
    const updatedMemberData: TeamMember = {
      ...originalMember, 
      ...validation.data, 
      joiningDate: validation.data.joiningDate !== undefined ? validation.data.joiningDate : originalMember.joiningDate,
      updatedAt: new Date().toISOString(), 
    };
    
    members[memberIndex] = updatedMemberData;
    await saveTeamMembers(members); // Save unsorted, sort on read
    revalidatePath('/admin/dashboard/team');
    revalidatePath(`/admin/dashboard/team/edit/${id}`);
    revalidatePath('/company');
    return { success: true, member: updatedMemberData };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update team member." };
  }
}

export async function deleteTeamMember(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    let members = await getTeamMembersInternal();
    const memberToDelete = members.find(p => p.id === id);
    if (!memberToDelete) {
      return { success: false, error: "Team member not found for deletion." };
    }

    const filteredMembers = members.filter(p => p.id !== id);
    await saveTeamMembers(filteredMembers);

    revalidatePath('/admin/dashboard/team');
    revalidatePath('/company'); 
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete team member." };
  }
}
