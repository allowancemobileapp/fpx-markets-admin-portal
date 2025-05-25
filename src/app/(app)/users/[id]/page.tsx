import { findUserById, getAllTradingPlans } from '@/actions/userActions';
import { getWalletByUserId } from '@/actions/walletActions'; // Use new function
import { UserProfileTabs } from '@/components/users/user-profile-tabs';
import { PageHeader } from '@/components/shared/page-header';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, User as UserIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function UserProfilePage({ params }: { params: { id: string } }) {
  const user = await findUserById(params.id);
  
  if (!user) {
    return (
      <div className="space-y-6">
        <PageHeader title="User Not Found" icon={UserIcon} />
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            The user with ID "{params.id}" could not be found.
          </AlertDescription>
        </Alert>
         <Button asChild variant="outline">
            <Link href="/users">Back to User List</Link>
        </Button>
      </div>
    );
  }

  const wallet = await getWalletByUserId(user.id); // Fetch wallet from DB
  const tradingPlans = await getAllTradingPlans(); // Fetch all trading plans
  
  if (!wallet) {
     return (
      <div className="space-y-6">
        <PageHeader title="User Wallet Not Found" icon={UserIcon} />
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Wallet for user "{user.username}" (ID: {params.id}) could not be found. This might indicate an incomplete user setup. A wallet should be created automatically for each user.
          </AlertDescription>
        </Alert>
         <Button asChild variant="outline">
            <Link href="/users">Back to User List</Link>
        </Button>
      </div>
    );
  }

  const tradingPlan = tradingPlans.find(tp => tp.id === user.trading_plan_id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Profile"
        description={`Details for ${user.username}`}
        icon={UserIcon}
         actions={
          <Button asChild variant="outline">
            <Link href="/users">Back to User List</Link>
          </Button>
        }
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
            <div className="p-6 border rounded-lg bg-card text-card-foreground shadow-sm">
                <div className="flex flex-col items-center text-center">
                    <Avatar className="h-24 w-24 mb-4">
                        <AvatarImage src={`https://placehold.co/100x100.png?text=${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`} alt={`${user.username} avatar`} data-ai-hint="user avatar" />
                        <AvatarFallback>{user.first_name?.[0] || 'U'}{user.last_name?.[0] || 'N'}</AvatarFallback>
                    </Avatar>
                    <h2 className="text-2xl font-semibold">{user.first_name} {user.last_name}</h2>
                    <p className="text-muted-foreground">@{user.username}</p>
                    <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
                     <Badge variant={user.is_active ? "default" : "destructive"} className="mt-2">
                        {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                </div>
                <div className="mt-6 space-y-2 text-sm">
                    <div><strong>Password:</strong> <span className="text-muted-foreground">Managed by Firebase Auth</span></div>
                    <div><strong>PIN Setup:</strong> 
                        {user.pin_setup_completed_at ? 
                            <><span className="text-green-600 font-medium">Completed</span> (<span className="text-muted-foreground text-xs">{new Date(user.pin_setup_completed_at).toLocaleDateString()}</span>)</> : 
                            <span className="text-orange-500 font-medium">Not Yet Setup</span>}
                    </div>
                    <p><strong>Country:</strong> {user.country_code || 'N/A'}</p>
                    <p><strong>Phone:</strong> {user.phone_number || 'N/A'}</p>
                    <p><strong>Trading Plan:</strong> {tradingPlan?.name || 'N/A'}</p>
                    <p><strong>Joined:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                    <p><strong>Last Updated:</strong> {new Date(user.updated_at).toLocaleDateString()}</p>
                </div>
            </div>
        </div>

        <div className="lg:col-span-2">
           <UserProfileTabs user={user} wallet={wallet} tradingPlans={tradingPlans} />
        </div>
      </div>
    </div>
  );
}
