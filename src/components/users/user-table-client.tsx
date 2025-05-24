// src/components/users/user-table-client.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Eye, Edit3, Trash2, CheckCircle, XCircle, Clock, MoreVertical, Search, Filter } from 'lucide-react';
import type { User, TradingPlan, KycStatus } from '@/lib/types';
import { mockTradingPlans } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { toggleUserActiveStatus } from '@/actions/userActions';
import { useToast } from '@/hooks/use-toast';

interface UserTableClientProps {
  initialUsers: User[];
}

export function UserTableClient({ initialUsers }: UserTableClientProps) {
  const [users, setUsers] = React.useState<User[]>(initialUsers);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [kycStatusFilter, setKycStatusFilter] = React.useState<KycStatus | 'all'>('all');
  const [isActiveFilter, setIsActiveFilter] = React.useState<'all' | 'true' | 'false'>('all');
  const [tradingPlanFilter, setTradingPlanFilter] = React.useState<string>('all');
  const { toast } = useToast();

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    const result = await toggleUserActiveStatus(userId, !currentStatus);
    if (result.success) {
      setUsers(users.map(u => u.id === userId ? { ...u, is_active: !currentStatus, updated_at: new Date().toISOString() } : u));
      toast({ title: "Success", description: result.message });
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  };

  const filteredUsers = React.useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (user.first_name && user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (user.last_name && user.last_name.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesKyc = kycStatusFilter === 'all' || user.kyc_status === kycStatusFilter;
      const matchesActive = isActiveFilter === 'all' || user.is_active.toString() === isActiveFilter;
      const matchesPlan = tradingPlanFilter === 'all' || user.trading_plan_id.toString() === tradingPlanFilter;
      return matchesSearch && matchesKyc && matchesActive && matchesPlan;
    });
  }, [users, searchTerm, kycStatusFilter, isActiveFilter, tradingPlanFilter]);

  const getKycStatusBadge = (status: KycStatus) => {
    switch (status) {
      case 'VERIFIED': return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Verified</Badge>;
      case 'PENDING_REVIEW': return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-black">Pending</Badge>;
      case 'REJECTED': return <Badge variant="destructive">Rejected</Badge>;
      case 'NOT_SUBMITTED':
      default: return <Badge variant="outline">Not Submitted</Badge>;
    }
  };
  
  const kycStatuses: KycStatus[] = ['VERIFIED', 'PENDING_REVIEW', 'REJECTED', 'NOT_SUBMITTED'];

  return (
    <Card className="shadow-lg">
      <CardContent className="p-0">
        <div className="p-4 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between border-b">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-full"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={kycStatusFilter} onValueChange={(value) => setKycStatusFilter(value as KycStatus | 'all')}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="KYC Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All KYC Statuses</SelectItem>
                {kycStatuses.map(status => (
                  <SelectItem key={status} value={status}>{status.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={isActiveFilter} onValueChange={(value) => setIsActiveFilter(value as 'all' | 'true' | 'false')}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Active Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Active</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
             <Select value={tradingPlanFilter} onValueChange={(value) => setTradingPlanFilter(value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Trading Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                {mockTradingPlans.map(plan => (
                  <SelectItem key={plan.id} value={plan.id.toString()}>{plan.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>KYC Status</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Trading Plan</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Link href={`/users/${user.id}`} className="font-medium text-primary hover:underline">
                      {user.username}
                    </Link>
                    <p className="text-xs text-muted-foreground">{user.first_name} {user.last_name}</p>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getKycStatusBadge(user.kyc_status)}</TableCell>
                  <TableCell>
                    {user.is_active ? 
                      <CheckCircle className="h-5 w-5 text-green-500" /> : 
                      <XCircle className="h-5 w-5 text-red-500" />}
                  </TableCell>
                  <TableCell>{mockTradingPlans.find(p => p.id === user.trading_plan_id)?.name || 'N/A'}</TableCell>
                  <TableCell>{format(new Date(user.created_at), 'MMM dd, yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-5 w-5" />
                          <span className="sr-only">User Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/users/${user.id}`} className="flex items-center">
                            <Eye className="mr-2 h-4 w-4" /> View Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => alert('Edit user: Not implemented yet.')} className="flex items-center">
                           <Edit3 className="mr-2 h-4 w-4" /> Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(user.id, user.is_active)} className="flex items-center">
                          {user.is_active ? <XCircle className="mr-2 h-4 w-4 text-red-500" /> : <CheckCircle className="mr-2 h-4 w-4 text-green-500" />}
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => alert('Delete user: Not implemented yet.')} className="text-red-600 flex items-center">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {/* Basic Pagination Placeholder */}
        <div className="p-4 border-t flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Showing {filteredUsers.length} of {users.length} users.</p>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>Previous</Button>
                <Button variant="outline" size="sm" disabled>Next</Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
