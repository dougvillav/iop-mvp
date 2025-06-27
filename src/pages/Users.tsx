
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { UserPlus, Search, Mail, Building2, Shield, User } from 'lucide-react';
import { UserModal } from '@/components/users/UserModal';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/lib/types';

// Simple interface for instances in user context
interface InstanceForUsers {
  id: string;
  legal_name: string;
}

const Users = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['users', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('user_profiles')
        .select('*');
      
      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }
      
      const { data: userProfiles, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;

      // Separar consulta para obtener instancias por usuario
      const usersWithInstances = await Promise.all(
        userProfiles.map(async (user) => {
          if (user.organization_id) {
            const { data: instances } = await supabase
              .from('instances')
              .select('id, legal_name')
              .eq('organization_id', user.organization_id)
              .limit(1);
            
            return {
              ...user,
              instances: instances || []
            };
          }
          return {
            ...user,
            instances: []
          };
        })
      );

      return usersWithInstances;
    }
  });

  const { data: instances } = useQuery({
    queryKey: ['instances-for-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instances')
        .select('id, legal_name')
        .eq('status', 'active')
        .order('legal_name');
      
      if (error) throw error;
      return data as InstanceForUsers[];
    }
  });

  const handleUserCreated = () => {
    refetch();
    setIsModalOpen(false);
    toast({
      title: 'Usuario creado',
      description: 'El usuario ha sido creado exitosamente',
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'operator':
        return 'secondary';
      case 'readonly':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'operator':
        return 'Gerente';
      case 'readonly':
        return 'Solo lectura';
      default:
        return role;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-2">
            Administra los usuarios de tu organización e instancias
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Crear Usuario
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg border">
        <div>
          <h2 className="text-xl font-semibold">Usuarios Registrados</h2>
          <p className="text-gray-600">
            {users?.length || 0} usuario{users?.length !== 1 ? 's' : ''} encontrado{users?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {!users?.length ? (
          <div className="col-span-full text-center py-12">
            <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay usuarios
            </h3>
            <p className="text-gray-600 mb-4">
              Comienza creando tu primer usuario
            </p>
            <Button onClick={() => setIsModalOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Crear Usuario
            </Button>
          </div>
        ) : (
          users.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-blue-100">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{user.full_name || 'Sin nombre'}</CardTitle>
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-1" />
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {getRoleText(user.role)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {user.role === 'admin' ? (
                    <div className="flex items-center text-sm text-green-600">
                      <Shield className="h-4 w-4 mr-2" />
                      Administrador de Organización
                    </div>
                  ) : user.instances && Array.isArray(user.instances) && user.instances.length > 0 ? (
                    <div className="flex items-center text-sm text-blue-600">
                      <Building2 className="h-4 w-4 mr-2" />
                      {user.instances[0].legal_name}
                    </div>
                  ) : (
                    <div className="flex items-center text-sm text-gray-500">
                      <Building2 className="h-4 w-4 mr-2" />
                      Sin instancia asignada
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    Creado: {new Date(user.created_at || '').toLocaleDateString('es-MX')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUserCreated={handleUserCreated}
        instances={instances || []}
      />
    </div>
  );
};

export default Users;

