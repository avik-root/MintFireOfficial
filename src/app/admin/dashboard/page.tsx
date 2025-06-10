
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LayoutDashboard, Package, Newspaper, Settings, BarChart3, Users, FileText, Trophy } from "lucide-react"; // Added Trophy, removed Users (or keep if generic users are planned)

interface DashboardCardProps {
  title: string;
  description: string;
  link: string;
  linkText: string;
  icon: React.ElementType;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, description, link, linkText, icon: Icon }) => {
  return (
    <Card className="layered-card w-full sm:w-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-medium font-headline">{title}</CardTitle>
        <Icon className="h-6 w-6 text-accent glowing-icon" />
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <Button asChild variant="outline">
          <Link href={link}>{linkText}</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default function AdminDashboardPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6 flex flex-col items-center">
      <div className="text-center mb-12">
        <LayoutDashboard className="w-16 h-16 text-primary mx-auto mb-4 glowing-icon-primary" />
        <h1 className="text-4xl font-bold font-headline mb-2">Admin Dashboard</h1>
        <p className="text-lg text-muted-foreground">Welcome back, Admin! Manage your MintFire application.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
        <DashboardCard
          title="Products"
          description="Manage your product catalog. View, add, edit, or delete products."
          link="/admin/dashboard/products"
          linkText="Go to Products"
          icon={Package}
        />
        <DashboardCard
          title="Hall of Fame"
          description="Manage Hall of Fame entries, points, and achievements."
          link="/admin/dashboard/hall-of-fame-management"
          linkText="Go to Hall of Fame"
          icon={Trophy}
        />
        <DashboardCard
          title="Site Content"
          description="Manage banners, news, and announcements."
          link="/admin/dashboard/site-content"
          linkText="Go to Site Content"
          icon={FileText}
        />
        <DashboardCard
          title="Blog Posts"
          description="Manage your blog content. Create, update, and publish blog articles."
          link="/admin/dashboard/blogs"
          linkText="Go to Blog Posts"
          icon={Newspaper} 
        />
         <DashboardCard
          title="Analytics"
          description="View site and product analytics. Track performance and user engagement."
          link="/admin/dashboard/analytics"
          linkText="View Analytics"
          icon={BarChart3}
        />
        <DashboardCard
          title="Settings"
          description="Configure system settings, roles, and API keys."
          link="/admin/dashboard/settings"
          linkText="Go to Settings"
          icon={Settings}
        />
      </div>
       <p className="mt-12 text-sm text-muted-foreground text-center">
        This is the central hub for managing your MintFire application. More features and sections will be added.
      </p>
    </div>
  );
}
