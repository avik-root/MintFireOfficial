
'use server';

import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import {
  TeamMemberSchema,
  FormTeamMemberSchema, 
  type TeamMember,
} from '@/lib/schemas/team-member-schemas';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

const teamMembersFilePath = path.join(process.cwd(), 'data', 'team_members.json');
const UPLOADS_DIR_NAME = 'uploads';
const TEAM_PHOTOS_DIR_NAME = 'team-photos';
const publicUploadsDir = path.join(process.cwd(), 'public', UPLOADS_DIR_NAME, TEAM_PHOTOS_DIR_NAME);

// Helper function to generate memberId
function generateMemberId(name: string): string {
  const nameParts = name.split(' ');
  let prefix = '';
  if (nameParts.length > 1) {
    prefix = (nameParts[0].substring(0, 3) + nameParts[nameParts.length -1].substring(0, 3)).toUpperCase();
  } else {
    prefix = name.substring(0, Math.min(6, name.length)).toUpperCase();
    while (prefix.length < 6) {
      prefix += 'X'; // Pad if name is too short
    }
  }
  
  const randomNumbers1 = Math.floor(1000 + Math.random() * 9000).toString(); // 4 random digits
  const randomChars = Array(2).fill(null).map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join(''); // 2 random uppercase letters
  const randomNumbers2 = Math.floor(10 + Math.random() * 90).toString(); // 2 random digits

  return `${prefix}${randomNumbers1}${randomChars}${randomNumbers2}`;
}


async function getTeamMembersInternal(params?: { publicOnly?: boolean }): Promise<TeamMember[]> {
  try {
    await fs.mkdir(path.dirname(teamMembersFilePath), { recursive: true });

    let fileContent: string;
    try {
      fileContent = await fs.readFile(teamMembersFilePath, 'utf-8');
    } catch (readError: any) {
      if (readError.code === 'ENOENT') {
        await fs.writeFile(teamMembersFilePath, JSON.stringify([]), 'utf-8');
        return [];
      }
      throw readError;
    }

    if (fileContent.trim() === '') {
      return [];
    }

    const items = JSON.parse(fileContent);

    if (!Array.isArray(items)) {
      console.error(`Data in ${teamMembersFilePath} is not an array. Found: ${typeof items}. Overwriting with empty array.`);
      await fs.writeFile(teamMembersFilePath, JSON.stringify([]), 'utf-8');
      return [];
    }
    
    let parsedItems = z.array(TeamMemberSchema).parse(items);

    if (params?.publicOnly) {
      parsedItems = parsedItems.filter(member => member.isPublic);
    }

    parsedItems.sort((a, b) => {
      const dateA = a.joiningDate ? new Date(a.joiningDate).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const dateB = b.joiningDate ? new Date(b.joiningDate).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return dateA - dateB; // Oldest first
    });
    return parsedItems;
  } catch (error: any) {
    console.error(`Error processing team members file (${teamMembersFilePath}):`, error);
    let errorMessage = `Could not process team member data from ${teamMembersFilePath}.`;
    if (error instanceof z.ZodError) {
      errorMessage = `Team member data validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`;
    } else if (error.message) {
      errorMessage = `Error reading team member data: ${error.message}`;
    }
    throw new Error(errorMessage);
  }
}

async function saveTeamMembers(items: TeamMember[]): Promise<void> {
  try {
    await fs.mkdir(path.dirname(teamMembersFilePath), { recursive: true });
    await fs.writeFile(teamMembersFilePath, JSON.stringify(items, null, 2), 'utf-8');
  } catch (error: any) {
    console.error("Error writing team members file:", error);
    throw new Error('Could not save team member data.');
  }
}

async function handleImageUpload(imageFile: File | null): Promise<string | null> {
  if (!imageFile || imageFile.size === 0) return null;

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(imageFile.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, GIF, WEBP are allowed.');
  }
  const maxSize = 2 * 1024 * 1024; // 2MB
  if (imageFile.size > maxSize) {
    throw new Error('File is too large. Maximum size is 2MB.');
  }

  await fs.mkdir(publicUploadsDir, { recursive: true });
  const fileExtension = path.extname(imageFile.name) || '.png';
  const uniqueFilename = `${randomUUID()}${fileExtension}`;
  const filePath = path.join(publicUploadsDir, uniqueFilename);
  
  const buffer = Buffer.from(await imageFile.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  return `/${UPLOADS_DIR_NAME}/${TEAM_PHOTOS_DIR_NAME}/${uniqueFilename}`;
}

export async function getTeamMembers(params?: { publicOnly?: boolean }): Promise<{ members?: TeamMember[]; error?: string }> {
  try {
    const members = await getTeamMembersInternal(params);
    return { members };
  } catch (error: any) {
    return { error: error.message || "Failed to fetch team members." };
  }
}

export async function addTeamMember(formData: FormData): Promise<{ success: boolean; member?: TeamMember; error?: string; errors?: z.ZodIssue[] }> {
  try {
    const rawData: Record<string, any> = {};
    formData.forEach((value, key) => {
      if ((key === 'githubUrl' || key === 'linkedinUrl') && value === '') {
        rawData[key] = undefined; // For optional fields that can be omitted
      } else if (key === 'isPublic') {
        rawData[key] = value === 'on' || String(value) === 'true';
      } else if (key !== 'imageFile') {
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

    if (imageFile && imageFile.size > 0) {
      imageUrl = await handleImageUpload(imageFile);
    }

    const members = await getTeamMembersInternal();
    const now = new Date().toISOString();
    const newMemberId = generateMemberId(validatedData.name);

    const newMember: TeamMember = {
      id: randomUUID(),
      memberId: newMemberId,
      name: validatedData.name,
      role: validatedData.role,
      description: validatedData.description,
      email: validatedData.email,
      githubUrl: validatedData.githubUrl || "",
      linkedinUrl: validatedData.linkedinUrl || "",
      joiningDate: validatedData.joiningDate || now,
      imageUrl: imageUrl || "",
      isPublic: validatedData.isPublic,
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
    const members = await getTeamMembersInternal({ publicOnly: false }); // Fetch all for admin view
    const member = members.find(p => p.id === id);
    if (!member) {
      return { error: "Team member not found." };
    }
    return { member };
  } catch (error: any) {
    return { error: error.message || "Failed to fetch team member." };
  }
}

export async function updateTeamMember(id: string, formData: FormData): Promise<{ success: boolean; member?: TeamMember; error?: string, errors?: z.ZodIssue[] }> {
  try {
    const rawData: Record<string, any> = {};
     formData.forEach((value, key) => {
      if ((key === 'githubUrl' || key === 'linkedinUrl') && value === '') {
        rawData[key] = undefined; 
      } else if (key === 'isPublic') {
        rawData[key] = value === 'on' || String(value) === 'true';
      } else if (key !== 'imageFile' && key !== 'existingImageUrl') {
        rawData[key] = value;
      }
    });

    const validation = FormTeamMemberSchema.partial().safeParse(rawData); 
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
    let imageUrlToSave = originalMember.imageUrl; 
    const imageFile = formData.get('imageFile') as File | null;
    const existingImageUrlFromForm = formData.get('existingImageUrl') as string | null;

    if (imageFile && imageFile.size > 0) {
      if (originalMember.imageUrl && originalMember.imageUrl.startsWith(`/${UPLOADS_DIR_NAME}/${TEAM_PHOTOS_DIR_NAME}/`)) {
        try {
          const oldImagePath = path.join(process.cwd(), 'public', originalMember.imageUrl);
          await fs.unlink(oldImagePath).catch(e => console.warn(`Non-critical: Failed to delete old image ${oldImagePath}: ${e.message}`));
        } catch (imgDelError: any) {
          console.warn(`Failed to delete old image ${originalMember.imageUrl}: ${imgDelError.message}`);
        }
      }
      imageUrlToSave = await handleImageUpload(imageFile);
    } else if (existingImageUrlFromForm !== null && existingImageUrlFromForm === "" && originalMember.imageUrl) { 
      if (originalMember.imageUrl.startsWith(`/${UPLOADS_DIR_NAME}/${TEAM_PHOTOS_DIR_NAME}/`)) {
        try {
          const oldImagePath = path.join(process.cwd(), 'public', originalMember.imageUrl);
          await fs.unlink(oldImagePath).catch(e => console.warn(`Non-critical: Failed to delete old image ${oldImagePath}: ${e.message}`));
        } catch (imgDelError: any) {
          console.warn(`Failed to delete old image ${originalMember.imageUrl}: ${imgDelError.message}`);
        }
      }
      imageUrlToSave = "";
    } else if (existingImageUrlFromForm !== null) {
      imageUrlToSave = existingImageUrlFromForm;
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
      isPublic: validatedData.isPublic !== undefined ? validatedData.isPublic : originalMember.isPublic,
      imageUrl: imageUrlToSave || "",
      updatedAt: new Date().toISOString(), 
      // memberId is NOT updated
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

    if (memberToDelete.imageUrl && memberToDelete.imageUrl.startsWith(`/${UPLOADS_DIR_NAME}/${TEAM_PHOTOS_DIR_NAME}/`)) {
      try {
        const imagePath = path.join(process.cwd(), 'public', memberToDelete.imageUrl);
        await fs.unlink(imagePath).catch(e => console.warn(`Non-critical: Failed to delete image ${imagePath}: ${e.message}`));
      } catch (imgDelError: any) {
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
