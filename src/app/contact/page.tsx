
"use client";

import React, { useState } from 'react'; // Added useState
import { Mail, Phone, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ContactPage() {
  const [isPhoneHovered, setIsPhoneHovered] = useState(false);
  const fullPhoneNumber = "+91 6294246820";
  const maskedPhoneNumber = "+91 62XXXXXX20";

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <section className="text-center mb-16">
        <Mail className="w-20 h-20 text-primary mx-auto mb-6 glowing-icon-primary" />
        <h1 className="font-headline text-5xl font-bold mb-4">Contact Us</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          We're here to help and answer any questions you might have. We look forward to hearing from you!
        </p>
      </section>

      <section className="grid md:grid-cols-2 gap-8 items-start">
        <Card className="layered-card">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center">
              <Mail className="w-6 h-6 mr-3 text-accent glowing-icon" />
              Send Us an Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              For general inquiries, support, or partnership opportunities, please email us.
            </p>
            <Button asChild variant="default" size="lg">
              <Link href="mailto:mintfire.official@gmail.com">mintfire.official@gmail.com</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="layered-card">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center">
              <Phone className="w-6 h-6 mr-3 text-accent glowing-icon" />
              Call Us
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Reach out to our team during business hours.
            </p>
            <p 
              className="text-2xl font-semibold text-foreground cursor-pointer"
              onMouseEnter={() => setIsPhoneHovered(true)}
              onMouseLeave={() => setIsPhoneHovered(false)}
              title="Hover to reveal full number"
            >
              {isPhoneHovered ? fullPhoneNumber : maskedPhoneNumber}
            </p>
            <p className="text-xs text-muted-foreground mt-1">(Mon-Fri, 10 AM - 6 PM IST)</p>
          </CardContent>
        </Card>
      </section>

      <section className="mt-16">
        <Card className="layered-card w-full max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center">
              <MapPin className="w-6 h-6 mr-3 text-accent glowing-icon" />
              Our Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-2">
              MintFire Headquarters
            </p>
            <p className="text-foreground">
              India, Kolkata - Remote (Cloud Based)
            </p>
            <div className="mt-4 aspect-w-16 aspect-h-9 rounded-md overflow-hidden border border-border">
              {/* Placeholder for a map embed or relevant graphic */}
              <img src="https://placehold.co/600x300.png?text=Global+Operations" alt="MintFire Global Operations" className="w-full h-full object-cover" data-ai-hint="global network abstract" />
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
