import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAppStore } from '../stores/useAppStore';
import { UserProfile } from '../types';
import { ProfileFormData } from '../types/profile';
import { ProfileForm } from '../components/profile/ProfileForm';
import { DeleteAccountButton } from '../components/profile/DeleteAccountButton';
import { DeleteAccountModal } from '../components/profile/DeleteAccountModal';

export const ProfilePage = () => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const queryClient = useQueryClient();
  const { logout } = useAppStore();

  const { data: profile, isLoading: isProfileLoading } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await api.get('/profile/');
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: Partial<ProfileFormData>) => {
      const { data } = await api.put('/profile/', values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/auth/delete-account/');
    },
    onSuccess: () => {
      logout();
    },
  });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Perfil y objetivos</h1>

      <ProfileForm
        profile={profile}
        isProfileLoading={isProfileLoading}
        isPending={updateMutation.isPending}
        onSubmit={(values) => updateMutation.mutate(values)}
      />

      {/* <div className="flex justify-end">
        <DeleteAccountButton onClick={() => setShowDeleteModal(true)} />
      </div>

      <DeleteAccountModal
        isOpen={showDeleteModal}
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setShowDeleteModal(false)}
      /> */}
    </div>
  );
};
