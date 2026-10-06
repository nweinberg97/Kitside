import { useCallback } from 'react';
import { navigate } from '../lib/router.jsx';
import { useSession } from './session.jsx';
import { useToast } from './toast.jsx';

/**
 * Returns gate(actionText). True when the person is a member (signed in with
 * a profile). Otherwise sends them to join or finish onboarding and returns false.
 */
export function useMemberGate() {
  const { user, profile } = useSession();
  const toast = useToast();
  return useCallback((action) => {
    if (!user) {
      toast(`Join Kitside to ${action}.`);
      navigate(`/join?next=${encodeURIComponent(window.location.hash.slice(1) || '/')}`);
      return false;
    }
    if (!profile) {
      toast('Finish your profile first. It takes a minute.');
      navigate('/welcome');
      return false;
    }
    return true;
  }, [user, profile, toast]);
}
