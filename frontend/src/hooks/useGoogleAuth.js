import { useGoogleLogin } from "@react-oauth/google";
import { useCallback } from "react";

export const useGoogleAuth = (onResponse) => {
  const login = useGoogleLogin({
    flow: "implicit",

    onSuccess: (tokenResponse) => {
      onResponse({
        credential: tokenResponse.access_token,
        isAccessToken: true,
      });
    },

    onError: () => {
      console.error("Google Login Failed");
    },
  });

  const triggerGoogleLogin = useCallback(() => {
    login();
  }, [login]);

  return { triggerGoogleLogin };
};