import { useEffect, useCallback } from "react";

const callbackRef = { current: null };

const loadScript = () => {
  if (document.getElementById("google-identity-sdk")) return;

  const script = document.createElement("script");
  script.src = "https://accounts.google.com/gsi/client";
  script.id = "google-identity-sdk";
  script.async = true;

  script.onload = () => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: (response) => callbackRef.current?.(response),
        use_fedcm_for_prompt: false,
        auto_select: false,
      });
    }
  };

  document.head.appendChild(script);
};

loadScript();

export const useGoogleAuth = (onResponse) => {
  useEffect(() => {
    callbackRef.current = onResponse;
  }, [onResponse]);

  const triggerGoogleLogin = useCallback(() => {
    if (!window.google) {
      alert("Google Sign-In is still loading.");
      return;
    }

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: (response) => callbackRef.current?.(response),
      use_fedcm_for_prompt: false,
      auto_select: false,
    });

    window.google.accounts.id.prompt();
  }, []);

  return { triggerGoogleLogin };
};
