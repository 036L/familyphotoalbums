import React, { useState } from 'react';
import { UserPlus, Copy, Mail, Link, Users, Check, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose
}) => {
  const [inviteMethod, setInviteMethod] = useState<'email' | 'link'>('email');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('家族アルバムに参加しませんか？大切な思い出を一緒に共有しましょう！');
  const [role, setRole] = useState<'viewer' | 'editor'>('editor');
  const [inviteLink, setInviteLink] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const generateInviteLink = async () => {
    setIsGenerating(true);
    setError('');

    try {
      // デモ用のリンク生成
      const inviteCode = Math.random().toString(36).substring(2, 15);
      const baseUrl = window.location.origin;
      const generatedLink = `${baseUrl}/invite/${inviteCode}`;
      
      // 実際のアプリケーションでは、ここでAPIを呼び出してリンクを生成
      setTimeout(() => {
        setInviteLink(generatedLink);
        setIsGenerating(false);
      }, 1000);
    } catch (err) {
      setError('招待リンクの生成に失敗しました');
      setIsGenerating(false);
    }
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setIsLinkCopied(true);
      setTimeout(() => setIsLinkCopied(false), 2000);
    } catch (err) {
      setError('クリップボードへのコピーに失敗しました');
    }
  };

  const sendEmailInvite = async () => {
    if (!email.trim()) {
      setError('メールアドレスを入力してください');
      return;
    }

    // 簡単なメールアドレス検証
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('有効なメールアドレスを入力してください');
      return;
    }

    setIsSending(true);
    setError('');

    try {
      // デモ用の送信シミュレーション
      // 実際のアプリケーションでは、ここでAPIを呼び出してメール送信
      setTimeout(() => {
        setSuccess(`${email} に招待メールを送信しました`);
        setIsSending(false);
        setEmail('');
      }, 1500);
    } catch (err) {
      setError('招待メールの送信に失敗しました');
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setInviteLink('');
    setError('');
    setSuccess('');
    setIsLinkCopied(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="w-full max-w-md">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-xl">
              <UserPlus size={24} className="text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">家族を招待</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* 招待方法選択 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            招待方法を選択
          </label>
          <div className="flex space-x-3">
            <button
              onClick={() => setInviteMethod('email')}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border-2 transition-colors ${
                inviteMethod === 'email'
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-200 hover:border-orange-300'
              }`}
            >
              <Mail size={20} />
              <span>メール</span>
            </button>
            <button
              onClick={() => setInviteMethod('link')}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border-2 transition-colors ${
                inviteMethod === 'link'
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-200 hover:border-orange-300'
              }`}
            >
              <Link size={20} />
              <span>リンク</span>
            </button>
          </div>
        </div>

        {/* 権限選択 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            権限を選択
          </label>
          <div className="space-y-2">
            <label className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer">
              <input
                type="radio"
                name="role"
                value="editor"
                checked={role === 'editor'}
                onChange={(e) => setRole(e.target.value as 'editor')}
                className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">編集者</span>
                <p className="text-xs text-gray-600">写真のアップロード・削除・コメントが可能</p>
              </div>
            </label>
            <label className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer">
              <input
                type="radio"
                name="role"
                value="viewer"
                checked={role === 'viewer'}
                onChange={(e) => setRole(e.target.value as 'viewer')}
                className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">閲覧者</span>
                <p className="text-xs text-gray-600">写真の閲覧・コメントのみ可能</p>
              </div>
            </label>
          </div>
        </div>

        {/* メール招待フォーム */}
        {inviteMethod === 'email' && (
          <div className="space-y-4">
            <Input
              label="招待するメールアドレス"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                招待メッセージ（任意）
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
                rows={3}
                placeholder="招待メッセージを入力..."
              />
            </div>

            <Button
              onClick={sendEmailInvite}
              disabled={isSending || !email.trim()}
              className="w-full flex items-center justify-center space-x-2"
            >
              {isSending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Mail size={20} />
              )}
              <span>{isSending ? '送信中...' : '招待メールを送信'}</span>
            </Button>
          </div>
        )}

        {/* リンク招待 */}
        {inviteMethod === 'link' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              招待リンクを生成して、SNSやメッセージアプリで共有できます
            </p>

            {!inviteLink ? (
              <Button
                onClick={generateInviteLink}
                disabled={isGenerating}
                className="w-full flex items-center justify-center space-x-2"
              >
                {isGenerating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Link size={20} />
                )}
                <span>{isGenerating ? '生成中...' : '招待リンクを生成'}</span>
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm font-mono"
                  />
                  <Button
                    onClick={copyInviteLink}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    {isLinkCopied ? <Check size={16} /> : <Copy size={16} />}
                    <span>{isLinkCopied ? 'コピー済み' : 'コピー'}</span>
                  </Button>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <p className="text-sm text-blue-800">
                    <strong>注意:</strong> このリンクは24時間後に期限切れになります
                  </p>
                </div>

                <Button
                  onClick={generateInviteLink}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  新しいリンクを生成
                </Button>
              </div>
            )}
          </div>
        )}

        {/* エラー・成功メッセージ */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-3">
            <p className="text-green-600 text-sm">{success}</p>
          </div>
        )}

        {/* 既存メンバー表示 */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <Users size={20} className="text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900">現在のメンバー</h3>
          </div>
          
          <div className="space-y-2">
            {[
              { name: 'デモユーザー', email: 'demo@example.com', role: 'admin', avatar: null },
              { name: '田中花子', email: 'hanako@example.com', role: 'editor', avatar: null },
            ].map((member, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-orange-600">
                      {member.name[0]}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{member.name}</p>
                    <p className="text-xs text-gray-600">{member.email}</p>
                  </div>
                </div>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  {member.role === 'admin' && '管理者'}
                  {member.role === 'editor' && '編集者'}
                  {member.role === 'viewer' && '閲覧者'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};