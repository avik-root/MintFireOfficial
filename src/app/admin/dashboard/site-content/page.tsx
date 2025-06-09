
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSiteContentItems } from "@/actions/site-content-actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, Edit, Trash2, ExternalLink, AlertTriangle, ListChecks } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function AdminSiteContentPage() {
  const { items: siteContentItems, error } = await getSiteContentItems();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-destructive">
        <AlertTriangle className="w-16 h-16 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error Loading Site Content</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!siteContentItems) {
    return <p>Loading site content...</p>; 
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Card className="layered-card">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="font-headline text-3xl flex items-center">
                <ListChecks className="w-8 h-8 mr-3 text-primary glowing-icon-primary" />
                Manage Site Content
              </CardTitle>
              <CardDescription>View, add, edit, or delete banners, news, and announcements.</CardDescription>
            </div>
            <Button asChild variant="default">
              <Link href="/admin/dashboard/site-content/add">
                <PlusCircle className="mr-2 h-5 w-5" /> Add New Item
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {siteContentItems.length === 0 ? (
            <div className="text-center py-12">
              <ListChecks className="w-20 h-20 mx-auto text-muted-foreground mb-4" />
              <p className="text-xl font-semibold text-muted-foreground">No site content items found.</p>
              <p className="text-muted-foreground">Get started by adding a new banner, news, or announcement.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-card">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Created At</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {siteContentItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{item.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        <Badge variant={
                          item.type === 'banner' ? 'default' : 
                          item.type === 'news' ? 'secondary' : 'outline'
                        } className="capitalize">{item.type}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Badge variant={item.isActive ? "default" : "destructive"} className="bg-opacity-70">
                          {item.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        {item.linkUrl && (
                          <Button variant="ghost" size="icon" asChild>
                            <a href={item.linkUrl} target="_blank" rel="noopener noreferrer" title="View Live">
                              <ExternalLink className="h-4 w-4 text-blue-500" />
                            </a>
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" asChild title="Edit Item">
                          <Link href={`/admin/dashboard/site-content/edit/${item.id}`}>
                            <Edit className="h-4 w-4 text-accent" />
                          </Link>
                        </Button>
                        {/* Delete button would require client component for confirmation dialog */}
                        <Button variant="ghost" size="icon" title="Delete Item (Not Implemented)">
                           <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        This is a foundational page for site content management. Full CRUD operations, especially for editing and deleting with confirmations, will be implemented in subsequent steps.
      </p>
    </div>
  );
}
