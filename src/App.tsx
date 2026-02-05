import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import AppShell from "@/components/AppShell";
import Produtos from "@/pages/Produtos";
import Loja from "@/pages/Loja";
import Fabrica from "@/pages/Fabrica";

export default function App() {
  return (
    <Router>
      <AppShell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/loja" element={<Loja />} />
          <Route path="/fabrica" element={<Fabrica />} />
        </Routes>
      </AppShell>
    </Router>
  );
}
