import React, { useState } from 'react';
import { Camera, LogOut, User, Upload, Settings, UserPlus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { NotificationBadge } from '../notification/NotificationBadge';
import { ProfileModal } from '../profile/ProfileModal';
import { SettingsModal } from '../settings/SettingsModal';
import { InviteModal } from '../invite/InviteModal';
import { PermissionGuard } from '../auth/PermissionGuard';


interface HeaderProps {
  onShowUpload?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onShowUpload }) => {
  const { profile, logout, currentAlbum } = useApp();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <>
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
              {/* 写真追加ボタン（アルバム詳細時のみ） */}
              {currentAlbum && onShowUpload && (
                <PermissionGuard permission="photo.upload">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onShowUpload}
                  className="hidden sm:flex items-center space-x-2"
                >
                  <Upload size={16} />
                  <span>写真を追加</span>
                </Button>
                </PermissionGuard>
              )}

              {/* 家族招待ボタン（管理者・編集者のみ） */}
              {(profile?.role === 'admin' || profile?.role === 'editor') && (
                <PermissionGuard permission="invite.create">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInviteModal(true)}
                  className="hidden sm:flex items-center space-x-2"
                >
                  <UserPlus size={16} />
                  <span>家族を招待</span>
                </Button>
                </PermissionGuard>
              )}
              
              {/* 通知ベル */}
              <NotificationBadge />
              
              {/* ユーザーメニュー */}
              {profile && (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 p-1 rounded-full hover:bg-gray-50 transition-colors"
                  >
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
                  </button>

                  {/* ユーザーメニューのドロップダウン */}
                  {showUserMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-30"
                        onClick={() => setShowUserMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 z-40">
                        <div className="p-4 border-b border-gray-100">
                          <div className="flex items-center space-x-3">
                            {profile.avatar_url ? (
                              <img
                                src={profile.avatar_url}
                                alt={profile.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center">
                                <User size={20} className="text-orange-600" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{profile.name}</p>
                              <p className="text-sm text-gray-500">{profile.role === 'admin' ? '管理者' : profile.role === 'editor' ? '編集者' : '閲覧者'}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-2">
                          <button
                            onClick={() => {
                              setShowProfileModal(true);
                              setShowUserMenu(false);
                            }}
                            className="w-full flex items-center space-x-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                          >
                            <User size={16} />
                            <span>プロフィール編集</span>
                          </button>
                          
                          <button
                            onClick={() => {
                              setShowSettingsModal(true);
                              setShowUserMenu(false);
                            }}
                            className="w-full flex items-center space-x-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                          >
                            <Settings size={16} />
                            <span>設定</span>
                          </button>
                          
                          <div className="border-t border-gray-100 my-2" />
                          
                          <button
                            onClick={() => {
                              logout();
                              setShowUserMenu(false);
                            }}
                            className="w-full flex items-center space-x-3 px-3 py-2 text-left text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <LogOut size={16} />
                            <span>ログアウト</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* モーダル */}
      <ProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />
      
      <SettingsModal 
        isOpen={showSettingsModal} 
        onClose={() => setShowSettingsModal(false)} 
      />
      
      <InviteModal 
        isOpen={showInviteModal} 
        onClose={() => setShowInviteModal(false)} 
      />
    </>
  );
};