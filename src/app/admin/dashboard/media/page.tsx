
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageIcon, Construction } from "lucide-react";

export default function AdminMediaPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6 w-full">
      <Card className="layered-card w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <ImageIcon className="w-8 h-8 text-primary glowing-icon-primary" />
            <div>
              <CardTitle className="font-headline text-3xl">Media Management</CardTitle>
              <CardDescription>Manage images for services, company page, and other site sections.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Construction className="w-20 h-20 mx-auto text-muted-foreground mb-6" />
          <p className="text-xl font-semibold text-muted-foreground mb-2">Under Construction</p>
          <p className="text-muted-foreground">
            This section will allow you to upload and manage images used across the website.
            <br />
            Functionality to dynamically link these images to service pages and the 'About Us' section is planned.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
