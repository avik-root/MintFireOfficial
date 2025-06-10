
import { getHallOfFameEntries } from '@/actions/hall-of-fame-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Trophy, UserCircle, Medal, Activity, Award, Star, ExternalLink, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge'; // Added this import

export default async function HallOfFamePage() {
  const { entries, error } = await getHallOfFameEntries();

  if (error) {
    return (
      <div className="container mx-auto py-12 px-4 md:px-6 text-center">
        <AlertTriangle className="w-20 h-20 text-destructive mx-auto mb-6" />
        <h1 className="font-headline text-4xl font-bold mb-4">Error Loading Hall of Fame</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">{error}</p>
      </div>
    );
  }

  const getRankColor = (rank?: number | null) => {
    if (rank === 1) return "text-yellow-400";
    if (rank === 2) return "text-slate-400";
    if (rank === 3) return "text-orange-400";
    return "text-primary";
  };

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <section className="text-center mb-16">
        <Trophy className="w-20 h-20 text-primary mx-auto mb-6 glowing-icon-primary" />
        <h1 className="font-headline text-5xl font-bold mb-4">MintFire Hall of Fame</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Recognizing the exceptional individuals who contribute to MintFire's security and innovation.
        </p>
      </section>

      {entries && entries.length > 0 ? (
        <div className="space-y-6">
          {entries.map((entry, index) => (
            <Card key={entry.id} className={`layered-card w-full max-w-3xl mx-auto ${entry.rank === 1 ? 'border-yellow-400 shadow-yellow-400/30' : entry.rank === 2 ? 'border-slate-400 shadow-slate-400/30' : entry.rank === 3 ? 'border-orange-400 shadow-orange-400/30' : 'border-primary/30'}`}>
              <CardHeader className="flex flex-row items-center gap-4">
                <div className={`text-5xl font-bold ${getRankColor(entry.rank)} w-16 text-center`}>
                  {entry.rank}
                </div>
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-accent">
                  <Image 
                    src={entry.avatarUrl || `https://placehold.co/64x64.png?text=${entry.displayName.charAt(0)}`} 
                    alt={entry.displayName} 
                    fill 
                    className="object-cover"
                    data-ai-hint="user avatar"
                  />
                </div>
                <div className="flex-1">
                  <CardTitle className="font-headline text-2xl text-foreground">{entry.displayName}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground flex items-center">
                    <Star className="w-4 h-4 mr-1.5 text-yellow-400 fill-yellow-400" />
                    {entry.totalPoints} Points
                    {entry.profileUrl && (
                       <Button asChild variant="link" size="sm" className="ml-2 p-0 h-auto">
                        <Link href={entry.profileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:text-primary">
                            View Profile <ExternalLink className="ml-1 h-3 w-3"/>
                        </Link>
                       </Button>
                    )}
                  </CardDescription>
                </div>
              </CardHeader>
              {entry.achievements && entry.achievements.length > 0 && (
                <CardContent>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center"><Award className="w-4 h-4 mr-2 text-accent"/>Achievements:</h4>
                  <div className="flex flex-wrap gap-2">
                    {entry.achievements.map(ach => (
                      <Badge key={ach} variant="secondary" className="bg-accent/20 text-accent border-accent/50">{ach}</Badge>
                    ))}
                  </div>
                </CardContent>
              )}
              {entry.lastRewardedAt && (
                <CardFooter className="text-xs text-muted-foreground">
                  Last recognized: {new Date(entry.lastRewardedAt).toLocaleDateString()}
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Activity className="w-20 h-20 mx-auto text-muted-foreground mb-4" />
          <p className="text-xl font-semibold text-muted-foreground">The Hall of Fame is currently empty.</p>
          <p className="text-muted-foreground">Outstanding contributions will be recognized here soon!</p>
        </div>
      )}
    </div>
  );
}
