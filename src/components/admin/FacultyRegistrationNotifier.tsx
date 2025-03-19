
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';

const FacultyRegistrationNotifier = () => {
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  
  useEffect(() => {
    if (!isAdmin) return;
    
    fetchPendingRequests();
    
    // Set up subscription for real-time updates
    const channel = supabase
      .channel('faculty_requests_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'faculty_requests',
        filter: 'status=eq.pending'
      }, () => {
        fetchPendingRequests();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);
  
  const fetchPendingRequests = async () => {
    if (!isAdmin) return;
    
    try {
      const { data, error } = await supabase
        .from('faculty_requests')
        .select('*')
        .eq('status', 'pending');
        
      if (error) throw error;
      setPendingRequests(data || []);
      
      // Show a toast notification for new requests
      if (data && data.length > 0) {
        toast({
          title: "Faculty Registration Requests",
          description: `You have ${data.length} pending faculty registration requests to review.`,
        });
      }
    } catch (error) {
      console.error('Error fetching pending faculty requests:', error);
    }
  };
  
  const handleApproveRequest = async (id: string) => {
    try {
      const { error } = await supabase
        .from('faculty_requests')
        .update({ status: 'approved' })
        .eq('id', id);
        
      if (error) throw error;
      
      // Update the user's role to 'faculty'
      const request = pendingRequests.find(req => req.id === id);
      if (request && request.user_id) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ role: 'faculty' })
          .eq('id', request.user_id);
          
        if (profileError) throw profileError;
      }
      
      toast({
        title: "Success",
        description: "Faculty request approved successfully.",
      });
      
      // Update local state
      setPendingRequests(pendingRequests.filter(req => req.id !== id));
    } catch (error) {
      console.error('Error approving faculty request:', error);
      toast({
        title: "Error",
        description: "Failed to approve faculty request.",
        variant: "destructive"
      });
    }
  };
  
  const handleRejectRequest = async (id: string) => {
    try {
      const { error } = await supabase
        .from('faculty_requests')
        .update({ status: 'rejected' })
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Faculty request rejected.",
      });
      
      // Update local state
      setPendingRequests(pendingRequests.filter(req => req.id !== id));
    } catch (error) {
      console.error('Error rejecting faculty request:', error);
      toast({
        title: "Error",
        description: "Failed to reject faculty request.",
        variant: "destructive"
      });
    }
  };
  
  if (!isAdmin || pendingRequests.length === 0) return null;
  
  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative p-2">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 px-1.5 h-5 min-w-5 flex items-center justify-center">
              {pendingRequests.length}
            </Badge>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <div className="flex items-center justify-between p-2 border-b">
            <span className="font-medium">Faculty Registration Requests</span>
            <Badge variant="outline">{pendingRequests.length}</Badge>
          </div>
          <div className="max-h-96 overflow-auto">
            {pendingRequests.map(request => (
              <div key={request.id} className="p-3 border-b last:border-0">
                <div className="font-medium">{request.name}</div>
                <div className="text-sm text-muted-foreground mb-1">{request.email}</div>
                <div className="text-sm">Department: {request.department}</div>
                {request.notes && (
                  <div className="text-sm mt-1 text-muted-foreground">Notes: {request.notes}</div>
                )}
                <div className="flex justify-end gap-2 mt-2">
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleRejectRequest(request.id)}
                  >
                    Reject
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => handleApproveRequest(request.id)}
                  >
                    Approve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default FacultyRegistrationNotifier;
