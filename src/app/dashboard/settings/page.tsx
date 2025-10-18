
'use client';

import { useState } from 'react';
import { useUser } from '@/lib/firebase/useUser';
import { sendPasswordResetEmail } from 'firebase/auth';
import { getAuth } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Mail } from 'lucide-react';
import { app } from '@/lib/firebase/config';

const auth = getAuth(app);

export default function SettingsPage() {
  const { user, isLoading: userLoading } = useUser();
  const { toast } = useToast();
  const [isPasswordResetLoading, setIsPasswordResetLoading] = useState(false);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name[0];
  };

  const handlePasswordReset = async () => {
    if (!user?.email) {
       toast({
        title: 'Error',
        description: 'Could not send password reset email. User email not found.',
        variant: 'destructive',
      });
      return;
    }

    setIsPasswordResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast({
        title: 'Password Reset Email Sent',
        description: `An email has been sent to ${user.email} with instructions to reset your password.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send password reset email. Please try again later.',
        variant: 'destructive',
      });
    }
    setIsPasswordResetLoading(false);
  };

  if (userLoading) {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
       <div className="flex h-full flex-1 items-center justify-center text-center p-4">
        <p>You must be logged in to view this page.</p>
      </div>
    )
  }

  return (
    <main className="flex-grow p-4 md:p-8">
       <div>
            <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
            <p className="text-muted-foreground">Manage your account details and preferences.</p>
        </div>
      <div className="mt-6 grid gap-6 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>This is your public information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
                  <AvatarFallback className="text-xl">{getInitials(user?.displayName)}</AvatarFallback>
                </Avatar>
                <div className="grid gap-1">
                    <p className="text-lg font-semibold">{user.displayName}</p>
                    <p className="text-sm text-muted-foreground break-all">{user.email}</p>
                </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
             <CardDescription>Manage your security settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">Change Password</h3>
              <p className="text-sm text-muted-foreground mt-1">
                For security purposes, we will send a link to your email to reset your password.
              </p>
            </div>
            <Button
              onClick={handlePasswordReset}
              disabled={isPasswordResetLoading}
            >
              {isPasswordResetLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2" />
              )}
              Send Password Reset Email
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
