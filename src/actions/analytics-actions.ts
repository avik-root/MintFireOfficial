
'use server';

import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { AnalyticsDataSchema, type AnalyticsData } from '@/lib/schemas/analytics-schemas';
import type { Product } from '@/lib/schemas/product-schemas';
import type { TeamMember } from '@/lib/schemas/team-member-schemas';
import type { Founder } from '@/lib/schemas/founder-schema';
import type { BlogPost } from '@/lib/schemas/blog-post-schemas';
import type { Applicant } from '@/lib/schemas/applicant-schemas';
import type { BugReport } from '@/lib/schemas/bug-report-schemas'; // Added

const analyticsFilePath = path.join(process.cwd(), 'data', 'analytics.json');
const productsFilePath = path.join(process.cwd(), 'data', 'products.json');
const teamMembersFilePath = path.join(process.cwd(), 'data', 'team_members.json');
const foundersFilePath = path.join(process.cwd(), 'data', 'founders.json');
const blogPostsFilePath = path.join(process.cwd(), 'data', 'blog_posts.json');
const applicantsFilePath = path.join(process.cwd(), 'data', 'applicants.json');
const bugReportsFilePath = path.join(process.cwd(), 'data', 'bug-reports.json'); // Added


async function readDataFile<T>(filePath: string, schema: z.ZodType<T[]>): Promise<T[]> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    if (fileContent.trim() === '') return [];
    return schema.parse(JSON.parse(fileContent));
  } catch (error: any) {
    if (error.code === 'ENOENT') return []; // File not found, return empty
    console.error(`Error reading or parsing ${path.basename(filePath)}:`, error);
    return []; // Return empty on other errors to avoid crashing analytics
  }
}


async function getAnalyticsDataInternal(): Promise<AnalyticsData> {
  try {
    await fs.mkdir(path.dirname(analyticsFilePath), { recursive: true });
    let fileContent: string;
    try {
      fileContent = await fs.readFile(analyticsFilePath, 'utf-8');
    } catch (readError: any) {
      if (readError.code === 'ENOENT') {
        // File doesn't exist, create it with default structure
        const defaultData: AnalyticsData = { productViews: {}, teamMemberViews: {}, lastUpdatedAt: new Date().toISOString() };
        await fs.writeFile(analyticsFilePath, JSON.stringify(defaultData, null, 2), 'utf-8');
        return defaultData;
      }
      throw readError;
    }

    if (fileContent.trim() === '') {
      const defaultData: AnalyticsData = { productViews: {}, teamMemberViews: {}, lastUpdatedAt: new Date().toISOString() };
      await fs.writeFile(analyticsFilePath, JSON.stringify(defaultData, null, 2), 'utf-8');
      return defaultData;
    }
    
    const parsed = AnalyticsDataSchema.safeParse(JSON.parse(fileContent));
    if (parsed.success) {
      return parsed.data;
    } else {
      console.warn("Analytics data file corrupted or outdated. Resetting to default. Error:", parsed.error.flatten());
      const defaultData: AnalyticsData = { productViews: {}, teamMemberViews: {}, lastUpdatedAt: new Date().toISOString() };
      await fs.writeFile(analyticsFilePath, JSON.stringify(defaultData, null, 2), 'utf-8');
      return defaultData;
    }

  } catch (error: any) {
    console.error(`Error processing analytics file (${analyticsFilePath}):`, error);
    // Fallback to default if there's an unrecoverable error
    return { productViews: {}, teamMemberViews: {}, lastUpdatedAt: new Date().toISOString() };
  }
}

async function saveAnalyticsData(data: AnalyticsData): Promise<void> {
  try {
    data.lastUpdatedAt = new Date().toISOString();
    await fs.mkdir(path.dirname(analyticsFilePath), { recursive: true });
    await fs.writeFile(analyticsFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error: any) {
    console.error("Error writing analytics file:", error);
    // Not throwing an error here to prevent crashing client-side operations,
    // but logging it is important.
  }
}

export async function getAnalyticsData(): Promise<{ data?: AnalyticsData; error?: string }> {
  try {
    const data = await getAnalyticsDataInternal();
    return { data };
  } catch (error: any) {
    return { error: error.message || "Failed to fetch analytics data." };
  }
}

export async function incrementProductView(productId: string): Promise<void> {
  try {
    const data = await getAnalyticsDataInternal();
    data.productViews[productId] = (data.productViews[productId] || 0) + 1;
    await saveAnalyticsData(data);
  } catch (error) {
    // Log but don't throw to client
    console.error("Failed to increment product view for ID:", productId, error);
  }
}

export async function incrementTeamMemberView(memberId: string): Promise<void> {
   try {
    const data = await getAnalyticsDataInternal();
    data.teamMemberViews[memberId] = (data.teamMemberViews[memberId] || 0) + 1;
    await saveAnalyticsData(data);
  } catch (error) {
    console.error("Failed to increment team member view for ID:", memberId, error);
  }
}

export async function getGeneralCounts(): Promise<{ counts?: { totalProducts: number; totalTeamMembers: number; totalFounders: number; totalBlogPosts: number; totalApplicants: number; totalBugReports: number; }; error?: string }> {
  try {
    const products = await readDataFile(productsFilePath, z.array(z.custom<Product>()));
    const teamMembers = await readDataFile(teamMembersFilePath, z.array(z.custom<TeamMember>()));
    const founders = await readDataFile(foundersFilePath, z.array(z.custom<Founder>()));
    const blogPosts = await readDataFile(blogPostsFilePath, z.array(z.custom<BlogPost>()));
    const applicants = await readDataFile(applicantsFilePath, z.array(z.custom<Applicant>()));
    const bugReports = await readDataFile(bugReportsFilePath, z.array(z.custom<BugReport>())); // Added

    return {
      counts: {
        totalProducts: products.length,
        totalTeamMembers: teamMembers.length,
        totalFounders: founders.length,
        totalBlogPosts: blogPosts.length,
        totalApplicants: applicants.length,
        totalBugReports: bugReports.length, // Added
      }
    };
  } catch (error: any) {
    console.error("Error fetching general counts:", error);
    return { error: error.message || "Failed to fetch general counts." };
  }
}
