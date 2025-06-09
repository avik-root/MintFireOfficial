
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTeamMembers } from "@/actions/team-member-actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { PlusCircle, Edit, UsersRound, AlertTriangle, Mail, Github, Linkedin, CalendarDays, Eye, EyeOff } from "lucide-react";
import DeleteTeamMemberButton from "./_components/DeleteTeamMemberButton";
import type { TeamMember } from "@/lib/schemas/team-member-schemas";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

export default async function AdminTeamMembersPage() {
  // Fetch all members for admin view
  const { members, error } = await getTeamMembers({ publicOnly: false }); 

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-destructive">
        <AlertTriangle className="w-16 h-16 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error Loading Team Members</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!members) {
    return (
       <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <UsersRound className="w-16 h-16 mb-4 text-muted-foreground animate-pulse" />
        <p className="text-muted-foreground">Loading team members...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 w-full">
      <Card className="layered-card w-full">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="font-headline text-3xl flex items-center">
                <UsersRound className="w-8 h-8 mr-3 text-primary glowing-icon-primary" />
                Manage Team Members
              </CardTitle>
              <CardDescription>View, add, edit, or delete team members and manage their visibility.</CardDescription>
            </div>
            <Button asChild variant="default" className="shrink-0">
              <Link href="/admin/dashboard/team/add">
                <PlusCircle className="mr-2 h-5 w-5" /> Add New Member
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-12">
              <UsersRound className="w-20 h-20 mx-auto text-muted-foreground mb-4" />
              <p className="text-xl font-semibold text-muted-foreground">No team members found.</p>
              <p className="text-muted-foreground">Get started by adding a new team member.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-card">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Photo</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Visibility</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Joining Date</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {members.map((member: TeamMember) => (
                    <tr key={member.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative h-10 w-10 rounded-full overflow-hidden border border-border">
                          <Image 
                            src={member.imageUrl || `https://placehold.co/40x40.png?text=${member.name.charAt(0)}`} 
                            alt={member.name} 
                            fill
                            className="object-cover"
                            data-ai-hint="profile photo"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{member.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{member.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Badge variant={member.isPublic ? "default" : "secondary"} 
                               className={member.isPublic ? "bg-green-600/30 text-green-400 border-green-500" : "bg-yellow-600/30 text-yellow-400 border-yellow-500"}>
                          {member.isPublic ? <Eye className="mr-1 h-3 w-3" /> : <EyeOff className="mr-1 h-3 w-3" />}
                          {member.isPublic ? "Public" : "Private"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {member.joiningDate ? format(new Date(member.joiningDate), "PPP") : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                        <Button variant="ghost" size="icon" asChild title="Edit Member">
                          <Link href={`/admin/dashboard/team/edit/${member.id}`}>
                            <Edit className="h-4 w-4 text-accent" />
                          </Link>
                        </Button>
                        <DeleteTeamMemberButton memberId={member.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
