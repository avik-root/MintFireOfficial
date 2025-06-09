import Link from 'next/link';
import { Zap } from 'lucide-react'; // Using Zap as a placeholder for a techy logo icon

const Logo = () => {
  return (
    <Link href="/" className="flex items-center space-x-2 group">
      <Zap className="h-8 w-8 text-primary group-hover:text-accent transition-colors duration-300 glowing-icon-primary" />
      <span className="font-headline text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300 glitch-text" data-text="MintFire">
        MintFire
      </span>
    </Link>
  );
};

export default Logo;