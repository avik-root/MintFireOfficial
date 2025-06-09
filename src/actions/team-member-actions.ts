
'use server';

import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import {
  TeamMemberSchema,
  FormTeamMemberSchema, // Using this for parsing text fields from FormData
  type TeamMember,
} from '@/lib/schemas/team-member-schemas';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

const teamMembersFilePath = path.join(process.cwd(), 'data', 'team_members.json');
const UPLOADS_DIR_NAME = 'uploads';
const TEAM_PHOTOS_DIR_NAME = 'team-photos';
const publicUploadsDir = path.join(process.cwd(), 'public', UPLOADS_DIR_NAME, TEAM_PHOTOS_DIR_NAME);

async function getTeamMembersInternal(): Promise<TeamMember[]> {
  try {
    await fs.mkdir(path.dirname(teamMembersFilePath), { recursive: true });
    const data = await fs.readFile(teamMembersFilePath, 'utf-8');
    const items = JSON.parse(data) as unknown[];
    const parsedItems = z.array(TeamMemberSchema).parse(items);
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

async function handleImageUpload(imageFile: File | null): Promise<string | null> {
  if (!imageFile) return null;

  // Validate file type and size
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(imageFile.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, GIF, WEBP are allowed.');
  }
  const maxSize = 2 * 1024 * 1024; // 2MB
  if (imageFile.size > maxSize) {
    throw new Error('File is too large. Maximum size is 2MB.');
  }

  await fs.mkdir(publicUploadsDir, { recursive: true });
  const fileExtension = path.extname(imageFile.name) || '.png'; // Default to .png if no extension
  const uniqueFilename = `${randomUUID()}${fileExtension}`;
  const filePath = path.join(publicUploadsDir, uniqueFilename);
  
  const buffer = Buffer.from(await imageFile.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  return `/${UPLOADS_DIR_NAME}/${TEAM_PHOTOS_DIR_NAME}/${uniqueFilename}`; // Relative public path
}

export async function getTeamMembers(): Promise<{ members?: TeamMember[]; error?: string }> {
  try {
    let members = await getTeamMembersInternal();
    return { members };
  } catch (error: any) {
    return { error: error.message || "Failed to fetch team members." };
  }
}

// Modified to accept FormData
export async function addTeamMember(formData: FormData): Promise<{ success: boolean; member?: TeamMember; error?: string; errors?: z.ZodIssue[] }> {
  try {
    const rawData: Record<string, any> = {};
    formData.forEach((value, key) => {
      // Handle optional empty strings for URLs specifically for Zod parsing
      if ((key === 'githubUrl' || key === 'linkedinUrl') && value === '') {
        rawData[key] = undefined; // Let Zod handle .optional().or(z.literal(''))
      } else if (key !== 'imageFile') { // Don't put file in rawData for Zod
        rawData[key] = value;
      }
    });

    const validation = FormTeamMemberSchema.safeParse(rawData);
    if (!validation.success) {
      return { success: false, error: "Invalid data provided.", errors: validation.error.issues };
    }
    
    const validatedData = validation.data;
    const imageFile = formData.get('imageFile') as File | null;
    let imageUrl: string | null = null;

    if (imageFile) {
      imageUrl = await handleImageUpload(imageFile);
    }

    const members = await getTeamMembersInternal();
    const now = new Date().toISOString();
    const newMember: TeamMember = {
      id: randomUUID(),
      name: validatedData.name,
      role: validatedData.role,
      description: validatedData.description,
      email: validatedData.email,
      githubUrl: validatedData.githubUrl || "",
      linkedinUrl: validatedData.linkedinUrl || "",
      joiningDate: validatedData.joiningDate || now,
      imageUrl: imageUrl || "", // Use uploaded image path or empty string
      createdAt: now,
      updatedAt: now,
    };
    
    members.push(newMember);
    await saveTeamMembers(members);
    revalidatePath('/admin/dashboard/team');
    revalidatePath('/company'); 
    return { success: true, member: newMember };
  } catch (error: any) {
    console.error("Add team member error:", error);
    return { success: false, error: error.message || "Failed to add team member." };
  }
}

export async function getTeamMemberById(id: string): Promise<{ member?: TeamMember; error?: string }> {
  try {
    const members = await getTeamMembersInternal();
    const member = members.find(p => p.id === id);
    if (!member) {
      return { error: "Team member not found." };
    }
    return { member };
  } catch (error: any) {
    return { error: error.message || "Failed to fetch team member." };
  }
}

// Modified to accept FormData and memberId
export async function updateTeamMember(id: string, formData: FormData): Promise<{ success: boolean; member?: TeamMember; error?: string, errors?: z.ZodIssue[] }> {
  try {
    const rawData: Record<string, any> = {};
     formData.forEach((value, key) => {
      if ((key === 'githubUrl' || key === 'linkedinUrl') && value === '') {
        rawData[key] = undefined; 
      } else if (key !== 'imageFile' && key !== 'existingImageUrl') {
        rawData[key] = value;
      }
    });

    const validation = FormTeamMemberSchema.partial().safeParse(rawData); // Use partial for update
    if (!validation.success) {
      return { success: false, error: "Invalid data provided for update.", errors: validation.error.issues };
    }
    
    const validatedData = validation.data;
    let members = await getTeamMembersInternal();
    const memberIndex = members.findIndex(p => p.id === id);

    if (memberIndex === -1) {
      return { success: false, error: "Team member not found." };
    }
    
    const originalMember = members[memberIndex];
    let imageUrlToSave = originalMember.imageUrl; // Default to existing
    const imageFile = formData.get('imageFile') as File | null;
    const existingImageUrlFromForm = formData.get('existingImageUrl') as string | null;


    if (imageFile) {
      // Optionally: delete old image if it exists and is different
      // For simplicity, not deleting old image now.
      imageUrlToSave = await handleImageUpload(imageFile) || originalMember.imageUrl;
    } else if (existingImageUrlFromForm !== null) {
      // This case handles if the client wants to keep the existing image explicitly
      // or if the image field was part of form but not changed.
      // If no imageFile and no existingImageUrl in formData, it means client might want to remove image or keep original.
      // The `FormTeamMemberSchema` doesn't have imageUrl, so `validatedData.imageUrl` isn't a thing.
      // We rely on `existingImageUrl` from FormData or `originalMember.imageUrl`.
      // If the form explicitly clears the image, there should be a mechanism for that.
      // For now, if no new file, we assume we keep the original image unless 'existingImageUrl' is empty.
       imageUrlToSave = existingImageUrlFromForm || ""; // If cleared, set to empty
    }


    const updatedMemberData: TeamMember = {
      ...originalMember,
      name: validatedData.name ?? originalMember.name,
      role: validatedData.role ?? originalMember.role,
      description: validatedData.description ?? originalMember.description,
      email: validatedData.email ?? originalMember.email,
      githubUrl: validatedData.githubUrl !== undefined ? validatedData.githubUrl : originalMember.githubUrl,
      linkedinUrl: validatedData.linkedinUrl !== undefined ? validatedData.linkedinUrl : originalMember.linkedinUrl,
      joiningDate: validatedData.joiningDate !== undefined ? validatedData.joiningDate : originalMember.joiningDate,
      imageUrl: imageUrlToSave,
      updatedAt: new Date().toISOString(), 
    };
    
    members[memberIndex] = updatedMemberData;
    await saveTeamMembers(members);
    revalidatePath('/admin/dashboard/team');
    revalidatePath(`/admin/dashboard/team/edit/${id}`);
    revalidatePath('/company');
    return { success: true, member: updatedMemberData };
  } catch (error: any) {
    console.error("Update team member error:", error);
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

    // Optionally: delete image file from public/uploads/team-photos
    if (memberToDelete.imageUrl) {
      try {
        const imagePath = path.join(process.cwd(), 'public', memberToDelete.imageUrl);
        await fs.unlink(imagePath);
      } catch (imgDelError: any) {
        // Log error but don't fail the whole operation if image deletion fails
        console.warn(`Failed to delete image ${memberToDelete.imageUrl}: ${imgDelError.message}`);
      }
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
