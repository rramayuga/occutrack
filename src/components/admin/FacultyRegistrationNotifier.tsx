
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  Popover, 
  PopoverContent,
  PopoverTrigger 
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';

const FacultyRegistrationNotifier = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Only run this for admin and superadmin users
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return;
    }

    // Fetch pending faculty requests
    const fetchPendingRequests = async () => {
      try {
        const { data, error } = await supabase
          .from('faculty_requests')
          .select('id')
          .eq('status', 'pending');
          
        if (error) throw error;
        
        setPendingCount(data?.length || 0);

        // Show a toast notification if there are pending requests
        if (data && data.length > 0) {
          toast({
            title: "Faculty Requests Pending",
            description: `${data.length} faculty registration requests await your approval.`,
            duration: 5000,
          });
        }
      } catch (error) {
        console.error('Error fetching pending faculty requests:', error);
      }
    };

    fetchPendingRequests();

    // Set up a subscription for real-time updates
    const facultyChannel = supabase
      .channel('faculty_requests_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'faculty_requests' 
      }, fetchPendingRequests)
      .subscribe();

    return () => {
      supabase.removeChannel(facultyChannel);
    };
  }, [user]);

  // Don't render anything if user is not admin/superadmin or if there are no pending requests
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin') || pendingCount === 0) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative mr-2"
          aria-label="Notifications"
        >
          <Bell className="h-[1.2rem] w-[1.2rem]" />
          <Badge 
            className="absolute -top-1 -right-1 px-1 min-w-[1.2rem] h-[1.2rem] flex items-center justify-center"
            variant="destructive"
          >
            {pendingCount}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="p-4 border-b">
          <div className="font-medium">Faculty Registration Requests</div>
          <div className="text-sm text-muted-foreground">
            {pendingCount} {pendingCount === 1 ? 'request' : 'requests'} pending approval
          </div>
        </div>
        <div className="p-4">
          <Link 
            to="/faculty-management"
            className="block w-full"
            onClick={() => setIsOpen(false)}
          >
            <Button className="w-full">Review Requests</Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default FacultyRegistrationNotifier;
