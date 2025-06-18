import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDate } from '../lib/utils';
import { rpcRequest } from '../api/client';
import useAuth from '../hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Switch } from '../components/ui/Switch';
import { Icons } from '../components/ui/Icons';
import { Skeleton } from '../components/ui/Skeleton';

interface UserProfile {
  user_id: string;
  user_name: string;
  email: string;
  user_type: 'individual' | 'institution';
  broker: string;
  exchanges: string[];
  products: string[];
  order_types: string[];
  email_verified: boolean;
  mobile_verified: boolean;
  pan_verified: boolean;
  bank_account_verified: boolean;
  created_at: string;
  last_login: string;
  login_count: number;
  profile_name: string;
  avatar_url?: string;
}

interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
}

interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationSettings;
  risk_profile: 'conservative' | 'moderate' | 'aggressive';
  refresh_interval: number;
  preferred_exchanges: string[];
  default_product: string;
  default_order_type: string;
  default_quantity: number;
  two_fa_enabled: boolean;
  api_enabled: boolean;
  gtt_enabled: boolean;
  margin_enabled: boolean;
  bracket_order_enabled: boolean;
  cover_order_enabled: boolean;
}

// Type guard to check if a value is a valid HTMLInputElement event
type InputEvent = React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement>;

const Profile = () => {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserSettings>>({});
  
  // Fetch user profile
  const {
    data: profile,
    isLoading: isProfileLoading,
    error: profileError,
  } = useQuery<UserProfile>({
    queryKey: ['user-profile'],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      try {
        const response = await rpcRequest('get_profile');
        return response || {};
      } catch (err) {
        console.error('Error fetching profile:', err);
        throw err;
      }
    },
    enabled: !!user,
  });
  
  // Fetch user settings
  const {
    data: settings,
    isLoading: isSettingsLoading,
    error: settingsError,
  } = useQuery<UserSettings>({
    queryKey: ['user-settings'],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      try {
        // In a real app, this would be a separate RPC method
        const defaultSettings: UserSettings = {
          theme: 'system',
          notifications: {
            email: true,
            push: true,
            sms: false,
          },
          risk_profile: 'moderate',
          refresh_interval: 30,
          preferred_exchanges: ['NSE', 'BSE'],
          default_product: 'MIS',
          default_order_type: 'MARKET',
          default_quantity: 1,
          two_fa_enabled: false,
          api_enabled: true,
          gtt_enabled: true,
          margin_enabled: true,
          bracket_order_enabled: true,
          cover_order_enabled: true,
        };
        return defaultSettings;
      } catch (err) {
        console.error('Error fetching settings:', err);
        throw err;
      }
    },
    enabled: !!user,
  });
  
  // Update form data when settings change
  useEffect(() => {
    if (settings) {
      setFormData({
        ...settings,
        notifications: {
          email: settings.notifications?.email ?? false,
          push: settings.notifications?.push ?? false,
          sms: settings.notifications?.sms ?? false,
        }
      });
    }
  }, [settings]);
  
  // Handle input changes
  const handleInputChange = (e: InputEvent) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const name = target.name;
    
    if (name.startsWith('notifications.')) {
      const notificationType = name.split('.')[1] as keyof NotificationSettings;
      setFormData(prev => ({
        ...prev,
        notifications: {
          ...(prev.notifications || { email: false, push: false, sms: false }),
          [notificationType]: (target as HTMLInputElement).checked,
        },
      }));
    } else if (target.type === 'checkbox' || target.type === 'switch') {
      setFormData(prev => ({
        ...prev,
        [name]: target.checked,
      }));
    } else if (target.type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: Number(target.value),
      }));
    } else {
      const value = target.type === 'checkbox' 
        ? (target as HTMLInputElement).checked 
        : target.type === 'number'
        ? Number(target.value)
        : target.value;

      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveSettingsMutation.mutateAsync(formData as UserSettings);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };
  
  // Save settings mutation with proper type safety
  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<UserSettings>) => {
      const response = await rpcRequest('update_settings', { settings });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  // Loading state
  if (isProfileLoading || isSettingsLoading) {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }
  
  // Error state
  if (profileError || settingsError) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Icons.close className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error loading profile
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>Failed to load your profile information. Please try again.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!profile || !settings) {
    return (
      <div className="text-center">
        <Icons.user className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No profile data</h3>
        <p className="mt-1 text-sm text-gray-500">
          Unable to load your profile information.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Profile & Settings</h2>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
      </div>
      
      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Your personal and account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Icons.user className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-medium">{profile.profile_name || profile.user_name}</h3>
              <p className="text-sm text-muted-foreground">{profile.user_id}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">
                {profile.email}
                {profile.email_verified ? (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                    Verified
                  </span>
                ) : (
                  <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                    Not Verified
                  </span>
                )}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium">Broker</p>
              <p className="text-sm text-muted-foreground">
                {profile.broker}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium">Account Created</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(profile.created_at)}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium">Last Login</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(profile.last_login)}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium">Exchanges</p>
              <p className="text-sm text-muted-foreground">
                {profile.exchanges?.join(', ') || 'None'}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium">Products</p>
              <p className="text-sm text-muted-foreground">
                {profile.products?.join(', ') || 'None'}
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button variant="outline" onClick={logout}>
            <Icons.logout className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </CardFooter>
      </Card>
      
      {/* Settings Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>
                  Customize your trading experience
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                {isEditing ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData(settings);
                      }}
                      disabled={saveSettingsMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saveSettingsMutation.isPending}>
                      {saveSettingsMutation.isPending ? (
                        <Icons.loader className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                  >
                    <Icons.pencil className="mr-2 h-4 w-4" />
                    Edit Preferences
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-4">Appearance</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="theme" className="font-normal">
                      Theme
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Choose between light and dark themes
                    </p>
                  </div>
                  <div className="w-48">
                    {isEditing ? (
                      <select
                        id="theme"
                        name="theme"
                        value={formData.theme}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange(e)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">System</option>
                      </select>
                    ) : (
                      <div className="text-right">
                        <p className="capitalize">{settings.theme}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="refresh_interval" className="font-normal">
                      Data Refresh Interval
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      How often to refresh market data (seconds)
                    </p>
                  </div>
                  <div className="w-48">
                    {isEditing ? (
                      <Input
                        type="number"
                        id="refresh_interval"
                        name="refresh_interval"
                        value={formData.refresh_interval}
                        onChange={handleInputChange}
                        min="5"
                        max="300"
                        className="text-right"
                      />
                    ) : (
                      <div className="text-right">
                        <p>{settings.refresh_interval} seconds</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-4">Trading Defaults</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="default_product" className="font-normal">
                      Default Product
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Product type for new orders
                    </p>
                  </div>
                  <div className="w-48">
                    {isEditing ? (
                      <select
                        id="default_product"
                        name="default_product"
                        value={formData.default_product}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange(e)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="CNC">CNC</option>
                        <option value="MIS">MIS</option>
                        <option value="NRML">NRML</option>
                        <option value="CO">CO</option>
                        <option value="BO">BO</option>
                      </select>
                    ) : (
                      <div className="text-right">
                        <p>{settings.default_product}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="default_order_type" className="font-normal">
                      Default Order Type
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Default order type for new orders
                    </p>
                  </div>
                  <div className="w-48">
                    {isEditing ? (
                      <select
                        id="default_order_type"
                        name="default_order_type"
                        value={formData.default_order_type}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange(e)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="MARKET">Market</option>
                        <option value="LIMIT">Limit</option>
                        <option value="SL">Stop Loss</option>
                        <option value="SL-M">Stop Loss Market</option>
                      </select>
                    ) : (
                      <div className="text-right">
                        <p>{settings.default_order_type}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="default_quantity" className="font-normal">
                      Default Quantity
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Default quantity for new orders
                    </p>
                  </div>
                  <div className="w-48">
                    {isEditing ? (
                      <Input
                        type="number"
                        id="default_quantity"
                        name="default_quantity"
                        value={formData.default_quantity}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e)}
                        min="1"
                        className="text-right"
                      />
                    ) : (
                      <div className="text-right">
                        <p>{settings.default_quantity}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-4">Notifications</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notifications.email" className="font-normal">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications
                    </p>
                  </div>
                  <div>
                    {isEditing ? (
                      <Switch
                        id="notifications.email"
                        name="notifications.email"
                        checked={formData.notifications?.email ?? false}
                        onCheckedChange={(checked) =>
                          handleInputChange({
                            target: {
                              name: 'notifications.email',
                              type: 'checkbox',
                              checked,
                            },
                          } as any)
                        }
                      />
                    ) : (
                      <span className="text-sm font-medium">
                        {settings.notifications?.email ? 'Enabled' : 'Disabled'}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notifications.push" className="font-normal">
                      Push Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications
                    </p>
                  </div>
                  <div>
                    {isEditing ? (
                      <Switch
                        id="notifications.push"
                        name="notifications.push"
                        checked={formData.notifications?.push ?? false}
                        onCheckedChange={(checked) =>
                          handleInputChange({
                            target: {
                              name: 'notifications.push',
                              type: 'checkbox',
                              checked,
                            },
                          } as any)
                        }
                      />
                    ) : (
                      <span className="text-sm font-medium">
                        {settings.notifications?.push ? 'Enabled' : 'Disabled'}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notifications.sms" className="font-normal">
                      SMS Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive SMS notifications
                    </p>
                  </div>
                  <div>
                    {isEditing ? (
                      <Switch
                        id="notifications.sms"
                        name="notifications.sms"
                        checked={formData.notifications?.sms ?? false}
                        onCheckedChange={(checked) =>
                          handleInputChange({
                            target: {
                              name: 'notifications.sms',
                              type: 'checkbox',
                              checked,
                            },
                          } as any)
                        }
                      />
                    ) : (
                      <span className="text-sm font-medium">
                        {settings.notifications?.sms ? 'Enabled' : 'Disabled'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-4">Trading Features</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="two_fa_enabled" className="font-normal">
                      Two-Factor Authentication
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <div>
                    {isEditing ? (
                      <Switch
                        id="two_fa_enabled"
                        name="two_fa_enabled"
                        checked={formData.two_fa_enabled ?? false}
                        onCheckedChange={(checked) =>
                          handleInputChange({
                            target: {
                              name: 'two_fa_enabled',
                              type: 'checkbox',
                              checked,
                            },
                          } as any)
                        }
                      />
                    ) : (
                      <span className="text-sm font-medium">
                        {settings.two_fa_enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="gtt_enabled" className="font-normal">
                      GTT Orders
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Enable Good Till Triggered orders
                    </p>
                  </div>
                  <div>
                    {isEditing ? (
                      <Switch
                        id="gtt_enabled"
                        name="gtt_enabled"
                        checked={formData.gtt_enabled ?? false}
                        onCheckedChange={(checked) =>
                          handleInputChange({
                            target: {
                              name: 'gtt_enabled',
                              type: 'checkbox',
                              checked,
                            },
                          } as any)
                        }
                      />
                    ) : (
                      <span className="text-sm font-medium">
                        {settings.gtt_enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="margin_enabled" className="font-normal">
                      Margin Trading
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Enable margin trading features
                    </p>
                  </div>
                  <div>
                    {isEditing ? (
                      <Switch
                        id="margin_enabled"
                        name="margin_enabled"
                        checked={formData.margin_enabled ?? false}
                        onCheckedChange={(checked) =>
                          handleInputChange({
                            target: {
                              name: 'margin_enabled',
                              type: 'checkbox',
                              checked,
                            },
                          } as any)
                        }
                      />
                    ) : (
                      <span className="text-sm font-medium">
                        {settings.margin_enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="bracket_order_enabled" className="font-normal">
                      Bracket Orders
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Enable bracket order features
                    </p>
                  </div>
                  <div>
                    {isEditing ? (
                      <Switch
                        id="bracket_order_enabled"
                        name="bracket_order_enabled"
                        checked={formData.bracket_order_enabled ?? false}
                        onCheckedChange={(checked) =>
                          handleInputChange({
                            target: {
                              name: 'bracket_order_enabled',
                              type: 'checkbox',
                              checked,
                            },
                          } as any)
                        }
                      />
                    ) : (
                      <span className="text-sm font-medium">
                        {settings.bracket_order_enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="cover_order_enabled" className="font-normal">
                      Cover Orders
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Enable cover order features
                    </p>
                  </div>
                  <div>
                    {isEditing ? (
                      <Switch
                        id="cover_order_enabled"
                        name="cover_order_enabled"
                        checked={formData.cover_order_enabled ?? false}
                        onCheckedChange={(checked) =>
                          handleInputChange({
                            target: {
                              name: 'cover_order_enabled',
                              type: 'checkbox',
                              checked,
                            },
                          } as any)
                        }
                      />
                    ) : (
                      <span className="text-sm font-medium">
                        {settings.cover_order_enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          {isEditing && (
            <CardFooter className="flex justify-end space-x-2 border-t px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setFormData(settings);
                }}
                disabled={saveSettingsMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saveSettingsMutation.isPending}>
                {saveSettingsMutation.isPending ? (
                  <Icons.loader className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Save Changes
              </Button>
            </CardFooter>
          )}
        </Card>
      </form>
      
      {/* Account Actions */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription className="text-destructive/70">
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-md border border-destructive/20 bg-destructive/5 p-4">
            <div>
              <h4 className="font-medium">Reset All Settings</h4>
              <p className="text-sm text-destructive/70">
                Reset all preferences to their default values
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Reset Settings
            </Button>
          </div>
          
          <div className="flex items-center justify-between rounded-md border border-destructive/20 bg-destructive/5 p-4">
            <div>
              <h4 className="font-medium">Delete Account</h4>
              <p className="text-sm text-destructive/70">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
