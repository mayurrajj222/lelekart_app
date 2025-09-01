import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useNotifications } from '@/contexts/notification-context';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NotificationList } from './notification-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  className?: string;
  iconClassName?: string;
  badgeClassName?: string;
}

export function NotificationBell({ 
  className = "", 
  iconClassName = "",
  badgeClassName = ""
}: NotificationBellProps) {
  const { unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn("relative", className)}
        >
          <Bell className={cn("h-5 w-5", iconClassName)} />
          {unreadCount > 0 && (
            <span className={cn(
              "absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground",
              badgeClassName
            )}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0 shadow-lg" align="end">
        <div className="flex items-center justify-between p-3 bg-primary text-primary-foreground">
          <h4 className="font-medium">Notifications</h4>
          <div className="flex items-center gap-2">
            <NotificationActions />
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-primary-foreground hover:bg-primary/90"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid grid-cols-3 bg-muted/50 rounded-none h-10">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="unread" className="text-xs">Unread</TabsTrigger>
            <TabsTrigger value="important" className="text-xs">Important</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-0 p-0">
            <ScrollArea className="h-[350px]">
              <NotificationList filter="all" />
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="unread" className="mt-0 p-0">
            <ScrollArea className="h-[350px]">
              <NotificationList filter="unread" />
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="important" className="mt-0 p-0">
            <ScrollArea className="h-[350px]">
              <NotificationList filter="important" />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

function NotificationActions() {
  const { markAllAsRead, deleteAllNotifications } = useNotifications();

  return (
    <div className="flex gap-1">
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-7 text-xs text-primary-foreground hover:bg-primary/90"
        onClick={markAllAsRead}
      >
        Mark all as read
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-7 text-xs text-primary-foreground hover:bg-primary/90"
        onClick={deleteAllNotifications}
      >
        Clear all
      </Button>
    </div>
  );
}