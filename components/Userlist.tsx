"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import { Label } from "@/components/ui/label"
import Avatar from 'react-avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Pen,X ,Plus,Users,Users2Icon,UserCog ,Trash} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import localizedFormat from 'dayjs/plugin/localizedFormat'

dayjs.extend(relativeTime)
dayjs.extend(localizedFormat)

interface User{
    id?: string,
    email?: string,
    name?: string,
    role?: string,
    profile_image_url?: string,
    token?: string,
    token_type?: string,
    expires_at?: string,
    permissions?: any,
    bio?: string,
    gender?: string,
    date_of_birth?: string
}

interface Group {
  id: string;
  user_id: string;
  name: string;
  description: string;
  permissions: any;
  data: any;
  meta: any;
  user_ids: string[];
  created_at: number;
  updated_at: number;
}

interface GroupForm {
  name: string;
  description: string;
  permissions?: any;
}

interface GroupUpdateForm extends GroupForm {
  user_ids?: string[];
}

interface UserTableItem {
  id: string;
  name: string;
  email: string;
  role: string;
  date_of_birth?: string;
  last_active_at?: number;
  created_at?: number;
  updated_at?: number;
  last_seen_at?: number;
  profile_image_url?: string;
  password?: string;
  oauth_sub?:string
}

interface AudioConfig {
   stt: {
     ENGINE?: string,
     OPENAI_API_BASE_URL?: string,
     OPENAI_API_KEY?: string,
     DEEPGRAM_API_KEY?: string,
     API_KEY?:string
   },
   tts: {
     ENGINE?: string,
     VOICE?: string,
     SPLIT_ON?: string,
     MODEL?: string,
   }
}

interface UsersResponse {
  users: UserTableItem[];
  total_pages: number;
  total_users: number;
  page: number;
  limit: number;
}

export function UserList() {
  const [user, setUser] = useState<User>({} as User)
  const WEBUI_BASE_URL = process.env.NEXT_PUBLIC_WEBUI_BASE_URL || "http://localhost:3000" || "http://localhost:8080";
  const [users, setUsers] = useState<UserTableItem[]>([]);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserTableItem | null>(null);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [allUsers, setAllUsers] = useState<UserTableItem[]>([]);
  const [groupUsers, setGroupUsers] = useState<{[key: string]: boolean}>({});
  const [activeGroupTab, setActiveGroupTab] = useState("general");
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "user"
  });
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: ""
  });
  const isAdminUser = user.role === 'admin';
  const isAdminCount = users.filter(u => u.role === 'admin').length;
  const isLastAdmin = isAdminUser && isAdminCount === 1;
  const [groups, setGroups] = useState<Group[]>([]);
  
  const fetchGroups = async() =>{
        try{
            const response = await apiClient.getgroups()
            if (response.data) {
              setGroups(response.data);
            }
        }
        catch(error){
          console.error("Error fetching groups:", error);
        }
      }
      
      const fetchAllUsers = async () => {
        try {
          const response = await apiClient.getAllUsers();
          if (response.success && response.data) {
            setAllUsers(response.data?.users);
            console.log(allUsers)
          }
        } catch (error) {
          console.error("Error fetching all users:", error);
          setAllUsers([]);
        }
      }
      
      useEffect(() => {
        const fetchUsers = async () => {
          try {
            const response = await apiClient.getSessionUser();
            if (response.data) {
              setUser(prevUser => ({
                ...prevUser,
                ...response.data
              }));
            }
          } catch (error) {
            console.error("Error fetching users:", error);
          }
        }
        
        fetchGroups()
        fetchUsers()
        fetchAllUsers()
      }, [])

  const fetchPaginatedUsers = async (page: number = 1) => {
    setLoading(true);
    try {
      const response = await apiClient.getUsers(page);
      if (response.data) {
        const usersData: UsersResponse = response.data;
        setUsers(usersData.users);
        setTotalPages(usersData.total_pages);
        setTotalUsers(usersData.total_users);
        setCurrentPage(usersData.page);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaginatedUsers(currentPage);
  }, [currentPage]);

  const handleUpdateUser = async (userData: UserTableItem) => {
    try {
      // Check if this is an attempt to change the role of the last admin user
      const isAdminUser = userData.role === 'admin';
      const isAdminCount = users.filter(u => u.role === 'admin').length;
      
      // If this is the last admin and we're trying to change their role, prevent it
      if (!isAdminUser && isAdminCount === 1 && users.find(u => u.id === userData.id)?.role === 'admin') {
        toast({
          title: "Error",
          description: "Cannot change role of the last admin user",
          variant: "destructive"
        });
        return;
      }

      const response = await apiClient.updateUser(userData.id, {
        name: userData.name,
        email: userData.email,
        role: userData.role
      });
      
      if (response.success) {
        toast({
          title: "Success",
          description: "User updated successfully",
          variant: "default"
        });
        
        // Update the user in the local state
        setUsers(users.map(u => u.id === userData.id ? userData : u));
        setIsEditingUser(false);
        setCurrentUser(null);
        
        // Refresh the user list
        fetchPaginatedUsers(currentPage);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update user",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive"
      });
      console.error("Error updating user:", error);
    }
  };
  const confirm = async (text: string) => {
    
    const confirmed = await new Promise<boolean>((resolve) => {
      const dialog = document.createElement('div');
      dialog.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
      dialog.innerHTML = `
        <div class="glass border-primary/20 p-6 w-full max-w-md rounded-lg">
          <h3 class="text-lg font-semibold mb-4">Confirm Deletion</h3>
          <p class="mb-6">${text}</p>
          <div class="flex justify-end space-x-2">
            <button id="cancel-btn" class="px-4 py-2 border border-primary/30 rounded-md">Cancel</button>
            <button id="confirm-btn" class="px-4 py-2 bg-destructive text-white rounded-md">Delete</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(dialog);
      
      const cancelBtn = dialog.querySelector('#cancel-btn');
      const confirmBtn = dialog.querySelector('#confirm-btn');
      
      const closeDialog = () => {
        document.body.removeChild(dialog);
      };
      
      cancelBtn?.addEventListener('click', () => {
        resolve(false);
        closeDialog();
      });
      
      confirmBtn?.addEventListener('click', () => {
        resolve(true);
        closeDialog();
      });
    });
    return confirmed; // Return the resolved value, not the function
  };

  const handleDeleteUser = async (userId: string) => {
    // Find the user to get their name for the confirmation dialog
    const userToDelete = users.find(user => user.id === userId);
    const userName = userToDelete?.name || 'this user';
    
    // Show custom confirmation dialog
    const confirmed = await confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)
    
    if (!confirmed) {
      return; 
    }
    
    try {
      const response = await apiClient.deleteUser(userId);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "User deleted successfully",
          variant: "default"
        });
        
        // Refresh the user list
        fetchPaginatedUsers(currentPage);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to delete user",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive"
      });
      console.error("Error deleting user:", error);
    }
  };

  
  const openEditUserModal = (user: UserTableItem) => {
    setCurrentUser(user);
    setIsEditingUser(true);
  };
  
  const closeEditUserModal = () => {
    setIsEditingUser(false);
    setCurrentUser(null);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleAddUser = async () => {
    try {
      const response = await apiClient.addUser({
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role
      });
      
      if (response.success) {
        toast({
          title: "Success",
          description: "User added successfully",
          variant: "default"
        });
        
        // Reset the form
        setNewUser({
          name: "",
          email: "",
          password: "",
          role: "user"
        });
        
        // Close the modal
        setIsAddingUser(false);
        
        // Refresh the user list
        fetchPaginatedUsers(currentPage);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to add user",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add user",
        variant: "destructive"
      });
    }
  };

  const handleAddGroup = async () => {
    try {
      const response = await apiClient.addGroup({
        name: newGroup.name,
        description: newGroup.description,
      });
      
      if (response.success) {
        toast({
          title: "Success",
          description: "User added successfully",
          variant: "default"
        });
        
        // Reset the form
        setNewGroup({
          name: "",
          description: "",
        });
        
        // Close the modal
        setIsAddingGroup(false);
        
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to add user",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add user",
        variant: "destructive"
      });
    }
  };

  const openAddUserModal = () => {
    setIsAddingUser(true);
  };

  const closeAddUserModal = () => {
    setIsAddingUser(false);
    setNewUser({
      name: "",
      email: "",
      password: "",
      role: "user"
    });
  };
  const openAddGroupModal = () => {
    setIsAddingGroup(true);
  };
  const closeAddGroupModal = () => {
    setIsAddingGroup(false);
  };
  
  const openEditGroupModal = (group: Group) => {
    setCurrentGroup(group);
    // Initialize group users map
    const usersMap: {[key: string]: boolean} = {};
    
     
    users.forEach(user => {
        usersMap[user.id] = group.user_ids.includes(user.id);
      });
    
    setGroupUsers(usersMap);
    setActiveGroupTab("general");
    setIsEditingGroup(true);
  };

  const closeEditGroupModal = () => {
    setIsEditingGroup(false);
    setCurrentGroup(null);
    setGroupUsers({});
  };

  const handleGroupUserChange = (userId: string, checked: boolean) => {
    setGroupUsers(prev => ({
      ...prev,
      [userId]: checked
    }));
  };

  const handleUpdateGroup = async () => {
    if (!currentGroup) return;
    
    try {
      // Get selected user IDs
      const selectedUserIds = Object.entries(groupUsers)
        .filter(([_, selected]) => selected)
        .map(([userId, _]) => userId);
      
      const updateData: GroupUpdateForm = {
        name: currentGroup.name,
        description: currentGroup.description,
        user_ids: selectedUserIds
      };
      
      const response = await apiClient.updateGroup({id: currentGroup.id, ...updateData});
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Group updated successfully",
          variant: "default"
        });
        
        // Refresh groups
        fetchGroups();
        closeEditGroupModal();
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update group",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update group",
        variant: "destructive"
      });
      console.error("Error updating group:", error);
    }
  };

  const handleDeleteGroup = async () => {
    if (!currentGroup) return;
    
    try {
      const response = await apiClient.deleteGroup(currentGroup.id);
      console.log(response)
      if (response.success) {
        toast({
          title: "Success",
          description: "Group deleted successfully",
          variant: "default"
        });
        
        fetchGroups();
        closeEditGroupModal();
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to delete group",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete group",
        variant: "destructive"
      });
      console.error("Error deleting group:", error);
    }
  };
  return (
    <>
        <Tabs defaultValue="overview">
        <TabsList className="glass border-primary/20">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary/20">
            <Users/>
            OverView
          </TabsTrigger>
          <TabsTrigger value="groups" className="data-[state=active]:bg-primary/20">
            <UserCog/>
            Groups
          </TabsTrigger>
        </TabsList>
          <TabsContent value="overview">

          <Card className="glass border-primary/20 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">User Management</h2>
              <Button onClick={openAddUserModal} className="neon-glow">
                <Plus/>
              </Button>
            </div>
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-primary/20">
                        <th className="text-left py-3 px-4">Role</th>
                        <th className="text-left py-3 px-4 items-center">Name</th>
                        <th className="text-left py-3 px-4">Email</th>
                        <th className="text-left py-3 px-4">Last Active</th>
                        <th className="text-left py-3 px-4">Created At</th>
                        <th className="text-left py-3 px-4">OAUTH ID</th>
                        <th className="text-left py-3 px-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => {
                        return (
                          <tr key={user.id} className="border-b border-primary/10 hover:bg-primary/5">
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs  ${user.role === 'admin' ? 'bg-primary/20 text-primary text-red-500' : 'bg-secondary/20 text-primary/50'} `}>
                                {user.role.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-4">
                                {user.profile_image_url ? (
                                <img 
                                  src={`${user.profile_image_url}`} 
                                  alt="User Avatar" 
                                  className="w-10 h-10 rounded-full"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement?.querySelector('.fallback-avatar')?.classList.remove('hidden');
                                  }}
                                  
                                />
                                
                              ) : null}
                              <div className="fallback-avatar hidden">
                                <Avatar name={user.name} size="25" round={true} />
                              </div>
                              <span className="ml-2">{user.name}</span>

                              </div>
                            </td>
                            <td className="py-3 px-4">{user.email}</td>
                            <td className="py-3 px-4">
                              {user.last_active_at ? 
                                dayjs(user.last_active_at * 1000).fromNow() : 
                                "Never"
                              }
                            </td>
                            <td className="py-3 px-4">
                              {user.created_at ? 
                                dayjs(user.created_at * 1000).format('LL') : 
                                "Never"
                              }
                            </td>
                            <td className="py-3 px-4">
                              {user.oauth_sub}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => openEditUserModal(user)}
                                  className="glass border-primary/30"
                                >
                                  <Pen/>
                                </Button>
                                {user.role!=="admin" && (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="glass border-primary/30"
                                  >
                                    <Trash/>
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination Controls */}
                <div className="flex justify-between items-center mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing page {currentPage} of {totalPages} ({totalUsers} total users)
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="glass border-primary/30"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="glass border-primary/30"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
          </TabsContent>
          <TabsContent value="groups">
        <Card className="glass border-primary/20 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              Groups ({groups.length})
            </h2>
            <Button onClick={openAddGroupModal} className="neon-glow">
              <Plus/>
            </Button>
          </div>
          
          {groups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No groups found. Create a new group to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-primary/20">
                    <th className="text-left py-3 px-4">Group Name</th>
                    <th className="text-left py-3 px-4">Users</th>
                    <th className="text-left py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => (
                    <tr key={group.id} className="border-b border-primary/10 hover:bg-primary/5">
                      <td className="py-3 px-4 font-medium">{group.name}</td>
                      <td className="py-3 px-4">
                        <div className="py-3 px-5">
                          {group.user_ids.length} <Users/>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => openEditGroupModal(group)}
                          className="glass border-primary/30"
                        >
                          <Pen className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </TabsContent>
        </Tabs>
          
          {/* Add User Modal */}
          {isAddingUser && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="glass border-primary/20 p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">Add New User</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="add-name">Name</Label>
                    <Input
                      id="add-name"
                      value={newUser.name}
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                      className="glass border-primary/20"
                      placeholder="Enter user's name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-email">Email</Label>
                    <Input
                      id="add-email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      className="glass border-primary/20"
                      placeholder="Enter user's email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-password">Password</Label>
                    <Input
                      id="add-password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      className="glass border-primary/20"
                      placeholder="Enter password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-role">Role</Label>
                    <Select 
                      value={newUser.role} 
                      onValueChange={(value) => setNewUser({...newUser, role: value})}
                    >
                      <SelectTrigger className="glass border-primary/20">
                        <SelectValue placeholder="Select Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={closeAddUserModal}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAddUser}
                      disabled={!newUser.name || !newUser.email || !newUser.password}
                    >
                      Add User
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
          
          {/* User Edit Modal */}
          {isEditingUser && currentUser && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="glass border-primary/20 p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <User className="w-6 h-6 mr-2" />
                    <span>Edit User</span>
                  </h3>
                  <Button variant="outline" onClick={closeEditUserModal} size="sm">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-4 mb-4">
                    {currentUser.profile_image_url ? (
                      <img 
                        src={`${currentUser.profile_image_url}`} 
                        alt="User Avatar" 
                        className="w-10 h-10 rounded-full"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement?.querySelector('.fallback-avatar')?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className="fallback-avatar hidden">
                      <Avatar name={currentUser.name} size="50" round={true} />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-lg font-semibold">{currentUser.name}</h3>
                      <p className="text-sm text-muted-foreground">{currentUser.created_at ? 
                                dayjs(currentUser.created_at * 1000).format('LL') : 
                                "Never"
                              }</p>
                    </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Name</Label>
                    <Input
                      id="edit-name"
                      value={currentUser.name}
                      onChange={(e) => setCurrentUser({...currentUser, name: e.target.value})}
                      className="glass border-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={currentUser.email}
                      onChange={(e) => setCurrentUser({...currentUser, email: e.target.value})}
                      className="glass border-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-role">Role</Label>
                    {(() => {
                      // Check if this is the last admin user
                      const isAdminUser = currentUser.role === 'admin';
                      const isAdminCount = users.filter(u => u.role === 'admin').length;
                      const isLastAdmin = isAdminUser && isAdminCount === 1;
                      
                      return (
                        <>
                          <Select 
                            value={currentUser.role} 
                            onValueChange={(value) => setCurrentUser({...currentUser, role: value})}
                            disabled={isLastAdmin}
                          >
                            <SelectTrigger className="glass border-primary/20">
                              <SelectValue placeholder="Select Role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          {isLastAdmin && (
                            <p className="text-xs text-muted-foreground mt-1">
                              The role of the last admin user cannot be changed.
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  <div className="space-y-2"> 
                  <Label htmlFor="edit-password">New Password</Label>
                  <Input
                    id="edit-password"
                    type="password"
                    value={currentUser.password}
                    onChange={(e) => setCurrentUser({...currentUser, password: e.target.value})}
                    className="glass border-primary/20"
                    placeholder="Enter new password"
                  />
                  </div>
                  <div className="space-y-2"> 
                  <Label htmlFor="edit-date-of-birth">Date of Birth</Label>
                    <Input
                      id="edit-date-of-birth"
                      type="date"
                      value={currentUser.date_of_birth}
                      onChange={(e) => setCurrentUser({...currentUser, date_of_birth: e.target.value})}
                      className="glass border-primary/20"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button 
                                  size="sm" 
                                  variant="destructive" 
                                  onClick={() => handleDeleteUser(currentUser.id)}
                                  disabled={isLastAdmin}
                                >
                                  Delete
                                </Button>
                    <Button onClick={() => handleUpdateUser(currentUser)}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Add Group Modal */}
          {isAddingGroup && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="glass border-primary/20 p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">Add New Group</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="add-name">Name</Label>
                    <Input
                      id="add-name"
                      value={newGroup.name}
                      onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                      className="glass border-primary/20"
                      placeholder="Group name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-description">Description</Label>
                    <Textarea
                      id="add-description"
                      value={newGroup.description}
                      onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                      className="glass border-primary/20"
                      placeholder="Group description"
                      rows={4}
                      
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={closeAddGroupModal}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAddGroup}
                      disabled={!newGroup.name}
                    >
                      Add Group
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
          
          {/* Group Edit Modal */}
          {isEditingGroup && currentGroup && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="glass border-primary/20 p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Users2Icon className="w-5 h-5 mr-2" />
                    Edit Group: {currentGroup.name}
                  </h3>
                  <Button variant="outline" onClick={closeEditGroupModal} size="sm">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <Tabs value={activeGroupTab} onValueChange={setActiveGroupTab} className="w-full">
                  <TabsList className="glass border-primary/20 mb-6">
                    <TabsTrigger value="general" className="data-[state=active]:bg-primary/20">
                      General
                    </TabsTrigger>
                    <TabsTrigger value="users" className="data-[state=active]:bg-primary/20">
                      Users
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="general" className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="group-name">Group Name</Label>
                        <Input
                          id="group-name"
                          value={currentGroup.name}
                          onChange={(e) => setCurrentGroup({...currentGroup, name: e.target.value})}
                          className="glass border-primary/20"
                          placeholder="Enter group name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="group-description">Description</Label>
                        <Textarea
                          id="group-description"
                          value={currentGroup.description}
                          onChange={(e) => setCurrentGroup({...currentGroup, description: e.target.value})}
                          className="glass border-primary/20"
                          placeholder="Enter group description"
                          rows={4}
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="users" className="space-y-6">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-primary/20">
                            <th className="text-left py-3 px-4 w-12"></th>
                            <th className="text-left py-3 px-4">User</th>
                            <th className="text-left py-3 px-4">Email</th>
                            <th className="text-left py-3 px-4">Role</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user) => {
                            const isChecked = groupUsers[user.id] || false;
                            return (
                              <tr key={user.id} className="border-b border-primary/10 hover:bg-primary/5">
                                <td className="py-3 px-4">
                                  <div className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => handleGroupUserChange(user.id, e.target.checked)}
                                      className="h-4 w-4 rounded border-primary/30 text-primary focus:ring-primary"
                                    />
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center">
                                    {user.profile_image_url ? (
                                <img 
                                  src={`${user.profile_image_url}`} 
                                  alt="User Avatar" 
                                  className="w-10 h-10 rounded-full"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement?.querySelector('.fallback-avatar')?.classList.remove('hidden');
                                  }}
                                  
                                />
                                
                              ) : null}
                              <div className="fallback-avatar hidden">
                                <Avatar name={user.name} size="25" round={true} />
                              </div>
                                    <span className="font-medium">{user.name}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">{user.email}</td>
                                <td className="py-3 px-4">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    user.role === 'admin' 
                                      ? 'bg-red-500/20 text-red-500' 
                                      : user.role === 'user' 
                                        ? 'bg-blue-500/20 text-blue-500' 
                                        : 'bg-gray-500/20 text-gray-500'
                                  }`}>
                                    {user.role}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteGroup}
                  >
                    Delete Group
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={closeEditGroupModal}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleUpdateGroup}
                  >
                    Save Changes
                  </Button>
                </div>
              </Card>
            </div>
          )}
    </>
  )
}
