
import React, { useState, useEffect } from 'react';
import { RoomManagementProvider } from '@/components/admin/context/RoomManagementContext';
import RoomManagementContent from '@/components/admin/RoomManagementContent';
import Navbar from '@/components/layout/Navbar';

const RoomManagement = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <RoomManagementProvider>
        <div className="container mx-auto py-6 space-y-6 pt-20">
          <h1 className="text-2xl font-bold">Room Management</h1>
          <RoomManagementContent />
        </div>
      </RoomManagementProvider>
    </div>
  );
};

export default RoomManagement;
