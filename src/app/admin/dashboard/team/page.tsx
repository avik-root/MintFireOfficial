
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTeamMembers } from "@/actions/team-member-actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { PlusCircle, Edit, UsersRound, AlertTriangle, Eye, EyeOff, Search, ArrowUpDown, CalendarDays, Loader2 } from "lucide-react";
import DeleteTeamMemberButton from "./_components/DeleteTeamMemberButton";
import type { TeamMember } from "@/lib/schemas/team-member-schemas";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

type SortKey = 'name' | 'role' | 'joiningDate' | 'isPublic';
type SortDirection = 'asc' | 'desc';

export default function AdminTeamMembersPage() {
  const [allMembers, setAllMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('joiningDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const fetchData = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) setIsLoading(true);
    // setError(null);
    try {
      const { members, error: fetchError } = await getTeamMembers({ publicOnly: false });
      if (fetchError) {
        setError(fetchError);
      } else if (members) {
        setAllMembers(members);
         if (!isInitialLoad) setError(null);
      }
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred fetching team members.");
    }
     if (isInitialLoad) setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData(true); // Initial fetch

    const intervalId = setInterval(() => {
      if (!document.hidden) {
        fetchData(false);
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [fetchData]);

  const filteredAndSortedMembers = useMemo(() => {
    let members = [...allMembers];

    if (searchTerm) {
      members = members.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    members.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (sortKey === 'joiningDate') {
        valA = a.joiningDate ? new Date(a.joiningDate).getTime() : 0;
        valB = b.joiningDate ? new Date(b.joiningDate).getTime() : 0;
      } else if (typeof valA === 'string' && typeof valB === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }


      let comparison = 0;
      if (valA > valB) {
        comparison = 1;
      } else if (valA < valB) {
        comparison = -1;
      }
      return sortDirection === 'desc' ? comparison * -1 : comparison;
    });

    return members;
  }, [allMembers, searchTerm, sortKey, sortDirection]);

  if (isLoading) {
    return (
       <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="w-16 h-16 mb-4 text-primary animate-spin" />
        <p className="text-muted-foreground">Loading team members...</p>
      </div>
    );
  }

  if (error && filteredAndSortedMembers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-destructive">
        <AlertTriangle className="w-16 h-16 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error Loading Team Members</h2>
        <p>{error}</p>
      </div>
    );
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };
  
  const SortableHeader = ({ children, columnKey }: { children: React.ReactNode; columnKey: SortKey }) => (
    <th 
        scope="col" 
        className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/50"
        onClick={() => handleSort(columnKey)}
    >
        <div className="flex items-center">
            {children}
            {sortKey === columnKey && (
                <ArrowUpDown className={`ml-2 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
            )}
        </div>
    </th>
  );


  return (
    <div className="container mx-auto py-8 px-4 md:px-6 w-full">
       {error && filteredAndSortedMembers.length > 0 && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive border border-destructive/30 rounded-md flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <p>Error refreshing data: {error}. Displaying last known data.</p>
        </div>
      )}
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
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name, role, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <div className="flex gap-2 items-center">
                <span className="text-sm text-muted-foreground">Sort by:</span>
                 <Select value={sortKey} onValueChange={(value) => handleSort(value as SortKey)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="role">Role</SelectItem>
                        <SelectItem value="joiningDate">Joining Date</SelectItem>
                        <SelectItem value="isPublic">Visibility</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}>
                    <ArrowUpDown className={`h-4 w-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAndSortedMembers.length === 0 && !error ? (
            <div className="text-center py-12">
              <UsersRound className="w-20 h-20 mx-auto text-muted-foreground mb-4" />
              <p className="text-xl font-semibold text-muted-foreground">
                {searchTerm ? "No members match your search." : "No team members found."}
              </p>
              <p className="text-muted-foreground">
                {searchTerm ? "Try adjusting your search terms." : "Get started by adding a new team member."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-card">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Photo</th>
                    <SortableHeader columnKey="name">Name</SortableHeader>
                    <SortableHeader columnKey="role">Role</SortableHeader>
                    <SortableHeader columnKey="isPublic">Visibility</SortableHeader>
                    <SortableHeader columnKey="joiningDate">Joining Date</SortableHeader>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {filteredAndSortedMembers.map((member: TeamMember) => (
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
