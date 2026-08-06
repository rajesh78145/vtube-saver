import { useGoogleLogin } from "@react-oauth/google";
import { useCallback } from "react";

export const useGoogleAuth = (onResponse) => {
  const googleLogin = useGoogleLogin({
    flow: "implicit",

    onSuccess: (tokenResponse) => {
      onResponse({
        accessToken: tokenResponse.access_token,
      });
    },

    onError: () => {
      console.error("Google login failed");
    },
  });

  const triggerGoogleLogin = useCallback(() => {
    googleLogin();
  }, [googleLogin]);

  return { triggerGoogleLogin };
};
