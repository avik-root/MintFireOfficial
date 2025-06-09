import { Zap } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border/40 bg-background/95">
      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center space-x-2 mb-4 md:mb-0">
          <Zap className="h-6 w-6 text-primary glowing-icon-primary" />
          <p className="text-sm text-muted-foreground font-headline">
            MintFire &copy; {new Date().getFullYear()}
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Pioneering the Future of Technology.
        </div>
      </div>
    </footer>
  );
};

export default Footer;