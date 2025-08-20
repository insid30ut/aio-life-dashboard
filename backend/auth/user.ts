import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";

export interface UserInfo {
  id: string;
  email: string | null;
  name: string | null;
  imageUrl: string;
}

// Gets the current user's information.
export const getUserInfo = api<void, UserInfo>(
  { auth: true, expose: true, method: "GET", path: "/user/me" },
  async () => {
    const auth = getAuthData()!;
    return {
      id: auth.userID,
      email: auth.email,
      name: auth.name,
      imageUrl: auth.imageUrl
    };
  }
);
