import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ComingSoonProps {
  feature: string;
}

export function ComingSoon({ feature }: ComingSoonProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mx-auto flex items-center justify-center">
          <span className="text-4xl">🚀</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{feature}</h1>
        <p className="text-lg text-gray-600">
          This feature is coming soon! We're working hard to bring you the best experience.
        </p>
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      </div>
    </div>
  );
}
