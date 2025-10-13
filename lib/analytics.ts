/**
 * Google Analytics Event Tracking
 * Track user interactions and engagement
 */

// Declare gtag for TypeScript
declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, any>
    ) => void;
  }
}

/**
 * Track custom events to Google Analytics
 */
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

/**
 * Track page views
 */
export const trackPageView = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: url,
    });
  }
};

/**
 * Track user login
 */
export const trackLogin = (method: string = 'twitch') => {
  trackEvent('login', 'engagement', method);
};

/**
 * Track game submission
 */
export const trackGameSubmission = (gameName: string) => {
  trackEvent('submit_game', 'engagement', gameName);
};

/**
 * Track vote action
 */
export const trackVote = (action: 'vote' | 'unvote', gameName?: string) => {
  trackEvent(action, 'engagement', gameName);
};

/**
 * Track search action
 */
export const trackSearch = (query: string, resultsCount: number) => {
  trackEvent('search', 'engagement', query, resultsCount);
};

/**
 * Track admin action
 */
export const trackAdminAction = (action: string, details?: string) => {
  trackEvent(action, 'admin', details);
};

