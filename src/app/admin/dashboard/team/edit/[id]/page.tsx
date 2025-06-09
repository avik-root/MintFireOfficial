
"use client";

import { useEffect, useState, useCallback, use } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTeamMemberById, updateTeamMember } from "@/actions/team-member-actions";
import TeamMemberForm from "../../_components/TeamMemberForm";
import { Edit3, Loader2, AlertTriangle } from "lucide-react";
import type { TeamMember } from "@/lib/schemas/team-member-schemas";

export default function EditTeamMemberPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const [member, setMember] = useState<TeamMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const params = use(paramsPromise);
  const memberId = params.id;

  const fetchMember = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getTeamMemberById(memberId);
    if (result.member) {
      setMember(result.member);
    } else {
      setError(result.error || "Failed to load team member.");
    }
    setIsLoading(false);
  }, [memberId]);

  useEffect(() => {
    fetchMember();
  }, [fetchMember]);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    // The server action updateTeamMember needs the ID.
    // We pass it directly, formData doesn't need to contain it.
    const result = await updateTeamMember(memberId, formData);
    setIsSubmitting(false);
    if(result.success) {
      await fetchMember(); 
    }
    return result; // This result will be handled by TeamMemberForm's own submit handler
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading team member...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-destructive">
        <AlertTriangle className="w-16 h-16 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!member) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Team member not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 w-full max-w-2xl">
      <Card className="layered-card w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Edit3 className="w-8 h-8 text-primary glowing-icon-primary" />
            <div>
              <CardTitle className="font-headline text-3xl">Edit Team Member</CardTitle>
              <CardDescription>Update the details for this team member.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TeamMemberForm 
            initialData={member}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitButtonText="Update Team Member"
          />
        </CardContent>
      </Card>
    </div>
  );
}
