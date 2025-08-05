import React from 'react';
import { Camera, LogOut, User, Upload } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';

interface HeaderProps {
  onShowUpload?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onShowUpload }) => {
  const { profile, logout, currentAlbum } = useApp();

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-orange-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-orange-400 to-amber-400 rounded-xl">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">家族アルバム</h1>
              {currentAlbum && (
                <p className="text-sm text-gray-600">{currentAlbum.title}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {currentAlbum && onShowUpload && (
              <Button
                variant="outline"
                size="sm"
                onClick={onShowUpload}
                className="hidden sm:flex items-center space-x-2"
              >
                <Upload size={16} />
                <span>写真を追加</span>
              </Button>
            )}
            
            {profile && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center">
                      <User size={16} className="text-orange-600" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">
                    {profile.name}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="p-2"
                >
                  <LogOut size={16} />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};