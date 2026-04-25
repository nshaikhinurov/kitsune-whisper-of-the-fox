import { ConvexProvider, ConvexReactClient } from "convex/react";
import { MainPage } from "../pages";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

function App() {
  return (
    <ConvexProvider client={convex}>
      <MainPage />
    </ConvexProvider>
  );
}

export default App;
