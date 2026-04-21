import { BrowserRouter, Route, Routes } from "react-router-dom";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<div style={{ padding: 40, fontFamily: 'sans-serif' }}>App shell test</div>} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
