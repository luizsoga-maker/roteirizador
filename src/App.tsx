import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Routing from "./pages/Routing";

import "./App.css";

const App = () => (
  <BrowserRouter basename="/roteirizador">
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/route" element={<Routing />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;