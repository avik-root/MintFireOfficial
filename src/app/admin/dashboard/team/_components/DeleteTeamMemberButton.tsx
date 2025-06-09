
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteTeamMember } from '@/actions/team-member-actions'; // Make sure this path is correct
import { useToast } from '@/hooks/use-toast';

interface DeleteTeamMemberButtonProps {
  memberId: string;
}

export default function DeleteTeamMemberButton({ memberId }: DeleteTeamMemberButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteTeamMember(memberId);
    if (result.success) {
      toast({ title: 'Success', description: 'Team member deleted successfully.' });
      setIsOpen(false);
      // Revalidation is handled by the server action
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed to delete team member.' });
    }
    setIsDeleting(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Delete Team Member">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the team member.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
              </>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
