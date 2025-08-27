import { UserProfile } from "@clerk/clerk-react";

export function ProfilePage() {
  return (
    <div className="flex justify-center items-center py-8">
      <UserProfile path="/profile" routing="path" />
    </div>
  );
}
