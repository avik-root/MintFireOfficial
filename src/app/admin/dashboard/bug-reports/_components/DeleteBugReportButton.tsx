
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
import { deleteBugReport } from '@/actions/bug-report-actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface DeleteBugReportButtonProps {
  reportId: string;
  onDeleted?: () => void; // Optional callback
}

export default function DeleteBugReportButton({ reportId, onDeleted }: DeleteBugReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteBugReport(reportId);
    if (result.success) {
      toast({ title: 'Success', description: 'Bug report deleted successfully.' });
      setIsOpen(false);
      if (onDeleted) {
        onDeleted();
      } else {
        // Fallback to router.refresh() if no callback is provided
        // This is generally handled by server action revalidation, but good as a backup
        router.refresh(); 
      }
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed to delete bug report.' });
    }
    setIsDeleting(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Delete Bug Report">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the bug report.
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
