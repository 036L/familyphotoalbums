// src/hooks/useWebPush.ts
import { useState, useEffect } from 'react';
import { useEnvironment } from './useEnvironment';
import type { PushSubscription, NotificationPayload } from '../types/core';

export const useWebPush = () => {
  // すべてのHooksをトップレベルで宣言（Hooksルール遵守）
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 環境情報をHookで取得
  const { isDemo } = useEnvironment();

  // デモ用のVAPIDキー（実際のアプリケーションでは環境変数から取得）
  const VAPID_PUBLIC_KEY = 'demo-vapid-public-key';

  useEffect(() => {
    // Web Push APIのサポートをチェック
    if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      checkExistingSubscription();
    }
  }, []);

  const checkExistingSubscription = async () => {
    try {
      if (isDemo) {
        // デモモードでローカルストレージをチェック
        const demoSubscription = localStorage.getItem('webPushSubscription');
        if (demoSubscription) {
          const parsedSubscription = JSON.parse(demoSubscription);
          setIsSubscribed(true);
          setSubscription(parsedSubscription);
        }
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      
      if (existingSubscription) {
        setIsSubscribed(true);
        setSubscription({
          endpoint: existingSubscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(existingSubscription.getKey('p256dh')!),
            auth: arrayBufferToBase64(existingSubscription.getKey('auth')!)
          }
        });
      }
    } catch (err) {
      console.error('既存のsubscription確認エラー:', err);
    }
  };

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      throw new Error('Web Push通知はサポートされていません');
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  };

  const subscribe = async (): Promise<PushSubscription> => {
    if (!isSupported) {
      throw new Error('Web Push通知はサポートされていません');
    }

    setLoading(true);
    setError(null);

    try {
      // 通知許可をリクエスト
      const permissionResult = await requestPermission();
      if (permissionResult !== 'granted') {
        throw new Error('通知の許可が必要です');
      }

      if (isDemo) {
        // デモモードでは実際のsubscriptionの代わりにモックデータを返す
        const mockSubscription: PushSubscription = {
          endpoint: 'https://fcm.googleapis.com/fcm/send/demo-endpoint',
          keys: {
            p256dh: 'demo-p256dh-key',
            auth: 'demo-auth-key'
          }
        };
        
        setIsSubscribed(true);
        setSubscription(mockSubscription);
        
        // ローカルストレージに保存
        localStorage.setItem('webPushSubscription', JSON.stringify(mockSubscription));
        
        return mockSubscription;
      }

      // Service Workerの登録
      const registration = await registerServiceWorker();
      
      // 実際のsubscription作成
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      const subscriptionData: PushSubscription = {
        endpoint: pushSubscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(pushSubscription.getKey('p256dh')!),
          auth: arrayBufferToBase64(pushSubscription.getKey('auth')!)
        }
      };

      setIsSubscribed(true);
      setSubscription(subscriptionData);

      // サーバーにsubscriptionを送信
      await sendSubscriptionToServer(subscriptionData);

      return subscriptionData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Push通知の設定に失敗しました';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async (): Promise<void> => {
    if (!isSubscribed) return;

    setLoading(true);
    setError(null);

    try {
      if (isDemo) {
        // デモモード
        localStorage.removeItem('webPushSubscription');
        setIsSubscribed(false);
        setSubscription(null);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.getSubscription();
      
      if (pushSubscription) {
        await pushSubscription.unsubscribe();
        
        // サーバーから削除
        if (subscription) {
          await removeSubscriptionFromServer(subscription);
        }
      }

      setIsSubscribed(false);
      setSubscription(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Push通知の解除に失敗しました';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const sendNotification = async (payload: NotificationPayload): Promise<void> => {
    if (!isSupported || permission !== 'granted') {
      throw new Error('通知が許可されていません');
    }

    try {
      if (isDemo) {
        // デモモードでは直接ブラウザ通知を表示
        new Notification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/favicon.ico',
          badge: payload.badge,
          tag: payload.tag,
          data: payload.data,
        });
        return;
      }

      // 実際のPush通知送信（サーバー経由）
      await sendPushNotification(payload);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '通知の送信に失敗しました';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // ユーティリティ関数
  const registerServiceWorker = async (): Promise<ServiceWorkerRegistration> => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Workerがサポートされていません');
    }

    try {
      return await navigator.serviceWorker.register('/sw.js');
    } catch (err) {
      throw new Error('Service Workerの登録に失敗しました');
    }
  };

  const sendSubscriptionToServer = async (subscription: PushSubscription): Promise<void> => {
    if (isDemo) {
      // デモモードでは何もしない
      return;
    }

    // 実際のAPI呼び出し
    const response = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });

    if (!response.ok) {
      throw new Error('Subscriptionの登録に失敗しました');
    }
  };

  const removeSubscriptionFromServer = async (subscription: PushSubscription): Promise<void> => {
    if (isDemo) {
      // デモモードでは何もしない
      return;
    }

    // 実際のAPI呼び出し
    await fetch('/api/notifications/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
  };

  const sendPushNotification = async (payload: NotificationPayload): Promise<void> => {
    // 実際のPush通知API呼び出し
    const response = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Push通知の送信に失敗しました');
    }
  };

  // ヘルパー関数
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  return {
    isSupported,
    isSubscribed,
    subscription,
    permission,
    loading,
    error,
    subscribe,
    unsubscribe,
    sendNotification,
    requestPermission,
  };
};