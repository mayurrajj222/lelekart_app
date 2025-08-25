import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';
import PublicSellerProfilePage from './public-profile';
import { Layout } from '@/components/layout/layout';
import { Toaster } from '@/components/ui/toaster';
import { useRoute } from 'wouter';

// A standalone wrapper for the public seller profile
// This is specifically designed to work without requiring auth or wallet providers
export default function PublicSellerProfileWrapper() {
  const [, params] = useRoute<{ id: string }>("/seller/public-profile/:id");
  
  console.log("Public profile wrapper with params:", params);
  
  return (
    <QueryClientProvider client={queryClient}>
      <div className="app min-h-screen flex flex-col">
        <Layout>
          <PublicSellerProfilePage />
        </Layout>
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}