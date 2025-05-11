
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, UserRole } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { ArrowLeft, Edit2, Loader2, Save } from 'lucide-react';
import UserRoleSelector from '@/components/admin/users/UserRoleSelector';
import Navbar from '@/components/layout/Navbar';

const UserDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  
  // Check if current user has admin rights
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  const isSuperAdmin = currentUser?.role === 'superadmin';
  
  useEffect(() => {
    if (!id || !isAdmin) return;
    
    const fetchUser = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        
        if (data) {
          const userData: User = {
            id: data.id,
            name: data.name,
            email: data.email,
            role: data.role as UserRole,
            avatarUrl: data.avatar
          };
          
          setUser(userData);
          setFormData(userData);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        toast({
          title: 'Error',
          description: 'Failed to load user data',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [id, isAdmin]);

  // Redirect if not admin
  useEffect(() => {
    if (currentUser && !isAdmin) {
      navigate('/');
    }
  }, [currentUser, isAdmin, navigate]);

  // Handle role changes - only superadmin can change admin roles
  const canChangeRole = (role: UserRole) => {
    if (isSuperAdmin) return true; // Superadmins can change any role
    if (currentUser?.role === 'admin') {
      // Admins can only change faculty and student roles
      return role === 'faculty' || role === 'student';
    }
    return false;
  };

  const handleSave = async () => {
    if (!user || !formData) return;
    
    try {
      setSaving(true);
      
      // Super admin check for role changes
      if (formData.role !== user.role && !canChangeRole(user.role)) {
        toast({
          title: 'Permission Denied',
          description: 'You do not have permission to change this user role',
          variant: 'destructive'
        });
        return;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          role: formData.role
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'User details updated successfully'
      });
      
      // Refresh user data
      setUser({
        ...user,
        ...formData
      });
      
      // Exit edit mode
      navigate(`/users/${id}`);
      
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user details',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-8 pt-20">
        <Button
          variant="outline"
          className="mb-6"
          onClick={() => navigate('/user-rights')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to User Management
        </Button>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !user ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">User not found</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Details</CardTitle>
                  <CardDescription>View and manage user information</CardDescription>
                </div>
                {isEditMode && (
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                )}
                {!isEditMode && (
                  <Button onClick={() => navigate(`/users/${id}?edit=true`)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit User
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <Avatar className="h-20 w-20">
                  {user.avatarUrl ? (
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                  ) : (
                    <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                  )}
                </Avatar>
                
                <div className="flex-1">
                  {isEditMode ? (
                    <div className="space-y-3">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input 
                          id="name" 
                          value={formData.name || ''} 
                          onChange={(e) => setFormData({...formData, name: e.target.value})} 
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-2xl font-bold">{user.name}</h3>
                      <p className="text-muted-foreground">{user.email}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="p-2 border rounded-md bg-muted/30">{user.email}</div>
                </div>
                
                <div className="space-y-2">
                  <Label>Role</Label>
                  {isEditMode ? (
                    <UserRoleSelector
                      currentRole={formData.role as UserRole}
                      onRoleChange={(newRole) => setFormData({...formData, role: newRole})}
                      disabled={!canChangeRole(user.role)}
                    />
                  ) : (
                    <div className="p-2 border rounded-md bg-muted/30 capitalize">{user.role}</div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>User ID</Label>
                <div className="p-2 border rounded-md bg-muted/30 text-sm font-mono">{user.id}</div>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => navigate('/user-rights')}>
                Back to Users
              </Button>
              
              {!isEditMode && (
                <Button 
                  variant="outline" 
                  onClick={() => navigate(`/users/${id}?edit=true`)}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UserDetail;
