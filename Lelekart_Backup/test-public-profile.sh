#!/bin/bash

# Create a temporary test file
cat > /tmp/TestPublicProfile.tsx << 'EOF'
import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
import PublicSellerProfilePage from './seller/public-profile';
import { useRoute } from 'wouter';

// Simplified wrapper that doesn't depend on other contexts
export default function TestPublicProfileWrapper() {
  const [, params] = useRoute("/seller/public-profile/:id");
  
  console.log("Test wrapper with params:", params);
  
  return (
    <QueryClientProvider client={queryClient}>
      <PublicSellerProfilePage />
    </QueryClientProvider>
  );
}
EOF

echo "Created test wrapper at /tmp/TestPublicProfile.tsx"
