export function openCookieSettings() {
  window.dispatchEvent(new CustomEvent('eosa-open-cookie-settings'));
}
