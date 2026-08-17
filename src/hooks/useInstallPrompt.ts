import { useEffect, useState } from 'react';

export function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(Boolean(standalone));

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  }, []);

  const isIos = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

  const installApp = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      await installPrompt.userChoice.catch(() => null);
      setInstallPrompt(null);
      return;
    }

    if (isIos()) {
      setShowIosHelp(true);
      return;
    }

    alert('Install Crack Skull AI from your browser menu: Install app, Add to Dock, or Save and share > Install page as app.');
  };

  return {
    installApp,
    isStandalone,
    showIosHelp,
    setShowIosHelp,
  };
}
