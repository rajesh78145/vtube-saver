import { useEffect, useCallback, useRef } from "react";

const callbackRef = { current: null };
const isLocalhost = () => window.location.hostname === "localhost";

const loadScript = () => {
  if (document.getElementById("google-identity-sdk")) return;
  const script = document.createElement("script");
  script.src = "https://accounts.google.com/gsi/client";
  script.id = "google-identity-sdk";
  script.async = true;
  script.onload = () => {
    if (window.google && callbackRef.current) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: (response) => callbackRef.current?.(response),
      });
    }
  };
  document.head.appendChild(script);
};

loadScript();

export const useGoogleAuth = (onResponse) => {
  console.log("Google Client ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);

  useEffect(() => {
    callbackRef.current = onResponse;
  }, [onResponse]);

  const triggerGoogleLogin = useCallback(() => {
    if (!window.google) {
      alert("Google sign-in is loading, please try again in a moment.");
      return;
    }

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: (response) => callbackRef.current?.(response),
    });

    window.google.accounts.id.prompt();
  }, []);

  return { triggerGoogleLogin };
};
