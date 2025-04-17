
import { useEffect } from 'react';
import { ChallengeType } from '../types';

export const useActivityMonitor = (
  challenge: ChallengeType | null,
  participantId: string | null,
  handleLoss: () => void
) => {
  useEffect(() => {
    if (!challenge || challenge.status !== 'active' || !participantId) return;

    // Track if we're in the background because of a phone lock vs. page change
    let wasVisibilityHidden = false;
    let wasPhoneLocked = false;

    const handleVisibilityChange = () => {
      console.log("Visibility state changed:", document.visibilityState);
      
      if (document.visibilityState === 'hidden') {
        wasVisibilityHidden = true;
        
        // When screen becomes hidden, we don't immediately count as loss
        // We'll set a flag to check if it's due to phone lock
        setTimeout(() => {
          // If still hidden after a short delay and app is active, it's likely a phone lock
          // rather than navigating away, so we'll set the phone lock flag
          if (document.visibilityState === 'hidden') {
            console.log("Likely phone lock detected - NOT counting as loss");
            wasPhoneLocked = true;
          }
        }, 100);
      } else if (document.visibilityState === 'visible') {
        // When returning to visible state
        if (wasVisibilityHidden) {
          if (wasPhoneLocked) {
            // If returning from what we detected as a phone lock, don't count as loss
            console.log("Returning from phone lock - not counting as loss");
            wasPhoneLocked = false;
          }
          wasVisibilityHidden = false;
        }
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (challenge.status === 'active' && 
          challenge.participants[participantId].status === 'active') {
        e.preventDefault();
        e.returnValue = '';
        handleLoss();
        return '';
      }
    };

    // Using the Page Visibility API to detect tab/window focus changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Using beforeunload to detect page navigation/closing
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Using the blur event on window to detect when the user switches to another app
    window.addEventListener('blur', () => {
      // Only count as loss if it's not a phone lock (which we detect with visibilitychange)
      if (!wasPhoneLocked && 
          challenge.status === 'active' && 
          challenge.participants[participantId].status === 'active') {
        console.log("Window blur detected - counting as loss");
        handleLoss();
      }
    });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('blur', () => {});
    };
  }, [challenge, participantId, handleLoss]);
};
