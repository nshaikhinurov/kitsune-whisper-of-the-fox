import { ConvexProvider, ConvexReactClient } from "convex/react";
import { MainPage } from "../pages";
import { TooltipProvider } from "~/shared/ui/tooltip";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

function App() {
  return (
    <ConvexProvider client={convex}>
      <TooltipProvider>
        <MainPage />
      </TooltipProvider>
    </ConvexProvider>
  );
}

export default App;
