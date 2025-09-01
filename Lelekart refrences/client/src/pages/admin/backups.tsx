import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Download, Trash2, Play, Calendar, Clock, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { Redirect } from 'wouter';
import AdminLayout from '@/components/admin/admin-layout';

interface BackupFile {
  name: string;
  date: string;
  size: string;
}

interface ScheduleInfo {
  isScheduled: boolean;
  nextRunTime: string | null;
  timeUntilNextRun: number | null;
}

export default function AdminBackupsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [hour, setHour] = useState<string>('0');
  const [minute, setMinute] = useState<string>('0');

  // Fetch backup files list
  const { data: backups, isLoading: backupsLoading } = useQuery({
    queryKey: ['/api/admin/backups'],
    queryFn: async () => {
      const res = await fetch('/api/admin/backups', {
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch backups');
      }
      
      return res.json();
    },
    staleTime: 30000, // 30 seconds
  });

  // Fetch backup schedule info
  const { data: scheduleInfo, isLoading: scheduleLoading } = useQuery({
    queryKey: ['/api/admin/backups/schedule'],
    queryFn: async () => {
      const res = await fetch('/api/admin/backups/schedule', {
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch schedule info');
      }
      
      return res.json();
    },
    staleTime: 30000, // 30 seconds
  });

  // Run immediate backup mutation
  const runBackupMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/backups/run', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error('Failed to run backup');
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Backup started',
        description: 'Backup process has been initiated successfully.',
      });
      
      // Refetch backup files after a short delay to allow backup to complete
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/backups'] });
      }, 3000);
    },
    onError: (error) => {
      toast({
        title: 'Backup failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Schedule backup mutation
  const scheduleBackupMutation = useMutation({
    mutationFn: async (data: { hour: string; minute: string }) => {
      const res = await fetch('/api/admin/backups/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        throw new Error('Failed to schedule backup');
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Backup scheduled',
        description: 'Daily backup has been scheduled successfully.',
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/backups/schedule'] });
    },
    onError: (error) => {
      toast({
        title: 'Scheduling failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Cancel scheduled backup mutation
  const cancelScheduleMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/backups/schedule', {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error('Failed to cancel scheduled backup');
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Schedule cancelled',
        description: 'Scheduled backup has been cancelled.',
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/backups/schedule'] });
    },
    onError: (error) => {
      toast({
        title: 'Cancellation failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete backup file mutation
  const deleteBackupMutation = useMutation({
    mutationFn: async (filename: string) => {
      const res = await fetch(`/api/admin/backups/${filename}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error('Failed to delete backup file');
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'File deleted',
        description: 'Backup file has been deleted successfully.',
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/backups'] });
    },
    onError: (error) => {
      toast({
        title: 'Deletion failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Download backup file
  const handleDownload = (filename: string) => {
    window.open(`/api/admin/backups/${filename}`, '_blank');
  };

  // Helper to format the time until next backup
  const formatTimeUntilNextRun = (ms: number | null) => {
    if (!ms) return 'Unknown';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''} ${hours % 24} hr${hours % 24 !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes % 60} min${minutes % 60 !== 1 ? 's' : ''}`;
    } else {
      return `${minutes} min${minutes !== 1 ? 's' : ''} ${seconds % 60} sec${seconds % 60 !== 1 ? 's' : ''}`;
    }
  };

  // If user is not authenticated or not an admin, redirect to the auth page
  if (!authLoading && (!user || user.role !== 'admin')) {
    return <Redirect to="/auth" />;
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-4 md:py-6 px-2 md:px-0">
        <h1 className="text-lg md:text-3xl font-bold mb-4 md:mb-6">Database Backup Management</h1>
        <Tabs defaultValue="manage">
          <div className="overflow-x-auto">
            <TabsList className="mb-3 md:mb-4 min-w-max">
              <TabsTrigger value="manage" className="text-xs md:text-sm">Backup Files</TabsTrigger>
              <TabsTrigger value="schedule" className="text-xs md:text-sm">Schedule Settings</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="manage">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-4 md:mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Data</CardTitle>
                  <CardDescription>Backup of buyers and sellers</CardDescription>
                </CardHeader>
                <CardContent>
                  {backupsLoading ? (
                    <div className="flex justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : backups?.users?.length > 0 ? (
                    <ul className="space-y-2">
                      {backups.users.slice(0, 5).map((file: string) => (
                        <li key={file} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                          <span className="text-xs md:text-sm truncate flex-1" title={file}>{file}</span>
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDownload(file)}
                              title="Download"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => deleteBackupMutation.mutate(file)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </li>
                      ))}
                      {backups.users.length > 5 && (
                        <li className="text-center text-xs md:text-sm text-muted-foreground">
                          +{backups.users.length - 5} more files
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-center text-xs md:text-sm text-muted-foreground">No user backup files found</p>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Product Data</CardTitle>
                  <CardDescription>Backup of all products</CardDescription>
                </CardHeader>
                <CardContent>
                  {backupsLoading ? (
                    <div className="flex justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : backups?.products?.length > 0 ? (
                    <ul className="space-y-2">
                      {backups.products.slice(0, 5).map((file: string) => (
                        <li key={file} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                          <span className="text-xs md:text-sm truncate flex-1" title={file}>{file}</span>
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDownload(file)}
                              title="Download"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => deleteBackupMutation.mutate(file)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </li>
                      ))}
                      {backups.products.length > 5 && (
                        <li className="text-center text-xs md:text-sm text-muted-foreground">
                          +{backups.products.length - 5} more files
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-center text-xs md:text-sm text-muted-foreground">No product backup files found</p>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Order Data</CardTitle>
                  <CardDescription>Backup of all orders</CardDescription>
                </CardHeader>
                <CardContent>
                  {backupsLoading ? (
                    <div className="flex justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : backups?.orders?.length > 0 ? (
                    <ul className="space-y-2">
                      {backups.orders.slice(0, 5).map((file: string) => (
                        <li key={file} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                          <span className="text-xs md:text-sm truncate flex-1" title={file}>{file}</span>
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDownload(file)}
                              title="Download"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => deleteBackupMutation.mutate(file)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </li>
                      ))}
                      {backups.orders.length > 5 && (
                        <li className="text-center text-xs md:text-sm text-muted-foreground">
                          +{backups.orders.length - 5} more files
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-center text-xs md:text-sm text-muted-foreground">No order backup files found</p>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Manual Backup</CardTitle>
                <CardDescription className="text-xs md:text-base">Create a backup of all data now</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-xs md:text-sm">
                  This will create a full backup of users, products, and orders data immediately.
                  The backup will be stored as CSV files that can be downloaded for safekeeping.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => runBackupMutation.mutate()}
                  disabled={runBackupMutation.isPending}
                >
                  {runBackupMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running backup...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Run backup now
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="schedule">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Current Schedule</CardTitle>
                  <CardDescription>View and manage the automatic backup schedule</CardDescription>
                </CardHeader>
                <CardContent>
                  {scheduleLoading ? (
                    <div className="flex justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center mb-4">
                        <div className={`h-3 w-3 rounded-full mr-2 ${scheduleInfo?.isScheduled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span>{scheduleInfo?.isScheduled ? 'Active' : 'Not scheduled'}</span>
                      </div>
                      
                      {scheduleInfo?.isScheduled && (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Next backup</Label>
                              <div className="flex items-center mt-1 text-sm">
                                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                {new Date(scheduleInfo.nextRunTime).toLocaleDateString()}
                              </div>
                              <div className="flex items-center mt-1 text-sm">
                                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                {new Date(scheduleInfo.nextRunTime).toLocaleTimeString()}
                              </div>
                            </div>
                            <div>
                              <Label>Time remaining</Label>
                              <div className="flex items-center mt-1 text-sm">
                                <div className="bg-muted px-2 py-1 rounded-md mt-1">
                                  {formatTimeUntilNextRun(scheduleInfo.timeUntilNextRun)}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => cancelScheduleMutation.mutate()}
                              disabled={cancelScheduleMutation.isPending}
                            >
                              {cancelScheduleMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Cancelling...
                                </>
                              ) : (
                                <>
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Cancel schedule
                                </>
                              )}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Schedule Settings</CardTitle>
                  <CardDescription>Set up automatic daily backups</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p>
                      Schedule a daily backup at your preferred time. The system will automatically
                      export all data to CSV files that you can download from the Backup Files tab.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="hour">Hour (0-23)</Label>
                        <Input
                          id="hour"
                          type="number"
                          min="0"
                          max="23"
                          value={hour}
                          onChange={(e) => setHour(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="minute">Minute (0-59)</Label>
                        <Input
                          id="minute"
                          type="number"
                          min="0"
                          max="59"
                          value={minute}
                          onChange={(e) => setMinute(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      Time is based on server time. Current server time: {new Date().toLocaleTimeString()}
                    </p>
                    
                    <Button
                      onClick={() => scheduleBackupMutation.mutate({ hour, minute })}
                      disabled={scheduleBackupMutation.isPending}
                    >
                      {scheduleBackupMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Scheduling...
                        </>
                      ) : (
                        <>
                          <Calendar className="mr-2 h-4 w-4" />
                          Schedule backup
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}