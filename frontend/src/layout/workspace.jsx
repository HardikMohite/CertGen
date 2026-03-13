export default function Workspace({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {children}
      </div>
    </div>
  );
}