/**
 * Helper utility to detect different browsers
 */

/**
 * Detects if the current browser is Firefox
 * @returns boolean indicating if the browser is Firefox
 */
export function isFirefox(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
}

/**
 * Detects if the current browser is Chrome
 * @returns boolean indicating if the browser is Chrome
 */
export function isChrome(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.userAgent.toLowerCase().indexOf('chrome') > -1 && 
         navigator.userAgent.toLowerCase().indexOf('edge') === -1;
}

/**
 * Detects if the current browser is Safari
 * @returns boolean indicating if the browser is Safari
 */
export function isSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.userAgent.toLowerCase().indexOf('safari') > -1 && 
         navigator.userAgent.toLowerCase().indexOf('chrome') === -1;
}

/**
 * Gets the current browser name
 * @returns the name of the current browser
 */
export function getBrowserName(): string {
  if (typeof navigator === 'undefined') return 'unknown';
  
  const ua = navigator.userAgent.toLowerCase();
  
  if (ua.indexOf('firefox') > -1) {
    return 'firefox';
  } else if (ua.indexOf('edge') > -1) {
    return 'edge';
  } else if (ua.indexOf('chrome') > -1) {
    return 'chrome';
  } else if (ua.indexOf('safari') > -1) {
    return 'safari';
  } else if (ua.indexOf('opera') > -1 || ua.indexOf('opr') > -1) {
    return 'opera';
  } else {
    return 'unknown';
  }
}