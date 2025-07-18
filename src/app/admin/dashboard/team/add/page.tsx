
"use client"; 

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { addTeamMember } from "@/actions/team-member-actions";
import TeamMemberForm from "../_components/TeamMemberForm";
import { UserPlus } from "lucide-react";

export default function AddTeamMemberPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    const result = await addTeamMember(formData);
    setIsSubmitting(false);
    return result; // This result will be handled by TeamMemberForm's own submit handler
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 w-full max-w-2xl">
      <Card className="layered-card w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <UserPlus className="w-8 h-8 text-primary glowing-icon-primary" />
            <div>
              <CardTitle className="font-headline text-3xl">Add New Team Member</CardTitle>
              <CardDescription>Enter the details for the new team member.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TeamMemberForm 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting}
            submitButtonText="Add Team Member"
          />
        </CardContent>
      </Card>
    </div>
  );
}
